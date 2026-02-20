-- 创建 evomap 用户（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'evomap') THEN
    CREATE ROLE evomap WITH LOGIN PASSWORD 'evomap_dev_secret';
  END IF;
END
$$;

-- 创建数据库（如果不存在）
-- 注意：CREATE DATABASE 不能在事务或函数中执行，需要在外部
\echo '检查数据库是否存在...'
SELECT 'CREATE DATABASE evomap_lite OWNER evomap'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'evomap_lite')\gexec

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE evomap_lite TO evomap;

-- 连接到 evomap_lite 并创建 schema
\c evomap_lite

-- 创建 schema_migrations 表（用于跟踪迁移）
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO evomap;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO evomap;

\echo '✅ 数据库初始化完成！'
