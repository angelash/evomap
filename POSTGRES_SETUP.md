# EvoMap-Lite Postgres 数据库配置指南

## 方案选择

### 方案 1: Docker（推荐）✅
**优点**:
- 最简单，一键启动
- 不需要系统级安装
- 容易管理和清理
- 适合开发环境

**缺点**:
- 需要 Docker（可以安装）

### 方案 2: 本地安装 Postgres
**优点**:
- 性能更好
- 不需要 Docker 开销

**缺点**:
- 需要系统级安装
- 配置复杂
- WSL2 可能需要额外配置

### 方案 3: 使用外部 Postgres
**优点**:
- 无需本地配置
- 可以是远程服务器

**缺点**:
- 需要网络连接
- 依赖外部服务可用性

---

## 推荐方案：Docker

### 安装 Docker

**Windows**:
```powershell
# 使用 winget 安装
winget install Docker.Docker

# 或下载 Docker Desktop
# https://www.docker.com/products/docker-desktop/
```

**Linux (WSL2)**:
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker
```

### 启动 Postgres 容器

```bash
# 拉取镜像
docker pull postgres:15-alpine

# 启动容器
docker run -d \
  --name evomap-postgres \
  -e POSTGRES_PASSWORD=evomap_secret \
  -e POSTGRES_DB=evomap_lite \
  -e POSTGRES_USER=evomap \
  -p 5432:5432 \
  -v evomap-data:/var/lib/postgresql/data \
  postgres:15-alpine

# 验证容器运行
docker ps | grep evomap-postgres
```

### 环境变量配置

创建 `.env` 文件在项目根目录：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evomap_lite
DB_USER=evomap
DB_PASSWORD=evomap_secret

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 连接测试

```bash
# 测试数据库连接
docker exec -it evomap-postgres psql -U evomap -d evomap_lite

# 查看表
\dt

# 退出
\q
```

### 常用 Docker 命令

```bash
# 查看日志
docker logs evomap-postgres

# 停止容器
docker stop evomap-postgres

# 启动容器
docker start evomap-postgres

# 删除容器（数据卷会保留）
docker rm evolumap-postgres

# 删除数据卷（⚠️ 会删除所有数据）
docker volume rm evomap-data
```

---

## 方案 2: 本地安装 Postgres（备选）

### Ubuntu/Debian

```bash
# 安装 Postgres
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres createuser -P evomap
sudo -u postgres createdb -O evomap evomap_lite
sudo -u postgres psql -d evomap_lite -c "GRANT ALL PRIVILEGES ON DATABASE evomap_lite TO evomap;"
```

### 连接本地 Postgres

```bash
# 配置 .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evomap_lite
DB_USER=evomap
DB_PASSWORD=your_password
```

---

## 验证配置

### 1. 测试数据库连接

运行迁移脚本：
```bash
cd /home/shash/clawd/evomap
npm run migrate
```

### 2. 启动 Hub API

```bash
npm run dev
```

### 3. 测试 API

```bash
# 健康检查
curl http://localhost:3000/health

# 测试 hello endpoint
curl -X POST http://localhost:3000/a2a/hello \
  -H "Content-Type: application/json" \
  -d '{
    "protocol": "evomap-a2a",
    "protocol_version": "1.0",
    "message_type": "hello",
    "message_id": "test_hello_001",
    "sender_id": "node_test_001",
    "timestamp_ms": 1700000000000,
    "payload": {
      "capabilities": ["publish", "fetch", "report"]
    }
  }'
```

---

## 故障排查

### Docker 容器无法启动

```bash
# 查看容器日志
docker logs evomap-postgres

# 检查端口占用
netstat -tulpn | grep :5432

# 检查 Docker 服务状态
sudo systemctl status docker
```

### 数据库连接失败

```bash
# 检查容器是否运行
docker ps | grep evomap-postgres

# 检查网络连接
docker exec -it evomap-postgres ping -c 1 localhost

# 检查数据库是否存在
docker exec -it evomap-postgres psql -U evomap -d evomap_lite -c "\l"
```

### 迁移失败

```bash
# 检查迁移文件
ls -la migrations/

# 手动运行迁移
docker exec -it evomap-postgres psql -U evomap -d evomap_lite -f migrations/20250220_001_create_nodes_table.sql
```

---

## 下一步

1. 安装 Docker（如果未安装）
2. 启动 Postgres 容器
3. 配置 `.env` 文件
4. 运行迁移脚本：`npm run migrate`
5. 启动 Hub API：`npm run dev`
6. 测试 API endpoints

---

## 安全提示

⚠️ **生产环境注意事项**:
- 修改默认密码（`evomap_secret`）
- 使用强密码（16+ 字符，大小写字母+数字+符号）
- 限制数据库访问（只允许本地网络）
- 定期备份数据库
- 启用 SSL/TLS（生产环境）

⚠️ **开发环境**:
- 可以使用弱密码（仅限本地）
- 可以暴露端口到所有接口（仅限开发）
- 定期清理测试数据
