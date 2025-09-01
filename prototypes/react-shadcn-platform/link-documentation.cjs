/**
 * Script to link technical documentation to Task 5.8.4
 */

const EntityManager = require('./src/lib/database/entity-manager.cjs');
const Database = require('better-sqlite3');
const path = require('path');
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
    
    // Check if project_documents table exists
    const tableExists = entityManager.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='project_documents'
    `).get();
    
    if (!tableExists) {
      console.log('📋 Creating project_documents table...');
      entityManager.db.exec(`
        CREATE TABLE project_documents (
          id TEXT PRIMARY KEY,
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
    
    // Ensure DOC board exists
    const docBoard = entityManager.db.prepare('SELECT * FROM boards WHERE prefix = ?').get('DOC');
    if (!docBoard) {
      console.log('📋 Creating DOC board...');
      entityManager.db.prepare(`
        INSERT INTO boards (prefix, name, description, default_entity_type, current_counter, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('DOC', 'Documentation', 'Documentation and technical guides', 'document', 0, 1);
      console.log('✅ Created DOC board');
    }
    
    // Generate document ID
    const docId = await entityManager.generateEntityId('DOC', 'document');
    
    // Insert documentation record
    const insertDoc = entityManager.db.prepare(`
      INSERT INTO project_documents (
        id, task_id, title, document_type, file_path, content, metadata, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertDoc.run(
      docId,
      'TASK-1482',
      docData.title,
      docData.type,
      docPath,
      docContent,
      JSON.stringify({
        categories: docData.categories,
        lastUpdated: docData.lastUpdated,
        implementation_status: docData.overview.implementation_status,
        test_coverage: docData.overview.test_coverage
      }),
      docData.version
    );
    
    if (result.changes > 0) {
      console.log(`✅ Created documentation record: ${docId}`);
      
      // Create relationship between task and documentation
      const relationshipId = await entityManager.createRelationship(
        'TASK-1482',
        docId,
        'documents',
        {
          strength: 1.0,
          impactScore: 0.9,
          notes: 'Comprehensive technical documentation for Entity Interconnection Architecture implementation',
          createdBy: 'DocumentationLinkingSystem',
          context: {
            documentType: 'technical_documentation',
            completeness: 'comprehensive',
            sections: ['architecture', 'api_reference', 'database_schema', 'testing_guide', 'development_guide']
          }
        }
      );
      
      console.log(`✅ Created documentation relationship: ${relationshipId}`);
      
      // Update task metadata to include documentation reference
      const currentTask = entityManager.getEntity('TASK-1482');
      const updatedMetadata = {
        ...currentTask.metadata,
        documentation: {
          technical_docs: docId,
          doc_file: docPath,
          doc_type: 'comprehensive_technical',
          sections_count: Object.keys(docData).length,
          api_methods_documented: Object.keys(docData.api_reference?.entityManager_methods || {}).length,
          last_updated: docData.lastUpdated
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
      console.log(`🔗 Document ID: ${docId}`);
      console.log(`📍 File Path: ${docPath}`);
      console.log(`📊 Sections: ${Object.keys(docData).length}`);
      console.log(`🔧 API Methods: ${Object.keys(docData.api_reference?.entityManager_methods || {}).length}`);
      
      // Show relationships
      const relationships = entityManager.getEntityRelationships('TASK-1482');
      const docRelationships = relationships.filter(r => r.relationship_type === 'documents');
      console.log(`\n📚 Task now has ${docRelationships.length} documentation relationship(s)`);
      
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