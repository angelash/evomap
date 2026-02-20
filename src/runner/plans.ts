/**
 * 验证计划配置
 * 预置任务名映射到实际命令
 */

export interface ValidationTaskMapping {
  name: string;
  command: string;
  timeout_ms?: number;
  description: string;
}

// 预置验证任务映射
const VALIDATION_TASKS: Record<string, ValidationTaskMapping> = {
  // 构建任务
  build_winser64: {
    name: 'build_win64',
    command: 'cmake --build . --config Release && cmake --build . --target test',
    timeout_ms: 300000,
    description: 'Build for Windows x64'
  },
  build_linux: {
    name: 'build_linux',
    command: 'make -j$(nproc)',
    timeout_ms: 300000,
    description: 'Build for Linux'
  },
  build_macos: {
    name: 'build_macos',
    command: 'xcodebuild -project MyProject.xcodeproj -scheme Release',
    timeout_ms: 300000,
    description: 'Build for macOS'
  },

  // 测试任务
  run_unit_tests: {
    name: 'run_unit_tests',
    command: 'ctest --output-on-failure',
    timeout_ms: 180000,
    description: 'Run unit tests'
  },
  run_integration_tests: {
    name: 'run_integration_tests',
    command: 'npm run test:integration',
    timeout_ms: 600000,
    description: 'Run integration tests'
  },

  // 代码质量任务
  lint_ts: {
    name: 'lint_ts',
    command: 'eslint src --ext .ts',
    timeout_ms: 60000,
    description: 'Lint TypeScript code'
  },
  lint_cpp: {
    name: 'lint_cpp',
    command: 'clang-tidy src/**/*.cpp',
    timeout_ms: 120000,
    description: 'Lint C++ code'
  },
  format_check: {
    name: 'format_check',
    command: 'prettier --check src/**/*.{ts,tsx}',
    timeout_ms: 30000,
    description: 'Check code formatting'
  },
  static_analysis: {
    name: 'static_analysis',
    command: 'sonar-scanner',
    timeout_ms: 600000,
    description: 'Run static analysis'
  },
};

/**
 * 获取任务映射
 */
export function getTaskMapping(taskName: string): ValidationTaskMapping | undefined {
  return VALIDATION_TASKS[taskName];
}

/**
 * 获取所有可用任务
 */
export function getAllTasks(): ValidationTaskMapping[] {
  return Object.values(VALIDATION_TASKS);
}

/**
 * 验证任务名是否合法
 */
export function isValidTaskName(taskName: string): boolean {
  return taskName in VALIDATION_TASKS;
}
