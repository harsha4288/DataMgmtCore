/**
 * Clean up duplicate and invalid records in project_documents table
 */

const Database = require('better-sqlite3');

function cleanupDocumentsTable() {
  const db = new Database('./src/lib/database/database.db');
  
  try {
    console.log('🧹 Cleaning up project_documents table...');
    
    // Remove records with null ids
    const deleteNullIds = db.prepare('DELETE FROM project_documents WHERE id IS NULL');
    const nullDeleted = deleteNullIds.run();
    console.log(`✅ Removed ${nullDeleted.changes} records with null IDs`);
    
    // Remove duplicate records, keeping only the latest one
    const deleteDuplicates = db.prepare(`
      DELETE FROM project_documents 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT MAX(id) as id
          FROM project_documents 
          WHERE task_id = 'TASK-1482'
          GROUP BY task_id, title, document_type
        )
      ) AND task_id = 'TASK-1482'
    `);
    const dupDeleted = deleteDuplicates.run();
    console.log(`✅ Removed ${dupDeleted.changes} duplicate records`);
    
    // Show remaining records
    console.log('\n📄 Remaining Records for TASK-1482:');
    const remainingRecords = db.prepare('SELECT id, title, document_type, version, created_at FROM project_documents WHERE task_id = ?').all('TASK-1482');
    console.log(`Total remaining: ${remainingRecords.length}`);
    
    remainingRecords.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  ID: ${record.id}`);
      console.log(`  Title: ${record.title}`);
      console.log(`  Type: ${record.document_type}`);
      console.log(`  Version: ${record.version}`);
      console.log(`  Created: ${record.created_at}`);
    });
    
    console.log('\n✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning up table:', error);
  } finally {
    db.close();
  }
}

cleanupDocumentsTable();