#!/usr/bin/env node

/**
 * Fix Entity-Document Mappings
 * 
 * This script fixes the entity ID mappings between documents and existing entities
 * by analyzing entity titles and matching them to document entity IDs.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../src/lib/database/database.db');

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '📄',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌'
  }[level] || '📄';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

class EntityMapper {
  constructor() {
    this.db = null;
    this.mappings = [];
  }
  
  async initialize() {
    try {
      this.db = new Database(DB_PATH);
      log('Database connection established');
      return true;
    } catch (error) {
      log(`Failed to connect to database: ${error.message}`, 'error');
      return false;
    }
  }
  
  async analyzeEntitiesAndDocuments() {
    log('Analyzing existing entities and documents...');
    
    // Get all entities
    const entities = this.db.prepare(`
      SELECT id, title, entity_type 
      FROM entities 
      ORDER BY id
    `).all();
    
    // Get all documents
    const documents = this.db.prepare(`
      SELECT id, entity_id, title, entity_type 
      FROM documents 
      ORDER BY entity_id
    `).all();
    
    log(`Found ${entities.length} entities and ${documents.length} documents`);
    
    return { entities, documents };
  }
  
  async createMappings(entities, documents) {
    log('Creating entity-document mappings...');
    
    const mappings = [];
    
    for (const doc of documents) {
      let matchedEntity = null;
      
      // Strategy 1: Direct task number matching
      // Document: TASK-100 (from task-0.1) -> Entity: TASK-1459 (Task 0.1)
      if (doc.entity_id.startsWith('TASK-')) {
        const taskNum = doc.entity_id.replace('TASK-', '');
        
        // Try to find entity by task number pattern in title
        matchedEntity = entities.find(e => {
          if (e.entity_type !== 'task') return false;
          
          // Look for task patterns like "Task 0.1", "Task 5.8.3", etc.
          const taskPattern = this.extractTaskPattern(e.title);
          const docPattern = this.taskNumberToPattern(taskNum);
          
          return taskPattern === docPattern;
        });
      }
      
      // Strategy 2: Phase matching
      // Document: PHASE-5 -> Entity with "Phase 5" in title
      else if (doc.entity_id.startsWith('PHASE-')) {
        const phaseNum = doc.entity_id.replace('PHASE-', '');
        
        matchedEntity = entities.find(e => {
          if (e.entity_type !== 'phase') return false;
          return e.title.toLowerCase().includes(`phase ${phaseNum}`);
        });
      }
      
      // Strategy 3: Title similarity matching for other documents
      else {
        // Find entities with similar titles
        matchedEntity = entities.find(e => {
          const docTitle = doc.title.toLowerCase();
          const entityTitle = e.title.toLowerCase();
          
          // Check if key words match
          const docWords = docTitle.split(' ').filter(w => w.length > 3);
          const entityWords = entityTitle.split(' ').filter(w => w.length > 3);
          
          const commonWords = docWords.filter(w => entityWords.includes(w));
          return commonWords.length >= 2; // At least 2 common significant words
        });
      }
      
      if (matchedEntity) {
        mappings.push({
          documentId: doc.id,
          documentEntityId: doc.entity_id,
          actualEntityId: matchedEntity.id,
          documentTitle: doc.title,
          entityTitle: matchedEntity.title,
          confidence: 'high'
        });
        
        log(`Mapped: ${doc.entity_id} -> ${matchedEntity.id} (${doc.title.substring(0, 40)})`);
      } else {
        log(`No match found for: ${doc.entity_id} (${doc.title.substring(0, 40)})`, 'warning');
      }
    }
    
    log(`Created ${mappings.length} mappings out of ${documents.length} documents`);
    return mappings;
  }
  
  extractTaskPattern(title) {
    // Extract pattern like "5.8.3" from "Task 5.8.3: Something"
    const match = title.match(/Task\s+(\d+(?:\.\d+)*)/i);
    return match ? match[1] : null;
  }
  
  taskNumberToPattern(taskNum) {
    // Convert TASK-5830 back to "5.8.3"
    if (taskNum.length === 4) {
      const major = taskNum.substring(0, 1);
      const minor = taskNum.substring(1, 2);
      const patch = taskNum.substring(2, 3);
      const build = taskNum.substring(3, 4);
      
      let pattern = major;
      if (minor !== '0') pattern += `.${minor}`;
      if (patch !== '0') pattern += `.${patch}`;
      if (build !== '0') pattern += `.${build}`;
      
      return pattern;
    }
    
    // For shorter numbers like 100 = 1.0.0
    if (taskNum.length === 3) {
      const major = taskNum.substring(0, 1);
      const minor = taskNum.substring(1, 2);
      const patch = taskNum.substring(2, 3);
      
      let pattern = major;
      if (minor !== '0') pattern += `.${minor}`;
      if (patch !== '0') pattern += `.${patch}`;
      
      return pattern;
    }
    
    return taskNum;
  }
  
  async applyMappings(mappings) {
    log(`Applying ${mappings.length} entity ID mappings...`);
    
    const updateDocument = this.db.prepare(`
      UPDATE documents 
      SET entity_id = ? 
      WHERE id = ?
    `);
    
    const insertMapping = this.db.prepare(`
      INSERT OR REPLACE INTO entity_id_mapping (old_id, new_id, entity_type, created_at)
      VALUES (?, ?, 'task', datetime('now'))
    `);
    
    const transaction = this.db.transaction(() => {
      let updated = 0;
      
      for (const mapping of mappings) {
        // Update document to point to correct entity
        const result = updateDocument.run(mapping.actualEntityId, mapping.documentId);
        if (result.changes > 0) {
          updated++;
        }
        
        // Create mapping for backward compatibility
        insertMapping.run(mapping.documentEntityId, mapping.actualEntityId);
      }
      
      return updated;
    });
    
    try {
      const updated = transaction();
      log(`Successfully updated ${updated} document mappings`, 'success');
      return true;
    } catch (error) {
      log(`Failed to apply mappings: ${error.message}`, 'error');
      return false;
    }
  }
  
  async validateResults() {
    log('Validating mapping results...');
    
    // Count documents with valid entity links
    const linkedDocs = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM documents d 
      INNER JOIN entities e ON d.entity_id = e.id
    `).get();
    
    // Count orphaned documents
    const orphanedDocs = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM documents d 
      LEFT JOIN entities e ON d.entity_id = e.id 
      WHERE e.id IS NULL
    `).get();
    
    // Count entities with documents
    const entitiesWithDocs = this.db.prepare(`
      SELECT COUNT(DISTINCT e.id) as count 
      FROM entities e 
      INNER JOIN documents d ON e.id = d.entity_id
    `).get();
    
    log(`Validation results:`);
    log(`- Documents with valid entity links: ${linkedDocs.count}`);
    log(`- Orphaned documents: ${orphanedDocs.count}`);
    log(`- Entities with documents: ${entitiesWithDocs.count}`);
    
    return {
      linkedDocuments: linkedDocs.count,
      orphanedDocuments: orphanedDocs.count,
      entitiesWithDocuments: entitiesWithDocs.count
    };
  }
  
  close() {
    if (this.db) {
      this.db.close();
      log('Database connection closed');
    }
  }
}

async function main() {
  log('🔧 Starting Entity-Document Mapping Fix');
  
  const mapper = new EntityMapper();
  
  try {
    // Initialize
    if (!(await mapper.initialize())) {
      process.exit(1);
    }
    
    // Analyze current state
    const { entities, documents } = await mapper.analyzeEntitiesAndDocuments();
    
    // Create mappings
    const mappings = await mapper.createMappings(entities, documents);
    
    if (mappings.length === 0) {
      log('No mappings could be created', 'warning');
      process.exit(1);
    }
    
    // Apply mappings
    if (!(await mapper.applyMappings(mappings))) {
      process.exit(1);
    }
    
    // Validate results
    const validation = await mapper.validateResults();
    
    if (validation.orphanedDocuments === 0) {
      log('🎉 All documents successfully linked to entities!', 'success');
    } else {
      log(`⚠️ ${validation.orphanedDocuments} documents remain orphaned`, 'warning');
    }
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  } finally {
    mapper.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { EntityMapper };