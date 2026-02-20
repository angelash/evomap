/**
 * Stage 5: Score & Promote Decision
 * 基于验证结果和安全报告做出提升决策
 */

import { createGateError } from '../../errors/index.js';
import type { GateContext, PromotionDecision, GateConfig } from '../types.js';

export async function executeStageScorePromote(
  context: GateContext,
  config: GateConfig,
  signal: AbortSignal
): Promise<PromotionDecision> {
  if (signal.aborted) {
    throw createGateError('E_GATE_CANCELLED', 'Gate cancelled');
  }

  const { security_report, validation_result, parsed_bundle } = context;

  if (!security_report || !validation_result || !parsed_bundle) {
    throw createGateError('E_GATE_INTERNAL_ERROR', 'Missing stage outputs for decision');
  }

  // 1. 基本拒绝条件
  if (validation_result.status === 'fail') {
    return {
      decision: 'rejected',
      reason: 'CI validation failed',
      auto_promote: false
    };
  }

  if (security_report.risk_level === 'critical') {
    return {
      decision: 'quarantined',
      reason: 'Critical security risk detected',
      auto_promote: false
    };
  }

  // 2. 计算综合评分 (基于 SDD v0.1 第 8.2 节)
  // score = 0.45 * intrinsic + 0.35 * usage + 0.20 * freshness
  // 初始发布时 usage 和 freshness 权重较低
  const intrinsicScore = parsed_bundle.gene.confidence;
  const score = intrinsicScore; // MVP 简化版

  // 3. 自动提升规则检查 (SDD v0.1 第 8.3 节)
  const canAutoPromote = 
    score >= config.auto_promote_threshold.confidence_min &&
    security_report.risk_level === 'low' &&
    security_report.blast_radius_safe;

  if (canAutoPromote && context.submit_mode !== 'candidate_only') {
    return {
      decision: 'promoted',
      reason: `Auto-promoted: high confidence (${score.toFixed(2)}) and passed all checks`,
      score,
      auto_promote: true
    };
  }

  // 4. 默认进入 candidate 等待人工审核
  return {
    decision: 'candidate',
    reason: score < config.auto_promote_threshold.confidence_min 
      ? `Confidence (${score.toFixed(2)}) below auto-promote threshold`
      : 'Passed validation, waiting for manual review',
    score,
    auto_promote: false
  };
}
