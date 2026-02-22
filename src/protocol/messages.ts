import type { EnvFingerprint } from './envelope.js';

/**
 * Hello 消息 - 节点注册/心跳
 */
export interface HelloPayload {
  capabilities: string[]; // ['publish', 'fetch', 'report']
  gene_count?: number;
  capsule_count?: number;
  env_fingerprint?: EnvFingerprint;
}

export interface HelloResponse {
  node_id: string;
  status: 'registered' | 'updated';
  claim_code?: string;
}

/**
 * Publish 消息 - 发布 bundle
 */
export interface PublishPayload {
  bundle_format: 'zip' | 'tar.gz';
  bundle_bytes_base64: string;
  bundle_hash: string; // sha256:...
  project: string;
  namespace: string;
  submit_mode: 'candidate_only' | 'auto_promote';
}

export interface PublishResponse {
  status: 'accepted' | 'rejected';
  candidate_asset_ids: string[];
  gate_pipeline_id?: string;
  next?: {
    type: 'poll';
    url: string;
  };
}

/**
 * Fetch 消息 - 拉取资产
 */
export interface FetchPayload {
  project: string;
  namespace: string;
  query: {
    signals?: string[];
    tags?: string[];
    env_fingerprint?: EnvFingerprint;
    risk_level_max?: 'low' | 'medium' | 'high';
  };
  limit: number;
  include_candidate: boolean;
}

export interface FetchResponse {
  assets: CapsuleSummary[];
  explain?: string;
}

export interface CapsuleSummary {
  asset_id: string;
  gene_id: string;
  summary: string;
  confidence: number;
  success_rate: number;
  env_fingerprint?: EnvFingerprint;
}

/**
 * Report 消息 - 上报复用结果
 */
export interface ReportPayload {
  target_capsule_id: string;
  consumer_node_id: string;
  env_fingerprint: EnvFingerprint;
  result: 'success' | 'failure';
  failure_reason?: string;
  duration_ms: number;
  notes?: string;
  artifacts?: {
    validation_report_hash?: string;
  };
}

export interface ReportResponse {
  status: 'recorded';
}

/**
 * Decision 消息 - 审核决策
 */
export interface DecisionPayload {
  asset_id: string;
  decision: 'accept' | 'reject' | 'quarantine';
  reason?: string;
  reviewer_id: string;
}

export interface DecisionResponse {
  status: 'applied';
  asset_status: 'promoted' | 'rejected' | 'quarantined';
}

/**
 * Revoke 消息 - 撤销资产
 */
export interface RevokePayload {
  asset_id: string;
  reason: string;
  revoker_id: string;
}

export interface RevokeResponse {
  status: 'revoked';
  broadcast: boolean;
}
