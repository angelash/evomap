# EvoMap-Lite Phase 0 开发计划

## 任务目标
完成 Phase 0（1~2 周）：协议骨架 + 存储模型 + publish/fetch/report

## 开发步骤

### Step 1: 项目初始化（✅ 完成）
- [x] 创建规则文件（.cursor/rules/*.mdc）
- [x] 写入开发任务工作要求
- [x] 初始化项目结构
- [x] 配置开发环境

### Step 2: 协议骨架实现（✅ 完成）
- [x] 实现 A2A Envelope 类型定义
- [x] 实现消息类型（hello/publish/fetch/report/decision/revoke）
- [x] 实现错误码定义
- [x] 编写单元测试
- [x] 安装依赖
- [x] 创建定时任务

### Step 3: 存储模型设计（✅ 完成）
- [x] 设计 Postgres 表结构
- [x] 编写数据库迁移脚本
- [x] 实现数据库连接池
- [x] 编写单元测试

### Step 4: 基础 API 实现（✅ 完成）
- [x] 实现 Express 服务器框架
- [x] 实现 hello endpoint（节点注册）
- [x] 实现 publish endpoint（接收 bundle）
- [x] 实现 fetch endpoint（拉取资产）
- [x] 编写集成测试

### Step 5: 验收测试（✅ 完成）
- [x] 运行全链路测试（hello → publish → fetch → report）
- [x] 验证 AC-M1 ~ AC-M5
- [x] 修复发现的问题

### Step 6: 数据库配置（✅ 完成）
- [x] 创建 Postgres 配置指南（POSTGRES_SETUP.md）
- [x] 部署正式环境 Postgres 数据库
- [x] 配置环境变量（.env）
- [x] 运行数据库迁移

### Step 7: 正式部署（✅ 完成）
- [x] 配置生产环境变量
- [x] 运行数据库迁移（正式环境）
- [x] 启动 Hub API 服务
- [x] 验证所有 endpoints
- [ ] 压力测试（可选）

### Step 8: 代码审查修复（✅ 完成）
- [x] 修复 publish.ts bundle_format 判断 bug
- [x] 修复 public_key NOT NULL 约束问题
- [x] 修复 fetch.ts 字段名不一致问题
- [x] 清理 node_modules 提交问题
- [x] 修复 POSTGRES_SETUP.md 拼写错误
- [x] 修复测试用例 Mock 问题
- [x] 所有 21 个测试通过

## 当前进度
- ✅ Step 1 完成（项目初始化）
- ✅ Step 2 完成（协议骨架实现）
- ✅ Step 3 完成（存储模型设计）
- ✅ Step 4 完成（基础 API 实现）
- ✅ Step 5 完成（验收测试）
- ✅ Step 6 完成（数据库配置）
- ✅ Step 7 完成（正式部署）
- ✅ Step 8 完成（代码审查修复）

## Phase 0 总结

### 已完成功能
- A2A Envelope 协议定义
- 6 种消息类型实现（hello/publish/fetch/report/decision/revoke）
- Postgres 存储模型（6 张表）
- Express API 服务器
- 完整的单元测试和集成测试（21 个测试全部通过）
- 生产环境部署完成

### 代码质量
- 所有测试通过（14 单元测试 + 7 集成测试）
- 代码审查问题全部修复
- .gitignore 配置完成
- 文档完善（POSTGRES_SETUP.md）

## 下一步
Phase 0 已完成！准备进入 Phase 1（Sandbox Runner + Gate Pipeline）

### Phase 1 规划（已确认：CI 模式）
✅ Sandbox Runner 方案：**CI 模式**（复用现有 CI 流水线）

详细任务清单见：`PLAN_PHASE1.md`
