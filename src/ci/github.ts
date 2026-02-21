import { CIAdapter, CITaskInput, CITaskOutput } from './adapter.js';
import axios from 'axios';

/**
 * GitHub Actions Adapter
 * Uses GitHub Repository Dispatch or Workflow Dispatch
 */
export class GitHubAdapter implements CIAdapter {
  private apiUrl: string;
  private token: string;
  private owner: string;
  private repo: string;
  private workflowId: string;

  constructor(config: {
    owner: string;
    repo: string;
    token: string;
    workflowId: string; // e.g., 'evomap-validation.yml'
  }) {
    this.apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
    this.token = config.token;
    this.owner = config.owner;
    this.repo = config.repo;
    this.workflowId = config.workflowId;
  }

  async triggerTask(input: CITaskInput): Promise<string> {
    // We use workflow_dispatch to trigger a specific workflow
    await axios.post(
      `${this.apiUrl}/actions/workflows/${this.workflowId}/dispatches`,
      {
        ref: input.repo_ref || 'main',
        inputs: {
          gate_id: input.gate_id,
          patch_key: input.patch_key,
          validation_plan: JSON.stringify(input.validation_plan)
        }
      },
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    // GitHub dispatch doesn't return the run ID immediately.
    // In a real implementation, we'd need to poll the runs list to find the most recent one 
    // matching our criteria, or use a unique request ID.
    // For simplicity, we'll return a placeholder and use more complex logic in checkStatus
    return `pending_${Date.now()}`;
  }

  async checkStatus(externalId: string): Promise<CITaskOutput> {
    // In a full implementation, this would list runs and find the one matching the dispatch
    // Or we use the run ID if we captured it.
    const response = await axios.get(
      `${this.apiUrl}/actions/runs?per_page=1`,
      {
        headers: {
          'Authorization': `token ${this.token}`
        }
      }
    );

    const run = response.data.workflow_runs[0];
    if (!run) return { status: 'running' };

    const statusMap: Record<string, CITaskOutput['status']> = {
      'queued': 'running',
      'in_progress': 'running',
      'completed': run.conclusion === 'success' ? 'pass' : 'fail',
      'failure': 'fail',
      'cancelled': 'error'
    };

    return {
      status: statusMap[run.status] || 'running',
      log_url: run.html_url
    };
  }

  async cancelTask(externalId: string): Promise<void> {
    // implementation for cancellation
  }
}
