/**
 * CI Adapter Interface
 * 抽象 CI 任务触发与结果获取
 */

export interface CITaskInput {
  gate_id: string;
  repo_ref: string;      // Git commit / SVN revision
  patch_key: string;     // 对象存储中的 patch 路径
  validation_plan: any;  // 验证计划
}

export interface CITaskOutput {
  status: 'pass' | 'fail' | 'running' | 'error';
  report_key?: string;   // 对象存储中的报告路径
  log_url?: string;      // CI 日志链接
  error_message?: string;
}

export interface CIAdapter {
  /**
   * 触发一个新的 CI 任务
   */
  triggerTask(input: CITaskInput): Promise<string>; // 返回 CI 系统中的 job/pipeline ID

  /**
   * 检查任务状态
   */
  checkStatus(externalId: string): Promise<CITaskOutput>;

  /**
   * 取消任务
   */
  cancelTask(externalId: string): Promise<void>;
}
