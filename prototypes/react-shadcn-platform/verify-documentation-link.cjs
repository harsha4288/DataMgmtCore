/**
 * Verification script for Task 5.8.4 documentation linking
 */

const EntityManager = require('./src/lib/database/entity-manager.cjs');

function verifyDocumentationLink() {
  const entityManager = new EntityManager('./src/lib/database/database.db');
  
  try {
    console.log('🔍 Verifying Task 5.8.4 Documentation Link...\n');
    
    // Get the task with updated metadata
    const task = entityManager.getEntity('TASK-1482');
    if (!task) {
      console.error('❌ Task 5.8.4 not found');
      return;
    }
    
    console.log(`📋 Task: ${task.title}`);
    console.log(`📊 Status: ${task.status} (${task.progress}% complete)`);
    console.log(`🏷️ Priority: ${task.priority}`);
    
    // Check documentation metadata
    if (task.metadata && task.metadata.documentation) {
      const doc = task.metadata.documentation;
      console.log('\n📄 Linked Documentation:');
      console.log(`   Title: ${doc.doc_title}`);
      console.log(`   Type: ${doc.doc_type}`);
      console.log(`   File: ${doc.doc_file}`);
      console.log(`   Version: ${doc.version}`);
      console.log(`   Record ID: ${doc.technical_docs_id}`);
      console.log(`   Sections: ${doc.sections_count}`);
      console.log(`   API Methods: ${doc.api_methods_documented}`);
      console.log(`   Database Tables: ${doc.database_tables_documented}`);
      console.log(`   Testing Scenarios: ${doc.testing_scenarios_count}`);
      console.log(`   Integration Examples: ${doc.integration_examples_count}`);
      console.log(`   Linked At: ${doc.linked_at}`);
    } else {
      console.log('\n❌ No documentation metadata found');
    }
    
    // Check implementation details
    if (task.metadata && task.metadata.implementation_details) {
      const impl = task.metadata.implementation_details;
      console.log('\n🔧 Implementation Details:');
      console.log(`   Status: ${impl.status}`);
      console.log(`   Components Created: ${impl.components_created.length}`);
      impl.components_created.forEach(comp => console.log(`     • ${comp}`));
      console.log(`   Features Implemented: ${impl.features_implemented.length}`);
      impl.features_implemented.forEach(feat => console.log(`     • ${feat}`));
      console.log(`   Files Modified: ${impl.files_modified.length}`);
      impl.files_modified.forEach(file => console.log(`     • ${file}`));
    }
    
    // Query project_documents table
    console.log('\n📚 Project Documents Table:');
    const docs = entityManager.db.prepare(`
      SELECT id, title, document_type, version, created_at 
      FROM project_documents 
      WHERE task_id = ? AND is_active = 1
    `).all('TASK-1482');
    
    if (docs.length > 0) {
      docs.forEach(doc => {
        console.log(`   • ID: ${doc.id} | ${doc.title} | ${doc.document_type} v${doc.version}`);
        console.log(`     Created: ${doc.created_at}`);
      });
    } else {
      console.log('   No documents found in database');
    }
    
    // Check file existence
    const fs = require('fs');
    const docPath = './entity-interconnection-architecture-docs.json';
    console.log(`\n📁 Documentation File Check:`);
    if (fs.existsSync(docPath)) {
      const stats = fs.statSync(docPath);
      console.log(`   ✅ File exists: ${docPath}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Modified: ${stats.mtime}`);
    } else {
      console.log(`   ❌ File not found: ${docPath}`);
    }
    
    console.log('\n✅ Documentation verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying documentation:', error);
  } finally {
    entityManager.close();
  }
}

verifyDocumentationLink();