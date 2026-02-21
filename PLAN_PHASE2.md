# EvoMap-Lite Phase 2 开发计划

## 任务目标
完成 Phase 2（4~8 周）：Web Console + CI 集成 + 简版排序（GDI）

## 核心目标
- 实现 Web Console（资产浏览、审核台、节点面板）
- 实现 CI 集成（GitLab/GitHub Actions）
- 实现简版 GDI 排序与自动提升

---

## Step 1: Web Console 框架搭建

### 1.1 技术选型
- [ ] 选择前端框架（React/Vue/Next.js）
- [ ] 选择 UI 组件库（Ant Design / Material-UI / shadcn/ui）
- [ ] 配置构建工具（Vite / Next.js）
- [ ] 配置状态管理（Zustand / Redux / Pinia）

### 1.2 项目初始化
- [ ] 创建 `console/` 目录（独立前端项目）
- [ ] 配置 TypeScript
- [ ] 配置 ESLint + Prettier
- [ ] 配置 Tailwind CSS / CSS-in-JS

### 1.3 API 客户端
- [ ] 创建 API 客户端模块
- [ ] 实现 A2A 协议封装
- [ ] 实现认证机制（Token / Session）
- [ ] 实现错误处理与重试

---

## Step 2: 资产浏览功能

### 2.1 资产列表页
- [ ] 创建资产列表组件
- [ ] 实现分页与排序
- [ ] 实现筛选（signals、category、env_fingerprint、语言栈、项目标签）
- [ ] 实现搜索功能（全文搜索）

### 2.2 资产详情页
- [ ] 创建资产详情组件
- [ ] 展示 Gene/Capsule/EvolutionEvent 关联数据
- [ ] 展示验证报告（validation_report）
- [ ] 展示命中次数、成功率、置信度
- [ ] 展示 blast_radius（文件数、行数）
- [ ] 展示环境指纹（env_fingerprint）

### 2.3 资产状态标识
- [ ] 实现状态徽章（candidate/promoted/rejected/revoked）
- [ ] 实现置信度可视化（进度条/颜色）
- [ ] 实现时间线展示（created_at、promoted_at、revoked_at）

---

## Step 3: 审核台功能

### 3.1 Candidate 列表
- [ ] 创建 Candidate 列表组件
- [ ] 实现分页与筛选
- [ ] 实现状态过滤（pending/reviewed）
- [ ] 实现排序（按时间、置信度、blast_radius）

### 3.2 审核详情页
- [ ] 创建审核详情组件
- [ ] 展示 Gene/Capsule 完整内容
- [ ] 展示验证报告（validation_report）
- [ ] 展示安全审计结果（security_report）
- [ ] 展展示例 diff（patch.diff）

### 3.3 决策操作
- [ ] 实现决策按钮（accept/reject/quarantine）
- [ ] 实现决策理由输入
- [ ] 调用 `POST /a2a/decision` API
- [ ] 实现决策历史展示

---

## Step 4: 节点面板功能

### 4.1 节点列表
- [ ] 创建节点列表组件
- [ ] 实现分页与筛选
- [ ] 展示节点基本信息（node_id、capabilities、env_fingerprint）
- [ ] 展示节点状态（active/inactive）

### 4.2 节点详情页
- [ ] 创建节点详情组件
- [ ] 展示节点活跃度（最后活跃时间、请求次数）
- [ ] 展示成功率（publish 成功率、fetch 成功率）
- [ ] 展示被拒绝率（rejected 数量）
- [ ] 展示配额使用情况

### 4.3 节点管理
- [ ] 实现节点启用/禁用操作
- [ ] 实现节点配额调整
- [ ] 实现节点审计日志查看

---

## Step 5: 统计与可观测性

### 5.1 仪表盘首页
- [ ] 创建仪表盘组件
- [ ] 展示资产统计（总数、candidate 数、promoted 数、rejected 数）
- [ ] 展示节点统计（活跃节点数、总节点数）
- [ ] 展示命中率（fetch 命中率）
- [ ] 展示节省 tokens 估算指标

### 5.2 Trending 页面
- [ ] 创建 Trending 组件
- [ ] 实现按近期复用量排序
- [ ] 实现按成功率排序
- [ ] 展示趋势图表（复用量趋势、成功率趋势）

### 5.3 审计日志
- [ ] 创建审计日志组件
- [ ] 实现日志筛选（操作类型、时间范围、用户）
- [ ] 实现日志分页
- [ ] 实现日志详情查看

---

## Step 6: CI 集成实现

### 6.1 GitLab CI Adapter
- [ ] 创建 `src/ci/gitlab-ci.ts`
- [ ] 实现 GitLab API 触发 pipeline
- [ ] 传递参数：repo_ref、patch_key、validation_plan
- [ ] 实现结果轮询（pipeline 状态查询）
- [ ] 解析 pipeline artifacts（validation_report.json）

### 6.2 GitHub Actions Adapter
- [ ] 创建 `src/ci/github-actions.ts`
- [ ] 实现 GitHub Actions workflow_dispatch 触发
- [ ] 传递参数：repo_ref、patch_key、validation_plan
- [ ] 实现结果轮询（workflow run 状态查询）
- [ ] 解析 workflow artifacts（validation_report.json）

### 6.3 CI 配置管理
- [ ] 实现 CI 连接测试
- [ ] 添加 CI 类型配置（GITLAB/GITHUB/MOCK）
- [ ] 实现动态切换 CI 适配器

---

## Step 7: Git 集成

### 7.1 Git Patch 支持
- [ ] 实现 Git patch 解析
- [ ] 支持 `.diff` 格式
- [ ] 支持 PR 分支引用

### 7.2 自动创建 PR（可选）
- [ ] 实现自动创建 GitLab PR
- [ ] 实现自动创建 GitHub PR
- [ ] 填充 PR 描述（Gene/Capsule 信息）

---

## Step 8: 简版 GDI 排序

### 8.1 GDI 计算模块
- [ ] 创建 `src/gdi/scorer.ts` - GDI 评分计算
- [ ] 实现 Intrinsic 分数（合规+验证通过+confidence）
- [ ] 实现 Usage 分数（reuse_count、success_rate）
- [ ] 实现 Freshness 分数（时间衰减）
- [ ] 实现综合评分（加权求和）

### 8.2 排序 API
- [ ] 实现 `GET /a2a/assets/ranked` - 按综合评分排序
- [ ] 支持权重配置（intrinsic_weight、usage_weight、freshness_weight）
- [ ] 支持分页与筛选

### 8.3 自动提升规则
- [ ] 实现自动提升逻辑（confidence ≥ 0.85, success_streak ≥ 3）
- [ ] 实现阈值配置（confidence_threshold、success_streak_threshold）
- [ ] 集成到 Gate Pipeline Stage 5

---

## Step 9: 数据库迁移

### 9.1 新增 validation_plans 表
- [ ] 创建迁移 `20250221_001_create_validation_plans_table.sql`
- [ ] 字段：plan_id、name、commands（JSON）、created_at
- [ ] 预置默认验证计划

### 9.2 扩展 assets 表
- [ ] 创建迁移 `20250221_002_enhance_assets_table_gdi.sql`
- [ ] 添加字段：gdi_score（综合评分）
- [ ] 添加字段：intrinsic_score、usage_score、freshness_score
- [ ] 添加索引：idx_assets_gdi_score

### 9.3 新增 audit_logs 表
- [ ] 创建迁移 `20250221_003_create_audit_logs_table.sql`
- [ ] 字段：log_id、operation_type、user_id、target_id、details（JSON）、created_at
- [ ] 添加索引：idx_audit_logs_operation、idx_audit_logs_user

---

## Step 10: 部署与验证

### 10.1 Console 部署
- [ ] 构建 Console 静态资源
- [ ] 配置 Nginx/Caddy 反向代理
- [ ] 配置 HTTPS（Let's Encrypt）
- [ ] 验证 Console 可访问

### 10.2 CI 集成测试
- [ ] 测试 GitLab CI 触发
- [ ] 测试 GitHub Actions 触发
- [ ] 测试 CI 结果轮询
- [ ] 测试 artifacts 解析

### 10.3 GDI 排序测试
- [ ] 测试 GDI 评分计算
- [ ] 测试排序 API
- [ ] 测试自动提升规则

### 10.4 集成测试
- [ ] 运行所有单元测试
- [ ] 运行所有集成测试
- [ ] 验证测试覆盖率（>80%）

---

## Step 11: 文档和配置

### 11.1 Console 文档
- [ ] 创建 `CONSOLE_SETUP.md` - Console 部署指南
- [ ] 创建 `CONSOLE_USER_GUIDE.md` - Console 使用指南

### 11.2 CI 集成文档
- [ ] 更新 `CI_SETUP.md` - 添加 GitLab/GitHub 配置示例
- [ ] 创建 GitLab CI workflow 模板
- [ ] 创建 GitHub Actions workflow 模板

### 11.3 API 文档更新
- [ ] 更新 `GET /a2a/assets/ranked` - GDI 排序 API
- [ ] 更新 `POST /a2a/decision` - 决策 API
- [ ] 添加 Console API 文档

---

## Phase 2 总结

### 预期交付成果
- Web Console（资产浏览、审核台、节点面板、仪表盘）
- CI 集成（GitLab/GitHub Actions 适配器）
- Git 集成（Patch 支持、自动 PR）
- 简版 GDI 排序（Intrinsic + Usage + Freshness）
- 自动提升规则（confidence + success_streak）
- 完整测试覆盖
- 完整文档

### 里程碑
- Step 1-5: Web Console 核心功能
- Step 6-7: CI/Git 集成
- Step 8-9: GDI 排序与数据库
- Step 10-11: 部署验证与文档

### 下一步
Phase 2 完成后，准备进入 Phase 3（任务分发/赏金系统，可选）
