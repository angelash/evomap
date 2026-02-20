/**
 * Gate Pipeline Scheduler - 异步任务调度器
 */

import { executeGatePipeline, getRunningGatesCount } from './pipeline.js';
import { createGate } from './pipeline.js';
import type { GateConfig, GateContext } from './types.js';

export interface QueueItem {
  gate_id: string;
  context: GateContext;
  priority: number;
  queued_at: Date;
}

export interface SchedulerConfig {
  max_concurrent_gates: number;
  poll_interval_ms: number;
  retry_max_attempts: number;
  retry_delay_ms: number;
}

// 任务队列
const queue: QueueItem[] = [];

// 调度器配置
let config: SchedulerConfig = {
  max_concurrent_gates: 5,
  poll_interval_ms: 1000,
  retry_max_attempts: 3,
  retry_delay_ms: 5000,
};

// 调度器状态
let isRunning = false;
let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * 启动调度器
 */
export function startScheduler(configOverride?: Partial<SchedulerConfig>): void {
  if (isRunning) {
    console.warn('[Scheduler] Already running');
    return;
  }

  config = { ...config, ...configOverride };
  isRunning = true;

  console.log(`[Scheduler] Started with max_concurrent_gates=${config.max_concurrent_gates}`);

  // 启动轮询
  schedulerTimer = setInterval(() => {
    processQueue();
  }, config.poll_interval_ms);

  // 立即处理一次
  processQueue();
}

/**
 * 停止调度器
 */
export function stopScheduler(): void {
  if (!isRunning) {
    return;
  }

  isRunning = false;

  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  console.log('[Scheduler] Stopped');
}

/**
 * 添加任务到队列
 */
export async function enqueueGate(
  bundleHash: string,
  senderId: string,
  bundleBytesBase64: string,
  bundleFormat: 'zip' | 'tar.gz',
  project?: string,
  namespace?: string,
  submitMode?: string,
  priority: number = 0
): Promise<string> {
  // 创建 gate 记录
  const gateId = await createGate(
    bundleHash,
    senderId,
    bundleBytesBase64,
    bundleFormat,
    project,
    namespace,
    submitMode
  );

  // 构建上下文
  const context: GateContext = {
    gate_id: gateId,
    bundle_hash: bundleHash,
    sender_id: senderId,
    bundle_bytes_base64: bundleBytesBase64,
    bundle_format: bundleFormat,
    project,
    namespace,
    submit_mode: submitMode,
  };

  // 添加到队列
  queue.push({
    gate_id: gateId,
    context,
    priority,
    queued_at: new Date(),
  });

  // 按优先级排序（高优先级在前）
  queue.sort((a, b) => b.priority - a.priority);

  console.log(`[Scheduler] Enqueued gate=${gateId}, queue_size=${queue.length}`);

  return gateId;
}

/**
 * 处理队列
 */
async function processQueue(): Promise<void> {
  if (!isRunning) {
    return;
  }

  const runningCount = getRunningGatesCount();

  // 检查是否还有容量
  if (runningCount >= config.max_concurrent_gates) {
    return;
  }

  // 检查队列是否为空
  if (queue.length === 0) {
    return;
  }

  // 取出下一个任务
  const item = queue.shift();
  if (!item) {
    return;
  }

  console.log(
    `[Scheduler] Processing gate=${item.gate_id}, ` +
    `running=${runningCount}/${config.max_concurrent_gates}, ` +
    `queue_size=${queue.length}`
  );

  // 执行 gate pipeline
  try {
    await executeGatePipeline(item.gate_id, item.context);
    console.log(`[Scheduler] Completed gate=${item.gate_id}`);
  } catch (error) {
    console.error(`[Scheduler] Failed gate=${item.gate_id}:`, error);
  }

  // 继续处理队列
  if (queue.length > 0) {
    setTimeout(() => processQueue(), 100);
  }
}

/**
 * 获取队列状态
 */
export function getQueueStatus(): {
  queue_size: number;
  running_count: number;
  max_concurrent: number;
} {
  return {
    queue_size: queue.length,
    running_count: getRunningGatesCount(),
    max_concurrent: config.max_concurrent_gates,
  };
}

/**
 * 清空队列（用于测试）
 */
export function clearQueue(): void {
  queue.length = 0;
}
