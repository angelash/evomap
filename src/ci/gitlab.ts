import { CIAdapter, CITaskInput, CITaskOutput } from './adapter.js';
import axios from 'axios';

/**
 * GitLab CI Adapter
 * Uses GitLab Pipelines API to trigger validation jobs
 */
export class GitLabAdapter implements CIAdapter {
  private apiUrl: string;
  private privateToken: string;
  private projectId: string;
  private triggerToken?: string;

  constructor(config: {
    baseUrl: string;
    projectId: string;
    privateToken: string;
    triggerToken?: string;
  }) {
    this.apiUrl = `${config.baseUrl.replace(/\/$/, '')}/api/v4`;
    this.projectId = config.projectId;
    this.privateToken = config.privateToken;
    this.triggerToken = config.triggerToken;
  }

  async triggerTask(input: CITaskInput): Promise<string> {
    // GitLab allows triggering pipelines via API
    // We pass EvoMap context as environment variables
    const response = await axios.post(
      `${this.apiUrl}/projects/${this.projectId}/pipeline`,
      {
        ref: input.repo_ref || 'main',
        variables: [
          { key: 'EVOMAP_GATE_ID', value: input.gate_id },
          { key: 'EVOMAP_PATCH_KEY', value: input.patch_key },
          { key: 'EVOMAP_VALIDATION_PLAN', value: JSON.stringify(input.validation_plan) }
        ]
      },
      {
        headers: {
          'PRIVATE-TOKEN': this.privateToken
        }
      }
    );

    return response.data.id.toString();
  }

  async checkStatus(externalId: string): Promise<CITaskOutput> {
    const response = await axios.get(
      `${this.apiUrl}/projects/${this.projectId}/pipelines/${externalId}`,
      {
        headers: {
          'PRIVATE-TOKEN': this.privateToken
        }
      }
    );

    const { status } = response.data;

    // Map GitLab status to EvoMap status
    const statusMap: Record<string, CITaskOutput['status']> = {
      'pending': 'running',
      'running': 'running',
      'success': 'pass',
      'failed': 'fail',
      'canceled': 'error',
      'skipped': 'error',
      'manual': 'running'
    };

    return {
      status: statusMap[status] || 'error',
      log_url: response.data.web_url,
    };
  }

  async cancelTask(externalId: string): Promise<void> {
    await axios.post(
      `${this.apiUrl}/projects/${this.projectId}/pipelines/${externalId}/cancel`,
      {},
      {
        headers: {
          'PRIVATE-TOKEN': this.privateToken
        }
      }
    );
  }
}
