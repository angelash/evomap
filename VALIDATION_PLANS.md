# 验证计划定义指南

## 概述

验证计划（Validation Plan）是 EvoMap-Lite 中用于验证资产的核心配置。它定义了在 CI 环境中需要执行的任务序列，以及资源限制。

---

## 验证计划结构

```json
{
  "tasks": [
    {
      "name": "build_win64",
      "command": "cmake --build . --config Release",
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

## 预置验证任务

### 构建任务

| 任务名 | 命令 | 超时 | 描述 |
|-------|------|------|------|
| `build_win64` | `cmake --build . --config Release && cmake --build . --target test` | 300000ms | Windows x64 构建 |
| `build_linux` | `make -j$(nproc)` | 300000ms | Linux 构建 |
| `build_macos` | `xcodebuild -project MyProject.xcodeproj -scheme Release` | 300000ms | macOS 构建 |

### 测试任务

| 任务名 | 命令 | 超时 | 描述 |
|-------|------|------|------|
| `run_unit_tests` | `ctest --output-on-failure` | 180000ms | 运行单元测试 |
| `run_integration_tests` | `npm run test:integration` | 600000ms | 运行集成测试 |

### 代码质量任务

| 任务名 | 命令 | 超时 | 描述 |
|-------|------|------|------|
| `lint_ts` | `eslint src --ext .ts` | 60000ms | TypeScript 代码检查 |
| `lint_cpp` | `clang-tidy src/**/*.cpp` | 120000ms | C++ 代码检查 |
| `format_check` | `prettier --check src/**/*.{ts,tsx}` | 30000ms | 代码格式检查 |
| `static_analysis` | `sonar-scanner` | 600000ms | 静态代码分析 |

---

## 资源限制

### CPU 限制

| 值 | 说明 |
|-----|------|
| 1 | 单核，轻量任务 |
| 2 | 双核，标准任务（推荐） |
| 4 | 四核，构建任务 |

### 内存限制

| 值 | 说明 |
|-----|------|
| 2048 | 2GB，轻量任务 |
| 4096 | 4GB，标准任务（推荐） |
| 8192 | 8GB，构建任务 |

### 超时限制

| 值 | 说明 |
|-----|------|
| 30000 | 30 秒，快速检查 |
| 60000 | 1 分钟，代码质量任务 |
| 180000 | 3 分钟，测试任务 |
| 300000 | 5 分钟，构建任务 |
| 600000 | 10 分钟，完整验证 |

---

## 自定义验证计划

### 方案 1: 使用预置任务

只需指定任务名，无需提供命令：

```json
{
  "tasks": [
    { "name": "build_win64" },
    { "name": "run_unit_tests" }
  ]
}
```

### 方案 2: 自定义命令

提供完整命令（需通过安全策略检查）：

```json
{
  "tasks": [
    {
      "name": "custom_build",
      "command": "make -j4 && make test",
      "timeout_ms": 300000
    }
  ]
}
```

⚠️ **安全提示**：
- 自定义命令会经过安全策略检查
- 禁止包含 `;`, `|`, `>`, `<`, `` ` ``, `$()` 的命令
- 禁止外连命令（`curl`, `wget`, `Invoke-WebRequest`）

---

## 验证报告格式

CI 执行完成后需生成 `validation_report.json`：

```json
{
  "status": "pass",
  "steps": [
    {
      "name": "build_win64",
      "status": "pass",
      "duration_ms": 180000,
      "output": "Build completed successfully"
    },
    {
      "name": "run_unit_tests",
      "status": "fail",
      "duration_ms": 45000,
      "error": "Test case TestFeature failed"
    }
  ],
  "artifacts": {
    "test_results.xml": "path/to/results.xml",
    "coverage_report.html": "path/to/coverage.html"
  },
  "env_fingerprint": {
    "os": "linux",
    "docker_image": "evomap-runner-win64:v1",
    "cpu": "Intel Core i7-9700K",
    "memory_mb": 16384,
    "node_version": "18.0.0",
    "compiler": "gcc 9.4.0"
  }
}
```

---

## 验证计划示例

### 示例 1: 最小验证

只运行构建和单元测试：

```json
{
  "tasks": [
    { "name": "build_win64" },
    { "name": "run_unit_tests" }
  ],
  "resource_limits": {
    "cpu": 2,
    "memory_mb": 4096,
    "timeout_ms": 300000
  }
}
```

### 示例 2: 完整验证

构建 + 测试 + 代码质量：

```json
{
  "tasks": [
    { "name": "build_win64" },
    { "name": "run_unit_tests" },
    { "name": "run_integration_tests" },
    { "name": "lint_ts" },
    { "name": "format_check" }
  ],
  "resource_limits": {
    "cpu": 4,
    "memory_mb": 8192,
    "timeout_ms": 600000
  }
}
```

### 示例 3: 多平台验证

同时验证多个平台：

```json
{
  "tasks": [
    { "name": "build_win64" },
    { "name": "build_linux" },
    { "name": "build_macos" }
  ],
  "resource_limits": {
    "cpu": 2,
    "memory_mb": 4096,
    "timeout_ms": 300000
  }
}
```

---

## 最佳实践

### 1. 任务顺序

建议按照依赖关系排序任务：
1. 构建任务（`build_*`）
2. 测试任务（`run_*_tests`）
3. 代码质量任务（`lint_*`, `format_check`, `static_analysis`）

### 2. 超时设置

- 构建任务：5-10 分钟
- 单元测试：3-5 分钟
- 集成测试：5-10 分钟
- 代码质量：1-2 分钟

### 3. 资源分配

- 轻量任务：1 CPU，2GB 内存
- 标准任务：2 CPU，4GB 内存
- 构建任务：4 CPU，8GB 内存

### 4. 错误处理

- 任务失败时，立即停止后续任务
- 记录详细的错误信息
- 保存测试结果和日志

---

## 安全检查

### 白名单验证

所有任务名必须在预置白名单中：

```
build_win64, build_linux, build_macos,
run_unit_tests, run_integration_tests,
lint_ts, lint_cpp, format_check, static_analysis
```

### 危险命令检测

以下模式会被拦截：

- `; curl`, `; wget`, `; powershell`
- `| curl`, `| wget`, `| powershell`
- `> /`, `> \`
- `` `command``, `$()`

### 外连命令检测

以下模式会被拦截：

- `curl http://`, `curl https://`
- `wget http://`, `wget https://`
- `Invoke-WebRequest`

---

## 下一步

1. 选择预置任务或自定义命令
2. 配置资源限制
3. 将验证计划添加到 bundle
4. 通过 CI 执行验证
5. 解析 validation_report.json
