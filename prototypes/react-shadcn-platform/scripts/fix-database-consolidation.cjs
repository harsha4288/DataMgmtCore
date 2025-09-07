#!/usr/bin/env node

/**
 * Database Consolidation Fix Script
 * 
 * CRITICAL FIX: Resolves the chaos of having TWO conflicting databases
 * 
 * PROBLEMS BEING FIXED:
 * 1. Root DB (sgs_data_management.db) - 42 entities, missing critical columns
 * 2. Src DB (database.db) - 58 entities, has proper schema
 * 3. Triple hierarchy implementations causing conflicts
 * 4. project_documents has wrong column name (task_id vs entity_id)
 * 5. Code referencing different databases randomly
 * 
 * SOLUTION:
 * - Consolidate to SINGLE database: src/lib/database/database.db
 * - Migrate missing data from root DB to src DB 
 * - Fix schema inconsistencies
 * - Standardize on entity_relationships for hierarchy ONLY
 * - Remove redundant hierarchy fields
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const ROOT_DB_PATH = 'sgs_data_management.db';
const SRC_DB_PATH = path.join('src', 'lib', 'database', 'database.db');

console.log('🚨 DATABASE CONSOLIDATION FIX STARTING...\n');

// Verify backups exist
const backupPattern = /\.backup\.\d+\.BEFORE_CONSOLIDATION$/;
const rootBackups = fs.readdirSync('.').filter(f => f.includes('sgs_data_management.db') && backupPattern.test(f));
const srcBackups = fs.readdirSync('src/lib/database').filter(f => f.includes('database.db') && backupPattern.test(f));

if (rootBackups.length === 0 || srcBackups.length === 0) {
  console.error('❌ CRITICAL: Backups not found! Run backups first.');
  process.exit(1);
}

console.log('✅ Backups verified:');
console.log(`   Root: ${rootBackups[0]}`);  
console.log(`   Src: ${srcBackups[0]}\n`);

// Open databases
let rootDb, srcDb;
try {
  rootDb = new Database(ROOT_DB_PATH);
  srcDb = new Database(SRC_DB_PATH);
  console.log('✅ Both databases opened successfully\n');
} catch (error) {
  console.error('❌ Failed to open databases:', error.message);
  process.exit(1);
}

// Analyze current state
console.log('📊 ANALYZING CURRENT STATE...\n');

const rootEntityCount = rootDb.prepare('SELECT COUNT(*) as count FROM entities').get().count;
const rootRelCount = rootDb.prepare('SELECT COUNT(*) as count FROM entity_relationships').get().count;

const srcEntityCount = srcDb.prepare('SELECT COUNT(*) as count FROM entities').get().count;
const srcRelCount = srcDb.prepare('SELECT COUNT(*) as count FROM entity_relationships').get().count;

console.log(`Root DB: ${rootEntityCount} entities, ${rootRelCount} relationships`);
console.log(`Src DB:  ${srcEntityCount} entities, ${srcRelCount} relationships\n`);

// Check schema differences
const rootCols = rootDb.pragma('table_info(entities)').map(c => c.name);
const srcCols = srcDb.pragma('table_info(entities)').map(c => c.name);

const missingInRoot = srcCols.filter(c => !rootCols.includes(c));
const missingInSrc = rootCols.filter(c => !srcCols.includes(c));

console.log('🔍 SCHEMA ANALYSIS:');
console.log('   Columns missing in ROOT DB:', missingInRoot.join(', '));
console.log('   Columns missing in SRC DB:', missingInSrc.join(', '));

// Get entities that exist in root but not in src
const entitiesInRoot = rootDb.prepare('SELECT id FROM entities').all().map(r => r.id);
const entitiesInSrc = srcDb.prepare('SELECT id FROM entities').all().map(r => r.id);

const onlyInRoot = entitiesInRoot.filter(id => !entitiesInSrc.includes(id));
const onlyInSrc = entitiesInSrc.filter(id => !entitiesInRoot.includes(id));

console.log(`\n📋 DATA ANALYSIS:`);
console.log(`   Entities only in ROOT: ${onlyInRoot.length} (${onlyInRoot.slice(0,3).join(', ')}${onlyInRoot.length > 3 ? '...' : ''})`);
console.log(`   Entities only in SRC:  ${onlyInSrc.length} (${onlyInSrc.slice(0,3).join(', ')}${onlyInSrc.length > 3 ? '...' : ''})`);

console.log('\n🔧 STARTING CONSOLIDATION PROCESS...\n');

// Step 1: Fix project_documents column name in src DB
console.log('Step 1: Fix project_documents schema...');
try {
  // Check if we need to rename task_id to entity_id
  const docCols = srcDb.pragma('table_info(project_documents)').map(c => c.name);
  if (docCols.includes('task_id') && !docCols.includes('entity_id')) {
    console.log('  🔄 Renaming task_id to entity_id in project_documents...');
    srcDb.exec(`
      BEGIN TRANSACTION;
      ALTER TABLE project_documents RENAME COLUMN task_id TO entity_id;
      COMMIT;
    `);
    console.log('  ✅ project_documents.task_id renamed to entity_id');
  } else if (docCols.includes('entity_id')) {
    console.log('  ✅ project_documents already has entity_id column');
  } else {
    console.log('  ⚠️  project_documents table schema unexpected');
  }
} catch (error) {
  console.error('  ❌ Failed to fix project_documents schema:', error.message);
}

// Step 2: Migrate missing entities from root to src
console.log('\nStep 2: Migrate missing entities from root DB...');
let migratedCount = 0;

for (const entityId of onlyInRoot) {
  try {
    const entity = rootDb.prepare('SELECT * FROM entities WHERE id = ?').get(entityId);
    
    // Map root DB columns to src DB columns (add missing columns with defaults)
    const insertData = {
      id: entity.id,
      entity_type: entity.entity_type,
      parent_id: null, // Will be set from relationships
      board_id: entity.board_id,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      priority: entity.priority,
      level: 0, // Will be calculated from relationships
      hierarchy_path: entity.id, // Use entity ID as default hierarchy path (required by schema)
      sort_order: entity.sort_order,
      metadata: entity.metadata || '{}',
      progress: entity.progress || 0,
      estimated_hours: entity.estimated_hours,
      actual_hours: entity.actual_hours,
      assignee: entity.assignee,
      labels: entity.labels || '[]',
      dependencies: entity.dependencies || '[]',
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      attributes: entity.attributes || '{}',
      start_date: null,
      due_date: null,
      completion_date: entity.completion_date,
      created_by: entity.created_by,
      updated_by: entity.updated_by
    };

    srcDb.prepare(`
      INSERT INTO entities (
        id, entity_type, parent_id, board_id, title, description, status, priority, 
        level, hierarchy_path, sort_order, metadata, progress, estimated_hours, 
        actual_hours, assignee, labels, dependencies, created_at, updated_at, 
        attributes, start_date, due_date, completion_date, created_by, updated_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      insertData.id, insertData.entity_type, insertData.parent_id, insertData.board_id,
      insertData.title, insertData.description, insertData.status, insertData.priority,
      insertData.level, insertData.hierarchy_path, insertData.sort_order, insertData.metadata,
      insertData.progress, insertData.estimated_hours, insertData.actual_hours, insertData.assignee,
      insertData.labels, insertData.dependencies, insertData.created_at, insertData.updated_at,
      insertData.attributes, insertData.start_date, insertData.due_date, insertData.completion_date,
      insertData.created_by, insertData.updated_by
    );
    
    migratedCount++;
  } catch (error) {
    console.error(`  ❌ Failed to migrate entity ${entityId}:`, error.message);
  }
}

console.log(`  ✅ Migrated ${migratedCount} entities from root DB to src DB`);

// Step 3: Migrate missing relationships from root to src 
console.log('\nStep 3: Migrate relationships from root DB...');
const rootRelationships = rootDb.prepare('SELECT * FROM entity_relationships').all();
let relationshipsMigrated = 0;

for (const rel of rootRelationships) {
  try {
    // Check if relationship already exists
    const exists = srcDb.prepare(
      'SELECT id FROM entity_relationships WHERE source_entity_id = ? AND target_entity_id = ? AND relationship_type = ?'
    ).get(rel.source_entity_id, rel.target_entity_id, rel.relationship_type);
    
    if (!exists) {
      // Check if src DB has metadata column
      const relCols = srcDb.pragma('table_info(entity_relationships)').map(c => c.name);
      
      if (relCols.includes('metadata')) {
        srcDb.prepare(`
          INSERT INTO entity_relationships (id, source_entity_id, target_entity_id, relationship_type, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          rel.id, rel.source_entity_id, rel.target_entity_id, rel.relationship_type,
          rel.metadata || '{}', rel.created_at, rel.updated_at
        );
      } else {
        srcDb.prepare(`
          INSERT INTO entity_relationships (id, source_entity_id, target_entity_id, relationship_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          rel.id, rel.source_entity_id, rel.target_entity_id, rel.relationship_type,
          rel.created_at, rel.updated_at
        );
      }
      relationshipsMigrated++;
    }
  } catch (error) {
    console.error(`  ❌ Failed to migrate relationship ${rel.id}:`, error.message);
  }
}

console.log(`  ✅ Migrated ${relationshipsMigrated} relationships from root DB to src DB`);

// Step 4: Build parent_id from entity_relationships for hierarchy
console.log('\nStep 4: Rebuild parent_id from entity_relationships...');
const parentRelationships = srcDb.prepare(`
  SELECT source_entity_id as parent_id, target_entity_id as child_id 
  FROM entity_relationships 
  WHERE relationship_type = 'parent_of'
`).all();

let parentUpdates = 0;
for (const rel of parentRelationships) {
  try {
    srcDb.prepare('UPDATE entities SET parent_id = ? WHERE id = ?')
      .run(rel.parent_id, rel.child_id);
    parentUpdates++;
  } catch (error) {
    console.error(`  ❌ Failed to update parent for ${rel.child_id}:`, error.message);
  }
}

console.log(`  ✅ Updated parent_id for ${parentUpdates} entities`);

// Step 5: Clean up redundant hierarchy fields (we'll keep them for now until verification)
console.log('\nStep 5: Hierarchy cleanup marked for later verification...');
console.log('  ℹ️  Will remove hierarchy_path after testing (keeping for now)');

// Final verification
const finalEntityCount = srcDb.prepare('SELECT COUNT(*) as count FROM entities').get().count;
const finalRelCount = srcDb.prepare('SELECT COUNT(*) as count FROM entity_relationships').get().count;

console.log('\n📊 FINAL STATE:');
console.log(`   Consolidated DB: ${finalEntityCount} entities, ${finalRelCount} relationships`);

// Test critical queries
console.log('\n🧪 TESTING CRITICAL QUERIES...');

try {
  const tasks = srcDb.prepare("SELECT COUNT(*) as count FROM entities WHERE entity_type = 'task'").get();
  console.log(`  ✅ Tasks query: ${tasks.count} tasks found`);
  
  const withParents = srcDb.prepare('SELECT COUNT(*) as count FROM entities WHERE parent_id IS NOT NULL').get();
  console.log(`  ✅ Hierarchy query: ${withParents.count} entities with parents`);
  
  const relationships = srcDb.prepare("SELECT COUNT(*) as count FROM entity_relationships WHERE relationship_type = 'parent_of'").get();
  console.log(`  ✅ Relationships query: ${relationships.count} parent_of relationships`);
  
} catch (error) {
  console.error('  ❌ Critical query test failed:', error.message);
}

// Close databases
rootDb.close();
srcDb.close();

console.log('\n🎉 DATABASE CONSOLIDATION COMPLETED!');
console.log('\n📋 NEXT STEPS:');
console.log('   1. Test workflow dashboard');
console.log('   2. Verify entity relationships work');
console.log('   3. Remove root database file');
console.log('   4. Update code references');
console.log('   5. Remove redundant hierarchy fields');

console.log('\n⚠️  IMPORTANT: Test thoroughly before removing backups!');