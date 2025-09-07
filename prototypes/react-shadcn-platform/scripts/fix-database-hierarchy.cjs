/**
 * Fix Database Hierarchy Issues
 * 
 * Phase 1: Restore broken functionality by:
 * 1. Fixing parent_id fields from hierarchy_path data
 * 2. Populating entity_relationships table
 * 3. Testing that workflow dashboard works
 */

const Database = require('better-sqlite3');
const path = require('path');

class DatabaseHierarchyFixer {
  constructor() {
    this.dbPath = path.resolve(__dirname, '../src/lib/database/database.db');
    this.db = new Database(this.dbPath);
    
    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Analyze current database state
   */
  analyzeDatabase() {
    console.log('📊 Analyzing database state...\n');
    
    // Count entities by type
    const entityCounts = this.db.prepare(`
      SELECT entity_type, COUNT(*) as count
      FROM entities 
      GROUP BY entity_type
      ORDER BY entity_type
    `).all();
    
    console.log('Entity counts:');
    entityCounts.forEach(row => {
      console.log(`  ${row.entity_type}: ${row.count}`);
    });
    
    // Check parent_id status
    const parentIdStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_entities,
        COUNT(parent_id) as entities_with_parent_id,
        COUNT(*) - COUNT(parent_id) as entities_with_null_parent_id
      FROM entities
    `).get();
    
    console.log('\nParent ID status:');
    console.log(`  Total entities: ${parentIdStats.total_entities}`);
    console.log(`  With parent_id: ${parentIdStats.entities_with_parent_id}`);
    console.log(`  With NULL parent_id: ${parentIdStats.entities_with_null_parent_id}`);
    
    // Check relationships
    const relationshipCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM entity_relationships
    `).get();
    
    console.log(`\nEntity relationships: ${relationshipCount.count}`);
    
    // Sample hierarchy_path data
    const samplePaths = this.db.prepare(`
      SELECT id, entity_type, hierarchy_path, parent_id
      FROM entities 
      WHERE hierarchy_path IS NOT NULL AND hierarchy_path != id
      LIMIT 10
    `).all();
    
    console.log('\nSample hierarchy_path data:');
    samplePaths.forEach(row => {
      console.log(`  ${row.id} (${row.entity_type}): ${row.hierarchy_path} -> parent_id: ${row.parent_id}`);
    });
    
    return {
      entityCounts,
      parentIdStats,
      relationshipCount: relationshipCount.count,
      samplePaths
    };
  }

  /**
   * Extract parent ID from hierarchy_path
   */
  extractParentFromPath(hierarchyPath, entityId) {
    if (!hierarchyPath || hierarchyPath === entityId) {
      return null; // Root entity
    }
    
    // Handle paths like '/phases/phase-0/tasks/task-0.1'
    // Pattern: /phases/phase-0 -> phase-0 is root (parent = null)
    // Pattern: /phases/phase-0/tasks/task-0.1 -> task-0.1's parent is phase-0
    
    const segments = hierarchyPath.split('/').filter(s => s.length > 0);
    
    // Look for entity-like segments (contain dashes: phase-0, task-0.1, PHASE-0, TASK-0.1)
    const entitySegments = segments.filter(segment => {
      return segment.includes('-') && (
        segment.startsWith('phase-') || 
        segment.startsWith('task-') ||
        segment.startsWith('PHASE-') ||
        segment.startsWith('TASK-') ||
        /^[A-Z]+-.+/.test(segment)  // Any uppercase prefix with dash
      );
    });
    
    console.log(`    Debug: ${entityId} path=${hierarchyPath} entitySegments=[${entitySegments.join(', ')}]`);
    
    // If we have multiple entity segments, the parent is the second-to-last one
    if (entitySegments.length >= 2) {
      let parent = entitySegments[entitySegments.length - 2];
      
      // Convert to uppercase format to match actual entity IDs
      // phase-0 -> PHASE-0, task-1.1 -> TASK-1.1
      if (parent.startsWith('phase-')) {
        parent = parent.replace('phase-', 'PHASE-');
      } else if (parent.startsWith('task-')) {
        parent = parent.replace('task-', 'TASK-');
      }
      
      console.log(`    -> Parent found: ${parent}`);
      return parent;
    }
    
    // If only one entity segment or none, it's a root
    console.log(`    -> Root entity (no parent)`);
    return null;
  }

  /**
   * Fix parent_id fields based on hierarchy_path data
   */
  fixParentIdFields() {
    console.log('\n🔧 Fixing parent_id fields from hierarchy_path data...');
    
    // Get all entities with hierarchy paths
    const entities = this.db.prepare(`
      SELECT id, entity_type, hierarchy_path, parent_id
      FROM entities
      ORDER BY hierarchy_path
    `).all();
    
    // Create lookup for existing entities
    const existingEntities = new Set(entities.map(e => e.id));
    
    const updateStmt = this.db.prepare(`
      UPDATE entities 
      SET parent_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    let updatedCount = 0;
    const transaction = this.db.transaction(() => {
      for (const entity of entities) {
        const expectedParent = this.extractParentFromPath(entity.hierarchy_path, entity.id);
        
        // Validate that parent exists if it's not null
        if (expectedParent && !existingEntities.has(expectedParent)) {
          console.log(`  ⚠️  Skipping ${entity.id}: parent ${expectedParent} does not exist`);
          continue;
        }
        
        if (expectedParent !== entity.parent_id) {
          console.log(`  Updating ${entity.id}: parent_id ${entity.parent_id} -> ${expectedParent}`);
          updateStmt.run(expectedParent, entity.id);
          updatedCount++;
        }
      }
    });
    
    transaction();
    console.log(`✅ Updated ${updatedCount} parent_id fields`);
    
    return updatedCount;
  }

  /**
   * Generate entity_relationships for all parent-child pairs
   */
  populateEntityRelationships() {
    console.log('\n🔧 Populating entity_relationships table...');
    
    // Get all entities with parents
    const entitiesWithParents = this.db.prepare(`
      SELECT id, parent_id, entity_type
      FROM entities
      WHERE parent_id IS NOT NULL
    `).all();
    
    // Check if relationship already exists
    const relationshipExists = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM entity_relationships
      WHERE source_entity_id = ? AND target_entity_id = ? AND relationship_type = 'parent_of'
    `);
    
    // Insert relationship
    const insertRelationship = this.db.prepare(`
      INSERT INTO entity_relationships (
        id, source_entity_id, target_entity_id, relationship_type,
        strength, impact_score, is_active, is_bidirectional, is_auto_generated,
        context, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    let createdCount = 0;
    const transaction = this.db.transaction(() => {
      for (const entity of entitiesWithParents) {
        const existing = relationshipExists.get(entity.parent_id, entity.id);
        
        if (existing.count === 0) {
          const relationshipId = `REL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          insertRelationship.run(
            relationshipId,
            entity.parent_id,    // source (parent)
            entity.id,           // target (child)
            'parent_of',
            1.0,                 // strength
            0.8,                 // impact_score
            1,                   // is_active
            0,                   // is_bidirectional
            1,                   // is_auto_generated
            JSON.stringify({ auto_generated: true, entity_type: entity.entity_type }),
            'Auto-generated from parent_id field'
          );
          
          console.log(`  Created relationship: ${entity.parent_id} -> ${entity.id} (parent_of)`);
          createdCount++;
        }
      }
    });
    
    transaction();
    console.log(`✅ Created ${createdCount} parent_of relationships`);
    
    return createdCount;
  }

  /**
   * Validate the fixes by testing queries
   */
  validateFixes() {
    console.log('\n✅ Validating fixes...');
    
    // Test the GraphQL query that was failing
    const phasesWithTasks = this.db.prepare(`
      SELECT 
        p.id,
        p.title as name,
        COUNT(t.id) as task_count
      FROM entities p
      LEFT JOIN entity_relationships er ON p.id = er.source_entity_id AND er.relationship_type = 'parent_of'
      LEFT JOIN entities t ON er.target_entity_id = t.id AND t.entity_type = 'task'
      WHERE p.entity_type = 'phase'
      GROUP BY p.id, p.title
      ORDER BY p.title
    `).all();
    
    console.log('Phases with task counts:');
    phasesWithTasks.forEach(phase => {
      console.log(`  ${phase.name}: ${phase.task_count} tasks`);
    });
    
    // Test parent_id queries
    const tasksWithParents = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM entities
      WHERE entity_type = 'task' AND parent_id IS NOT NULL
    `).get();
    
    console.log(`\nTasks with parent_id: ${tasksWithParents.count}`);
    
    // Test relationship queries
    const parentOfRelationships = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM entity_relationships
      WHERE relationship_type = 'parent_of'
    `).get();
    
    console.log(`Parent-of relationships: ${parentOfRelationships.count}`);
    
    return {
      phasesWithTasks,
      tasksWithParents: tasksWithParents.count,
      parentOfRelationships: parentOfRelationships.count
    };
  }

  /**
   * Clean up legacy empty tables
   */
  cleanupLegacyTables() {
    console.log('\n🧹 Checking legacy tables...');
    
    const legacyTables = ['tasks', 'phases', 'issues'];
    
    for (const tableName of legacyTables) {
      try {
        const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        console.log(`  ${tableName}: ${count.count} records`);
        
        if (count.count === 0) {
          console.log(`    ⚠️  Table ${tableName} is empty and could be dropped`);
        }
      } catch (error) {
        console.log(`    ⚠️  Table ${tableName} does not exist or is inaccessible`);
      }
    }
  }

  /**
   * Run all fixes
   */
  async runAllFixes() {
    try {
      console.log('🚀 Starting database hierarchy fixes...\n');
      
      // Analyze current state
      const analysis = this.analyzeDatabase();
      
      // Fix parent_id fields
      const parentIdUpdates = this.fixParentIdFields();
      
      // Populate relationships
      const relationshipCreations = this.populateEntityRelationships();
      
      // Validate fixes
      const validation = this.validateFixes();
      
      // Check legacy tables
      this.cleanupLegacyTables();
      
      console.log('\n✅ Database hierarchy fixes completed successfully!');
      console.log('\nSummary:');
      console.log(`  - Updated ${parentIdUpdates} parent_id fields`);
      console.log(`  - Created ${relationshipCreations} parent_of relationships`);
      console.log(`  - ${validation.tasksWithParents} tasks now have parent_id`);
      console.log(`  - ${validation.parentOfRelationships} parent_of relationships exist`);
      
      return {
        success: true,
        parentIdUpdates,
        relationshipCreations,
        validation
      };
      
    } catch (error) {
      console.error('❌ Error during database fixes:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.close();
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new DatabaseHierarchyFixer();
  fixer.runAllFixes()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Ready to test workflow dashboard!');
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = DatabaseHierarchyFixer;