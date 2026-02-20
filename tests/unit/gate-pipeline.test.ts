import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startScheduler, enqueueGate, getQueueStatus, clearQueue } from '../../src/gate/scheduler.js';
import { executeGatePipeline } from '../../src/gate/pipeline.js';

describe('Gate Pipeline Tests', () => {
  beforeEach(() => {
    clearQueue();
  });

  afterEach(() => {
    clearQueue();
  });

  it('should enqueue and process gate', async () => {
    startScheduler();
    
    const gateId = await enqueueGate(
      'sha256:test',
      'node_test',
      'mock_base64',
      'zip'
    );

    expect(gateId).toBeDefined();
    expect(gateId).toMatch(/^gate_/);
  });

  it('should track queue status', async () => {
    startScheduler();
    
    await enqueueGate('sha256:test1', 'node1', 'base64', 'zip');
    await enqueueGate('sha256:test2', 'node2', 'base64', 'zip');

    const status = getQueueStatus();
    expect(status.queue_size).toBeGreaterThanOrEqual(0);
    expect(status.running_count).toBeGreaterThanOrEqual(0);
  });

  it('should handle concurrent gate limit', async () => {
    startScheduler({ max_concurrent_gates: 2 });
    
    // Enqueue more gates than limit
    await enqueueGate('sha256:test1', 'node1', 'base64', 'zip');
    await enqueueGate('sha256:test2', 'node2', 'base64', 'zip');
    await enqueueGate('sha256:test3', 'node3', 'base64', 'zip');

    const status = getQueueStatus();
    expect(status.max_concurrent).toBe(2);
  });
});

describe('CI Adapter Tests', () => {
  it('should mock CI adapter trigger task', async () => {
    const { MockCIAdapter } = await import('../../src/ci/mock.js');
    const adapter = new MockCIAdapter();

    const externalId = await adapter.triggerTask({
      gate_id: 'test_gate',
      repo_ref: 'commit123',
      patch_key: 'patches/test.diff',
      validation_plan: { tasks: [] }
    });

    expect(externalId).toBeDefined();
    expect(externalId).toMatch(/^mock_ci_/);
  });

  it('should mock CI adapter check status', async () => {
    const { MockCIAdapter } = await import('../../src/ci/mock.js');
    const adapter = new MockCIAdapter();

    const externalId = await adapter.triggerTask({
      gate_id: 'test_gate',
      repo_ref: 'commit123',
      patch_key: 'patches/test.diff',
      validation_plan: { tasks: [] }
    });

    // Wait a bit for mock to complete
    await new Promise(resolve => setTimeout(resolve, 2500));

    const status = await adapter.checkStatus(externalId);
    expect(status.status).toBe('pass');
  });
});

describe('Sandbox Runner Tests', () => {
  it('should execute validation plan', async () => {
    const { executeValidationPlan } = await import('../../src/runner/executor.js');

    const result = await executeValidationPlan({
      tasks: [
        { name: 'build_win64' },
        { name: 'run_unit_tests' }
      ]
    });

    expect(result.status).toBe('pass');
    expect(result.steps).toHaveLength(2);
  });

  it('should collect env fingerprint', async () => {
    const { executeValidationPlan } = await import('../../src/runner/executor.js');

    const result = await executeValidationPlan({ tasks: [] });

    expect(result.env_fingerprint).toBeDefined();
    expect(result.env_fingerprint?.os).toBeDefined();
  });
});
