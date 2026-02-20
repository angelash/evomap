/**
 * Stage 4: CI Validation
 * 触发外部 CI 流水线进行隔离验证
 */

import { createGateError } from '../../errors/index.js';
import type { GateContext, ValidationResult } from '../types.js';

export async function executeStageCIValidate(
  context: GateContext,
  signal: AbortSignal
): Promise<ValidationResult> {
  if (signal.aborted) {
    throw createGateError('E_GATE_CANCELLED', 'Gate cancelled');
  }

  console.log(`[Stage 4] Starting CI validation for gate=${context.gate_id}`);

  // TODO: 调用 CI Adapter 触发任务
  // 1. 准备 CI 变量 (repo_ref, patch_key, validation_plan)
  // 2. 触发 CI Pipeline
  // 3. 轮询状态或等待回调
  // 4. 获取并解析 validation_report.json

  // 模拟异步过程
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 暂时返回 Mock 结果
  const result: ValidationResult = {
    status: 'pass',
    steps: [
      { name: 'checkout', status: 'pass', duration_ms: 5000 },
      { name: 'apply_patch', status: 'pass', duration_ms: 1200 },
      { name: 'build_win64', status: 'pass', duration_ms: 180000 },
      { name: 'run_unit_tests', status: 'pass', duration_ms: 45000 }
    ],
    env_fingerprint: {
      os: 'linux',
      docker_image: 'evomap-runner-win64:v1',
      cpu_cores: 4
    }
  };

  console.log(`[Stage 4] CI validation completed for gate=${context.gate_id}, result=${result.status}`);
  return result;
}
