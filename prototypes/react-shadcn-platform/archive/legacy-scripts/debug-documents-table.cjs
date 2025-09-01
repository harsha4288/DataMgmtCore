/**
 * Debug project_documents table structure and data
 */

const Database = require('better-sqlite3');

function debugDocumentsTable() {
  const db = new Database('./src/lib/database/database.db');
  
  try {
    console.log('🔍 Debugging project_documents table...');
    
    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='project_documents'
    `).get();
    
    if (!tableExists) {
      console.log('❌ project_documents table does not exist');
      return;
    }
    
    console.log('✅ project_documents table exists');
    
    // Get table schema
    console.log('\n📋 Table Schema:');
    const schema = db.prepare('PRAGMA table_info(project_documents)').all();
    schema.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.pk ? '(PRIMARY KEY)' : ''} ${col.notnull ? 'NOT NULL' : ''}`);
    });
    
    // Get all records
    console.log('\n📄 All Records:');
    const allRecords = db.prepare('SELECT * FROM project_documents').all();
    console.log(`Total records: ${allRecords.length}`);
    
    allRecords.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      Object.keys(record).forEach(key => {
        console.log(`  ${key}: ${record[key]}`);
      });
    });
    
    // Check records for TASK-1482 specifically
    console.log('\n🎯 Records for TASK-1482:');
    const taskRecords = db.prepare('SELECT * FROM project_documents WHERE task_id = ?').all('TASK-1482');
    console.log(`Records for TASK-1482: ${taskRecords.length}`);
    
    taskRecords.forEach((record, index) => {
      console.log(`\nTASK-1482 Record ${index + 1}:`);
      Object.keys(record).forEach(key => {
        console.log(`  ${key}: ${record[key]}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error debugging table:', error);
  } finally {
    db.close();
  }
}

debugDocumentsTable();