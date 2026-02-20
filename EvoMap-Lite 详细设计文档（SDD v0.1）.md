下面是一份可直接给研发开工的 **《EvoMap-Lite（企业内网版）详细设计文档 / SDD v0.1》**。我按“能落地、能迭代、默认安全”的思路写，优先把 **Gene/Capsule/EvolutionEvent 闭环 + publish/fetch/report + sandbox 门禁**做扎实；GDI/市场化先留扩展点。

------

# EvoMap-Lite 详细设计文档（SDD v0.1）

## 0. 文档信息

- 系统名：EvoMap-Lite（企业内网经验进化与复用 Hub）
- 目标用户：研发/测试/Agent 节点/审核者/平台管理员
- 设计原则：**可验证、可追溯、可隔离、可回滚、可扩展**
- 默认假设：
  - 你们有内网 CI（Jenkins/GitLab CI/自研均可）
  - 代码仓库可能同时存在 Git 与 SVN
  - Agent 在内网服务器/WSL/Linux 运行，允许访问 Hub

------

## 1. 总体架构

### 1.1 逻辑组件

1. **Hub API（核心服务）**

- A2A 协议入口（hello/publish/fetch/report/decision/revoke）
- 资产生命周期与权限
- 质量门禁编排（调用 Sandbox/CI）
- 召回/撤销/黑名单

1. **Indexer（检索/索引服务，可内嵌）**

- 关键词/规则检索（signals、summary、tags）
- 可选：向量检索（embedding）

1. **Sandbox Runner（隔离验证执行器）**

- 拉取代码快照（Git commit / SVN revision）
- 应用 patch（diff）
- 执行验证计划（tests/build/lint）
- 产出结构化报告

1. **CI Adapter（可选）**

- 把验证任务转交 CI 执行（更复用你们已有流水线）

1. **Console（Web 管控台，可选但强烈建议）**

- 资产详情、审计、审核决策、趋势、节点管理

1. **Evolver SDK（Agent 侧库/CLI）**

- 提取 signals、选择资产、生成 capsule bundle、上报 report
- 不强绑某个模型，重点是“协议+打包+验证串联”

### 1.2 物理部署（建议）

- 先做 **模块化单体**（一个 repo，服务内分包），上线快、迭代成本低
- 后续再拆：Hub / Sandbox / Indexer

### 1.3 拓扑（ASCII）

```
[Agent/Evolver] --A2A--> [Hub API] -----> [Postgres]
        |                  |  \-----> [ObjectStore(MinIO/S3)]
        |                  |   \----> [Indexer(Meili/OpenSearch)]
        |                  \--------> [Sandbox Runner] -> [Repo Snapshot] -> [Validation Report]
        \----report--------/
```

------

## 2. 核心数据对象与包格式

### 2.1 对象定义（工程视角）

- **Gene**：可复用策略模板（匹配 signals + 前置条件 + 约束 + 验证计划）
- **Capsule**：一次成功的“可复现”解决方案（patch + 适用环境 + 置信度 + 影响范围）
- **EvolutionEvent**：过程审计（怎么从 signals → 变异 → 验证 → 成功/失败）

### 2.2 Bundle（发布包）格式

- 统一：`bundle.zip`（或 tar.gz）
- 内容：
  - `gene.json`
  - `capsule.json`
  - `event.json`（可选，强烈建议）
  - `artifacts/patch.diff`
  - `artifacts/validation_plan.json`
  - `artifacts/validation_report.json`（发布时可为空；Hub 验证后补全）
  - `artifacts/logs/*.log`（可选）

### 2.3 内容寻址 Asset ID（强制）

- 规则：`asset_id = "sha256:" + SHA256(canonical_json_bytes)`
- **canonical JSON** 必须固定：
  - UTF-8
  - 字段按字典序排序
  - 不允许浮点 NaN/Infinity
  - 数值统一格式（建议小数保留 4 位或用整数表示权重）
- 目的：防篡改、去重、可追溯

------

## 3. 协议与 API 设计

### 3.1 A2A Envelope（所有请求统一外壳）

```json
{
  "protocol": "evomap-a2a",
  "protocol_version": "1.0",
  "message_type": "publish",
  "message_id": "uuid",
  "sender_id": "node_xxx",
  "timestamp_ms": 1730000000000,
  "payload": { }
}
```

### 3.2 Endpoint 列表（MVP 必须）

- `POST /a2a/hello` 节点注册/心跳
- `POST /a2a/publish` 发布 bundle
- `POST /a2a/fetch` 拉取资产（按 query）
- `POST /a2a/report` 上报复用结果
- `POST /a2a/decision` 审核决策（candidate → promoted/rejected/quarantine）
- `POST /a2a/revoke` 撤销资产

另：Console/调试用 REST（可选）

- `GET /assets/{asset_id}`
- `GET /assets/search?q=...`
- `GET /assets/ranked?...`
- `GET /nodes`

### 3.3 Publish 请求（关键字段）

**payload：**

```json
{
  "bundle_format": "zip",
  "bundle_bytes_base64": "...",
  "bundle_hash": "sha256:....",
  "project": "A1",
  "namespace": "client",
  "submit_mode": "candidate_only"
}
```

**返回：**

```json
{
  "status": "accepted",
  "candidate_asset_ids": ["sha256:gene...", "sha256:capsule..."],
  "gate_pipeline_id": "gate_123",
  "next": {"type": "poll", "url": "/gates/gate_123"}
}
```

### 3.4 Fetch 请求（支持“检索 + 约束”）

```json
{
  "project": "A1",
  "namespace": "client",
  "query": {
    "signals": ["LNK2019", "undefined reference", "ShaderCompileWorker crash"],
    "tags": ["ue", "win64"],
    "env_fingerprint": {"os":"win", "toolchain":"vs2022", "ue":"5.6"},
    "risk_level_max": "medium"
  },
  "limit": 5,
  "include_candidate": false
}
```

### 3.5 Report 上报（自然选择数据）

```json
{
  "target_capsule_id": "sha256:...",
  "consumer_node_id": "node_abc",
  "env_fingerprint": {...},
  "result": "success",
  "failure_reason": null,
  "duration_ms": 180000,
  "notes": "pass in win64, fail in linux due to ...",
  "artifacts": {"validation_report_hash":"sha256:..."}
}
```

### 3.6 Error 码（建议统一）

- `E_AUTH_*`：鉴权/权限
- `E_SCHEMA_*`：schema 校验失败
- `E_HASH_*`：hash 不一致/篡改
- `E_POLICY_*`：安全策略拦截
- `E_GATE_*`：门禁执行失败
- `E_RATE_*`：限流/配额
- `E_NOTFOUND_*`：资产不存在/已撤销

------

## 4. Hub 内部流程设计（关键序列）

### 4.1 Publish 门禁流水线（Gate Pipeline）

**目标：把“外来可执行资产”变成“可控候选”，并尽量自动验证。**

阶段：

1. **Parse & Schema Validate**

- 解压 bundle
- 校验 gene/capsule 基本字段齐全
- 校验 schema_version、字段范围

1. **Hash Verify**

- 重新 canonicalize gene/capsule 计算 sha256
- 对比 asset_id 一致性（不一致 → reject）

1. **Security Policy Check**

- 校验 validation_plan（见第 6、7 节）
- 禁止危险命令/符号/外连
- 识别超大 blast_radius（大改默认进 quarantine）

1. **Sandbox/CI Validation**

- 拉代码快照 → 应用 patch → 执行验证计划
- 产出 validation_report（结构化）

1. **Score & Promote Decision**

- 满足 auto-promote 规则 → promoted
- 否则 candidate，等待审核者 decision

**状态机：**
`received -> schema_ok -> policy_ok -> validated -> (promoted | candidate | rejected | quarantined)`

### 4.2 Fetch 决策链

- 过滤 revoked/rejected
- promoted 优先
- candidate 默认不下发（除非审核者/白名单节点）
- 结合 env_fingerprint 做适配打分
- 返回 top-k（附带原因 explain 字段，便于 Agent 选择）

------

## 5. 数据库与存储设计

### 5.1 Postgres 表（建议）

1. `nodes`

- `node_id (pk)`、公钥、角色、配额、状态、最后心跳、标签

1. `assets`

- `asset_id (pk)`、`type (gene/capsule/event)`、`project/namespace`
- `status (candidate/promoted/rejected/revoked/quarantine)`
- `summary`、`tags`、`signals`（jsonb）
- `env_fingerprint`（jsonb，可空）
- `created_by_node`、`created_at`

1. `capsules`

- `capsule_id (pk=fk assets)`、`gene_id`、`confidence`
- `blast_radius_files`、`blast_radius_lines`
- `patch_object_key`（指向对象存储）
- `validation_plan_key`
- `latest_validation_report_key`

1. `gates`

- `gate_id`、`bundle_hash`、阶段状态、错误码、报告 key、耗时

1. `reports`

- `id`、`capsule_id`、`node_id`、`result`、`env_fingerprint`、耗时、失败原因、时间

1. `decisions`

- `id`、`asset_id`、`reviewer`、decision、reason、时间

1. `audit_logs`（强烈建议 append-only）

- message_id、sender、action、asset_id、结果、摘要、时间

### 5.2 对象存储（MinIO/S3）

- `/bundles/{bundle_hash}.zip`
- `/patches/{capsule_id}.diff`
- `/reports/{gate_id}/validation_report.json`
- `/logs/{gate_id}/...`

### 5.3 索引策略

- signals、tags、summary：倒排索引
- env_fingerprint：结构化过滤
- 可选向量：summary/signals 生成 embedding（后期再上，不阻塞 MVP）

------

## 6. Sandbox Runner 详细设计

### 6.1 输入输出

输入：

- repo_ref（Git commit 或 SVN revision）
- patch.diff
- validation_plan（要跑哪些命令/哪些测试套件）
- resource_limits（CPU/MEM/TIME）

输出：

- validation_report.json（统一结构）
- logs（stdout/stderr）
- 补充 env_fingerprint（实际执行环境）

### 6.2 执行步骤

1. 获取代码快照

- Git：浅克隆到指定 commit（或本地 mirror）
- SVN：checkout 到指定 revision（或基于本地工作副本更新）

1. 应用 patch

- 优先用 `git apply`（Git）
- SVN 也可以用统一 diff + `patch` 工具（注意换行符/路径前缀）

1. 执行验证计划

- 强制在容器/VM 中执行
- 默认 **无外网**（依赖由镜像预置或内网代理）

1. 产出报告（结构化）

```json
{
  "status": "pass|fail",
  "steps": [
    {"name":"build", "status":"pass", "duration_ms":...},
    {"name":"unit_test", "status":"fail", "failed_cases":[...]}
  ],
  "artifacts": {...},
  "env_fingerprint": {...}
}
```

### 6.3 隔离与资源限制（最低可用）

- Docker + 只读挂载源码
- 输出目录只写
- 限制：
  - `--cpus`、`--memory`
  - timeout 到点 kill
- 进阶（你们安全要求高再上）：gVisor/Firecracker

------

## 7. 安全设计（必须“写死”）

### 7.1 信任边界

- **Hub 不信任任何外部节点的 bundle**
- **验证命令必须在 Sandbox/CI 执行**
- candidate 不默认下发

### 7.2 命令策略（建议两层）

**层 A：强白名单（MVP）**

- validation_plan 不允许携带任意 shell
- 只能选择预置的“任务名”，例如：
  - `build_win64`
  - `run_unit_tests`
  - `lint_ts`
- 由 Runner 映射到具体命令（命令在服务端配置）

**层 B：有限命令（若你坚持允许命令字符串）**

- 禁止 `; & | > < \` $()`
- 禁止 `curl/wget/powershell Invoke-WebRequest` 等外连
- 禁止写系统目录、读敏感路径

> 现实建议：**别给字符串命令自由度**，最终会变成安全洞。

### 7.3 资产撤销（Revoke）策略

- 一旦发现污染/漏洞：
  - `status=revoked`
  - fetch 默认过滤
  - 可选：向已注册节点推送 revoke（或下次 hello 时同步黑名单）

### 7.4 配额与反滥用

- publish 限流（每 node 每小时 N 次）
- candidate 池容量限制（超出自动降级/拒收）
- 同 signals 重复提交提示“可能重复”

------

## 8. 排序与自动提升（Promotion / Ranking）

### 8.1 MVP：硬门槛优先

promoted 必须满足：

- 通过 Sandbox/CI 验证至少 1 次
- blast_radius 不超过阈值（或经过人工审核）
- 无安全策略命中
- confidence ≥ 0.7（或人工 override）

### 8.2 Beta：简版 GDI（可解释）

给一个可解释的综合分：

```
score = 0.45 * intrinsic
      + 0.35 * usage
      + 0.20 * freshness
```

- intrinsic：验证通过 + 置信度 + 影响范围惩罚
- usage：success_rate、reuse_count（带去重：不同 node/不同 env 才算）
- freshness：时间衰减

### 8.3 Auto-Promote 规则（建议保守）

满足以下全部才自动 promoted：

- confidence ≥ 0.85
- success_streak ≥ 3
- env_coverage ≥ 2（至少两类 env_fingerprint）
- blast_radius_files ≤ X 且 blast_radius_lines ≤ Y
  否则进入 candidate 等审核。

------

## 9. Git / SVN / CI / IM 集成设计

### 9.1 代码载体统一：Patch + Ref

Capsule 必带：

- `base_ref`：commit hash 或 svn revision
- `patch.diff`：统一 diff（最好带路径前缀规范）
- `apply_instructions`：可选（让消费者能一键应用）

### 9.2 CI 集成（建议优先用你们现有）

- Hub 在 Gate 阶段触发 CI job：
  - 参数：repo_ref、patch_key、validation_plan
- CI 产出 report 回调 Hub（或 Hub 轮询）

### 9.3 IM Bot（你们“小九”场景）

- bot 接收自然语言 → 解析 signals（关键词/报错）
- 调用 `fetch` 返回 Top-k capsule + 适配解释
- bot 提供一键“生成测试分支/补丁包/应用脚本”的链接

------

## 10. 可观测性与运维

### 10.1 指标（最少要有）

- publish_success / publish_reject（按原因分类）
- gate_duration（分阶段）
- validation_pass_rate
- fetch_hit_rate（命中 promoted 的比例）
- reuse_success_rate（来自 report）
- revoked_count / quarantine_count

### 10.2 日志与审计

- 每个 message_id 全链路关联（Hub ↔ Runner ↔ CI）
- audit_logs append-only（合规/追责）

### 10.3 备份与恢复

- Postgres：每日备份 + 7/30 天保留
- ObjectStore：生命周期策略（大日志 7 天、关键报告 90 天）

------

## 11. 性能与扩展性（按你们内网规模）

- 资产量 10k：Postgres + 轻量索引足够
- 节点 200：hello 心跳用轻量表 + 缓存
- Runner 并发：用队列控制（如 Redis/DB queue），避免把宿主机打满
- 搜索：先 Meilisearch（轻、快、运维简单），后续再换 OpenSearch

------

## 12. 测试策略（别省）

- 单元测试：schema 校验、hash canonicalize、权限/策略
- 集成测试：
  - publish → gate → fetch → report 全链路
  - 恶意 bundle：hash 篡改/危险 validation/超大 patch
- 安全测试：
  - sandbox 逃逸尝试（基础）
  - 外连阻断验证
- 回归集：关键 signals 的典型 case（你们 UE 构建/Shader/脚本相关）

------

## 13. 灰度上线与回滚

- Phase0：只读 fetch（先当“经验库”）
- Phase1：开放 publish → candidate，但不自动下发 candidate
- Phase2：引入 sandbox 验证与小范围 auto-promote（白名单项目）
- 回滚：
  - 关闭 publish 或全部降级为 candidate
  - 关闭 auto-promote
  - 一键 revoke 某批次资产（按 created_at / node_id）

------

# 附录 A：建议的 JSON 字段骨架（精简示例）

### Gene（gene.json）

```json
{
  "type": "Gene",
  "schema_version": "1.0",
  "asset_id": "sha256:...",
  "project": "A1",
  "namespace": "client",
  "category": "repair",
  "signals_match": ["LNK2019", "unresolved external symbol"],
  "preconditions": {"os":["win"], "toolchain":["vs2022"], "ue":["5.6"]},
  "constraints": {"max_blast_radius_files": 20},
  "validation_plan": {"tasks":["build_win64","unit_test_smoke"]},
  "summary": "修复某类链接错误并保证 Win64 构建通过",
  "tags": ["ue", "build"]
}
```

### Capsule（capsule.json）

```json
{
  "type": "Capsule",
  "schema_version": "1.0",
  "asset_id": "sha256:...",
  "gene_id": "sha256:...",
  "base_ref": {"vcs":"git","ref":"abcd1234"},
  "patch": {"object_key": "/patches/sha256...diff"},
  "confidence": 0.88,
  "blast_radius": {"files": 3, "lines": 25},
  "env_fingerprint": {"os":"win","toolchain":"vs2022","ue":"5.6"},
  "summary": "针对 LNK2019 的头文件包含顺序修复",
  "tags": ["ue","linker"]
}
```

### EvolutionEvent（event.json，可选）

```json
{
  "type": "EvolutionEvent",
  "schema_version": "1.0",
  "asset_id": "sha256:...",
  "intent": "repair",
  "signals": ["LNK2019 ..."],
  "mutations_tried": 2,
  "outcome": "success",
  "evidence": {"gate_id":"gate_123"}
}
```

------

## 你接下来怎么用这份 SDD

1. 直接按组件开任务：Hub API / Runner / Indexer / Console / SDK
2. 我建议你们先做 **“任务名验证计划”**（而不是命令字符串），安全风险会小一个量级。
3. 如果你告诉我你们更偏 **SVN 还是 Git**、以及 CI 类型，我可以把第 9 节细化到“具体命令/镜像/挂载/路径规范/patch 前缀规则/流水线参数”的工程级细则，并给一套可以直接写代码的接口定义（OpenAPI + JSON Schema）。