/**
 * Stage 2: Hash Verify
 * 验证 asset_id 的 SHA256 哈希是否正确
 */

import { createHashError } from '../../errors/index.js';
import type { GateContext, VerifiedAssets } from '../types.js';

export async function executeStageHashVerify(
  context: GateContext,
  signal: AbortSignal
): Promise<VerifiedAssets> {
  if (signal.aborted) {
    throw createHashError('E_GATE_CANCELLED', 'Gate cancelled');
  }

  if (!context.parsed_bundle) {
    throw createHashError('E_SCHEMA_MISSING_FIELD', 'Parsed bundle not available');
  }

  const { gene, capsule } = context.parsed_bundle;

  // 计算 canonical JSON 并生成 SHA256
  const geneHash = computeCanonicalHash(gene);
  const capsuleHash = capsule ? computeCanonicalHash(capsule) : undefined;

  // 验证 gene_id
  if (!gene.gene_id.startsWith('sha256:')) {
    throw createHashError(
      'E_HASH_INVALID_FORMAT',
      'Gene ID must start with sha256:',
      { gene_id: gene.gene_id }
    );
  }

  if (gene.gene_id !== `sha256:${geneHash}`) {
    throw createHashError(
      'E_HASH_MISMATCH',
      'Gene ID hash mismatch',
      { expected: `sha256:${geneHash}`, actual: gene.gene_id }
    );
  }

  // 验证 capsule_id（如果存在）
  if (capsule && capsule.capsule_id) {
    if (!capsule.capsule_id.startsWith('sha256:')) {
      throw createHashError(
        'E_HASH_INVALID_FORMAT',
        'Capsule ID must start with sha256:',
        { capsule_id: capsule.capsule_id }
      );
    }

    if (capsule.capsule_id !== `sha256:${capsuleHash}`) {
      throw createHashError(
        'E_HASH_MISMATCH',
        'Capsule ID hash mismatch',
        { expected: `sha256:${capsuleHash}`, actual: capsule.capsule_id }
      );
    }
  }

  const verifiedAssets: VerifiedAssets = {
    gene_id: gene.gene_id,
    capsule_id: capsule?.capsule_id,
    hash_verified: true,
    canonical_hashes: {
      gene: `sha256:${geneHash}`,
      capsule: capsuleHash ? `sha256:${capsuleHash}` : undefined,
    },
  };

  console.log(`[Stage 2] Verified hashes for gate=${context.gate_id}`);
  return verifiedAssets;
}

/**
 * 计算 canonical JSON 的 SHA256 哈希
 *
 * Canonical JSON 规则：
 * 1. UTF-8 编码
 * 2. 字段按字典序排序
 * 3. 不允许浮点 NaN/Infinity
 * 4. 数值统一格式
 */
function computeCanonicalHash(obj: unknown): string {
  const canonical = canonicalize(obj);
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Canonicalize 对象
 */
function canonicalize(obj: unknown): string {
  if (obj === null) {
    return 'null';
  }

  if (typeof obj === 'undefined') {
    return 'null';
  }

  if (typeof obj === 'boolean' || typeof obj === 'number') {
    if (typeof obj === 'number' && (Number.isNaN(obj) || !Number.isFinite(obj))) {
      throw new Error('Invalid number: NaN or Infinity not allowed');
    }
    return String(obj);
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(key => {
      return canonicalize(key) + ':' + canonicalize((obj as Record<string, unknown>)[key]);
    });
    return '{' + pairs.join(',') + '}';
  }

  throw new Error('Unsupported type for canonicalization');
}
