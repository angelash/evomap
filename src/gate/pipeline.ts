/**
 * Gate Pipeline - 核心编排器集成
 */

import { query, queryOne } from '../database/pool.js';
import { createPolicyError, createGateError } from '../errors/index.js';
import type {
  GateContext,
  GateStatus,
  GateStage,
  GateConfig,
  PromotionDecision,
} from './types.js';

// 导入阶段实现
import { executeStageParse } from './stages/01-parse.js';
import { executeStageHashVerify } from './stages/02-hash-verify.js';
import { executeStageSecurityCheck } from './stages/03-security-check.js';
import { executeStageCIValidate } from './stages/04-ci-validate.js';
import { executeStageScorePromote } from './stages/05-score-promote.js';

const DEFAULT_CONFIG: GateConfig = {
  max_concurrent_gates: 5,
  gate_timeout_ms: 30 * 60 * 1000,
  auto_promote_threshold: {
    confidence_min: 0.85,
    success_streak_min: 3,
    env_coverage_min: 2,
  },
  blast_radius_limits: {
    max_files: 100,
    max_lines: 10000,
  },
};

const runningGates = new Map<string, AbortController>();

export async function createGate(
  bundleHash: string,
  senderId: string,
  bundleBytesBase64: string,
  bundleFormat: 'zip' | 'tar.gz',
  project?: string,
  namespace?: string,
  submitMode?: string
): Promise<string> {
  const gateId = `gate_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  await query(
    `INSERT INTO gates (gate_id, bundle_hash, status, stage, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [gateId, bundleHash, 'received', 'parse']
  );
  return gateId;
}

export async function getGateStatus(gateId: string): Promise<any> {
  return await queryOne(
    `SELECT gate_id, status, stage, error_code, error_message, decision, decision_reason, created_at, updated_at
     FROM gates WHERE gate_id = $1`,
    [gateId]
  );
}

export async function updateGateStatus(
  gateId: string,
  status: GateStatus,
  stage?: GateStage,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  await query(
    `UPDATE gates
     SET status = $1, stage = $2, error_code = $3, error_message = $4, updated_at = NOW()
     WHERE gate_id = $5`,
    [status, stage, errorCode, errorMessage, gateId]
  );
}

export async function updateGateDecision(
  gateId: string,
  decision: string,
  reason: string
): Promise<void> {
  await query(
    `UPDATE gates SET decision = $1, decision_reason = $2, updated_at = NOW() WHERE gate_id = $3`,
    [decision, reason, gateId]
  );
}

export async function cancelGate(gateId: string): Promise<boolean> {
  const controller = runningGates.get(gateId);
  if (controller) {
    controller.abort();
    runningGates.delete(gateId);
    await updateGateStatus(gateId, 'failed', undefined, 'E_GATE_CANCELLED', 'Gate cancelled by user');
    return true;
  }
  return false;
}

export async function executeGatePipeline(
  gateId: string,
  context: GateContext,
  config: GateConfig = DEFAULT_CONFIG
): Promise<PromotionDecision> {
  const abortController = new AbortController();
  runningGates.set(gateId, abortController);

  try {
    // Stage 1: Parse
    await updateGateStatus(gateId, 'received', 'parse');
    context.parsed_bundle = await executeStageParse(context, abortController.signal);

    // Stage 2: Hash Verify
    await updateGateStatus(gateId, 'schema_ok', 'hash_verify');
    context.verified_assets = await executeStageHashVerify(context, abortController.signal);

    // Stage 3: Security Check
    await updateGateStatus(gateId, 'policy_ok', 'security_check');
    context.security_report = await executeStageSecurityCheck(context, config, abortController.signal);

    if (context.security_report.risk_level === 'critical') {
      throw createPolicyError('E_POLICY_CRITICAL_RISK', 'Critical security risk');
    }

    // Stage 4: CI Validate
    await updateGateStatus(gateId, 'policy_ok', 'ci_validate');
    context.validation_result = await executeStageCIValidate(context, abortController.signal);

    // Stage 5: Decision
    await updateGateStatus(gateId, 'validated', 'score_promote');
    const decision = await executeStageScorePromote(context, config, abortController.signal);
    
    // Finalize
    await updateGateStatus(gateId, decision.decision as GateStatus, 'score_promote');
    await updateGateDecision(gateId, decision.decision, decision.reason);

    return decision;
  } catch (error: any) {
    console.error(`[Pipeline] Error in gate=${gateId}:`, error);
    const status = error.code === 'E_POLICY_CRITICAL_RISK' ? 'quarantined' : 'failed';
    await updateGateStatus(gateId, status as GateStatus, undefined, error.code || 'E_GATE_ERROR', error.message);
    throw error;
  } finally {
    runningGates.delete(gateId);
  }
}

export function getRunningGatesCount(): number {
  return runningGates.size;
}
