#!/usr/bin/env node

/**
 * Migration script to complete the consolidation from documents to project_documents table
 * This migration was started but never completed properly
 * 
 * Issues being fixed:
 * 1. 68 documents remain in old 'documents' table
 * 2. Only 1 document in 'project_documents' table
 * 3. Entity ID mismatch between tables (TASK-1300 vs TASK-1463)
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ID mapping from old format (TASK-XX00) to new format (TASK-14XX)
const ENTITY_ID_MAPPING = {
  // Phase 0 tasks
  'TASK-100': 'TASK-1459',   // Task 0.1: Documentation Structure
  'TASK-200': 'TASK-1460',   // Task 0.2: Guidelines & Standards
  
  // Phase 1 tasks
  'TASK-1100': 'TASK-1461',  // Task 1.1: Project Initialization
  'TASK-1200': 'TASK-1462',  // Task 1.2: Theme System Implementation
  'TASK-1300': 'TASK-1463',  // Task 1.3: Core shadcn/ui Components Setup
  'TASK-1400': 'TASK-1464',  // Task 1.4: Entity System Integration
  'TASK-1500': 'TASK-1465',  // Task 1.5: Table Customization
  
  // Phase 2 tasks
  'TASK-2100': 'TASK-1466',  // Task 2.1: Dashboard Layout
  'TASK-2900': 'TASK-1467',  // Task 2.9: UI Validation & Polish
  
  // Phase 5 tasks
  'TASK-5100': 'TASK-1468',  // Task 5.1
  'TASK-5200': 'TASK-1469',  // Task 5.2
  'TASK-5300': 'TASK-1470',  // Task 5.3
  'TASK-5400': 'TASK-1471',  // Task 5.4
  'TASK-5430': 'TASK-1472',  // Task 5.4.3
  'TASK-5500': 'TASK-1473',  // Task 5.5
  'TASK-5600': 'TASK-1474',  // Task 5.6
  'TASK-5700': 'TASK-1475',  // Task 5.7
  'TASK-5800': 'TASK-1476',  // Task 5.8
  'TASK-5810': 'TASK-1477',  // Task 5.8.1
  'TASK-5820': 'TASK-1478',  // Task 5.8.2
  'TASK-5830': 'TASK-1479',  // Task 5.8.3
  'TASK-5831': 'TASK-1480',  // Task 5.8.3.1
  'TASK-5832': 'TASK-1481',  // Task 5.8.3.2
  'TASK-5840': 'TASK-1482',  // Task 5.8.4
  'TASK-5850': 'TASK-1483',  // Task 5.8.5
  'TASK-5860': 'TASK-1484',  // Task 5.8.6
  'TASK-5870': 'TASK-1485',  // Task 5.8.7
  
  // Phase 6 tasks
  'TASK-6100': 'TASK-1486',  // Task 6.1
  'TASK-6200': 'TASK-1487',  // Task 6.2
  'TASK-6300': 'TASK-1488',  // Task 6.3
  'TASK-6400': 'TASK-1489',  // Task 6.4
  'TASK-6500': 'TASK-1490',  // Task 6.5
  'TASK-6600': 'TASK-1491',  // Task 6.6
  'TASK-6700': 'TASK-1492',  // Task 6.7
  'TASK-6800': 'TASK-1493',  // Task 6.8
  'TASK-6900': 'TASK-1494',  // Task 6.9
  'TASK-7000': 'TASK-1495',  // Task 7.0
};

// Map document type from old to new format
function mapDocumentType(oldType) {
  const typeMapping = {
    'technical': 'technical_documentation',
    'requirements': 'requirements_documentation',
    'implementation': 'implementation_guide',
    'all': 'general_documentation'
  };
  return typeMapping[oldType] || 'technical_documentation';
}

// Generate unique document ID
function generateDocId() {
  return `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
}

async function migrateDocuments() {
  const dbPath = path.join(__dirname, '../src/lib/database/database.db');
  console.log('📂 Opening database:', dbPath);
  
  const db = new Database(dbPath);
  
  try {
    // Start transaction for safety
    db.exec('BEGIN TRANSACTION');
    
    // 1. Check current state
    console.log('\n📊 Current State:');
    const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const projDocCount = db.prepare('SELECT COUNT(*) as count FROM project_documents').get();
    console.log(`  - Documents table: ${docCount.count} records`);
    console.log(`  - Project_documents table: ${projDocCount.count} records`);
    
    // 2. Get all documents from old table
    console.log('\n📥 Reading documents from old table...');
    const documents = db.prepare('SELECT * FROM documents ORDER BY entity_id').all();
    console.log(`  Found ${documents.length} documents to migrate`);
    
    // 3. Prepare insert statement for project_documents
    const insertStmt = db.prepare(`
      INSERT INTO project_documents (
        id, task_id, title, document_type, file_path, 
        content, metadata, version, is_active, created_at, updated_at
      ) VALUES (
        @id, @task_id, @title, @document_type, @file_path,
        @content, @metadata, @version, @is_active, @created_at, @updated_at
      )
    `);
    
    // 4. Migrate each document
    let migrated = 0;
    let skipped = 0;
    const errors = [];
    
    for (const doc of documents) {
      try {
        // Determine the new task_id
        let newTaskId = doc.entity_id;
        
        // Only map if it's a TASK entity
        if (doc.entity_id && doc.entity_id.startsWith('TASK-')) {
          if (ENTITY_ID_MAPPING[doc.entity_id]) {
            newTaskId = ENTITY_ID_MAPPING[doc.entity_id];
            console.log(`  Mapping: ${doc.entity_id} → ${newTaskId}`);
          } else {
            console.log(`  ⚠️ No mapping for ${doc.entity_id}, keeping as-is`);
          }
        }
        
        // Check if document already exists in project_documents
        const existing = db.prepare('SELECT id FROM project_documents WHERE task_id = ? AND title = ?')
          .get(newTaskId, doc.title);
        
        if (existing) {
          console.log(`  ⏭️ Skipping duplicate: ${doc.title} for ${newTaskId}`);
          skipped++;
          continue;
        }
        
        // Create metadata JSON
        const metadata = JSON.stringify({
          status: doc.status,
          author: doc.author || 'Development Team',
          entity_type: doc.entity_type,
          original_entity_id: doc.entity_id,
          version: doc.version || 1,
          migrated_from: 'documents_table',
          migration_date: new Date().toISOString()
        });
        
        // Insert into project_documents
        insertStmt.run({
          id: generateDocId(),
          task_id: newTaskId,
          title: doc.title,
          document_type: mapDocumentType(doc.type),
          file_path: null, // No file path for DB-stored documents
          content: doc.content,
          metadata: metadata,
          version: String(doc.version || 1),
          is_active: 1,
          created_at: doc.created_at || new Date().toISOString(),
          updated_at: doc.updated_at || new Date().toISOString()
        });
        
        migrated++;
        
      } catch (error) {
        console.error(`  ❌ Error migrating document ${doc.id}:`, error.message);
        errors.push({ doc: doc.id, error: error.message });
      }
    }
    
    // 5. Commit transaction
    db.exec('COMMIT');
    
    // 6. Verify migration
    console.log('\n✅ Migration Complete:');
    const newProjDocCount = db.prepare('SELECT COUNT(*) as count FROM project_documents').get();
    console.log(`  - Migrated: ${migrated} documents`);
    console.log(`  - Skipped: ${skipped} duplicates`);
    console.log(`  - Errors: ${errors.length}`);
    console.log(`  - Total in project_documents: ${newProjDocCount.count}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      errors.forEach(e => console.log(`  - ${e.doc}: ${e.error}`));
    }
    
    // 7. Test query
    console.log('\n🔍 Testing document retrieval for TASK-1463:');
    const testDocs = db.prepare(`
      SELECT id, task_id, title, document_type 
      FROM project_documents 
      WHERE task_id = 'TASK-1463' AND is_active = 1
    `).all();
    
    if (testDocs.length > 0) {
      console.log(`  ✅ Found ${testDocs.length} documents for TASK-1463:`);
      testDocs.forEach(d => console.log(`    - ${d.title} (${d.document_type})`));
    } else {
      console.log('  ⚠️ No documents found for TASK-1463');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('  1. Test the dashboard to verify documents are showing');
    console.log('  2. Once verified, run: node scripts/drop-old-documents-table.cjs');
    console.log('  3. The old documents table will be backed up before deletion');
    
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migration
if (require.main === module) {
  console.log('🚀 Starting Document Migration\n');
  console.log('This will migrate all documents from the old documents table');
  console.log('to the new project_documents table with proper ID mapping.\n');
  
  migrateDocuments()
    .then(() => {
      console.log('\n✨ Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDocuments, ENTITY_ID_MAPPING };