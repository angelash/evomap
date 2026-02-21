/**
 * A2A Envelope - 统一消息封装外壳
 * 所有 A2A 请求都必须使用此格式
 */

export interface A2AEnvelope<T = unknown> {
  protocol: 'evomap-a2a';
  protocol_version: '1.0';
  message_type: MessageType;
  message_id: string; // UUID v4
  sender_id: string; // node_xxx
  timestamp_ms: number; // Unix timestamp in milliseconds
  payload: T;
}

/**
 * 支持的消息类型
 */
export type MessageType =
  | 'hello'
  | 'publish'
  | 'fetch'
  | 'report'
  | 'decision'
  | 'revoke';

/**
 * 环境指纹
 */
export interface EnvFingerprint {
  os: 'win' | 'linux' | 'macos';
  toolchain?: string; // 'vs2022', 'gcc', 'clang'
  ue?: string; // '5.6', '5.5'
  node_version?: string;
  [k: string]: unknown; // 其他环境特定字段
}
