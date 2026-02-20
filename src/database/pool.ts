/**
 * Database connection pool for EvoMap-Lite
 */

import { Pool, PoolConfig } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

const DEFAULT_CONFIG: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'evomap_lite',
  user: process.env.DB_USER || 'evomap',
  password: process.env.DB_PASSWORD || 'evomap_dev_secret',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const config: PoolConfig = {
      host: DEFAULT_CONFIG.host,
      port: DEFAULT_CONFIG.port,
      database: DEFAULT_CONFIG.database,
      user: DEFAULT_CONFIG.user,
      password: DEFAULT_CONFIG.password,
      max: DEFAULT_CONFIG.max,
      idleTimeoutMillis: DEFAULT_CONFIG.idleTimeoutMillis,
      connectionTimeoutMillis: DEFAULT_CONFIG.connectionTimeoutMillis
    };

    pool = new Pool(config);
  }

  return pool;
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute a query with parameters
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const dbPool = getPool();
  const result = await dbPool.query(text, params);
  return result.rows as T[];
}

/**
 * Execute a single-row query
 */
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const dbPool = getPool();
  const client = await dbPool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
