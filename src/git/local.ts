import { GitService, GitCommitInfo } from './service.js';
import { execa } from 'execa';
import path from 'path';
import fs from 'fs/promises';

export class LocalGitService implements GitService {
  private repoPath: string;
  private remoteUrl?: string;

  constructor(repoPath: string, remoteUrl?: string) {
    this.repoPath = repoPath;
    this.remoteUrl = remoteUrl;
  }

  async sync(): Promise<void> {
    const gitDir = path.join(this.repoPath, '.git');
    try {
      await fs.access(gitDir);
      // Repository exists, pull latest
      await execa('git', ['-C', this.repoPath, 'pull', 'origin', 'main']);
    } catch {
      // Repository doesn't exist, clone it
      if (!this.remoteUrl) {
        throw new Error('Remote URL is required for cloning');
      }
      await execa('git', ['clone', this.remoteUrl, this.repoPath]);
    }
  }

  async commit(files: string[], message: string): Promise<GitCommitInfo> {
    // Stage files
    for (const file of files) {
      await execa('git', ['-C', this.repoPath, 'add', file]);
    }

    // Commit
    await execa('git', ['-C', this.repoPath, 'commit', '-m', message]);

    // Get commit info
    const { stdout } = await execa('git', ['-C', this.repoPath, 'log', '-1', '--format=%H|%an|%at|%s']);
    const [hash, author, timestamp, msg] = stdout.split('|');

    return {
      hash,
      author,
      timestamp: new Date(parseInt(timestamp) * 1000),
      message: msg
    };
  }

  async push(): Promise<void> {
    await execa('git', ['-C', this.repoPath, 'push', 'origin', 'main']);
  }

  async getHistory(filePath: string): Promise<GitCommitInfo[]> {
    const { stdout } = await execa('git', ['-C', this.repoPath, 'log', '--format=%H|%an|%at|%s', '--', filePath]);
    
    return stdout.split('\n').filter(line => line.trim()).map(line => {
      const [hash, author, timestamp, msg] = line.split('|');
      return {
        hash,
        author,
        timestamp: new Date(parseInt(timestamp) * 1000),
        message: msg
      };
    });
  }
}
