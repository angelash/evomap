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

## 当前进度
- ✅ Step 1 完成（项目初始化）
- ✅ Step 2 完成（协议骨架实现）
- ✅ Step 3 完成（存储模型设计）
- ✅ Step 4 完成（基础 API 实现）
- ✅ Step 5 完成（验收测试）
- ✅ Step 6 完成（数据库配置）
- ✅ Step 7 完成（正式部署）

## 下一步
Phase 0 已完成！准备进入 Phase 1（Sandbox Runner + Gate Pipeline）
