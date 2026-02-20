/**
 * Sandbox Runner Executor - 验证计划执行器（CI 模式）
 *
 * 注意：CI 模式下，实际的代码执行由外部 CI 系统完成
 * 这里主要负责准备验证计划和执行环境指纹收集
 */

import type { ValidationPlan, ValidationResult, ValidationStep } from '../gate/types.js';

export async function executeValidationPlan(
  validationPlan: ValidationPlan,
  envFingerprint: Record<string, unknown> = {}
): Promise<ValidationResult> {
  console.log('[Sandbox Runner] Executing validation plan');

  const steps: ValidationStep[] = [];
  const startTime = Date.now();

  try {
    // 模拟执行各个任务
    for (const task of validationPlan.tasks) {
      const stepStart = Date.now();
      
      try {
        await executeTask(task, envFingerprint);
        steps.push({
          name: task.name,
          status: 'pass',
          duration_ms: Date.now() - stepStart
        });
      } catch (error) {
        steps.push({
          name: task.name,
          status: 'fail',
          duration_ms: Date.now() - stepStart,
          error: (error as Error).message
        });
        throw error;
      }
    }

    return {
      status: 'pass',
      steps,
      artifacts: {},
      env_fingerprint: collectEnvFingerprint()
    };
  } catch (error) {
    return {
      status: 'fail',
      steps,
      artifacts: {},
      env_fingerprint: collectEnvFingerprint()
    };
  }
}

/**
 * 执行单个验证任务
 */
async function executeTask(
  task: { name: string; command?: string; timeout_ms?: number },
  envFingerprint: Record<string, unknown>
): Promise<void> {
  console.log(`[Sandbox Runner] Executing task: ${task.name}`);

  // TODO: CI 模式下，任务由外部 CI 执行
  // 这里只是准备和验证计划，实际执行在 CI 中

  // 模拟执行延迟
  const duration = task.timeout_ms || 5000;
  await new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * 收集环境指纹
 */
function collectEnvFingerprint(): Record<string, unknown> {
  return {
    os: process.platform,
    node_version: process.version,
    cpu_arch: process.arch,
    timestamp: Date.now()
  };
}

/**
 * 准备 CI 工作流变量
 */
export function prepareCIVariables(
  repoRef: string,
  patchKey: string,
  validationPlan: ValidationPlan
): Record<string, string> {
  return {
    EVOMAP_REPO_REF: repoRef,
    EVOMAP_PATCH_KEY: patchKey,
    EVOMAP_VALIDATION_PLAN: JSON.stringify(validationPlan),
    EVOMAP_TIMESTAMP: Date.now().toString()
  };
}
