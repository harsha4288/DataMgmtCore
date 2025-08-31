#!/usr/bin/env node

/**
 * Documentation System Complete Reload Script
 * 
 * This script completely wipes and reloads all documentation with proper linking:
 * 1. Backs up current database state
 * 2. Wipes documents and mappings tables
 * 3. Parses all .md files in docs/ directory
 * 4. Extracts content, status, and metadata
 * 5. Creates proper entity-document mappings
 * 6. Updates entity statuses based on real document content
 * 7. Validates all links work correctly
 * 
 * Usage: node scripts/reload-documents.js [--verbose] [--dry-run]
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const DB_PATH = path.join(PROJECT_ROOT, 'src/lib/database/database.db');

// Command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const DRY_RUN = args.includes('--dry-run');

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '📄',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'debug': '🔍'
  }[level] || '📄';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function verbose(message) {
  if (VERBOSE) log(message, 'debug');
}

// Entity ID generation functions
function generateEntityId(filePath, filename) {
  // Remove docs/ prefix and normalize path
  const relativePath = path.relative(DOCS_DIR, filePath);
  const pathParts = relativePath.split(path.sep);
  
  verbose(`Processing file: ${relativePath}`);
  
  // Handle different file patterns
  if (filename === 'README.md') {
    // Phase READMEs: docs/progress/phase-X/README.md → PHASE-X
    if (pathParts.includes('progress') && pathParts[1]?.startsWith('phase-')) {
      const phaseNum = pathParts[1].replace('phase-', '');
      return `PHASE-${phaseNum}`;
    }
    return null; // Skip other READMEs
  }
  
  // Task files: task-X.Y.Z.md → TASK-XAYBZ (A=0, B=0)
  const taskMatch = filename.match(/^task-(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (taskMatch) {
    const [, major, minor, patch = '0', build = '0'] = taskMatch;
    // Convert to sequential ID: 5.8.3 → 5803, 1.2 → 1200
    const id = parseInt(major) * 1000 + parseInt(minor) * 100 + parseInt(patch) * 10 + parseInt(build);
    return `TASK-${id}`;
  }
  
  // Issues: docs/issues/something.md → ISSUE-HASH
  if (pathParts[0] === 'issues') {
    const baseName = path.basename(filename, '.md');
    const hash = baseName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    return `ISSUE-${hash}`;
  }
  
  // Analysis documents: docs/analysis/something.md → DOC-HASH
  if (pathParts[0] === 'analysis' || pathParts[0] === 'domains') {
    const baseName = path.basename(filename, '.md');
    const hash = baseName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    return `DOC-${hash}`;
  }
  
  // Other documents
  const baseName = path.basename(filename, '.md');
  const hash = baseName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
  return `DOC-${hash}`;
}

function extractStatusFromContent(content) {
  // Look for status indicators in the content and map to document status values
  const statusPatterns = [
    { pattern: /✅.*completed?/i, taskStatus: 'completed', docStatus: 'approved' },
    { pattern: /🔄.*in[_\s]*progress/i, taskStatus: 'in_progress', docStatus: 'review' },
    { pattern: /⏳.*pending/i, taskStatus: 'pending', docStatus: 'draft' },
    { pattern: /🚫.*blocked?/i, taskStatus: 'blocked', docStatus: 'draft' },
    { pattern: /❌.*cancelled?/i, taskStatus: 'cancelled', docStatus: 'archived' },
    { pattern: /status:\s*completed?/i, taskStatus: 'completed', docStatus: 'approved' },
    { pattern: /status:\s*in[_\s]*progress/i, taskStatus: 'in_progress', docStatus: 'review' },
    { pattern: /status:\s*pending/i, taskStatus: 'pending', docStatus: 'draft' },
    { pattern: /status:\s*blocked?/i, taskStatus: 'blocked', docStatus: 'draft' }
  ];
  
  for (const { pattern, taskStatus, docStatus } of statusPatterns) {
    if (pattern.test(content)) {
      verbose(`Found status indicator: ${taskStatus} → ${docStatus}`);
      return { taskStatus, docStatus };
    }
  }
  
  // Default to pending/draft for new documents
  return { taskStatus: 'pending', docStatus: 'draft' };
}

function extractTitleFromContent(content) {
  // Extract first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Fallback to first line if no heading
  const firstLine = content.split('\n')[0].trim();
  return firstLine.substring(0, 100);
}

function determineEntityType(entityId) {
  if (entityId.startsWith('TASK-')) return 'task';
  if (entityId.startsWith('PHASE-')) return 'phase';
  if (entityId.startsWith('ISSUE-')) return 'issue';
  // Map 'document' to 'task' since documents constraint doesn't allow 'document'
  return 'task';
}

// Database operations
class DocumentReloader {
  constructor() {
    this.db = null;
    this.stats = {
      filesProcessed: 0,
      documentsCreated: 0,
      entitiesUpdated: 0,
      mappingsCreated: 0,
      errors: 0
    };
  }
  
  async initialize() {
    try {
      this.db = new Database(DB_PATH);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      log('Database connection established');
      return true;
    } catch (error) {
      log(`Failed to connect to database: ${error.message}`, 'error');
      return false;
    }
  }
  
  async backupCurrentState() {
    log('Creating backup of current database state...');
    
    try {
      const backupPath = `${DB_PATH}.backup.${Date.now()}`;
      fs.copyFileSync(DB_PATH, backupPath);
      log(`Backup created: ${backupPath}`, 'success');
      
      // Also export current data as JSON for debugging
      const entities = this.db.prepare('SELECT * FROM entities').all();
      const documents = this.db.prepare('SELECT * FROM documents').all();
      const mappings = this.db.prepare('SELECT * FROM entity_id_mapping').all();
      
      const exportData = {
        timestamp: new Date().toISOString(),
        entities: entities.length,
        documents: documents.length,
        mappings: mappings.length,
        data: { entities, documents, mappings }
      };
      
      fs.writeFileSync(
        `${DB_PATH}.export.${Date.now()}.json`,
        JSON.stringify(exportData, null, 2)
      );
      
      log(`Current state: ${entities.length} entities, ${documents.length} documents, ${mappings.length} mappings`);
      return true;
    } catch (error) {
      log(`Backup failed: ${error.message}`, 'error');
      return false;
    }
  }
  
  async clearDocuments() {
    log('Clearing existing documents and mappings...');
    
    if (DRY_RUN) {
      log('DRY RUN: Would clear documents and mappings', 'warning');
      return true;
    }
    
    try {
      const transaction = this.db.transaction(() => {
        this.db.prepare('DELETE FROM documents').run();
        this.db.prepare('DELETE FROM entity_id_mapping').run();
        log('Documents and mappings cleared', 'success');
      });
      
      transaction();
      return true;
    } catch (error) {
      log(`Failed to clear documents: ${error.message}`, 'error');
      return false;
    }
  }
  
  async processAllFiles() {
    log('Processing all markdown files...');
    
    const allFiles = await this.findAllMarkdownFiles(DOCS_DIR);
    log(`Found ${allFiles.length} markdown files to process`);
    
    const processedFiles = [];
    
    for (const filePath of allFiles) {
      try {
        const result = await this.processFile(filePath);
        if (result) {
          processedFiles.push(result);
          this.stats.filesProcessed++;
        }
      } catch (error) {
        log(`Error processing ${filePath}: ${error.message}`, 'error');
        this.stats.errors++;
      }
    }
    
    log(`Successfully processed ${processedFiles.length} files`, 'success');
    return processedFiles;
  }
  
  async findAllMarkdownFiles(dir) {
    const files = [];
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        const subFiles = await this.findAllMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (item.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  async processFile(filePath) {
    const filename = path.basename(filePath);
    verbose(`Processing: ${filePath}`);
    
    // Generate entity ID
    const entityId = generateEntityId(filePath, filename);
    if (!entityId) {
      verbose(`Skipping file: ${filename} (no entity ID generated)`);
      return null;
    }
    
    // Read and process content
    const content = fs.readFileSync(filePath, 'utf8');
    const title = extractTitleFromContent(content);
    const { taskStatus, docStatus } = extractStatusFromContent(content);
    const entityType = determineEntityType(entityId);
    
    verbose(`Generated: ${entityId} (${entityType}) - ${title.substring(0, 50)}`);
    verbose(`Status: ${taskStatus} (doc: ${docStatus})`);
    
    return {
      filePath,
      entityId,
      title,
      content,
      taskStatus,
      docStatus,
      entityType,
      filename
    };
  }
  
  async insertDocuments(processedFiles) {
    log('Inserting documents into database...');
    
    if (DRY_RUN) {
      log(`DRY RUN: Would insert ${processedFiles.length} documents`, 'warning');
      processedFiles.forEach(file => {
        log(`  ${file.entityId}: ${file.title.substring(0, 50)}...`);
      });
      return true;
    }
    
    const insertDocument = this.db.prepare(`
      INSERT INTO documents (
        id, title, content, type, status, entity_id, entity_type, 
        author, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const transaction = this.db.transaction((files) => {
      for (const file of files) {
        const docId = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        
        insertDocument.run(
          docId,
          file.title,
          file.content,
          'technical',
          file.docStatus,
          file.entityId,
          file.entityType,
          'Development Team',
          1
        );
        
        this.stats.documentsCreated++;
        verbose(`Inserted document: ${docId} for ${file.entityId}`);
      }
    });
    
    try {
      transaction(processedFiles);
      log(`Successfully inserted ${processedFiles.length} documents`, 'success');
      return true;
    } catch (error) {
      log(`Failed to insert documents: ${error.message}`, 'error');
      return false;
    }
  }
  
  async updateEntityStatuses(processedFiles) {
    log('Updating entity statuses based on document content...');
    
    if (DRY_RUN) {
      log(`DRY RUN: Would update ${processedFiles.length} entity statuses`, 'warning');
      return true;
    }
    
    const updateEntity = this.db.prepare(`
      UPDATE entities SET status = ?, updated_at = datetime('now') 
      WHERE id = ?
    `);
    
    const transaction = this.db.transaction((files) => {
      for (const file of files) {
        const result = updateEntity.run(file.taskStatus, file.entityId);
        if (result.changes > 0) {
          this.stats.entitiesUpdated++;
          verbose(`Updated entity ${file.entityId} status to ${file.taskStatus}`);
        }
      }
    });
    
    try {
      transaction(processedFiles);
      log(`Updated ${this.stats.entitiesUpdated} entity statuses`, 'success');
      return true;
    } catch (error) {
      log(`Failed to update entity statuses: ${error.message}`, 'error');
      return false;
    }
  }
  
  async createCompatibilityMappings() {
    log('Creating ID mappings for backward compatibility...');
    
    // Create mappings for common patterns that might be expected
    const mappings = [
      // Map simple task numbers to full IDs
      { oldId: 'TASK-1480', newId: 'TASK-5803', entityType: 'task' }, // task-5.8.3
      { oldId: 'TASK-1481', newId: 'TASK-5800', entityType: 'task' }, // task-5.8
      { oldId: 'TASK-1482', newId: 'TASK-5801', entityType: 'task' }, // task-5.8.1
      { oldId: 'TASK-1483', newId: 'TASK-5802', entityType: 'task' }, // task-5.8.2
      { oldId: 'TASK-1484', newId: 'TASK-5804', entityType: 'task' }, // task-5.8.4
      { oldId: 'TASK-1485', newId: 'TASK-5805', entityType: 'task' }, // task-5.8.5
      { oldId: 'TASK-1486', newId: 'TASK-5806', entityType: 'task' }, // task-5.8.6
      { oldId: 'TASK-1487', newId: 'TASK-5807', entityType: 'task' }, // task-5.8.7
    ];
    
    if (DRY_RUN) {
      log(`DRY RUN: Would create ${mappings.length} ID mappings`, 'warning');
      return true;
    }
    
    const insertMapping = this.db.prepare(`
      INSERT OR REPLACE INTO entity_id_mapping (old_id, new_id, entity_type, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    const transaction = this.db.transaction((maps) => {
      for (const mapping of maps) {
        insertMapping.run(mapping.oldId, mapping.newId, mapping.entityType);
        this.stats.mappingsCreated++;
        verbose(`Created mapping: ${mapping.oldId} → ${mapping.newId}`);
      }
    });
    
    try {
      transaction(mappings);
      log(`Created ${mappings.length} ID mappings`, 'success');
      return true;
    } catch (error) {
      log(`Failed to create mappings: ${error.message}`, 'error');
      return false;
    }
  }
  
  async validateResults() {
    log('Validating results...');
    
    try {
      // Count records
      const entityCount = this.db.prepare('SELECT COUNT(*) as count FROM entities').get().count;
      const documentCount = this.db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
      const mappingCount = this.db.prepare('SELECT COUNT(*) as count FROM entity_id_mapping').get().count;
      
      log(`Final counts: ${entityCount} entities, ${documentCount} documents, ${mappingCount} mappings`);
      
      // Check for documents without entities
      const orphanedDocs = this.db.prepare(`
        SELECT d.id, d.entity_id, d.title 
        FROM documents d 
        LEFT JOIN entities e ON d.entity_id = e.id 
        WHERE e.id IS NULL
      `).all();
      
      if (orphanedDocs.length > 0) {
        log(`Warning: ${orphanedDocs.length} documents have no matching entities`, 'warning');
        orphanedDocs.forEach(doc => {
          verbose(`  Orphaned: ${doc.entity_id} - ${doc.title}`);
        });
      }
      
      // Check for entities without documents
      const documentsLess = this.db.prepare(`
        SELECT e.id, e.title
        FROM entities e 
        LEFT JOIN documents d ON e.id = d.entity_id 
        WHERE d.entity_id IS NULL AND e.entity_type IN ('task', 'phase')
      `).all();
      
      if (documentsLess.length > 0) {
        log(`Info: ${documentsLess.length} entities have no documents (may be expected)`, 'warning');
        documentsLess.slice(0, 5).forEach(entity => {
          verbose(`  No docs: ${entity.id} - ${entity.title}`);
        });
        if (documentsLess.length > 5) {
          verbose(`  ... and ${documentsLess.length - 5} more`);
        }
      }
      
      return {
        entities: entityCount,
        documents: documentCount,
        mappings: mappingCount,
        orphanedDocs: orphanedDocs.length,
        entitiesWithoutDocs: documentsLess.length
      };
      
    } catch (error) {
      log(`Validation failed: ${error.message}`, 'error');
      return null;
    }
  }
  
  async generateReport() {
    const validation = await this.validateResults();
    if (!validation) return;
    
    const report = `
# Documentation System Reload Report

**Generated:** ${new Date().toISOString()}
**Mode:** ${DRY_RUN ? 'DRY RUN' : 'LIVE RUN'}

## Summary Statistics

- **Files Processed:** ${this.stats.filesProcessed}
- **Documents Created:** ${this.stats.documentsCreated}
- **Entities Updated:** ${this.stats.entitiesUpdated}
- **ID Mappings Created:** ${this.stats.mappingsCreated}
- **Errors:** ${this.stats.errors}

## Database State

- **Total Entities:** ${validation.entities}
- **Total Documents:** ${validation.documents}
- **ID Mappings:** ${validation.mappings}
- **Orphaned Documents:** ${validation.orphanedDocs}
- **Entities Without Documents:** ${validation.entitiesWithoutDocs}

## Status Distribution

${await this.getStatusDistribution()}

## Validation Results

${validation.orphanedDocs === 0 ? '✅' : '⚠️'} Document-Entity Linking: ${validation.orphanedDocs === 0 ? 'All Good' : `${validation.orphanedDocs} orphaned`}
${validation.entitiesWithoutDocs < 10 ? '✅' : '⚠️'} Entity Documentation: ${validation.entitiesWithoutDocs < 10 ? 'Mostly Complete' : `${validation.entitiesWithoutDocs} missing docs`}
${this.stats.errors === 0 ? '✅' : '❌'} Processing Errors: ${this.stats.errors === 0 ? 'None' : `${this.stats.errors} errors`}

## Next Steps

${DRY_RUN ? '1. Run without --dry-run to apply changes' : '1. Test GraphQL queries in dashboard'}
2. Verify document display in UI
3. Check status indicators are accurate
4. Update any custom entity IDs if needed

---
*Generated by reload-documents.js*
`;
    
    const reportPath = path.join(DOCS_DIR, 'DOCUMENTATION_RELOAD_REPORT.md');
    fs.writeFileSync(reportPath, report.trim());
    
    log(`Report saved to: ${reportPath}`, 'success');
    console.log(report);
  }
  
  async getStatusDistribution() {
    try {
      const statusCounts = this.db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM documents 
        GROUP BY status 
        ORDER BY count DESC
      `).all();
      
      return statusCounts.map(s => `- **${s.status}:** ${s.count}`).join('\n');
    } catch {
      return 'Unable to generate status distribution';
    }
  }
  
  close() {
    if (this.db) {
      this.db.close();
      log('Database connection closed');
    }
  }
}

// Main execution
async function main() {
  log('🚀 Starting Documentation System Reload', 'info');
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE RUN'}`);
  
  const reloader = new DocumentReloader();
  
  try {
    // Initialize
    if (!(await reloader.initialize())) {
      process.exit(1);
    }
    
    // Backup
    if (!(await reloader.backupCurrentState())) {
      process.exit(1);
    }
    
    // Clear existing data
    if (!(await reloader.clearDocuments())) {
      process.exit(1);
    }
    
    // Process all files
    const processedFiles = await reloader.processAllFiles();
    if (processedFiles.length === 0) {
      log('No files were processed successfully', 'error');
      process.exit(1);
    }
    
    // Insert new documents
    if (!(await reloader.insertDocuments(processedFiles))) {
      process.exit(1);
    }
    
    // Update entity statuses
    if (!(await reloader.updateEntityStatuses(processedFiles))) {
      process.exit(1);
    }
    
    // Create compatibility mappings
    if (!(await reloader.createCompatibilityMappings())) {
      process.exit(1);
    }
    
    // Generate final report
    await reloader.generateReport();
    
    log('🎉 Documentation reload completed successfully!', 'success');
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  } finally {
    reloader.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { DocumentReloader, generateEntityId, extractStatusFromContent };