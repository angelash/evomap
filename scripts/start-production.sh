#!/bin/bash
# EvoMap-Lite 生产环境启动脚本

set -e

# 加载环境变量
if [ -f ".env.production" ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
else
  echo "错误：.env.production 文件不存在"
  exit 1
fi

# 检查必需的环境变量
required_vars=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD" "PORT")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "错误：缺少必需的环境变量：$var"
    exit 1
  fi
done

echo "========================================"
echo "EvoMap-Lite 生产环境启动"
echo "========================================"
echo "数据库：${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "API 端口：${PORT}"
echo "环境：${NODE_ENV:-production}"
echo "========================================"

# 检查数据库连接
echo "检查数据库连接..."
if command -v psql &> /dev/null; then
  PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1" &> /dev/null
  if [ $? -eq 0 ]; then
    echo "✅ 数据库连接成功"
  else
    echo "❌ 数据库连接失败"
    exit 1
  fi
else
  echo "⚠️  psql 未安装，跳过数据库连接检查"
fi

# 运行数据库迁移
echo "运行数据库迁移..."
npm run migrate

if [ $? -ne 0 ]; then
  echo "❌ 数据库迁移失败"
  exit 1
fi

echo "✅ 数据库迁移完成"

# 启动服务
echo "启动 Hub API 服务..."
NODE_ENV=production npm start
