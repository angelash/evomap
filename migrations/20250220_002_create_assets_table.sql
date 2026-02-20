-- 创建 assets 表
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(255) UNIQUE NOT NULL,
  hash VARCHAR(255) NOT NULL,
  hash_algorithm VARCHAR(50) DEFAULT 'sha256',
  name VARCHAR(500) NOT NULL,
  description TEXT,
  author_node_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'candidate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  promoted_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assets_hash ON assets(hash);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_author ON assets(author_node_id);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);

-- 授予权限
GRANT ALL PRIVILEGES ON assets TO evomap;
GRANT ALL PRIVILEGES ON assets_id_seq TO evomap;

COMMENT ON TABLE assets IS '资产表：存储所有经验资产（候选和已推广）';
COMMENT ON COLUMN assets.status IS '状态：candidate（候选）| promoted（已推广）| rejected（已拒绝）';
