/**
 * Object Storage Client - MinIO/S3 兼容
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface StorageConfig {
  endpoint: string;
  access_key: string;
  secret_key: string;
  bucket: string;
  region?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

let client: S3Client | null = null;
let config: StorageConfig | null = null;

/**
 * 初始化存储客户端
 */
export function initStorage(storageConfig: StorageConfig): void {
  config = storageConfig;

  client = new S3Client({
    endpoint: storageConfig.endpoint,
    region: storageConfig.region || 'us-east-1',
    credentials: {
      accessKeyId: storageConfig.access_key,
      secretAccessKey: storageConfig.secret_key
    },
    forcePathStyle: true // MinIO 需要
  });

  console.log(`[Storage] Initialized: ${storageConfig.endpoint}/${storageConfig.bucket}`);
}

/**
 * 上传文件
 */
export async function uploadFile(
  key: string,
  data: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<UploadResult> {
  if (!client || !config) {
    throw new Error('Storage client not initialized');
  }

  const command = new PutObjectCommand({
    Bucket: config!.bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
  });

  await client.send(command);

  return {
    key,
    url: `${config!.endpoint}/${config!.bucket}/${key}`,
    size: data.length
  };
}

/**
 * 下载文件
 */
export async function downloadFile(key: string): Promise<Buffer> {
  if (!client || !config) {
    throw new Error('Storage client not initialized');
  }

  const command = new GetObjectCommand({
    Bucket: config!.bucket,
    Key: key,
  });

  const response = await client.send(command);
  return response.Body as Buffer;
}

/**
 * 删除文件
 */
export async function deleteFile(key: string): Promise<void> {
  if (!client || !config) {
    throw new Error('Storage client not initialized');
  }

  const command = new DeleteObjectCommand({
    Bucket: config!.bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * 生成 bundle 存储路径
 */
export function getBundlePath(bundleHash: string): string {
  return `bundles/${bundleHash}.zip`;
}

/**
 * 生成 patch 存储路径
 */
export function getPatchPath(capsuleId: string): string {
  return `patches/${capsuleId}.diff`;
}

/**
 * 生成 validation report 存储路径
 */
export function getReportPath(gateId: string): string {
  return `reports/${gateId}/validation_report.json`;
}

/**
 * 测试连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    // 尝试列出 bucket（需要权限）
    const { ListObjectsCommand } = await import('@aws-sdkver/client-s3');
    const command = new ListObjectsCommand({
      Bucket: config!.bucket,
      MaxKeys: 1
    });
    await client!.send(command);
    return true;
  } catch (error) {
    console.error('[Storage] Connection test failed:', error);
    return false;
  }
}
