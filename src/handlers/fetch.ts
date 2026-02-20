import { FetchPayload, FetchResponse } from '../protocol/messages.js';
import { query, queryOne } from '../database/pool.js';
import { EvoMapError, createAuthError, E_AUTH_PERMISSION_DENIED } from '../errors/index.js';

/**
 * Handle fetch message - retrieve assets
 */
export async function handleFetch(
  envelope: import('../protocol/envelope.js').A2AEnvelope<FetchPayload>
): Promise<FetchResponse> {
  const { sender_id, payload } = envelope;

  // Step 1: Check node permissions
  const node = await queryOne(
    'SELECT node_id, role FROM nodes WHERE node_id = $1 AND status = $2',
    [sender_id, 'active']
  );

  if (!node) {
    throw createAuthError(
      'E_AUTH_NODE_NOT_REGISTERED',
      'Node not registered or inactive',
      { sender_id }
    );
  }

  // Step 2: Build query conditions
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Project filter
  if (payload.project) {
    conditions.push(`project = $${paramIndex++}`);
    params.push(payload.project);
  }

  // Namespace filter
  if (payload.namespace) {
    conditions.push(`namespace = $${paramIndex++}`);
    params.push(payload.namespace);
  }

  // Signals filter (JSONB GIN query)
  if (payload.query?.signals && payload.query.signals.length > 0) {
    conditions.push(`signals @> $${paramIndex++}`);
    params.push(JSON.stringify(payload.query.signals));
  }

  // Tags filter (JSONB GIN query)
  if (payload.query?.tags && payload.query.tags.length > 0) {
    conditions.push(`tags @> $${paramIndex++}`);
    params.push(JSON.stringify(payload.query.tags));
  }

  // Env fingerprint filter
  if (payload.query?.env_fingerprint) {
    conditions.push(`env_fingerprint @> $${paramIndex++}`);
    params.push(JSON.stringify(payload.query.env_fingerprint));
  }

  // Status filter (promoted only, unless include_candidate is true)
  if (!payload.include_candidate) {
    conditions.push(`status = 'promoted'`);
  }

  // Step 3: Build and execute query
  let whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  const limitClause = `LIMIT ${Math.min(payload.limit, 100)}`;

  const queryText = `
    SELECT
      a.asset_id,
      c.gene_id,
      a.name as summary,
      c.confidence,
      COALESCE(SUM(CASE WHEN r.result = 'success' THEN 1 ELSE 0 END), 0) / NULLIF(COUNT(r.id), 0) as success_rate,
      a.metadata->>'env_fingerprint' as env_fingerprint
    FROM assets a
    LEFT JOIN capsules c ON a.asset_id = c.capsule_id
    LEFT JOIN reports r ON a.asset_id = r.capsule_id
    WHERE ${whereClause}
    GROUP BY a.asset_id, c.gene_id, a.name, c.confidence, a.metadata, a.created_at
    ORDER BY c.confidence DESC, a.created_at DESC
    ${limitClause}
  `;

  const assets = await query(queryText, params);

  return {
    assets: assets.map(row => ({
      asset_id: row.asset_id,
      gene_id: row.gene_id,
      summary: row.summary,
      confidence: parseFloat(row.confidence),
      success_rate: parseFloat(row.success_rate),
      env_fingerprint: row.env_fingerprint ? JSON.parse(row.env_fingerprint) : undefined
    })),
    explain: `Found ${assets.length} assets matching query`
  };
}
