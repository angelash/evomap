-- 步骤 1: 创建 evomap 用户（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'evomap') THEN
    CREATE ROLE evomap WITH LOGIN PASSWORD 'evomap_dev_secret';
    RAISE NOTICE '用户 evomap 已创建';
  ELSE
    RAISE NOTICE '用户 evomap 已存在';
  END IF;
END
$$;
