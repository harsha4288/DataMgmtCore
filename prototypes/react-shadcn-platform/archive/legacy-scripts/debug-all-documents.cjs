/**
 * Debug all document tables to understand what's being shown
 */

const Database = require('better-sqlite3');

function debugAllDocuments() {
  const db = new Database('./src/lib/database/database.db');
  
  try {
    console.log('🔍 Debugging ALL document sources for TASK-1482...\n');
    
    // Check documents table (old structure)
    console.log('1️⃣ Documents from "documents" table (old Phase 2.1 structure):');
    console.log('=========================================================');
    const documentsTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='documents'
    `).get();
    
    if (documentsTableExists) {
      const oldDocs = db.prepare('SELECT id, entity_id, title, type, status, author, updated_at FROM documents WHERE entity_id = ?').all('TASK-1482');
      console.log(`Found ${oldDocs.length} documents in "documents" table:`);
      oldDocs.forEach((doc, index) => {
        console.log(`\nDocument ${index + 1}:`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Title: ${doc.title}`);
        console.log(`  Type: ${doc.type}`);
        console.log(`  Status: ${doc.status}`);
        console.log(`  Author: ${doc.author}`);
        console.log(`  Updated: ${doc.updated_at}`);
      });
    } else {
      console.log('❌ "documents" table does not exist');
    }
    
    // Check project_documents table (new structure)
    console.log('\n2️⃣ Documents from "project_documents" table (new Task 5.8.4 structure):');
    console.log('==========================================================================');
    const projectDocsTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='project_documents'
    `).get();
    
    if (projectDocsTableExists) {
      const newDocs = db.prepare('SELECT id, task_id, title, document_type, version, created_at FROM project_documents WHERE task_id = ?').all('TASK-1482');
      console.log(`Found ${newDocs.length} documents in "project_documents" table:`);
      newDocs.forEach((doc, index) => {
        console.log(`\nDocument ${index + 1}:`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Title: ${doc.title}`);
        console.log(`  Type: ${doc.document_type}`);
        console.log(`  Version: ${doc.version}`);
        console.log(`  Created: ${doc.created_at}`);
      });
    } else {
      console.log('❌ "project_documents" table does not exist');
    }
    
    // Check what getDocumentsByEntity would return
    console.log('\n3️⃣ What getDocumentsByEntity query returns:');
    console.log('=============================================');
    
    // This mimics the GraphQL resolver logic
    if (documentsTableExists) {
      // Strategy 1: Direct entity ID match
      const directRows = db.prepare('SELECT * FROM documents WHERE entity_id = ? ORDER BY updated_at DESC').all('TASK-1482');
      console.log(`Direct match: ${directRows.length} documents`);
      
      // Strategy 2: Search in content for entity reference
      const contentRows = db.prepare(`SELECT * FROM documents WHERE content LIKE ? ORDER BY updated_at DESC`).all(`%${TASK-1482}%`);
      console.log(`Content match: ${contentRows.length} documents`);
      
      // Strategy 3: Search in title
      const titleRows = db.prepare(`SELECT * FROM documents WHERE title LIKE ? ORDER BY updated_at DESC`).all(`%5.8.4%`);
      console.log(`Title match: ${titleRows.length} documents`);
    }
    
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log('The UI is showing documents from BOTH tables:');
    console.log('• DocumentContentViewer queries the "documents" table (Phase 2.1 implementation)');
    console.log('• Task.documents field queries the "project_documents" table (Task 5.8.4 implementation)');
    console.log('\nThis is why you see two documents - they are from different sources!');
    
  } catch (error) {
    console.error('❌ Error debugging documents:', error);
  } finally {
    db.close();
  }
}

debugAllDocuments();