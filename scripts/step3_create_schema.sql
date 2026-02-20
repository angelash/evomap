-- 步骤 3: 连接到 evomap_lite 并创建 schema_migrations 表

-- 创建 schema_migrations 表（用于跟踪迁移）
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO evomap;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO evomap;

\echo '✅ 数据库初始化完成！'
