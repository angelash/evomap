#!/usr/bin/env node

/**
 * EvoMap-Lite 数据库迁移脚本
 * 运行所有未执行的迁移脚本
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从环境变量读取数据库配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'evomap_lite',
  user: process.env.DB_USER || 'evomap',
  password: process.env.DB_PASSWORD || 'evomap_dev_secret',
};

const pool = new Pool(config);

async function runMigrations() {
  try {
    console.log('🔧 连接数据库...');
    await pool.connect();
    console.log('✅ 数据库连接成功');

    // 确保 schema_migrations 表存在
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 获取已执行的迁移
    const { rows: appliedMigrations } = await pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const appliedVersions = new Set(appliedMigrations.map((row) => row.version));

    // 读取所有迁移文件
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`\n📋 找到 ${migrationFiles.length} 个迁移文件`);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');

      if (appliedVersions.has(version)) {
        console.log(`⏭️  跳过已执行的迁移: ${file}`);
        skippedCount++;
        continue;
      }

      console.log(`\n🚀 执行迁移: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // 执行迁移
      await pool.query(sql);

      // 记录迁移
      await pool.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version]
      );

      console.log(`✅ 迁移完成: ${file}`);
      appliedCount++;
    }

    console.log(`\n📊 迁移统计:`);
    console.log(`   - 已执行: ${appliedCount}`);
    console.log(`   - 已跳过: ${skippedCount}`);
    console.log(`   - 总计: ${migrationFiles.length}`);

    if (appliedCount > 0) {
      console.log('\n🎉 数据库迁移完成！');
    } else {
      console.log('\n✨ 数据库已是最新状态');
    }

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
