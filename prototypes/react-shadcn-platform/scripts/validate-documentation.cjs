#!/usr/bin/env node

/**
 * Documentation Validation System
 * 
 * This script validates the documentation system integrity and provides
 * comprehensive reports on entity-document linkages and data quality.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../src/lib/database/database.db');
const DOCS_DIR = path.join(__dirname, '../docs');

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

class DocumentationValidator {
  constructor() {
    this.db = null;
    this.validationResults = {
      entityDocumentLinking: [],
      orphanedDocuments: [],
      entitiesWithoutDocs: [],
      missingMdFiles: [],
      statusInconsistencies: [],
      duplicateEntityIds: [],
      brokenMappings: []
    };
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
  
  async runFullValidation() {
    log('Starting comprehensive documentation validation...');
    
    // Validation checks
    await this.validateEntityDocumentLinking();
    await this.validateDocumentIntegrity();
    await this.validateMdFileCoverage();
    await this.validateStatusConsistency();
    await this.validateIdMappings();
    await this.validateDuplicates();
    
    return this.generateReport();
  }
  
  async validateEntityDocumentLinking() {
    log('Validating entity-document linking...');
    
    // Find orphaned documents (documents with no matching entities)
    const orphanedDocs = this.db.prepare(`
      SELECT d.id, d.entity_id, d.title, d.entity_type
      FROM documents d 
      LEFT JOIN entities e ON d.entity_id = e.id 
      WHERE e.id IS NULL
      ORDER BY d.entity_id
    `).all();
    
    this.validationResults.orphanedDocuments = orphanedDocs;
    
    // Find entities without documents
    const entitiesWithoutDocs = this.db.prepare(`
      SELECT e.id, e.title, e.entity_type, e.status
      FROM entities e 
      LEFT JOIN documents d ON e.id = d.entity_id 
      WHERE d.entity_id IS NULL 
        AND e.entity_type IN ('task', 'phase')
      ORDER BY e.id
    `).all();
    
    this.validationResults.entitiesWithoutDocs = entitiesWithoutDocs;
    
    log(`Found ${orphanedDocs.length} orphaned documents`);
    log(`Found ${entitiesWithoutDocs.length} entities without documents`);
  }
  
  async validateDocumentIntegrity() {
    log('Validating document integrity...');
    
    // Check for documents with missing required fields
    const incompleteDocuments = this.db.prepare(`
      SELECT id, title, entity_id, 
             CASE 
               WHEN title IS NULL OR title = '' THEN 'missing_title'
               WHEN content IS NULL OR content = '' THEN 'missing_content'
               WHEN entity_id IS NULL OR entity_id = '' THEN 'missing_entity_id'
               WHEN entity_type IS NULL OR entity_type = '' THEN 'missing_entity_type'
               ELSE 'complete'
             END as issue
      FROM documents
      WHERE title IS NULL OR title = ''
         OR content IS NULL OR content = ''
         OR entity_id IS NULL OR entity_id = ''
         OR entity_type IS NULL OR entity_type = ''
    `).all();
    
    this.validationResults.incompleteDocuments = incompleteDocuments;
    
    log(`Found ${incompleteDocuments.length} documents with integrity issues`);
  }
  
  async validateMdFileCoverage() {
    log('Validating .md file coverage...');
    
    try {
      // Get all .md files
      const allMdFiles = this.findAllMarkdownFiles(DOCS_DIR);
      
      // Get all documents in database
      const dbDocuments = this.db.prepare('SELECT entity_id, title FROM documents').all();
      const dbEntityIds = new Set(dbDocuments.map(d => d.entity_id));
      
      // Check for .md files without corresponding database entries
      const missingFromDb = [];
      
      for (const filePath of allMdFiles) {
        const relativePath = path.relative(DOCS_DIR, filePath);
        const filename = path.basename(filePath);
        
        // Skip some files that shouldn't have database entries
        if (filename === 'README.md' && !relativePath.includes('phase-')) continue;
        if (filename.includes('test-invalid') || filename.includes('invalid')) continue;
        
        // Generate expected entity ID for this file
        const expectedEntityId = this.generateExpectedEntityId(filePath, filename);
        if (expectedEntityId && !dbEntityIds.has(expectedEntityId)) {
          missingFromDb.push({
            filePath: relativePath,
            expectedEntityId,
            exists: fs.existsSync(filePath)
          });
        }
      }
      
      this.validationResults.missingMdFiles = missingFromDb;
      
      log(`Found ${missingFromDb.length} .md files not represented in database`);
      
    } catch (error) {
      log(`Error validating .md file coverage: ${error.message}`, 'error');
    }
  }
  
  findAllMarkdownFiles(dir) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          const subFiles = this.findAllMarkdownFiles(fullPath);
          files.push(...subFiles);
        } else if (item.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return files;
  }
  
  generateExpectedEntityId(filePath, filename) {
    // Simplified version of the entity ID generation logic
    const relativePath = path.relative(DOCS_DIR, filePath);
    const pathParts = relativePath.split(path.sep);
    
    if (filename === 'README.md' && pathParts.includes('progress') && pathParts[1]?.startsWith('phase-')) {
      const phaseNum = pathParts[1].replace('phase-', '');
      return `PHASE-${phaseNum}`;
    }
    
    const taskMatch = filename.match(/^task-(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (taskMatch) {
      const [, major, minor, patch = '0', build = '0'] = taskMatch;
      const id = parseInt(major) * 1000 + parseInt(minor) * 100 + parseInt(patch) * 10 + parseInt(build);
      return `TASK-${id}`;
    }
    
    if (pathParts[0] === 'issues') {
      const baseName = path.basename(filename, '.md');
      const hash = baseName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
      return `ISSUE-${hash}`;
    }
    
    return null; // Skip other files
  }
  
  async validateStatusConsistency() {
    log('Validating status consistency...');
    
    // Compare entity status with document status
    const statusInconsistencies = this.db.prepare(`
      SELECT e.id as entity_id, e.title, e.status as entity_status,
             d.id as document_id, d.status as document_status
      FROM entities e
      INNER JOIN documents d ON e.id = d.entity_id
      WHERE (
        (e.status = 'completed' AND d.status NOT IN ('approved', 'archived')) OR
        (e.status = 'in_progress' AND d.status NOT IN ('review', 'draft')) OR
        (e.status = 'pending' AND d.status NOT IN ('draft'))
      )
    `).all();
    
    this.validationResults.statusInconsistencies = statusInconsistencies;
    
    log(`Found ${statusInconsistencies.length} status inconsistencies`);
  }
  
  async validateIdMappings() {
    log('Validating ID mappings...');
    
    // Check for broken mappings (mapping references non-existent entities)
    const brokenMappings = this.db.prepare(`
      SELECT m.old_id, m.new_id, m.entity_type,
             CASE 
               WHEN e1.id IS NULL THEN 'old_id_missing'
               WHEN e2.id IS NULL THEN 'new_id_missing'
               ELSE 'valid'
             END as issue
      FROM entity_id_mapping m
      LEFT JOIN entities e1 ON m.old_id = e1.id
      LEFT JOIN entities e2 ON m.new_id = e2.id
      WHERE e1.id IS NULL OR e2.id IS NULL
    `).all();
    
    this.validationResults.brokenMappings = brokenMappings;
    
    log(`Found ${brokenMappings.length} broken ID mappings`);
  }
  
  async validateDuplicates() {
    log('Validating for duplicates...');
    
    // Check for duplicate entity IDs
    const duplicateEntityIds = this.db.prepare(`
      SELECT entity_id, COUNT(*) as count, GROUP_CONCAT(id) as document_ids
      FROM documents 
      GROUP BY entity_id 
      HAVING COUNT(*) > 1
    `).all();
    
    this.validationResults.duplicateEntityIds = duplicateEntityIds;
    
    log(`Found ${duplicateEntityIds.length} entity IDs with multiple documents`);
  }
  
  async generateReport() {
    const results = this.validationResults;
    
    const report = `# Documentation System Validation Report

**Generated:** ${new Date().toISOString()}

## 📊 Summary

| Metric | Count | Status |
|--------|-------|--------|
| Orphaned Documents | ${results.orphanedDocuments.length} | ${results.orphanedDocuments.length === 0 ? '✅' : '⚠️'} |
| Entities Without Docs | ${results.entitiesWithoutDocs.length} | ${results.entitiesWithoutDocs.length < 10 ? '✅' : '⚠️'} |
| Missing .md Files in DB | ${results.missingMdFiles?.length || 0} | ${(results.missingMdFiles?.length || 0) === 0 ? '✅' : '⚠️'} |
| Status Inconsistencies | ${results.statusInconsistencies.length} | ${results.statusInconsistencies.length === 0 ? '✅' : '⚠️'} |
| Broken ID Mappings | ${results.brokenMappings.length} | ${results.brokenMappings.length === 0 ? '✅' : '❌'} |
| Duplicate Entity IDs | ${results.duplicateEntityIds.length} | ${results.duplicateEntityIds.length === 0 ? '✅' : '⚠️'} |

## 🔗 Entity-Document Linking

### Orphaned Documents (${results.orphanedDocuments.length})
${results.orphanedDocuments.length === 0 ? '_No orphaned documents found._' : 
results.orphanedDocuments.slice(0, 10).map(doc => 
  `- **${doc.entity_id}**: ${doc.title.substring(0, 60)}...`
).join('\\n')}

### Entities Without Documents (${results.entitiesWithoutDocs.length})
${results.entitiesWithoutDocs.length === 0 ? '_All entities have documents._' :
results.entitiesWithoutDocs.slice(0, 10).map(entity => 
  `- **${entity.id}**: ${entity.title.substring(0, 60)}... (${entity.status})`
).join('\\n')}

## 📁 File System Coverage

### Missing .md Files in Database (${results.missingMdFiles?.length || 0})
${(results.missingMdFiles?.length || 0) === 0 ? '_All .md files are represented in database._' :
results.missingMdFiles.slice(0, 5).map(file => 
  `- **${file.expectedEntityId}**: ${file.filePath}`
).join('\\n')}

## ⚠️ Data Quality Issues

### Status Inconsistencies (${results.statusInconsistencies.length})
${results.statusInconsistencies.length === 0 ? '_No status inconsistencies found._' :
results.statusInconsistencies.slice(0, 5).map(issue => 
  `- **${issue.entity_id}**: Entity(${issue.entity_status}) vs Document(${issue.document_status})`
).join('\\n')}

### Broken ID Mappings (${results.brokenMappings.length})
${results.brokenMappings.length === 0 ? '_All ID mappings are valid._' :
results.brokenMappings.map(mapping => 
  `- **${mapping.old_id} → ${mapping.new_id}**: ${mapping.issue}`
).join('\\n')}

### Duplicate Entity IDs (${results.duplicateEntityIds.length})
${results.duplicateEntityIds.length === 0 ? '_No duplicate entity IDs found._' :
results.duplicateEntityIds.map(dup => 
  `- **${dup.entity_id}**: ${dup.count} documents (${dup.document_ids})`
).join('\\n')}

## 🎯 Recommendations

${this.generateRecommendations()}

---
*Generated by validate-documentation.cjs*
`;

    const reportPath = path.join(DOCS_DIR, 'VALIDATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    
    log(`Validation report saved to: ${reportPath}`, 'success');
    
    // Also print summary to console
    console.log('\\n' + '='.repeat(60));
    console.log('📋 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📄 Orphaned Documents: ${results.orphanedDocuments.length}`);
    console.log(`🏷️  Entities Without Docs: ${results.entitiesWithoutDocs.length}`);
    console.log(`📁 Missing .md Files: ${results.missingMdFiles?.length || 0}`);
    console.log(`⚠️  Status Inconsistencies: ${results.statusInconsistencies.length}`);
    console.log(`🔗 Broken Mappings: ${results.brokenMappings.length}`);
    console.log(`🔄 Duplicate Entity IDs: ${results.duplicateEntityIds.length}`);
    console.log('='.repeat(60));
    
    return results;
  }
  
  generateRecommendations() {
    const results = this.validationResults;
    const recommendations = [];
    
    if (results.orphanedDocuments.length > 0) {
      recommendations.push('1. **Fix Orphaned Documents**: Run entity mapping script or manually link documents to entities');
    }
    
    if (results.entitiesWithoutDocs.length > 10) {
      recommendations.push('2. **Create Missing Documentation**: Generate documents for entities that lack documentation');
    }
    
    if (results.statusInconsistencies.length > 0) {
      recommendations.push('3. **Sync Status Values**: Update either entity or document statuses to maintain consistency');
    }
    
    if (results.brokenMappings.length > 0) {
      recommendations.push('4. **Fix Broken Mappings**: Remove or correct ID mappings that reference non-existent entities');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 **System Health: Excellent!** All validation checks passed.');
    }
    
    return recommendations.join('\\n');
  }
  
  close() {
    if (this.db) {
      this.db.close();
      log('Database connection closed');
    }
  }
}

async function main() {
  log('🔍 Starting Documentation System Validation');
  
  const validator = new DocumentationValidator();
  
  try {
    if (!(await validator.initialize())) {
      process.exit(1);
    }
    
    const results = await validator.runFullValidation();
    
    // Determine overall health
    const issues = results.orphanedDocuments.length + 
                  results.statusInconsistencies.length + 
                  results.brokenMappings.length;
    
    if (issues === 0) {
      log('🎉 Documentation system validation completed successfully!', 'success');
    } else {
      log(`⚠️ Found ${issues} issues that need attention`, 'warning');
    }
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  } finally {
    validator.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { DocumentationValidator };