下面给你一份 **“EvoMap-Lite（企业内网自建版）”详细完整需求文档（PRD）**，目标是把 *Gene / Capsule / EvolutionEvent* 的闭环跑通，并对齐公开的 GEP/A2A 思路（协议封装、资产寻址、质量门禁、上报与自然选择）。([EvoMap](https://evomap.ai/llms.txt))

------

# EvoMap-Lite 需求文档（PRD v0.1）

## 1. 背景与问题陈述

### 1.1 背景

团队内多 Agent / 多角色（研发、测试、策划）在高频解决相似问题：构建失败、依赖冲突、性能回归、脚本不稳定、接口异常等。**重复推理与重复修复**导致：

- 同类问题被不同人/不同 Agent 反复“重新想一遍”；
- 经验难以复用，缺少可追溯、可验证的“经验资产”；
- 自动化能力难规模化，容易变成不可控的“自由发挥”。

### 1.2 要解决的核心问题

1. 把一次成功修复/优化沉淀为可复用资产（可验证 + 可追溯 + 可检索）。
2. 让其他 Agent 能“继承”而不是“重新推理”。
3. 用质量门禁与隔离验证降低风险（尤其是可执行验证命令）。([EvoMap](https://evomap.ai/llms-full.txt))

------

## 2. 产品目标与非目标

### 2.1 产品目标（Goals）

- G1：建立“资产化经验”体系：Gene（策略模板）+ Capsule（成功产物）+ EvolutionEvent（审计记录）。([EvoMap](https://evomap.ai/llms.txt))
- G2：提供 Agent-to-Agent 的最小协议接口：hello / publish / fetch / report / decision / revoke。([EvoMap](https://evomap.ai/llms.txt))
- G3：实现 **candidate → promoted** 的质量门禁与自动/人工决策流程。([EvoMap](https://evomap.ai/llms-full.txt))
- G4：企业内网部署，支持 Git / SVN 两种改动载体（patch/变更集）和 CI 校验。
- G5：默认“安全优先”：**不允许直接在生产自动打补丁**，以 review/sandbox/门禁为默认路径。

### 2.2 非目标（Non-Goals）

- NG1：不做公网 marketplace、跨组织结算、公开声誉经济（先不碰钱）。
- NG2：不追求“全自动无人值守上线”；无人值守仅限 sandbox 与候选区。
- NG3：不强绑定某一家 LLM / 某一个 Agent 平台（保持可插拔）。

------

## 3. 术语与定义（与公开 GEP 对齐）

- **Gene**：可复用策略模板（repair/optimize/innovate），包含触发信号、前置条件、约束、验证命令。([EvoMap](https://evomap.ai/llms.txt))
- **Capsule**：应用 Gene 得到的“已验证成功”产物，带触发信号、置信度、影响范围（blast radius）、环境指纹（env fingerprint）。([EvoMap](https://evomap.ai/llms.txt))
- **EvolutionEvent**：进化过程审计记录（意图、尝试的变异、结果等）。([EvoMap](https://evomap.ai/llms.txt))
- **Asset ID**：内容寻址 ID，使用 canonical JSON 的 SHA-256（防篡改、去重）。([EvoMap](https://evomap.ai/llms-full.txt))
- **A2A**：Agent-to-Agent 协议消息封装（hello/publish/fetch/report/decision/revoke）。([EvoMap](https://evomap.ai/llms.txt))
- **GDI（可选）**：资产综合排序分数（质量/使用/社交/新鲜度权重），用于推荐与自动提升。([EvoMap](https://evomap.ai/llms.txt))

------

## 4. 用户画像与权限模型

### 4.1 角色

- R1：**资产贡献者**（研发/Agent）：产出 Gene/Capsule，提交 publish。
- R2：**资产消费者**（研发/测试/策划/Agent）：search/fetch 复用资产。
- R3：**审核者**（TL/代码所有者/安全）：对 candidate 做 decision（accept/reject/quarantine）。
- R4：**平台管理员/运维**：节点管理、黑白名单、配额、审计、回收。

### 4.2 权限（RBAC）

- Node 注册（hello）：仅内网 invite code / 白名单可注册（防“匿名节点”污染）。参考公开实现里也强调注册可追溯与安全门禁。([EvoMap](https://evomap.ai/llms-full.txt))
- publish：R1 + 已注册 Node
- decision/revoke：R3/R4
- fetch/report：R2 + 已注册 Node（或只读开放给内网用户）

------

## 5. 业务流程（End-to-End）

### 5.1 主流程：问题 → 资产沉淀 → 复用

1. Agent 发现问题（日志/报错/指标）
2. Evolver 本地进入 “evolve loop”：提取 signals → 选 Gene/生成 Mutation → 产出 patch → 在 sandbox 运行验证命令
3. 验证通过：打包 Gene + Capsule（可选加 EvolutionEvent）并计算 SHA-256 asset_id
4. Hub 接收 publish：完整性校验 + 安全审查 + 质量门禁 → candidate
5. 满足条件则 auto-promote，否则进入人工 decision
6. 其他 Agent fetch 命中后复用，提交 report（成功/失败/环境差异）形成自然选择数据。([EvoMap](https://evomap.ai/llms.txt))

------

## 6. 功能需求（FR）

### 6.1 Hub 服务（核心）

**FR-H01 Node Registry（hello）**

- 输入：Node 基本信息（capabilities、gene_count、capsule_count、env_fingerprint 等）
- 输出：node_id、注册状态、可选 claim_code
- 约束：注册需 invite code / 内网 ACL（MVP 可用静态白名单）

**FR-H02 资产接收（publish）**

- 必须支持 bundle：至少包含 **1 Gene + 1 Capsule**（同一 bundle）。([EvoMap](https://evomap.ai/llms-full.txt))
- 校验：
  - schema_version、必填字段、字段范围（confidence 0~1 等）
  - asset_id 与内容 hash 一致（防篡改）([EvoMap](https://evomap.ai/llms-full.txt))
  - Gene.validation 命令安全审计（见安全需求）

**FR-H03 资产生命周期**

- candidate / promoted / rejected / revoked 四态管理。([EvoMap](https://evomap.ai/llms-full.txt))
- 状态变更记录审计（谁/何时/原因）

**FR-H04 质量门禁（Quality Gates）**

- Gate-1：结构完整性 + hash 校验
- Gate-2：安全审计（验证命令白名单、危险操作符拦截）([EvoMap](https://evomap.ai/llms-full.txt))
- Gate-3：sandbox 验证（可配置：Hub 自己跑 / 调用 CI / 调用 Sandbox 服务）
- Gate-4：重复资产检测（同 asset_id 直接去重；相似 signals/summary 提示重复）

**FR-H05 检索与分发（fetch + search）**

- 支持按：signals、category、env_fingerprint、语言栈标签、项目标签检索
- 返回：promoted 优先；可配置是否允许 candidate（默认不下发）

**FR-H06 使用反馈（report）**

- 上报：target_asset_id、执行环境指纹、成功/失败、失败原因分类、耗时、影响范围
- Hub 累积：success_rate、reuse_count、env_coverage

**FR-H07 管理裁决（decision / revoke）**

- decision：accept / reject / quarantine
- revoke：资产撤回并广播（可选）

**FR-H08 统计与可观测性（stats / trending）**

- Hub 统计：资产数、节点数、命中率、节省 tokens 的估算指标（可先占位）
- trending：按近期复用量/成功率排序

------

### 6.2 Evolver 客户端（Agent 侧）

> 参考公开 Evolver 的定位：扫描运行历史、提取 signals、选择 Gene/Capsule、生成协议受限的演进产物，并提供 loop/review 等安全模式。([GitHub](https://raw.githubusercontent.com/autogame-17/evolver/main/SKILL.md))

**FR-E01 信号提取（Signals Extraction）**

- 输入：日志（jsonl）、异常栈、性能指标、用户反馈
- 输出：signals 列表（去重、聚类、top-N）

**FR-E02 选择与复用（Selector）**

- 优先 fetch 已有 promoted 资产；命中则尝试直接复用
- 未命中才进入 Mutation 生成（减少“重复造轮子”）

**FR-E03 变异生成（Mutation）**

- 类型：repair / optimize / innovate
- 约束：每轮必须显式声明 mutation（避免隐式大改）
- 策略预设：balanced / innovate / harden / repair-only（可按你们阶段调参）([GitHub](https://raw.githubusercontent.com/autogame-17/evolver/main/SKILL.md))

**FR-E04 固化验证（Solidify）**

- 执行 Gene.validation 命令，产出验证报告（结构化 JSON）
- 失败则回滚本地变更或标记失败原因

**FR-E05 打包发布**

- 生成 canonical JSON，计算 SHA-256 asset_id
- 组装 bundle 并 publish
- 默认 **禁止自修改 Evolver 核心**（可选开关，但不建议上生产）([GitHub](https://raw.githubusercontent.com/autogame-17/evolver/main/SKILL.md))

**FR-E06 Loop 模式与反滞留**

- loop：周期执行（crontab/daemon）
- backoff：负载过高暂停（如 load average 阈值）([GitHub](https://raw.githubusercontent.com/autogame-17/evolver/main/SKILL.md))
- stagnation detection：连续修同一类问题触发策略切换（防无限循环）

------

### 6.3 Sandbox（隔离验证执行）

**FR-S01 容器化执行**

- 运行模式：一次性容器（推荐）
- 挂载：代码只读 + 工件输出目录只写
- 网络：默认无外网或白名单域名（依赖下载走镜像缓存/内网代理）

**FR-S02 资源配额**

- CPU / MEM / IO / TIME 限制（防挖矿/死循环/爆盘）

**FR-S03 工件与证据保全**

- 保存：执行日志、测试报告、diff、环境指纹
- 关联到 EvolutionEvent / ValidationReport

------

### 6.4 Web Console（可选但强烈建议）

**FR-W01 资产浏览**：按 signals/项目/语言栈筛选
**FR-W02 资产详情**：Gene/Capsule/EvolutionEvent 关联展示、验证报告、命中次数、成功率
**FR-W03 审核台**：candidate 列表、diff、决策按钮、审计理由
**FR-W04 节点面板**：节点活跃度、成功率、被拒绝率、配额

------

### 6.5 CI / Repo 集成

**FR-I01 Git 集成（必做）**

- Capsule 可携带 git patch / PR 分支引用
- 支持自动创建 PR（可选）

**FR-I02 SVN 集成（按你们现状可选）**

- Capsule 携带 svn diff / shelve 信息
- 提供“应用补丁到工作区”的标准脚本接口

**FR-I03 CI Gate**

- candidate 资产必须跑一套最小验证（单测/静态检查/打包）再允许 promoted（可由 Hub 调度 CI）

------

## 7. 协议与接口（A2A + REST）

### 7.1 A2A 消息封装（必做）

每个请求都包含统一 envelope：protocol、protocol_version、message_type、message_id、sender_id、timestamp、payload（7 个字段）。([EvoMap](https://evomap.ai/llms-full.txt))

支持 message_type：hello / publish / fetch / report / decision / revoke。([EvoMap](https://evomap.ai/llms.txt))

### 7.2 Endpoint（对齐公开路径，方便未来兼容）

- POST `/a2a/hello`
- POST `/a2a/publish`
- POST `/a2a/fetch`
- POST `/a2a/report`
- POST `/a2a/decision`
- POST `/a2a/revoke`
  并提供只读查询：`/a2a/assets`、`/a2a/assets/ranked`、`/a2a/trending`、`/a2a/nodes`、`/a2a/stats` 等。([EvoMap](https://evomap.ai/llms.txt))

------

## 8. 数据结构（Schema 级需求）

### 8.1 Gene（最小字段）

- type = "Gene"
- schema_version
- category ∈ {repair, optimize, innovate}
- signals_match[]（触发信号，≥1）
- summary（≥10 字符）
- validation[]（验证命令列表）
- asset_id（sha256:…）([EvoMap](https://evomap.ai/llms-full.txt))

### 8.2 Capsule（最小字段）

- type = "Capsule"
- schema_version
- trigger[]
- gene（引用 Gene.asset_id）
- summary（≥20 字符）
- confidence ∈ [0,1]
- blast_radius（files/lines）
- outcome（status/score）
- success_streak（连续成功次数）
- env_fingerprint（平台/版本）
- asset_id([EvoMap](https://evomap.ai/llms-full.txt))

### 8.3 EvolutionEvent（建议字段）

- type="EvolutionEvent"
- intent（repair/optimize/innovate）
- genes_used[]
- mutations_tried、total_cycles
- outcome
- asset_id

> 公开参考里提到：带 EvolutionEvent 会带来加分/增益（你内网版可以先当“审计增强项”）。([EvoMap](https://evomap.ai/llms-full.txt))

------

## 9. 排序与提升（GDI / Promotion）

### 9.1 MVP：先不做复杂 GDI，但要做“硬门槛”

- promoted 必须满足：schema+hash+安全审计+验证通过（至少 1 次）
- report 引入后再做排序

### 9.2 Beta：实现简版 GDI 与自动提升

公开参考提供了一个权重样例（质量/使用/社交/新鲜度），并给出 auto-promotion 的阈值条件（confidence、success_streak、reputation 等）。([EvoMap](https://evomap.ai/llms.txt))
你内网版建议：

- Intrinsic（合规+验证通过+confidence）
- Usage（reuse_count、success_rate）
- Freshness（时间衰减）
  社交信号（投票）可以最后再上，避免被刷。

------

## 10. 安全需求（必须写死在 PRD 里）

这是整个系统最容易“翻车”的地方：你在接收并执行别人给的 validation 命令。

**SR-01 Validation 命令白名单**

- 仅允许 `node` / `npm` / `npx` 前缀；禁止 shell 操作符与命令替换（`; & | > < \` $(...)` 等）。([EvoMap](https://evomap.ai/llms-full.txt))

**SR-02 外部资产永远先进 candidate 区**

- candidate 默认不下发给普通消费者
- promoted 必须经过验证门禁与审核/策略提升([EvoMap](https://evomap.ai/llms-full.txt))

**SR-03 沙箱隔离与资源限制**

- 禁止直接在 Hub 宿主机执行验证命令
- 强制容器/VM 隔离 + 配额 + 超时 kill

**SR-04 审计不可删除**

- publish / decision / revoke / report 全部写入审计日志
- 保留期与导出能力（合规/追责）

**SR-05 供应链与密钥**

- sandbox 内默认拿不到生产密钥
- 依赖下载走内网镜像，禁止随意外连

------

## 11. 非功能需求（NFR）

- NFR-01 可用性：Hub 99.9%（内网）；降级策略：fetch 可读缓存
- NFR-02 延迟：search/fetch P95 < 300ms（内网）
- NFR-03 扩展性：支持至少 200 节点并发注册、10k 资产索引
- NFR-04 可观测：指标（命中率、promote 率、失败分类）、日志、trace
- NFR-05 可维护：schema versioning、向后兼容策略

------

## 12. 验收标准（Acceptance Criteria）

**MVP（可上线试点）**

- AC-M1：hello/publish/fetch/report 全链路可跑通
- AC-M2：资产 hash 校验 + 去重可用
- AC-M3：sandbox 验证可执行并产出报告
- AC-M4：candidate/promoted 生命周期可控
- AC-M5：验证命令安全审计生效（危险命令必拒绝）

**Beta（可规模化）**

- AC-B1：简版排序（成功率/复用量/新鲜度）可用
- AC-B2：审核台可视化、审计可追溯
- AC-B3：与 CI/Repo 集成稳定（Git 必做，SVN 按需）

------

## 13. 里程碑建议（现实一点）

- Phase 0（1~2 周）：协议骨架 + 存储模型 + publish/fetch/report
- Phase 1（2~4 周）：sandbox + 安全审计 + candidate/promoted 流程
- Phase 2（4~8 周）：Web Console + CI 集成 + 简版排序
- Phase 3（8+ 周）：任务分发/赏金（如果你们内部确实需要）——公开参考里也有 task/bounty endpoints，但这块复杂度会上一个量级。([EvoMap](https://evomap.ai/llms-full.txt))

------

## 14. 风险清单（不糖衣，提前说透）

- **RISK-1：安全事故**（验证命令/依赖/外连）——必须 sandbox + 白名单 + 审计先行。([EvoMap](https://evomap.ai/llms-full.txt))
- **RISK-2：资产污染**（低质量/重复/刷分）——先硬门槛，社交信号最后做。
- **RISK-3：环境漂移**（能在 A 跑不在 B 跑）——env_fingerprint 必填 + report 反馈闭环。([EvoMap](https://evomap.ai/llms-full.txt))
- **RISK-4：组织协作成本**——审核/责任边界不清会卡死；PRD 里要写清“谁有 decision 权”。

------

如果你下一步要落到“可开工的工程拆分”，我可以把这份 PRD 继续细化成：

- **接口字段级 JSON Schema**（Gene/Capsule/Event/Report）
- **Hub 数据库表设计（Postgres）+ 索引策略（OpenSearch/Meilisearch）**
- **Sandbox 执行器的镜像/挂载/网络策略模板**
  并按你们实际（Git 还是 SVN 为主、CI 是 Jenkins 还是 GitLab CI、Agent 运行在 WSL 还是 Linux 服务器）给出对应的实现清单。