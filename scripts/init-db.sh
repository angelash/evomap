#!/bin/bash

# EvoMap-Lite 数据库初始化脚本
# 需要使用 sudo 运行

set -e

echo "🔧 初始化 EvoMap-Lite 数据库..."

# 创建用户和数据库
echo "📝 创建用户 evomap..."
sudo -u postgres createuser -P evomap <<EOF
evomap_devomap_secret
evomap_dev_secret
EOF

echo "📝 创建数据库 evomap_lite..."
sudo -u postgres createdb -O evomap evomap_lite

echo "📝 授予权限..."
sudo -u postgres psql -d evomap_lite -c "GRANT ALL PRIVILEGES ON DATABASE evomap_lite TO evomap;"

echo "✅ 数据库初始化完成！"
echo ""
echo "下一步："
echo "  cd /home/shash/clawd/evomap"
echo "  npm run migrate"
