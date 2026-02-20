import { HelloPayload, HelloResponse } from '../protocol/messages.js';
import { queryOne, transaction } from '../database/pool.js';
import { createAuthError, E_AUTH_NODE_NOT_REGISTERED } from '../errors/index.js';

/**
 * Handle hello message - node registration
 */
export async function handleHello(
  envelope: import('../protocol/envelope.js').A2AEnvelope<HelloPayload>
): Promise<HelloResponse> {
  const { sender_id, payload } = envelope;

  // Check if node already exists
  const existingNode = await queryOne(
    'SELECT node_id, status FROM nodes WHERE node_id = $1',
    [sender_id]
  );

  // Generate or reuse claim code
  const claimCode = existingNode ? null : generateClaimCode();

  // Update or insert node
  if (existingNode) {
    await transaction(async (client) => {
      await client.query(
        'UPDATE nodes SET capabilities = $1, gene_count = $2, capsule_count = $3, env_fingerprint = $4, last_heartbeat = NOW() WHERE node_id = $5',
        [
          JSON.stringify(payload.capabilities),
          payload.gene_count || 0,
          payload.capsule_count || 0,
          JSON.stringify(payload.env_fingerprint || {}),
          sender_id
        ]
      );
    });

    return {
      node_id: sender_id,
      status: 'updated',
      claim_code: claimCode || undefined
    };
  } else {
    await transaction(async (client) => {
      await client.query(
        'INSERT INTO nodes (node_id, capabilities, gene_count, capsule_count, env_fingerprint, status, last_heartbeat) VALUES ($1, $2, $3, $4, $5, NOW())',
        [
          sender_id,
          JSON.stringify(payload.capabilities),
          payload.gene_count || 0,
          payload.capsule_count || 0,
          JSON.stringify(payload.env_fingerprint || {}),
          'active'
        ]
      );
    });

    return {
      node_id: sender_id,
      status: 'registered',
      claim_code: claimCode
    };
  }
}

/**
 * Generate a random claim code for new nodes
 */
function generateClaimCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
