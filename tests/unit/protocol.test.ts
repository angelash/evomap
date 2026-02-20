import { describe, it, expect } from 'vitest';
import {
  A2AEnvelope,
  MessageType,
  EnvFingerprint
} from '../../src/protocol/enevelope.js';
import {
  HelloPayload,
  HelloResponse,
  PublishPayload,
  PublishResponse,
  FetchPayload,
  FetchResponse,
  ReportPayload,
  ReportResponse,
  DecisionPayload,
  DecisionResponse,
  RevokePayload,
  RevokeResponse
} from '../../src/protocol/messages.js';

describe('A2A Envelope', () => {
  describe('type validation', () => {
    it('should accept valid envelope', () => {
      const envelope: A2AEnvelope<HelloPayload> = {
        protocol: 'evomap-a2a',
        protocol_version: '1.0',
        message_type: 'hello',
        message: 'uuid-v4',
        sender_id: 'node_001',
        timestamp_ms: Date.now(),
        payload: {
          capabilities: ['publish', 'fetch']
        }
      };

      expect(envelope.protocol).toBe('evomap-a2a');
      expect(envelope.protocol_version).toBe('1.0');
      expect(envelope.message_type).toBe('hello');
    });

    it('should support all message types', () => {
      const types: MessageType[] = [
        'hello',
        'publish',
        'fetch',
        'report',
        'decision',
        'revoke'
      ];

      for (const type of types) {
        const envelope: A2AEnvelope<unknown> = {
          protocol: 'evomap-a2a',
          protocol_version: '1.0',
          message_type: type,
          message_id: 'uuid-v4',
          sender_id: 'node_001',
          timestamp_ms: Date.now(),
          payload: {}
        };

        expect(envelope.message_type).toBe(type);
      }
    });
  });

  describe('EnvFingerprint', () => {
    it('should accept valid fingerprint', () => {
      const fingerprint: EnvFingerprint = {
        os: 'linux',
        toolchain: 'gcc',
        ue: '5.6',
        node_version: '18.0.0'
      };

      expect(fingerprint.os).toBe('linux');
      expect(fingerprint.toolchain).toBe('gcc');
    });

    it('should support all OS types', () => {
      const osTypes: EnvFingerprint['os'][] = ['win', 'linux', 'macos'];

      for (const os of osTypes) {
        const fingerprint: EnvFingerprint = { os };
        expect(fingerprint.os).toBe(os);
      }
    });
  });
});

describe('Message Types', () => {
  describe('Hello Payload', () => {
    it('should accept valid hello payload', () => {
      const payload: HelloPayload = {
        capabilities: ['publish', 'fetch', 'report'],
        gene_count: 10,
        capsule_count: 5,
        env_fingerprint: {
          os: 'linux'
        }
      };

      expect(payload.capabilities).toHaveLength(3);
      expect(payload.gene_count).toBe(10);
    });
  });

  describe('Publish Payload', () => {
    it('should accept valid publish payload', () => {
      const payload: PublishPayload = {
        bundle_format: 'zip',
        bundle_bytes_base64: 'base64data',
        bundle_hash: 'sha256:abc123',
        project: 'test-project',
        namespace: 'test',
        submit_mode: 'candidate_only'
      };

      expect(payload.bundle_format).toBe('zip');
      expect(payload.submit_mode).toBe('candidate_only');
    });
  });

  describe('Fetch Payload', () => {
    it('should accept valid fetch payload', () => {
      const payload: FetchPayload = {
        project: 'test-project',
        namespace: 'test',
        query: {
          signals: ['LNK2019'],
          tags: ['ue', 'win64'],
          risk_level_max: 'medium'
        },
        limit: 5,
        include_candidate: false
      };

      expect(payload.limit).toBe(5);
      expect(payload.include_candidate).toBe(false);
    });
  });

  describe('Report Payload', () => {
    it('should accept valid report payload', () => {
      const payload: ReportPayload = {
        target_capsule_id: 'sha256:capsule123',
        consumer_node_id: 'node_001',
        env_fingerprint: {
          os: 'win'
        },
        result: 'success',
        duration_ms: 180000,
        notes: 'Test passed'
      };

      expect(payload.result).toBe('success');
      expect(payload.duration_ms).toBe(180000);
    });
  });

  describe('Decision Payload', () => {
    it('should accept valid decision payload', () => {
      const payload: DecisionPayload = {
        asset_id: 'sha256:asset123',
        decision: 'accept',
        reason: 'Passed validation',
        reviewer_id: 'reviewer_001'
      };

      expect(payload.decision).toBe('accept');
    });
  });

  describe('Revoke Payload', () => {
    it('should accept valid revoke payload', () => {
      const payload: RevokePayload = {
        asset_id: 'sha256:asset123',
        reason: 'Security issue',
        revoker_id: 'admin_001'
      };

      expect(payload.reason).toBe('Security issue');
    });
  });
});
