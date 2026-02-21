/**
 * Stage 4: CI Validation
 * 触发外部 CI 流水线进行隔离验证
 */

import { createGateError } from '../../errors/index.js';
import type { GateContext, ValidationResult } from '../types.js';
import { MockCIAdapter } from '../../ci/mock.js';
import { CIAdapter } from '../../ci/adapter.js';

// 这里目前写死使用 MockCIAdapter，后续从全局配置注入
const ciAdapter: CIAdapter = new MockCIAdapter();

export async function executeStageCIValidate(
  context: GateContext,
  signal: AbortSignal
): Promise<ValidationResult> {
  if (signal.aborted) {
    throw createGateError('E_GATE_CANCELLED', 'Gate cancelled');
  }

  console.log(`[Stage 4] Starting CI validation for gate=${context.gate_id}`);

  // 1. 准备 CI 变量
  const input = {
    gate_id: context.gate_id,
    repo_ref: (context.parsed_bundle?.gene?.metadata?.repo_ref as string) || 'main',
    patch_key: context.parsed_bundle?.capsule?.patch_object_key || `patches/${context.gate_id}/patch.zip`,
    validation_plan: context.parsed_bundle?.gene?.validation_plan || { tasks: [] }
  };

  try {
    // 2. 触发 CI Pipeline
    const externalId = await ciAdapter.triggerTask(input);
    console.log(`[Stage 4] CI task triggered: externalId=${externalId}`);

    // 3. 轮询状态
    let pollCount = 0;
    const maxPolls = 60; // 60 * 5s = 5 minutes
    
    while (pollCount < maxPolls) {
      if (signal.aborted) {
        await ciAdapter.cancelTask(externalId);
        throw createGateError('E_GATE_CANCELLED', 'Gate cancelled during CI polling');
      }

      const output = await ciAdapter.checkStatus(externalId);
      console.log(`[Stage 4] Polling CI status: externalId=${externalId}, status=${output.status}`);

      if (output.status === 'pass') {
        // TODO: 获取并解析 validation_report.json
        // 目前返回 Mock 结果
        return {
          status: 'pass',
          steps: [
            { name: 'ci_execution', status: 'pass' }
          ],
          env_fingerprint: {
            external_id: externalId,
            log_url: output.log_url
          }
        };
      } else if (output.status === 'fail' || output.status === 'error') {
        return {
          status: 'fail',
          steps: [
            { name: 'ci_execution', status: 'fail', error: output.error_message }
          ],
          env_fingerprint: {
            external_id: externalId,
            log_url: output.log_url
          }
        };
      }

      // 等待 5 秒
      await new Promise(resolve => setTimeout(resolve, 5000));
      pollCount++;
    }

    throw createGateError('E_CI_TIMEOUT', `CI validation timeout for externalId=${externalId}`);

  } catch (error: any) {
    if (error.code === 'E_GATE_CANCELLED' || error.code === 'E_CI_TIMEOUT') {
      throw error;
    }
    throw createGateError('E_CI_TRIGGER_FAILED', `Failed to trigger/poll CI: ${error.message}`);
  }
}
