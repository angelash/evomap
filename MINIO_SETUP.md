#对象存储配置指南

## 方案选择

### 方案 1: MinIO（推荐）✅
**优点**:
- S3 兼容 API
- 完全自托管，无外部依赖
- 适合企业内网环境

**缺点**:
- 需要自己部署和维护

### 方案 2: AWS S3
**优点**:
- 托管服务，运维简单
- 高可用、高可靠性

**缺点**:
- 需要外网访问
- 数据存储在外部

---

## 推荐方案：MinIO（Docker）

### 安装 MinIO

**Linux/WSL2**:
```bash
# 使用 Docker 运行
docker run -d \
  --name evomap-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=evomap" \
  -e "MINIO_ROOT_PASSWORD=evomap_secret" \
  -v minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

**Windows**:
```powershell
docker run -d `
  --name evomap-minio `
  -p 9000:9000 `
  -p 9001:9001 `
  -e "MINIO_ROOT_USER=evomap" `
  -e "MINIO_ROOT_PASSWORD=evomap_secret" `
  -v minio-data:/data `
  minio/minio server /data --console-address ":9001"
```

### 环境变量配置

创建 `.env` 文件在项目根目录：

```bash
# 对象存储配置
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=evomap
S3_SECRET_KEY=evomap_secret
S3_BUCKET=evomap-bundles
S3_REGION=us-east-1
```

### 连接测试

```bash
# 测试 MinIO 连接
curl http://localhost:9000/minio/health/live

# 访问 MinIO Console
# http://localhost:9001
# 用户名: evomap
# 密码: evomap_secret
```

### 创建 Bucket

访问 MinIO Console (http://localhost:9001):
1. 登录（evomap / evomap_secret）
2. 点击 "Buckets" → "Create Bucket"
3. 输入 bucket 名称：`evomap-bundles`
4. 选择版本控制：Disabled（可选）
5. 点击 "Create Bucket"

---

## 方案 2: AWS S3（备选）

### 环境变量配置

```bash
# 对象存储配置
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=YOUR_ACCESS_KEY
S3_SECRET_KEY=YOUR_SECRET_KEY
S3_BUCKET=evomap-bundles
S3_REGION=us-east-1
```

### 创建 Bucket

使用 AWS CLI:
```bash
aws s3 mb s3://evomap-bundles --region us-east-1
```

或使用 AWS Console:
1. 登录 AWS Console
2. 导航到 S3 服务
3. 点击 "Create bucket"
4. 输入 bucket 名称：`evomap-bundles`
5. 选择区域：`us-east-1`
6. 点击 "Create bucket"

---

## 存储路径规范

EvoMap-Lite 使用以下路径规范：

- **Bundles**: `bundles/{bundle_hash}.zip`
- **Patches**: `patches/{capsule_id}.diff`
- **Reports**: `reports/{gate_id}/validation_report.json`

示例：
```
evomap-bundles/
  bundles/
    sha256:abc123...zip
    sha256:def456...zip
  patches/
    sha256:ghi789...diff
    sha256:jkl012...diff
  reports/
    gate_123456_abc/
      validation_report.json
    gate_789012_def/
      validation_report.json
```

---

## 安全提示

⚠️ **生产环境注意事项**:
- 修改默认密码（`evomap_secret`）
- 使用强密码（16+ 字符，大小写字母+数字+符号）
- 启用 HTTPS（生产环境）
- 配置访问策略（只允许 Hub API 访问）
- 定期备份 Bucket 数据

⚠️ **开发环境**:
- 可以使用弱密码（仅限本地）
- 可以暴露端口到所有接口（仅限开发）
- 定期清理测试数据

---

## 故障排查

### MinIO 容器无法启动

```bash
# 查看容器日志
docker logs evomap-minio

# 检查端口占用
netstat -tulpn | grep :9000

# 检查 Docker 服务状态
sudo systemctl status docker
```

### 连接失败

```bash
# 检查 MinIO 是否运行
curl http://localhost:9000/minio/health/live

# 检查网络连接
ping -c 3 localhost

# 检查防火墙
sudo ufw status
```

### Bucket 访问错误

```bash
# 检查 Bucket 是否存在
aws s3 ls s3://evomap-bundles --endpoint-url http://localhost:9000

# 检查访问权限
aws s3api get-bucket-acl \
  --bucket evomap-bundles \
  --endpoint-url http://localhost:9000
```

---

## 下一步

1. 安装 MinIO（如果未安装）
2. 启动 MinIO 容器
3. 创建 `evomap-bundles` bucket
4. 配置 `.env` 文件
5. 运行数据库迁移：`npm run migrate`
6. 启动 Hub API：`npm run dev`
7. 测试对象存储上传下载
