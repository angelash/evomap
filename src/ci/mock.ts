import { CIAdapter, CITaskInput, CITaskOutput } from './adapter.js';

export class MockCIAdapter implements CIAdapter {
  private tasks = new Map<string, CITaskOutput>();

  async triggerTask(input: CITaskInput): Promise<string> {
    const externalId = `mock_ci_${Date.now()}`;
    console.log(`[MockCI] Triggered task externalId=${externalId} for gate=${input.gate_id}`);
    
    this.tasks.set(externalId, { status: 'running' });

    // 模拟 2 秒后完成
    setTimeout(() => {
      this.tasks.set(externalId, {
        status: 'pass',
        report_key: `reports/${input.gate_id}/validation_report.json`,
        log_url: `http://ci.internal/logs/${externalId}`
      });
    }, 2000);

    return externalId;
  }

  async checkStatus(externalId: string): Promise<CITaskOutput> {
    return this.tasks.get(externalId) || { status: 'error', error_message: 'Task not found' };
  }

  async cancelTask(externalId: string): Promise<void> {
    this.tasks.set(externalId, { status: 'error', error_message: 'Cancelled' });
  }
}
