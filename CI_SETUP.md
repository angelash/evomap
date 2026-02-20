# CI 配置指南

## 方案选择

### 方案 1: Mock CI（开发/测试）✅
**优点**:
- 无需外部依赖
- 快速验证流程
- 适合本地开发

**缺点**:
- 不执行真实验证
- 仅用于测试

### 方案 2: GitLab CI（推荐）✅
**优点**:
- 企业内网常用
- 支持 pipeline 触发
- 支持 artifacts 存储
- 支持变量传递

**缺点**:
- 需要 GitLab 实例
- 需要配置 runner

### 方案 3: GitHub Actions（备选）
**优点**:
- 托管服务
- 丰富的 workflow 功能
- 社区支持好

**缺点**:
- 需要外网访问
- 不适合企业内网

---

## 推荐方案：GitLab CI

### 环境变量配置

创建 `.env` 文件在项目根目录：

```bash
# CI 配置
CI_TYPE=gitlab

# GitLab CI
CI_URL=https://gitlab.internal.com/api/v4
CI_TOKEN=your_gitlab_token
CI_PROJECT_ID=123
CI_REF=main

# GitLab Runner 标签（可选）
CI_RUNNER_TAGS=evomap-runner
```

### GitLab Token 配置

1. 登录 GitLab
2. 导航到 User Settings → Access Tokens
3. 点击 "Add new token"
4. 输入名称：`evomap-hub`
5. 选择权限：
   - `api`（必需）
   - `read_api`（必需）
   - `read_repository`（可选）
6. 点击 "Create personal access token"
7. 复制 token 到 `.env` 文件

### GitLab Project ID

获取 Project ID：
```bash
# 使用 GitLab API
curl --header "PRIVATE-TOKEN: YOUR_TOKEN" \
  https://gitlab.internal.com/api/v4/projects?search=evomap-lite
```

或从项目 URL 中提取：
```
https://gitlab.internal.com/your-group/evomap-lite/-/settings/repository
                                        ^^^^^^^^^^
                                        Project ID
```

---

## GitLab Workflow 配置

### 1. 创建 `.gitlab-ci.yml`

在项目根目录创建：

```yaml
stages:
  - validate

variables:
  # 从 Hub 传递的变量
  EVOMAP_REPO_REF: $CI_COMMIT_SHA
  EVOMAP_PATCH_KEY: ""
  EVOMAP_VALIDATION_PLAN: ""

validate:
  stage: validate
  image: evomap-runner-win64:v1
  tags:
    - evomap-runner
  script:
    - echo "EvoMap-Lite Validation"
    - echo "Repo Ref: $EVOMAP_REPO_REF"
    - echo "Patch Key: $EVOMAP_PATCH_KEY"
    - echo "Validation Plan: $EVOMAP_VALIDATION_PLAN"
    
    # 下载 patch
    - aws s3 cp s3://evomap-bundles/$EVOMAP_PATCH_KEY /tmp/patch.diff
    
    # 应用 patch
    - git apply /tmp/patch.diff
    
    # 执行验证计划
    - npm run validate
    
  artifacts:
    when: always
    paths:
      - validation_report.json
      - logs/
    reports:
      junit: validation_report.json
  rules:
    - if: '$CI_PIPELINE_SOURCE == "trigger"'
```

### 2. 注册 GitLab Runner

在 GitLab 服务器上：

```bash
# 注册 runner
gitlab-runner register \
  --url https://gitlab.internal.com \
  --registration-token YOUR_RUNNER_TOKEN \
  --name evomap-runner-win64 \
  --executor docker \
  --docker-image "docker:latest" \
  --docker-privileged \
  --docker-volumes /var/run/docker.sock:/var/run/docker.sock \
  --docker-volumes /cache:/cache \
  --tag-list "evomap-runner,win64"
```

### 3. 启动 Runner

```bash
# 启动 runner
gitlab-runner run \
  --config /etc/gitlab-runner/config.toml \
  --service gitlab-runner \
  --syslog
```

---

## GitHub Actions 配置（备选）

### 环境变量配置

```bash
# CI 配置
CI_TYPE=github

# GitHub Actions
CI_URL=https://api.github.com/repos/your-org/evomap-lite/actions
CI_TOKEN=your_github_token
CI_WORKFLOW=validation.yml
```

### GitHub Token 配置

1. 登录 GitHub
2. 导航到 Settings → Developer settings → Personal access tokens
3. 点击 "Generate new token"
4. 输入名称：`evomap-hub`
5. 选择权限：
   - `repo`（必需）
   - `workflow`（必需）
6. 点击 "Generate token"
7. 复制 token 到 `.env` 文件

### GitHub Workflow 配置

创建 `.github/workflows/validation.yml`：

```yaml
name: EvoMap-Lite Validation

on:
  workflow_dispatch:
    inputs:
      repo_ref:
        required: true
        type: string
      patch_key:
        required: true
        type: string
      validation_plan:
        required: true
        type: string

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          ref: ${{ inputs.repo_ref }}
      
      - name: Download patch
        run: |
          aws s3 cp s3://evomap-bundles/${{ inputs.patch_key }} /tmp/patch.diff
      
      - name: Apply patch
        run: |
          git apply /tmp/patch.diff
      
      - name: Run validation
        run: |
          npm run validate
      
      - name: Upload validation report
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation_report.json
```

---

## 验证计划传递

### Hub → CI 变量映射

Hub 通过 CI Adapter 传递以下变量：

| 变量名 | 类型 | 说明 |
|---------|------|------|
| `EVOMAP_REPO_REF` | string | Git commit hash 或 SVN revision |
| `EVOMAP_PATCH_KEY` | string | 对象存储中的 patch 路径 |
| `EVOMAP_VALIDATION_PLAN` | JSON | 验证计划（tasks 数组） |
| `EVOMAP_TIMESTAMP` | number | 触发时间戳 |

### 验证计划示例

```json
{
  "tasks": [
    {
      "name": "build_win64",
      "timeout_ms": 300000
    },
    {
      "name": "run_unit_tests",
      "timeout_ms": 180000
    }
  ],
  "resource_limits": {
    "cpu": 2,
    "memory_mb": 4096,
    "timeout_ms": 600000
  }
}
```

---

## 故障排查

### GitLab Runner 无法连接

```bash
# 检查 runner 状态
gitlab-runner verify --config /etc/gitlab-runner/config.toml

# 查看 runner 日志
journalctl -u gitlab-runner -f

# 检查网络连接
ping -c 3 gitlab.internal.com
```

### Pipeline 触发失败

```bash
# 检查 GitLab API 连接
curl --header "PRIVATE-TOKEN: YOUR_TOKEN" \
  https://gitlab.internal.com/api/v4/projects/PROJECT_ID/pipelines

# 检查 token 权限
curl --header "PRIVATE-TOKEN: YOUR_TOKEN" \
  https://gitlab.internal.com/api/v4/user
```

### Artifacts 上传失败

```bash
# 检查 artifacts 大小限制
# GitLab 默认限制：100MB

# 检查磁盘空间
df -h

# 检查 runner 权限
ls -la /var/run/docker.sock
```

---

## 下一步

1. 配置 CI 环境变量（`.env`）
2. 创建 CI workflow 文件（`.gitlab-ci.yml` 或 `.github/workflows/validation.yml`）
3. 注册并启动 GitLab Runner
4. 测试 CI 触发和结果获取
5. 集成到 Hub API 的 CI Adapter
