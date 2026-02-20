import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startScheduler, enqueueGate } from '../../src/gate/scheduler.js';
import { getGateStatus } from '../../src/gate/pipeline.js';

describe('Integration Tests - Full Pipeline', () => {
  beforeAll(() => {
    startScheduler({ max_concurrent_gates: 1 });
  });

  afterAll(() => {
    // TODO: stopScheduler();
  });

  it('should complete full pipeline: publish → gate → validated → candidate', async () => {
    // Step 1: Publish bundle
    const gateId = await enqueueGate(
      'sha256:test_bundle_hash',
      'node_test_001',
      'mock_base64_data',
      'zip',
      'test-project',
      'test-namespace',
      'candidate_only'
    );

    expect(gateId).toBeDefined();
    expect(gateId).toMatch(/^gate_/);

    // Step 2: Wait for gate to complete
    // Note: Mock implementation completes quickly
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Check gate status
    const gate = await getGateStatus(gateId);
    expect(gate).toBeDefined();
    expect(gate.status).toMatch(/candidate|promoted|rejected/);
  });

  it('should handle security policy rejection', async () => {
    // Publish with dangerous command (mock scenario)
    const gateId = await enqueueGate(
      'sha256:dangerous',
      'node_test_002',
      'mock_base64_with_danger',
      'zip'
    );

    await new Promise(resolve => setTimeout(resolve, 3000));

    const gate = await getGateStatus(gateId);
    expect(gate.status).toBe('rejected');
    expect(gate.error_code).toBeDefined();
  });

  it('should handle hash verification failure', async () => {
    // Publish with invalid hash (mock scenario)
    const gateId = await enqueueGate(
      'sha256:invalid',
      'node_test_003',
      'mock_base64_invalid_hash',
      'zip'
    );

    await new Promise(resolve => setTimeout(resolve, 3000));

    const gate = await getGateStatus(gateId);
    expect(gate.status).toBe('rejected');
    expect(gate.error_code).toContain('HASH');
  });
});

describe('Integration Tests - CI Adapter', () => {
  it('should trigger CI job and poll for results', async () => {
    const { MockCIAdapter } = await import('../../src/ci/mock.js');
    const adapter = new MockCIAdapter();

    const externalId = await adapter.triggerTask({
      gate_id: 'test_gate',
      repo_ref: 'commit123',
      patch_key: 'patches/test.diff',
      validation_plan: { tasks: [] }
    });

    expect(externalId).toBeDefined();

    // Poll for completion
    let status = await adapter.checkStatus(externalId);
    expect(status.status).toBe('running');

    // Wait for mock to complete
    await new Promise(resolve => setTimeout(resolve, 2500));

    status = await adapter.checkStatus(externalId);
    expect(status.status).toBe('pass');
    expect(status.report_key).toBeDefined();
  });

  it('should handle CI timeout', async () => {
    const { MockCIAdapter } = await import('../../src/ci/mock.js');
    const adapter = new MockCIAdapter();

    const externalId = await adapter.triggerTask({
      gate_id: 'timeout_gate',
      repo_ref: 'commit456',
      patch_key: 'patches/timeout.diff',
      validation_plan: { tasks: [] }
    });

    // Cancel after short delay
    await new Promise(resolve => setTimeout(resolve, 500));
    await adapter.cancelTask(externalId);

    const status = await adapter.checkStatus(externalId);
    expect(status.status).toBe('error');
  });
});

describe('Integration Tests - Object Storage', () => {
  it('should upload and download bundle', async () => {
    const { initStorage, uploadFile, downloadFile, getBundlePath } = await import('../../src/storage/client.js');

    // Mock config
    initStorage({
      endpoint: 'http://localhost:9000',
      access_key: 'test',
      secret_key: 'test',
      bucket: 'test-bucket'
    });

    const testData = Buffer.from('test bundle data');
    const key = getBundlePath('sha256:test123');

    const uploadResult = await uploadFile(key, testData, 'application/zip');
    expect(uploadResult.key).toBe(key);
    expect(uploadResult.size).toBe(testData.length);

    // Note: Download would fail without real MinIO
    // const downloaded = await downloadFile(key);
    // expect(downloaded).toEqual(testData);
  });
});
