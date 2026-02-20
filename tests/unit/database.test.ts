import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPool, closePool, query } from '../../src/database/pool.js';
import pkg from 'pg';
const { Pool } = pkg;

// Mock pg.Pool
vi.mock('pg', () => {
  const Pool = vi.fn(() => ({
    query: vi.fn(),
    end: vi.fn(),
    connect: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn(),
    })),
  }));
  return { default: { Pool } };
});

describe('Database Pool', () => {
  afterEach(async () => {
    await closePool();
    vi.clearAllMocks();
  });

  it('should initialize the pool with default config', () => {
    const pool = getPool();
    expect(pool).toBeDefined();
    expect(Pool).toHaveBeenCalled();
  });

  it('should reuse the same pool instance', () => {
    const pool1 = getPool();
    const pool2 = getPool();
    expect(pool1).toBe(pool2);
  });

  it('should close the pool', async () => {
    const pool = getPool();
    await closePool();
    expect(pool.end).toHaveBeenCalled();
  });

  it('should execute queries through the pool', async () => {
    const pool = getPool();
    const mockRows = [{ id: 1, name: 'test-node' }];
    (pool.query as any).mockResolvedValueOnce({ rows: mockRows });

    const result = await query('SELECT * FROM nodes');
    expect(result).toEqual(mockRows);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM nodes', undefined);
  });
});
