/**
 * Script to link technical documentation to Task 5.8.4 (Simple Approach)
 */

const EntityManager = require('./src/lib/database/entity-manager.cjs');
const fs = require('fs');

async function linkDocumentation() {
  const entityManager = new EntityManager('./src/lib/database/database.db');
  
  try {
    console.log('📎 Linking technical documentation to Task 5.8.4...');
    
    // Read the documentation content
    const docPath = './entity-interconnection-architecture-docs.json';
    const docContent = fs.readFileSync(docPath, 'utf8');
    const docData = JSON.parse(docContent);
    
    // Check if Task 5.8.4 exists
    const task = entityManager.getEntity('TASK-1482');
    if (!task) {
      console.error('❌ Task 5.8.4 (TASK-1482) not found');
      return;
    }
    
    console.log(`✅ Found task: ${task.id} - ${task.title}`);
    
    // Check if project_documents table exists, create if not
    const tableExists = entityManager.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='project_documents'
    `).get();
    
    if (!tableExists) {
      console.log('📋 Creating project_documents table...');
      entityManager.db.exec(`
        CREATE TABLE project_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id TEXT NOT NULL,
          title TEXT NOT NULL,
          document_type TEXT NOT NULL,
          file_path TEXT,
          content TEXT,
          metadata TEXT,
          version TEXT DEFAULT '1.0.0',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES entities(id)
        )
      `);
      console.log('✅ Created project_documents table');
    }
    
    // Insert documentation record
    const insertDoc = entityManager.db.prepare(`
      INSERT INTO project_documents (
        task_id, title, document_type, file_path, content, metadata, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const docRecord = insertDoc.run(
      'TASK-1482',
      docData.title,
      docData.type,
      docPath,
      docContent,
      JSON.stringify({
        categories: docData.categories,
        lastUpdated: docData.lastUpdated,
        implementation_status: docData.overview.implementation_status,
        test_coverage: docData.overview.test_coverage,
        sections: Object.keys(docData).length,
        api_methods_documented: Object.keys(docData.api_reference?.entityManager_methods || {}).length
      }),
      docData.version
    );
    
    if (docRecord.changes > 0) {
      console.log(`✅ Created documentation record with ID: ${docRecord.lastInsertRowid}`);
      
      // Update task metadata to include documentation reference
      const currentTask = entityManager.getEntity('TASK-1482');
      const updatedMetadata = {
        ...currentTask.metadata,
        documentation: {
          technical_docs_id: docRecord.lastInsertRowid,
          doc_file: docPath,
          doc_type: 'comprehensive_technical',
          doc_title: docData.title,
          sections_count: Object.keys(docData).length,
          api_methods_documented: Object.keys(docData.api_reference?.entityManager_methods || {}).length,
          database_tables_documented: Object.keys(docData.database_schema || {}).length,
          testing_scenarios_count: Object.keys(docData.testing_guide?.manual_testing_scenarios || {}).length,
          integration_examples_count: Object.keys(docData.integration_examples || {}).length,
          last_updated: docData.lastUpdated,
          version: docData.version,
          linked_at: new Date().toISOString()
        },
        implementation_details: {
          status: 'completed',
          components_created: [
            'EntityManager class',
            'Database schema enhancement',
            'GraphQL API integration',
            'Comprehensive test suite'
          ],
          features_implemented: [
            'JIRA-style ID generation',
            'Hierarchical entity management', 
            'Entity relationships',
            'Progress calculation',
            'Advanced search',
            'Board statistics'
          ],
          files_modified: [
            'src/lib/database/entity-manager.cjs',
            'src/lib/database/schema.sql',
            'scripts/graphql-server.cjs',
            'test-entity-system.cjs'
          ]
        }
      };
      
      entityManager.db.prepare(`
        UPDATE entities 
        SET metadata = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(JSON.stringify(updatedMetadata), 'TASK-1482');
      
      console.log('✅ Updated task metadata with documentation reference');
      
      // Display final status
      console.log('\n🎉 Documentation Successfully Linked!');
      console.log(`📋 Task: ${task.title}`);
      console.log(`📄 Document: ${docData.title}`);
      console.log(`🆔 Document Record ID: ${docRecord.lastInsertRowid}`);
      console.log(`📍 File Path: ${docPath}`);
      console.log(`📊 Documentation Sections: ${Object.keys(docData).length}`);
      console.log(`🔧 API Methods Documented: ${Object.keys(docData.api_reference?.entityManager_methods || {}).length}`);
      console.log(`🗄️ Database Tables Documented: ${Object.keys(docData.database_schema || {}).length}`);
      console.log(`🧪 Testing Scenarios: ${Object.keys(docData.testing_guide?.manual_testing_scenarios || {}).length}`);
      console.log(`🔗 Integration Examples: ${Object.keys(docData.integration_examples || {}).length}`);
      console.log(`📅 Version: ${docData.version}`);
      
      // Verify the link by querying
      const linkedDocs = entityManager.db.prepare(`
        SELECT * FROM project_documents WHERE task_id = ? AND is_active = 1
      `).all('TASK-1482');
      
      console.log(`\n📚 Task 5.8.4 now has ${linkedDocs.length} linked document(s)`);
      linkedDocs.forEach(doc => {
        console.log(`   • ${doc.title} (${doc.document_type}, v${doc.version})`);
      });
      
      console.log('\n✅ Documentation linking completed successfully!');
      
    } else {
      console.error('❌ Failed to create documentation record');
    }
    
  } catch (error) {
    console.error('❌ Error linking documentation:', error);
  } finally {
    entityManager.close();
  }
}

linkDocumentation();