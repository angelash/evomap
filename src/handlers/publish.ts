import { PublishPayload, PublishResponse } from '../protocol/messages.js';
import { query, queryOne, transaction } from '../database/pool.js';
import { EvoMapError, createSchemaError, createPolicyError } from '../errors/index.js';
import crypto from 'crypto';

/**
 * Handle publish message - receive bundle
 */
export async function handlePublish(
  envelope: import('../protocol/envelope.js').A2AEnvelope<PublishPayload>
): Promise<PublishResponse> {
  const { sender_id, payload } = envelope;

  // Step 1: Validate payload structure
  if (!payload.bundle_format || !payload.bundle_bytes_base64 || !payload.bundle_hash) {
    throw createSchemaError(
      'E_SCHEMA_MISSING_FIELD',
      'Missing required fields in publish payload',
      { sender_id }
    );
  }

  if (
!payload.bundle_format === 'zip' &&
!payload.bundle_format === 'tar.gz'
) {
    throw createSchemaError(
      'E_SCHEMA_INVALID_TYPE',
      'Invalid bundle format, must be zip or tar.gz',
      { bundle_format: payload.bundle_format }
    );
  }

  // Step 2: Verify bundle hash (basic validation)
  // Note: Full hash verification will be done in gate pipeline
  if (!payload.bundle_hash.startsWith('sha256:')) {
    throw createSchemaError(
      'E_HASH_INVALID_FORMAT',
      'Invalid hash format, must start with sha256:',
      { bundle_hash: payload.bundle_hash }
    );
  }

  // Step 3: Check node permissions and quota
  const node = await queryOne(
    'SELECT node_id, role, quota_used, quota_limit FROM nodes WHERE node_id = $1 AND status = $2',
    [sender_id, 'active']
  );

  if (!node) {
    throw createAuthError(
      'E_AUTH_NODE_NOT_REGISTERED',
      'Node not registered or inactive',
      { sender_id }
    );
  }

  if (node.quota_used >= node.quota_limit) {
    throw new EvoMapError(
      'E_RATE_QUOTA_EXCEEDED',
      'Publish quota exceeded',
      { quota_used: node.quota_used, quota_limit: node.quota_limit }
    );
  }

  // Step 4: Create gate pipeline entry
  const gateId = `gate_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  await transaction(async (client) => {
    // Insert gate entry
    await client.query(
      'INSERT INTO gates (gate_id, bundle_hash, status, created_at) VALUES ($1, $2, $3, NOW())',
      [gateId, payload.bundle_hash, 'received']
    );

    // Update node quota
    await client.query(
      'UPDATE nodes SET quota_used = quota_used + 1, last_heartbeat = NOW() WHERE node_id = $1',
      [sender_id]
    );

    // Write audit log
    await client.query(
      'INSERT INTO audit_logs (message_id, sender_id, action, result, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [envelope.message_id, sender_id, 'publish', 'success']
    );
  });

  return {
    status: 'accepted',
    candidate_asset_ids: [], // Will be populated after gate completion
    gate_pipeline_id: gateId,
    next: {
      type: 'poll',
      url: `/gates/${gateId}`
    }
  };
}
