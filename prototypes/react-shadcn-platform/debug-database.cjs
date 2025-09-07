#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

async function debugDatabase() {
  const dbPath = path.join(__dirname, 'src/lib/database/database.db');
  console.log('🔍 Database path:', dbPath);
  
  try {
    const db = new Database(dbPath);
    console.log('✅ Database connected successfully');
    
    // Check if entities table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('\n📋 Available tables:');
    tables.forEach(table => console.log(`  - ${table.name}`));
    
    // Check entities table structure
    try {
      const columns = db.prepare("PRAGMA table_info(entities)").all();
      console.log('\n🏗️  Entities table structure:');
      columns.forEach(col => console.log(`  - ${col.name}: ${col.type}`));
      
      // Check for specific columns
      const hasParentId = columns.find(col => col.name === 'parent_id');
      const hasHierarchyPath = columns.find(col => col.name === 'hierarchy_path');
      console.log(`\n🔍 Key column check:`);
      console.log(`  - parent_id: ${hasParentId ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - hierarchy_path: ${hasHierarchyPath ? '✅ EXISTS' : '❌ MISSING'}`);
      
    } catch (err) {
      console.log('❌ Entities table does not exist');
    }
    
    // Count rows by entity_type
    try {
      const counts = db.prepare("SELECT entity_type, COUNT(*) as count FROM entities GROUP BY entity_type").all();
      console.log('\n📊 Entity counts by type:');
      counts.forEach(row => console.log(`  - ${row.entity_type}: ${row.count}`));
      
      // Show phase examples
      const phases = db.prepare("SELECT id, title, entity_type, status FROM entities WHERE entity_type = 'phase' LIMIT 5").all();
      console.log('\n🎯 Sample phases:');
      phases.forEach(phase => console.log(`  - ${phase.id}: ${phase.title} (${phase.status})`));
      
      // Show task examples and try to understand relationships
      const tasks = db.prepare("SELECT id, title, entity_type, board_id FROM entities WHERE entity_type = 'task' LIMIT 5").all();
      console.log('\n📋 Sample tasks:');
      tasks.forEach(task => console.log(`  - ${task.id}: ${task.title} (board_id: ${task.board_id})`));
      
      // Check if tasks reference phases via board_id
      const phaseTask = db.prepare(`
        SELECT t.id as task_id, t.title as task_title, p.id as phase_id, p.title as phase_title 
        FROM entities t 
        LEFT JOIN entities p ON t.board_id = p.id 
        WHERE t.entity_type = 'task' AND p.entity_type = 'phase'
        LIMIT 3
      `).all();
      console.log('\n🔗 Task-Phase relationships via board_id:');
      phaseTask.forEach(rel => console.log(`  - Task "${rel.task_title}" → Phase "${rel.phase_title}"`));
      
    } catch (err) {
      console.log('❌ Error querying entities:', err.message);
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

debugDatabase();