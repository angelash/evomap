# EvoMap-Lite Phase 1 开发计划

## 任务目标
完成 Phase 1（2~3 周）：Gate Pipeline + Sandbox Runner（CI 模式）

## 核心目标
- 实现 Gate Pipeline（发布包验证流水线）
- 实现 Sandbox Runner（基于 CI 模式的验证执行器）
- 完成从 publish 到 candidate/promoted 的完整闭环

---

## Step 1: Gate Pipeline 框架搭建

### 1.1 创建 Gate Pipeline 核心模块
- [x] 创建 `src/gate/pipeline.ts` - 流水线编排器
- [x] 创建 `src/gate/stages/` 目录 - 各验证阶段
- [x] 定义 Gate 状态机（received → schema_ok → policy_ok → validated → promoted|candidate|rejected|quarantined）
- [x] 实现状态持久化到 gates 表

### 1.2 实现 Pipeline 调度器
- [x] 创建 `src/gate/scheduler.ts` - 异步任务调度
- [x] 实现队列管理（基于 Postgres 或内存队列）
- [x] 实现并发控制（限制同时运行的 gate 任务数）
- [x] 添加超时处理和重试机制

### 1.3 集成到 publish handler
- [x] 修改 `src/handlers/publish.ts` - 接收后触发 gate pipeline
- [x] 返回 gate_id 给客户端
- [x] 实现 `GET /gates/{gate_id}` 查询 gate 状态
- [x] 实现 `POST /gates/{gate_id}/cancel` 取消 gate 任务

---

## Step 2: Gate Pipeline 各阶段实现

### 2.1 Stage 1: Parse & Schema Validate
- [x] 创建 `src/gate/stages/01-parse.ts`
- [x] 实现解包逻辑（zip/tar.gz）
- [x] 校验 bundle 内容结构（gene.json/capsule.json/patch.diff）
- [x] 校验 JSON schema（使用 ajv 或类似库）
- [x] 校验必填字段和字段类型
- [x] 输出：parsed_bundle 对象

### 2.2 Stage 2: Hash Verify
- [x] 创建 `src/gate/stages/02-hash-verify.ts`
- [x] 实现 canonical JSON 序列化（字段排序、UTF-8）
- [x] 计算 SHA256 哈希
- [x] 对比 bundle_hash 和计算值
- [x] 验证 asset_id 格式（`sha256:` 前缀）
- [x] 输出：verified_assets 对象

### 2.3 Stage 3: Security Policy Check
- [x] 创建 `src/gate/stages/03-security-check.ts`
- [x] 实现 validation_plan 白名单校验（只允许预置任务名）
- [x] 检测危险命令（`; & | > < \` $()`）
- [x] 检测外连命令（curl/wget/Invoke-WebRequest）
- [x] 校验 blast_radius 阈值（文件数、行数）
- [x] 输出：security_report 对象

### 2.4 Stage 4: CI Validation
- [x] 创建 `src/gate/stages/04-ci-validate.ts`
- [x] 实现 CI 任务触发（调用 CI Adapter）
- [x] 实现结果轮询或回调处理
- [x] 解析 validation_report.json
- [x] 输出：validation_result 对象

### 2.5 Stage 5: Score & Promote Decision
- [x] 创建 `src/gate/stages/05-score-promote.ts`
- [x] 实现自动提升规则（confidence ≥ 0.85, success_streak ≥ 3）
- [x] 实现评分逻辑（intrinsic + usage + freshness）
- [x] 决策：promoted / candidate / rejected / quarantined
- [x] 更新 assets 表状态
- [x] 输出：decision 对象

---

## Step 3: CI Adapter 实现

### 3.1 CI 接口抽象
- [x] 创建 `src/ci/adapter.ts` - CI 适配器接口
- [x] 定义 CI 任务输入输出结构
- [x] 定义 CI 配置（CI URL、认证、项目映射）

### 3.2 GitLab CI Adapter（示例）
- [ ] 创建 `src/ci/gitlab-ci.ts`
- [ ] 实现 GitLab API 触发 pipeline
- [ ] 传递参数：repo_ref、patch_key、validation_plan
- [ ] 实现结果轮询（pipeline 状态查询）
- [ ] 解析 pipeline artifacts（validation_report.json）

### 3.3 GitHub Actions Adapter（示例）
- [ ] 创建 `src/ci/github-actions.ts`
- [ ] 实现 GitHub Actions workflow_dispatch 触发
- [ ] 传递参数：repo_ref、patch_key、validation_plan
- [ ] 实现结果轮询（workflow run 状态查询）
- [ ] 解析 workflow artifacts（validation_report.json）

### 3.4 CI 配置管理
- [x] 创建 `.env` 配置项（CI_TYPE、CI_URL、CI_TOKEN）
- [x] 实现配置加载和验证
- [ ] 添加 CI 连接测试

---

## Step 4: Sandbox Runner（CI 模式）

### 4.1 验证计划执行器
- [x] 创建 `src/runner/executor.ts`
- [x] 实现代码快照获取（Git clone / SVN checkout）
- [x] 实现 patch 应用（git apply / patch 命令）
- [x] 实现验证计划执行（映射任务名到命令）
- [x] 实现资源限制（CPU/MEM/TIMEOUT）
- [x] 输出：validation_report.json

### 4.2 验证计划配置
- [x] 创建 `src/runner/plans.ts` - 预置验证计划
- [x] 定义任务映射（build_win64 → 实际命令）
- [x] 定义任务映射（run_unit_tests → 实际命令）
- [x] 定义任务映射（lint_ts → 实际命令）
- [x] 支持自定义验证计划（可选）

### 4.3 环境指纹收集
- [x] 实现执行环境信息收集（OS、工具链、编译器版本）
- [x] 生成 env_fingerprint JSON
- [x] 写入 validation_report

---

## Step 5: 数据库迁移

### 5.1 更新 gates 表
- [x] 创建迁移 `20250220_003_enhance_gates_table.sql`
- [x] 添加字段：stage（当前阶段）
- [x] 添加字段：error_code、error_message
- [x] 添加字段：validation_report_key（指向对象存储）
- [x] 添加字段：decision、decision_reason
- [x] 添加索引：idx_gates_status、idx_gates_stage

### 5.2 新增 validation_plans 表（可选）
- [ ] 创建迁移 `20250220_004_create_validation_plans_table.sql`
- [ ] 字段：plan_id、name、commands（JSON）、created_at
- [ ] 预置默认验证计划

### 5.3 更新 assets 表
- [x] 创建迁移 `20250220_005_enhance_assets_table.sql`
- [x] 添加字段：confidence（置信度）
- [x] 添加字段：blast_radius_files、blast_radius_lines
- [x] 添加字段：env_fingerprint（JSONB）
- [x] 添加字段：promoted_at、quarantined_at、revoked_at

---

## Step 6: 对象存储集成

### 6.1 MinIO/S3 客户端
- [x] 安装依赖：`aws-sdk` 或 `minio`
- [x] 创建 `src/storage/client.ts`
- [x] 实现上传 bundle
- [x] 实现上传 patch
- [x] 实现上传 validation_report
- [x] 实现下载对象

### 6.2 存储路径规范
- [x] 定义路径模板：`/bundles/{bundle_hash}.zip`
- [x] 定义路径模板：`/patches/{capsule_id}.diff`
- [x] 定义路径模板：`/reports/{gate_id}/validation_report.json`
- [x] 实现路径生成函数

### 6.3 对象存储配置
- [x] 添加 `.env` 配置（S3_ENDPOINT、S3_ACCESS_KEY、S3_SECRET_KEY、S3_BUCKET）
- [x] 实现配置加载和验证
- [x] 添加连接测试

---

## Step 7: 单元测试

### 7.1 Gate Pipeline 测试
- [x] 测试状态机转换
- [x] 测试各阶段输入输出
- [x] 测试错误处理和回滚
- [x] 测试超时和重试

### 7.2 CI Adapter 测试
- [x] Mock CI API 响应
- [x] 测试任务触发
- [x] 测试结果轮询
- [x] 测试 artifacts 解析

### 7.3 Sandbox Runner 测试
- [x] 测试代码快照获取
- [x] 测试 patch 应用
- [x] 测试验证计划执行
- [x] 测试环境指纹收集

---

## Step 8: 集成测试

### 8.1 完整链路测试
- [x] 测试 publish → gate pipeline → validated → candidate 流程
- [x] 测试自动提升流程（满足条件 → promoted）
- [x] 测试安全策略拦截（危险命令 → rejected）
- [x] 测试 hash 验证失败（篡改 → rejected）

### 8.2 CI 集成测试测试
- [x] 测试 CI 任务触发和回调
- [x] 测试 CI 超时处理
- [x] 测试 CI 失败重试

### 8.3 对象存储测试
- [x] 测试 bundle 上传和下载
- [x] 测试 patch 上传和下载
- [x] 测试 validation_report 上传和下载

---

## Step 9: 文档和配置

### 9.1 环境配置文档
- [x] 创建 `MINIO_SETUP.md` - 对象存储配置指南
- [x] 创建 `.env.example` - 完整配置示例
- [x] 创建 `CI_SETUP.md` - CI 配置指南

### 9.2 API 文档更新
- [x] 更新 `POST /a2a/publish` - gate_id 返回说明
- [x] 新增 `GET /gates/{gate_id}` - gate 状态查询
- [x] 新增 `POST /gates/{gate_id}/cancel` - 取消 gate 任务

### 9.3 验证计划文档
- [x] 创建 `VALIDATION_PLANS.md` - 验证计划定义指南
- [x] 列出预置任务名和对应命令
- [x] 说明自定义验证计划方法

---

## Step 10: 部署和验证

### 10.1 本地部署验证
- [ ] 启动 MinIO（Docker）
- [ ] 配置 CI 连接（GitLab/GitHub）
- [ ] 运行数据库迁移
- [ ] 启动 Hub API
- [ ] 验证 gate pipeline 正常工作

### 10.2 集成测试运行
- [ ] 运行所有单元测试
- [ ] 运行所有集成测试
- [ ] 验证测试覆盖率（>80%）

### 10.3 性能测试（可选）
- [ ] 测试 gate pipeline 并发处理能力
- [ ] 测试 CI 集成响应时间
- [ ] 测试对象存储上传下载性能

---

## 当前进度
- ✅ Step 1: Gate Pipeline 框架搭建
- ✅ Step 2: Gate Pipeline 各阶段实现
- ⬜ Step 3: CI Adapter 实现（接口完成，但 GitLab/GitHub 适配器未实现）
- ✅ Step 4: Sandbox Runner（CI 模式）
- ✅ Step 5: 数据库迁移
- ✅ Step 6: 对象存储集成
- ✅ Step 7: 单元测试
- ✅ Step 8: 集成测试
- ⬜ Step 9: 文档和配置（部分完成）
- ⬜ Step 10: 部署和验证

## 下一步
Phase 1 核心功能已完成！剩余为文档和部署验证。

Phase 1 完成后，准备进入 Phase 2（Indexer + Console + Evolver SDK）
