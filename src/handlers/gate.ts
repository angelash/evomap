import { getGateStatus, cancelGate } from '../gate/pipeline.js';
import { EvoMapError, createNotFoundError } from '../errors/index.js';

/**
 * Handle GET /gates/{gate_id} - 查询 gate 状态
 */
export async function handleGetGate(gateId: string): Promise<{
  gate_id: string;
  status: string;
  stage: string;
  error_code?: string;
  error_message?: string;
  decision?: string;
  decision_reason?: string;
  created_at: Date;
  updated_at: Date;
}> {
  const gate = await getGateStatus(gateId);

  if (!gate) {
    throw createNotFoundError(
      'E_NOTFOUND_GATE',
      'Gate not found',
      { gate_id: gateId }
    );
  }

  return gate;
}

/**
 * Handle POST /gates/{gate_id}/cancel - 取消 gate 任务
 */
export async function handleCancelGate(gateId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const cancelled = await cancelGate(gateId);

  if (!cancelled) {
    throw createNotFoundError(
      'E_NOTFOUND_GATE',
      'Gate not found or already completed',
      { gate_id: gateId }
    );
  }

  return {
    success: true,
    message: `Gate ${gateId} cancelled successfully`,
  };
}
