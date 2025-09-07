#!/usr/bin/env node
/**
 * Remove remaining level column from entities table
 */

const Database = require('better-sqlite3');
const path = require('path');

class LevelColumnRemover {
  constructor() {
    this.dbPath = path.resolve(__dirname, '../src/lib/database/database.db');
    this.db = new Database(this.dbPath);
    this.db.pragma('foreign_keys = OFF');
  }

  removeLevel() {
    console.log('🔧 Removing level column from entities table...');
    
    const transaction = this.db.transaction(() => {
      // Step 1: Create new table without level column
      this.db.exec(`
        CREATE TABLE entities_new (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          board_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium',
          sort_order INTEGER DEFAULT 0,
          metadata TEXT DEFAULT '{}',
          progress INTEGER NOT NULL DEFAULT 0,
          estimated_hours REAL,
          actual_hours REAL,
          assignee TEXT,
          labels TEXT DEFAULT '[]',
          dependencies TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          attributes TEXT DEFAULT '{}',
          start_date DATE,
          due_date DATE,
          completion_date DATE,
          created_by TEXT DEFAULT 'system',
          updated_by TEXT DEFAULT 'system',
          
          CHECK (entity_type IN ('project', 'phase', 'task', 'subtask', 'issue', 'epic', 'specification', 'quality_report', 'review', 'approval')),
          CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled', 'ready_for_review', 'in_review', 'approved')),
          CHECK (priority IN ('low', 'medium', 'high', 'critical')),
          CHECK (progress >= 0 AND progress <= 100)
        )
      `);
      
      // Step 2: Copy data (excluding level column)
      this.db.exec(`
        INSERT INTO entities_new (
          id, entity_type, board_id, title, description, status, priority,
          sort_order, metadata, progress, estimated_hours, actual_hours,
          assignee, labels, dependencies, created_at, updated_at,
          attributes, start_date, due_date, completion_date,
          created_by, updated_by
        )
        SELECT 
          id, entity_type, board_id, title, description, status, priority,
          sort_order, metadata, progress, estimated_hours, actual_hours,
          assignee, labels, dependencies, created_at, updated_at,
          attributes, start_date, due_date, completion_date,
          created_by, updated_by
        FROM entities
      `);
      
      // Step 3: Drop old table and rename new one
      this.db.exec(`DROP TABLE entities`);
      this.db.exec(`ALTER TABLE entities_new RENAME TO entities`);
    });
    
    transaction();
    console.log('✅ Level column removed successfully');
  }

  verify() {
    const columns = this.db.prepare('PRAGMA table_info(entities)').all().map(c => c.name);
    console.log('Final columns:', columns.join(', '));
    
    if (columns.includes('level')) {
      throw new Error('Level column still exists!');
    }
    
    console.log('✅ Verification passed - level column removed');
  }

  run() {
    try {
      this.removeLevel();
      this.verify();
      console.log('🎉 Level column removal completed successfully!');
    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      this.db.pragma('foreign_keys = ON');
      this.db.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const remover = new LevelColumnRemover();
  remover.run();
}

module.exports = LevelColumnRemover;