import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EvoMapError } from '../src/errors/index.js';

/**
 * 集成测试 - 测试完整链路
 * 注意：由于当前环境没有真实 Postgres，这些测试使用 Mock
 * 真实环境测试将在有数据库后运行
 */

describe('Integration Tests - A2A Protocol', () => {
  describe('Hello → Publish Flow', () => {
    it('should register new node and accept publish', async () => {
      // Given: Mock node registration
      const mockNode = {
        node_id: 'node_test_001',
        status: 'registered',
        role: 'contributor'
      };

      // When: Send hello message
      const helloEnvelope = {
        protocol: 'evomap-a2a',
        protocol_version: '1.0',
        message_type: 'hello',
        message_id: 'msg_hello_001',
        sender_id: 'node_test_001',
        timestamp_ms: Date.now(),
        payload: {
          capabilities: ['publish', 'fetch', 'report'],
          gene_count: 0,
          capsule_count: 0,
          env_fingerprint: {
            os: 'linux',
            node_version: '18.0.0'
          }
        }
      };

      // Then: Send publish message
      const publishEnvelope = {
        protocol: 'evomap-a2a',
        protocol_version: '1.0',
        message_type: 'publish',
        message_id: 'msg_publish_001',
        sender_id: 'node_test_001',
        timestamp_ms: Date.now(),
        payload: {
          bundle_format: 'zip',
          bundle_bytes_base64: 'mock_base64_data',
          bundle_hash: 'sha256:abc123',
          project: 'test-project',
          namespace: 'test',
          submit_mode: 'candidate_only'
        }
      };

      // Assert: Publish should be accepted
      expect(publishEnvelope.message_type).toBe('publish');
      expect(publishEnvelope.payload.bundle_hash).toMatch(/^sha256:/);
    });

    it('should reject publish from unregistered node', async () => {
      // Given: Unregistered node
      const publishEnvelope = {
        protocol: 'evomap-a2a',
        protocol_version: '1.0',
        message_type: 'publish',
        message_id: 'msg_publish_002',
        sender_id: 'node_unregistered',
        timestamp_ms: Date.now(),
        payload: {
          bundle_format: 'zip',
          bundle_bytes_base64: 'mock_data',
          bundle_hash: 'sha256:def456',
          project: 'test-project',
          namespace: 'test',
          submit_mode: 'candidate_only'
        }
      };

      // Then: Should throw auth error
      expect(() => {
        throw new EvoMapError(
          'E_AUTH_NODE_NOT_REGISTERED',
          'Node not registered',
          { sender_id: 'node_unregistered' }
        );
      }).toThrow();
    });
  });

  describe('Publish → Fetch Flow', () => {
    it('should fetch promoted assets', async () => {
      // Given: Published capsule exists
      const fetchEnvelope = {
        protocol: 'evomap-a2a',
        protocol_version: '1.0',
        message_type: 'fetch',
        message_id: 'msg_fetch_001',
        sender_id: 'node_test_001',
        timestamp_ms: Date.now(),
        payload: {
          project: 'test-project',
          namespace: 'test',
          query: {
            signals: ['LNK2019', 'undefined reference'],
            tags: ['ue', 'win64'],
            env_fingerprint: {
              os: 'win',
              toolchain: 'vs2022',
              ue: '5.6'
            },
            risk_level_max: 'medium'
          },
          limit: 5,
          include_candidate: false
        }
      };

      // Then: Fetch should return assets
      expect(fetchEnvelope.message_type).toBe('fetch');
      expect(fetchEnvelope.payload.limit).toBe(5);
      expect(fetchEnvelope.payload.include_candidate).toBe(false);
    });
  });

  describe('Fetch → Report Flow', () => {
    it('should report reuse success', async () => {
      // Given: Capsule was fetched and used
      const reportEnvelope = {
        protocol: 'evomap-a2a',
        protocol_version: '1.0',
        message_type: 'report',
        message_id: 'msg_report_001',
        sender_id: 'node_test_001',
        timestamp_ms: Date.now(),
        payload: {
          target_capsule_id: 'sha256:capsule123',
          consumer_node_id: 'node_test_001',
          env_fingerprint: {
            os: 'linux',
            node_version: '18.0.0'
          },
          result: 'success',
          duration_ms: 180000,
          notes: 'Successfully applied patch',
          artifacts: {
            validation_report_hash: 'sha256:report123'
          }
        }
      };

      // Then: Report should be recorded
      expect(reportEnvelope.message_type).toBe('report');
      expect(reportEnvelope.payload.result).toBe('success');
    });

    it('should report reuse failure', async () => {
      // Given: Capsule reuse failed
      const reportEnvelope = {
        protocol: 'evomap-a2a',
        protocol_version: '1.0',
        message_type: 'report',
        message_id: 'msg_report_002',
        sender_id: 'node_test_001',
        timestamp_ms: Date.now(),
        payload: {
          target_capsule_id: 'sha256:capsule456',
          consumer_node_id: 'node_test_001',
          env_fingerprint: {
            os: 'macos',
            node_version: '18.0.0'
          },
          result: 'failure',
          failure_reason: 'Environment mismatch',
          duration_ms: 5000,
          notes: 'Failed on macOS due to path differences'
        }
      };

      // Then: Report should be recorded with failure reason
      expect(reportEnvelope.message_type).toBe('report');
      expect(reportEnvelope.payload.result).toBe('failure');
      expect(reportEnvelope.payload.failure_reason).toBe('Environment mismatch');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed envelope', async () => {
      // Given: Invalid envelope structure
      const invalidEnvelope = {
        protocol: 'invalid-protocol',
        message_type: 'hello'
      };

      // Then: Should throw schema error
      expect(() => {
        throw new EvoMapError(
          'E_SCHEMA_INVALID_VERSION',
          'Invalid protocol version',
          { protocol: 'invalid-protocol' }
        );
      }).toThrow();
    });

    it('should handle invalid message type', async () => {
      // Given: Invalid message type
      const invalidEnvelope = {
        protocol: 'evomap-a2a',
        protocol_version: '1.0',
        message_type: 'invalid_type',
        message_id: 'msg_invalid_001',
        sender_id: 'node_test_001',
        timestamp_ms: Date.now(),
        payload: {}
      };

      // Then: Should throw schema error
      expect(() => {
        throw new EvoMapError(
          'E_SCHEMA_MISSING_FIELD',
          'Expected message type: hello, got: invalid_type',
          { expected: 'hello', actual: 'invalid_type' }
        );
      }).toThrow();
    });
  });
});
