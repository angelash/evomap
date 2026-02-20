-- 步骤 2: 创建数据库 evomap_lite（如果不存在）
-- 注意：CREATE DATABASE 不能在事务或函数中执行

SELECT 'CREATE DATABASE evomap_lite OWNER evomap'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'evomap_lite')\gexec
