/**
 * Stage 1: Parse & Schema Validate
 * 解包并校验 bundle 内容结构
 */

import { createSchemaError } from '../../errors/index.js';
import type { GateContext, ParsedBundle } from '../types.js';

export async function executeStageParse(
  context: GateContext,
  signal: AbortSignal
): Promise<ParsedBundle> {
  if (signal.aborted) {
    throw createSchemaError('E_GATE_CANCELLED', 'Gate cancelled');
  }

  // TODO: 实现解包逻辑（zip/tar.gz）
  // 暂时返回 mock 数据
  const parsedBundle: ParsedBundle = {
    gene: {
      gene_id: 'mock_gene_id',
      summary: 'Mock gene for parsing',
      signals: ['LNK2019', 'undefined reference'],
      tags: ['ue', 'win64'],
      preconditions: [],
      constraints: [],
      validation_plan: {
        tasks: [
          { name: 'build_win64' },
          { name: 'run_unit_tests' },
        ],
        resource_limits: {
          cpu: 2,
          memory_mb: 4096,
          timeout_ms: 300000,
        },
      },
      confidence: 0.9,
      metadata: {},
    },
    capsule: {
      capsule_id: 'mock_capsule_id',
      gene_id: 'mock_gene_id',
      confidence: 0.9,
      blast_radius: {
        files: 5,
        lines: 100,
      },
      patch_object_key: 'patches/mock_capsule_id.diff',
      validation_plan_key: 'plans/mock_validation_plan.json',
      env_fingerprint: {
        os: 'win',
        toolchain: 'vs2022',
        ue: '5.6',
      },
      metadata: {},
    },
    artifacts: {
      patch: Buffer.from('Mock patch content'),
      validation_plan: {
        tasks: [
          { name: 'build_win64' },
          { name: 'run_unit_tests' },
        ],
      },
      validation_report: Buffer.from('Mock validation report'),
      logs: [],
    },
  };

  console.log(`[Stage 1] Parsed bundle for gate=${context.gate_id}`);
  return parsedBundle;
}

/**
 * 解压 bundle（zip/tar.gz）
 */
async function extractBundle(
  bundleBytesBase64: string,
  format: 'zip' | 'tar.gz',
  signal: AbortSignal
): Promise<Map<string, Buffer>> {
  // TODO: 实现解压逻辑
  // 1. Base64 解码
  // 2. 解压（使用 adm-zip 或 tar）
  // 3. 返回文件映射（文件名 → 内容）

  return new Map();
}

/**
 * 校验 JSON schema
 */
function validateSchema(obj: unknown, schema: Record<string, unknown>): boolean {
  // TODO: 使用 ajv 或类似库进行 schema 校验
  return true;
}
