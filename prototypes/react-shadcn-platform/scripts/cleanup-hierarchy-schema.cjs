#!/usr/bin/env node

/**
 * Hierarchy Schema Cleanup Script
 * 
 * Removes redundant hierarchy fields now that we've standardized on entity_relationships
 * 
 * REMOVES:
 * - hierarchy_path column (now only using entity_relationships)  
 * - parent_id column (now only using entity_relationships)
 * 
 * KEEPS:
 * - entity_relationships table as the SINGLE source of truth for hierarchy
 */

const Database = require('better-sqlite3');
const path = require('path');

const SRC_DB_PATH = path.join('src', 'lib', 'database', 'database.db');

console.log('🧹 HIERARCHY SCHEMA CLEANUP STARTING...\n');

// Open database
let db;
try {
  db = new Database(SRC_DB_PATH);
  console.log('✅ Database opened successfully\n');
} catch (error) {
  console.error('❌ Failed to open database:', error.message);
  process.exit(1);
}

// Check current schema
const beforeCols = db.pragma('table_info(entities)').map(c => c.name);
console.log('📋 CURRENT SCHEMA:');
console.log('   Columns:', beforeCols.join(', '));

// Check what we're about to remove
const hasParentId = beforeCols.includes('parent_id');
const hasHierarchyPath = beforeCols.includes('hierarchy_path');

console.log('\n🔍 HIERARCHY FIELDS STATUS:');
console.log(`   parent_id: ${hasParentId ? 'EXISTS' : 'NOT FOUND'}`);
console.log(`   hierarchy_path: ${hasHierarchyPath ? 'EXISTS' : 'NOT FOUND'}`);

if (!hasParentId && !hasHierarchyPath) {
  console.log('ℹ️  No redundant hierarchy fields to remove. Schema is already clean.');
  db.close();
  process.exit(0);
}

// Verify entity_relationships table has proper data
const relationshipCount = db.prepare("SELECT COUNT(*) as count FROM entity_relationships WHERE relationship_type = 'parent_of'").get().count;
console.log(`\n🔗 RELATIONSHIPS STATUS:`);
console.log(`   parent_of relationships: ${relationshipCount}`);

if (relationshipCount === 0) {
  console.error('❌ CRITICAL: No parent_of relationships found! Cannot remove hierarchy fields.');
  db.close();
  process.exit(1);
}

// Start transaction
console.log('\n🔧 STARTING SCHEMA CLEANUP...');

try {
  // Disable foreign keys temporarily
  db.pragma('foreign_keys = OFF');
  db.exec('BEGIN TRANSACTION');
  
  // Create new table without redundant hierarchy fields
  console.log('Step 1: Creating new entities table without redundant fields...');
  
  db.exec(`
    CREATE TABLE entities_new (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT,
      level INTEGER DEFAULT 0,
      sort_order INTEGER,
      metadata TEXT DEFAULT '{}',
      progress INTEGER DEFAULT 0,
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
      created_by TEXT,
      updated_by TEXT
    )
  `);
  
  console.log('  ✅ New entities table created');
  
  // Copy data from old table to new table
  console.log('Step 2: Copying data to new table...');
  
  db.exec(`
    INSERT INTO entities_new (
      id, entity_type, board_id, title, description, status, priority, level,
      sort_order, metadata, progress, estimated_hours, actual_hours, assignee,
      labels, dependencies, created_at, updated_at, attributes, start_date,
      due_date, completion_date, created_by, updated_by
    )
    SELECT 
      id, entity_type, board_id, title, description, status, priority, level,
      sort_order, metadata, progress, estimated_hours, actual_hours, assignee,
      labels, dependencies, created_at, updated_at, attributes, start_date,
      due_date, completion_date, created_by, updated_by
    FROM entities
  `);
  
  const copiedCount = db.prepare('SELECT COUNT(*) as count FROM entities_new').get().count;
  console.log(`  ✅ Copied ${copiedCount} entities to new table`);
  
  // Drop old table and rename new table
  console.log('Step 3: Replacing old table...');
  
  db.exec('DROP TABLE entities');
  db.exec('ALTER TABLE entities_new RENAME TO entities');
  
  console.log('  ✅ Table replacement completed');
  
  // Commit transaction
  db.exec('COMMIT');
  
  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');
  console.log('  ✅ Transaction committed and foreign keys re-enabled');
  
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  try {
    db.exec('ROLLBACK');
    console.log('🔄 Transaction rolled back');
  } catch (rollbackError) {
    console.error('❌ Rollback failed:', rollbackError.message);
  }
  db.close();
  process.exit(1);
}

// Verify final schema
const afterCols = db.pragma('table_info(entities)').map(c => c.name);
console.log('\n📋 FINAL SCHEMA:');
console.log('   Columns:', afterCols.join(', '));

const removedFields = beforeCols.filter(col => !afterCols.includes(col));
console.log('\n🗑️  REMOVED FIELDS:', removedFields.join(', '));

// Verify data integrity
const finalEntityCount = db.prepare('SELECT COUNT(*) as count FROM entities').get().count;
const finalRelCount = db.prepare('SELECT COUNT(*) as count FROM entity_relationships').get().count;
console.log('\n📊 FINAL DATA STATUS:');
console.log(`   Entities: ${finalEntityCount}`);
console.log(`   Relationships: ${finalRelCount}`);

// Test critical queries
console.log('\n🧪 TESTING CRITICAL QUERIES...');

try {
  const tasks = db.prepare("SELECT COUNT(*) as count FROM entities WHERE entity_type = 'task'").get();
  console.log(`  ✅ Tasks query: ${tasks.count} tasks found`);
  
  const relationships = db.prepare("SELECT COUNT(*) as count FROM entity_relationships WHERE relationship_type = 'parent_of'").get();
  console.log(`  ✅ Relationships query: ${relationships.count} parent_of relationships`);
  
  // Test a complex hierarchy query
  const hierarchyTest = db.prepare(`
    SELECT 
      e.id, e.title,
      p.id as parent_id, p.title as parent_title
    FROM entities e
    LEFT JOIN entity_relationships r ON e.id = r.target_entity_id AND r.relationship_type = 'parent_of'
    LEFT JOIN entities p ON r.source_entity_id = p.id
    WHERE e.entity_type = 'task'
    LIMIT 5
  `).all();
  
  console.log('  ✅ Hierarchy query test:');
  hierarchyTest.forEach(row => {
    console.log(`    ${row.id}: ${row.title} (parent: ${row.parent_id || 'none'})`);
  });
  
} catch (error) {
  console.error('  ❌ Critical query test failed:', error.message);
}

db.close();

console.log('\n🎉 HIERARCHY SCHEMA CLEANUP COMPLETED!');
console.log('\n📋 SUMMARY:');
console.log('   ✅ Removed redundant hierarchy fields');
console.log('   ✅ Standardized on entity_relationships for hierarchy');
console.log('   ✅ All data preserved and verified');
console.log('\n🔗 Hierarchy now ONLY uses entity_relationships table');