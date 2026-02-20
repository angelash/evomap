/**
 * EvoMap-Lite 统一错误码
 */

export class EvoMapError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EvoMapError';
  }
}

/**
 * 鉴权错误
 */
export const E_AUTH_INVALID_TOKEN = 'E_AUTH_INVALID_TOKEN';
export const E_AUTH_NODE_NOT_REGISTERED = 'E_AUTH_NODE_NOT_REGISTERED';
export const E_AUTH_PERMISSION_DENIED = 'E_AUTH_PERMISSION_DENIED';

/**
 * Schema 错误
 */
export const E_SCHEMA_MISSING_FIELD = 'E_SCHEMA_MISSING_FIELD';
export const E_SCHEMA_INVALID_TYPE = 'E_SCHEMA_INVALID_TYPE';
export const E_SCHEMA_INVALID_VERSION = 'E_SCHEMA_INVALID_VERSION';

/**
 * Hash 错误
 */
export const E_HASH_MISMATCH = 'E_HASH_MISMATCH';
export const E_HASH_INVALID_FORMAT = 'E_HASH_INVALID_FORMAT';

/**
 * 策略错误
 */
export const E_POLICY_DANGEROUS_COMMAND = 'E_POLICY_DANGEROUS_COMMAND';
export const E_POLICY_BLAST_RADIUS_TOO_LARGE = 'E_POLICY_BLAST_RADIUS_TOO_LARGE';
export const E_POLICY_EXTERNAL_CONNECTION_BLOCKED = 'E_POLICY_EXTERNAL_CONNECTION_BLOCKED';

/**
 * 门禁错误
 */
export const E_GATE_VALIDATION_FAILED = 'E_GATE_VALIDATION_FAILED';
export const E_GATE_SANDBOX_TIMEOUT = 'E_GATE_SANDBOX_TIMEOUT';
export const E_GATE_CI_JOB_FAILED = 'E_GATE_CI_JOB_FAILED';

/**
 * 限流错误
 */
export const E_RATE_LIMIT_EXCEEDED = 'E_RATE_LIMIT_EXCEEDED';
export const E_RATE_QUOTA_EXCEEDED = 'E_RATE_QUOTA_EXCEEDED';

/**
 * 未找到错误
 */
export const E_NOTFOUND_ASSET = 'E_NOTFOUND_ASSET';
export const E_NOTFOUND_NODE = 'E_NOTFOUND_NODE';

/**
 * 创建鉴权错误
 */
export function createAuthError(code: string, message: string, context?: Record<string, unknown>): EvoMapError {
  return new EvoMapError(code, message, context);
}

/**
 * 创建 Schema 错误
 */
export function createSchemaError(code: string, message: string, context?: Record<string, unknown>): EvoMapError {
  return new EvoMapError(code, message, context);
}

/**
 * 创建 Hash 错误
 */
export function createHashError(code: string, message: string, context?: Record<string, unknown>): EvoMapError {
  return new EvoMapError(code, message, context);
}

/**
 * 创建策略错误
 */
export function createPolicyError(code: string, message: string, context?: Record<string, unknown>): EvoMapError {
  return new EvoMapError(code, message, context);
}

/**
 * 创建门禁错误
 */
export function createGateError(code: string, message: string, context?: Record<string, unknown>): EvoMapError {
  return new EvoMapError(code, message, context);
}

/**
 * 创建限流错误
 */
export function createRateError(code: string, message: string, context?: Record<string, unknown>): EvoMapError {
  return new EvoMapError(code, message, context);
}

/**
 * 创建未找到错误
 */
export function createNotFoundError(code: string, message: string, context?: Record<string, unknown>): EvoMapError {
  return new EvoMapError(code, message, context);
}
