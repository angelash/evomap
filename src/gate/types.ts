/**
 * Gate Pipeline - 发布包验证流水线
 *
 * 状态机流转：
 * received → schema_ok → policy_ok → validated → promoted|candidate|rejected|quarantined
 */

export type GateStatus =
  | 'received'      // 收到 bundle
  | 'schema_ok'     // schema 校验通过
  | 'policy_ok'     // 安全策略检查通过
  | 'validated'      // CI 验证完成
  | 'promoted'      // 自动提升
  | 'candidate'     // 等待人工审核
  | 'rejected'      // 拒绝
  | 'quarantined'   // 隔离（高风险）
  | 'failed';       // 执行失败

export type GateStage =
  | 'parse'         // 解包和 schema 校验
  | 'hash_verify'   // 哈希验证
  | 'security_check' // 安全策略检查
  | 'ci_validate'   // CI 验证
  | 'score_promote'; // 评分和提升决策

export interface GateContext {
  gate_id: string;
  bundle_hash: string;
  sender_id: string;
  bundle_bytes_base64: string;
  bundle_format: 'zip' | 'tar.gz';
  project?: string;
  namespace?: string;
  submit_mode?: string;

  // 阶段输出
  parsed_bundle?: ParsedBundle;
  verified_assets?: VerifiedAssets;
  security_report?: SecurityReport;
  validation_result?: ValidationResult;
  decision?: PromotionDecision;

  // 错误信息
  error_code?: string;
  error_message?: string;
}

export interface ParsedBundle {
  gene: Gene;
  capsule?: Capsule;
  event?: EvolutionEvent;
  artifacts: {
    patch?: Buffer;
    validation_plan?: ValidationPlan;
    validation_report?: Buffer;
    logs?: Buffer[];
  };
}

export interface Gene {
  gene_id: string;
  summary: string;
  signals: string[];
  tags: string[];
  preconditions?: string[];
  constraints?: string[];
  validation_plan: ValidationPlan;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface Capsule {
  capsule_id: string;
  gene_id: string;
  confidence: number;
  blast_radius: {
    files: number;
    lines: number;
  };
  patch_object_key: string;
  validation_plan_key: string;
  env_fingerprint?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EvolutionEvent {
  event_id: string;
  gene_id: string;
  capsule_id?: string;
  timestamp_ms: number;
  mutation_type: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export interface ValidationPlan {
  tasks: ValidationTask[];
  resource_limits?: {
    cpu?: number;
    memory_mb?: number;
    timeout_ms?: number;
  };
}

export interface ValidationTask {
  name: string;
  command?: string;
  timeout_ms?: number;
}

export interface VerifiedAssets {
  gene_id: string;
  capsule_id?: string;
  event_id?: string;
  hash_verified: boolean;
  canonical_hashes: {
    gene: string;
    capsule?: string;
    event?: string;
  };
}

export interface SecurityReport {
  validation_plan_safe: boolean;
  dangerous_commands: string[];
  external_commands: string[];
  blast_radius_safe: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  notes: string[];
}

export interface ValidationResult {
  status: 'pass' | 'fail';
  steps: ValidationStep[];
  artifacts?: Record<string, string>;
  env_fingerprint?: Record<string, unknown>;
}

export interface ValidationStep {
  name: string;
  status: 'pass' | 'fail' | 'skipped';
  duration_ms?: number;
  output?: string;
  error?: string;
}

export interface PromotionDecision {
  decision: 'promoted' | 'candidate' | 'rejected' | 'quarantined';
  reason: string;
  score?: number;
  auto_promote: boolean;
}

export interface GateConfig {
  max_concurrent_gates: number;
  gate_timeout_ms: number;
  auto_promote_threshold: {
    confidence_min: number;
    success_streak_min: number;
    env_coverage_min: number;
  };
  blast_radius_limits: {
    max_files: number;
    max_lines: number;
  };
}
