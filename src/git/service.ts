/**
 * Git Repository Management
 * 用于处理资产的版本化存储和追踪
 */

export interface GitCommitInfo {
  hash: string;
  author: string;
  timestamp: Date;
  message: string;
}

export interface GitService {
  /**
   * 克隆或拉取最新的仓库
   */
  sync(): Promise<void>;

  /**
   * 提交更改
   */
  commit(files: string[], message: string): Promise<GitCommitInfo>;

  /**
   * 推送到远程仓库
   */
  push(): Promise<void>;

  /**
   * 获取文件历史
   */
  getHistory(filePath: string): Promise<GitCommitInfo[]>;
}
