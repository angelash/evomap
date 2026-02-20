import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPool, closePool, query } from '../../src/database/pool.js';

// Mock pg module - must be at top level and use factory function
vi.mock('pg', () => {
  const mockPool = {
    query: vi.fn(),
    end: vi.fn(),
    connect: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn(),
    })),
  };

  return {
    Pool: vi.fn(() => mockPool),
  };
});

describe('Database Pool', () => {
  afterEach(async () => {
    await closePool();
    vi.clearAllMocks();
  });

  it('should initialize pool with default config', () => {
    const pool = getPool();
    expect(pool).toBeDefined();
  });

  it('should reuse same pool instance', () => {
    const pool1 = getPool();
    const pool2 = getPool();
    expect(pool1).toBe(pool2);
  });

  it('should close pool', async () => {
    const pool = getPool();
    await closePool();
    expect(pool.end).toHaveBeenCalled();
  });

  it('should execute queries through pool', async () => {
    const pool = getPool();
    const mockRows = [{ id: 1, name: 'test-node' }];
    (pool.query as any).mockResolvedValueOnce({ rows: mockRows });

    const result = await query('SELECT * FROM nodes');
    expect(result).toEqual(mockRows);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM nodes', undefined);
  });
});
