/**
 * Database Migration: Remove Redundant Hierarchy Fields
 * 
 * Phase 3: Clean up database by removing redundant fields:
 * - Remove parent_id column (data now in entity_relationships)
 * - Remove hierarchy_path column (calculated dynamically via relationships)
 * - Remove level column (calculated dynamically via relationships)
 * - Drop legacy empty tables (tasks, phases, issues)
 * - Add performance indexes for relationship queries
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseMigration {
  constructor() {
    this.dbPath = path.resolve(__dirname, '../src/lib/database/database.db');
    this.backupPath = `${this.dbPath}.backup.${Date.now()}`;
    this.db = null;
  }

  /**
   * Create backup before migration
   */
  createBackup() {
    console.log('💾 Creating database backup...');
    fs.copyFileSync(this.dbPath, this.backupPath);
    console.log(`✅ Backup created: ${this.backupPath}`);
  }

  /**
   * Initialize database connection
   */
  initDb() {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = OFF'); // Disable FK constraints during migration
  }

  /**
   * Verify current state before migration
   */
  verifyCurrentState() {
    console.log('\n📊 Verifying current database state...');
    
    // Check entities table structure
    const tableInfo = this.db.prepare(`PRAGMA table_info(entities)`).all();
    const columns = tableInfo.map(col => col.name);
    
    console.log('Current entities table columns:');
    columns.forEach(col => console.log(`  - ${col}`));
    
    // Verify relationships exist
    const relationshipCount = this.db.prepare(`SELECT COUNT(*) as count FROM entity_relationships`).get();
    console.log(`\nRelationships: ${relationshipCount.count}`);
    
    // Verify parent_id is populated
    const entitiesWithParentId = this.db.prepare(`SELECT COUNT(*) as count FROM entities WHERE parent_id IS NOT NULL`).get();
    console.log(`Entities with parent_id: ${entitiesWithParentId.count}`);
    
    // Check legacy tables
    const legacyTables = ['tasks', 'phases', 'issues'];
    console.log('\nLegacy table status:');
    for (const table of legacyTables) {
      try {
        const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        console.log(`  ${table}: ${count.count} records`);
      } catch (error) {
        console.log(`  ${table}: table does not exist or is inaccessible`);
      }
    }
    
    return {
      hasParentId: columns.includes('parent_id'),
      hasHierarchyPath: columns.includes('hierarchy_path'),
      hasLevel: columns.includes('level'),
      relationshipCount: relationshipCount.count,
      entitiesWithParentId: entitiesWithParentId.count
    };
  }

  /**
   * Test relationship-based queries work correctly
   */
  testRelationshipQueries() {
    console.log('\n🧪 Testing relationship-based queries...');
    
    // Test getting children via relationships
    const testParentId = 'PHASE-1';
    const childrenQuery = `
      SELECT e.id, e.title FROM entities e
      JOIN entity_relationships er ON e.id = er.target_entity_id
      WHERE er.source_entity_id = ? AND er.relationship_type = 'parent_of' AND er.is_active = 1
    `;
    
    const children = this.db.prepare(childrenQuery).all(testParentId);
    console.log(`Children of ${testParentId}: ${children.length} found`);
    
    if (children.length === 0) {
      throw new Error('Relationship queries not working - aborting migration!');
    }
    
    // Test recursive hierarchy query
    const hierarchyQuery = `
      WITH RECURSIVE entity_tree AS (
        SELECT e.*, 0 as depth FROM entities e WHERE e.id = ?
        UNION ALL
        SELECT e.*, et.depth + 1
        FROM entities e
        JOIN entity_relationships er ON e.id = er.target_entity_id
        JOIN entity_tree et ON er.source_entity_id = et.id
        WHERE er.relationship_type = 'parent_of' AND er.is_active = 1
      )
      SELECT COUNT(*) as count FROM entity_tree WHERE id != ?
    `;
    
    const descendants = this.db.prepare(hierarchyQuery).get(testParentId, testParentId);
    console.log(`Descendants of ${testParentId}: ${descendants.count} found`);
    
    console.log('✅ Relationship queries working correctly');
  }

  /**
   * Fix data issues before migration
   */
  fixDataIssues() {
    console.log('\n🔧 Fixing data issues before migration...');
    
    // Set default priority for entities with NULL priority
    const updatePriority = this.db.prepare(`
      UPDATE entities 
      SET priority = CASE 
        WHEN entity_type = 'phase' THEN 'medium'
        WHEN entity_type = 'task' THEN 'medium'
        ELSE 'low'
      END
      WHERE priority IS NULL
    `);
    
    const updated = updatePriority.run();
    console.log(`✅ Fixed ${updated.changes} entities with NULL priority`);
  }

  /**
   * Remove redundant columns
   */
  removeRedundantColumns() {
    console.log('\n🔧 Removing redundant columns from entities table...');
    
    const transaction = this.db.transaction(() => {
      // Step 1: Create new table without redundant columns
      this.db.exec(`
        CREATE TABLE entities_new (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          board_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium',
          assignee TEXT,
          estimated_hours REAL,
          actual_hours REAL,
          progress INTEGER NOT NULL DEFAULT 0,
          completion_date DATE,
          sort_order INTEGER DEFAULT 0,
          metadata TEXT DEFAULT '{}',
          attributes TEXT DEFAULT '{}',
          labels TEXT DEFAULT '[]',
          dependencies TEXT DEFAULT '[]',
          created_by TEXT DEFAULT 'system',
          updated_by TEXT DEFAULT 'system',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          -- Constraints
          CHECK (entity_type IN ('project', 'phase', 'task', 'subtask', 'issue', 'epic', 'specification', 'quality_report', 'review', 'approval')),
          CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled', 'ready_for_review', 'in_review', 'approved')),
          CHECK (priority IN ('low', 'medium', 'high', 'critical')),
          CHECK (progress >= 0 AND progress <= 100)
        )
      `);
      
      // Step 2: Copy data (excluding redundant columns), with COALESCE for safety
      this.db.exec(`
        INSERT INTO entities_new (
          id, entity_type, board_id, title, description, status, priority,
          assignee, estimated_hours, actual_hours, progress, completion_date,
          sort_order, metadata, attributes, labels, dependencies,
          created_by, updated_by, created_at, updated_at
        )
        SELECT 
          id, entity_type, board_id, title, description, status, 
          COALESCE(priority, 'medium') as priority,
          assignee, estimated_hours, actual_hours, COALESCE(progress, 0) as progress, completion_date,
          COALESCE(sort_order, 0) as sort_order, 
          COALESCE(metadata, '{}') as metadata, 
          COALESCE(attributes, '{}') as attributes, 
          COALESCE(labels, '[]') as labels, 
          COALESCE(dependencies, '[]') as dependencies,
          COALESCE(created_by, 'system') as created_by, 
          COALESCE(updated_by, 'system') as updated_by, 
          created_at, updated_at
        FROM entities
      `);
      
      // Step 3: Drop old table and rename new one
      this.db.exec(`DROP TABLE entities`);
      this.db.exec(`ALTER TABLE entities_new RENAME TO entities`);
      
      console.log('✅ Redundant columns removed');
    });
    
    transaction();
  }

  /**
   * Drop legacy empty tables
   */
  dropLegacyTables() {
    console.log('\n🗑️  Dropping legacy empty tables...');
    
    const legacyTables = ['tasks', 'phases', 'issues'];
    
    for (const table of legacyTables) {
      try {
        // Check if table exists and is empty
        const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        
        if (count.count === 0) {
          this.db.exec(`DROP TABLE IF EXISTS ${table}`);
          console.log(`✅ Dropped empty table: ${table}`);
        } else {
          console.log(`⚠️  Skipping ${table}: contains ${count.count} records`);
        }
      } catch (error) {
        console.log(`⚠️  Table ${table} does not exist or already dropped`);
      }
    }
  }

  /**
   * Add performance indexes for relationship queries
   */
  addPerformanceIndexes() {
    console.log('\n⚡ Adding performance indexes...');
    
    const indexes = [
      // Existing indexes should already be there, but let's ensure
      `CREATE INDEX IF NOT EXISTS idx_relationships_source_type ON entity_relationships(source_entity_id, relationship_type)`,
      `CREATE INDEX IF NOT EXISTS idx_relationships_target_type ON entity_relationships(target_entity_id, relationship_type)`,
      `CREATE INDEX IF NOT EXISTS idx_relationships_active_type ON entity_relationships(is_active, relationship_type)`,
      
      // New indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_entities_type_status ON entities(entity_type, status)`,
      `CREATE INDEX IF NOT EXISTS idx_entities_board ON entities(board_id)`,
      `CREATE INDEX IF NOT EXISTS idx_entities_sort ON entities(sort_order, created_at)`,
    ];
    
    indexes.forEach(indexSql => {
      this.db.exec(indexSql);
    });
    
    console.log('✅ Performance indexes added');
  }

  /**
   * Update schema.sql file to reflect changes
   */
  updateSchemaFile() {
    console.log('\n📝 Updating schema.sql file...');
    
    const schemaPath = path.resolve(__dirname, '../src/lib/database/schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      let schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Remove parent_id, hierarchy_path, and level from entities table definition
      schema = schema.replace(/\s*parent_id TEXT[^,\n]*,?\n/g, '\n');
      schema = schema.replace(/\s*hierarchy_path TEXT[^,\n]*,?\n/g, '\n');
      schema = schema.replace(/\s*level INTEGER[^,\n]*,?\n/g, '\n');
      
      // Remove foreign key constraint for parent_id
      schema = schema.replace(/\s*FOREIGN KEY \(parent_id\) REFERENCES entities\(id\)[^,\n]*,?\n/g, '\n');
      
      // Remove legacy table definitions
      schema = schema.replace(/-- Tasks.*?CREATE TABLE IF NOT EXISTS tasks.*?;/gs, '-- Legacy tasks table removed');
      schema = schema.replace(/-- Phases.*?CREATE TABLE IF NOT EXISTS phases.*?;/gs, '-- Legacy phases table removed');
      schema = schema.replace(/-- Issues.*?CREATE TABLE IF NOT EXISTS issues.*?;/gs, '-- Legacy issues table removed');
      
      // Clean up extra commas and whitespace
      schema = schema.replace(/,\s*,/g, ',');
      schema = schema.replace(/,(\s*\))/g, '$1');
      
      fs.writeFileSync(schemaPath, schema);
      console.log('✅ Schema file updated');
    } else {
      console.log('⚠️  Schema file not found, skipping update');
    }
  }

  /**
   * Verify migration success
   */
  verifyMigration() {
    console.log('\n✅ Verifying migration success...');
    
    // Check new table structure
    const tableInfo = this.db.prepare(`PRAGMA table_info(entities)`).all();
    const columns = tableInfo.map(col => col.name);
    
    console.log('New entities table columns:');
    columns.forEach(col => console.log(`  - ${col}`));
    
    // Verify redundant columns are gone
    const hasParentId = columns.includes('parent_id');
    const hasHierarchyPath = columns.includes('hierarchy_path');
    const hasLevel = columns.includes('level');
    
    if (hasParentId || hasHierarchyPath || hasLevel) {
      throw new Error('Migration failed: redundant columns still exist');
    }
    
    // Test that data is still accessible
    const entityCount = this.db.prepare(`SELECT COUNT(*) as count FROM entities`).get();
    const relationshipCount = this.db.prepare(`SELECT COUNT(*) as count FROM entity_relationships`).get();
    
    console.log(`Entities: ${entityCount.count}`);
    console.log(`Relationships: ${relationshipCount.count}`);
    
    // Test a relationship query still works
    this.testRelationshipQueries();
    
    console.log('✅ Migration verification complete');
  }

  /**
   * Run the complete migration
   */
  async runMigration() {
    try {
      console.log('🚀 Starting Database Migration: Remove Redundant Fields\n');
      
      // Step 1: Create backup
      this.createBackup();
      
      // Step 2: Initialize database
      this.initDb();
      
      // Step 3: Verify current state
      const currentState = this.verifyCurrentState();
      
      if (currentState.relationshipCount === 0) {
        throw new Error('No relationships found! Run the hierarchy fix script first.');
      }
      
      // Step 4: Test relationship queries
      this.testRelationshipQueries();
      
      // Step 5: Fix data issues
      this.fixDataIssues();
      
      // Step 6: Remove redundant columns
      this.removeRedundantColumns();
      
      // Step 7: Drop legacy tables
      this.dropLegacyTables();
      
      // Step 8: Add performance indexes
      this.addPerformanceIndexes();
      
      // Step 9: Update schema file
      this.updateSchemaFile();
      
      // Step 10: Verify migration
      this.verifyMigration();
      
      console.log('\n🎉 Database migration completed successfully!');
      console.log('\nSummary:');
      console.log('  ✅ Removed parent_id column from entities table');
      console.log('  ✅ Removed hierarchy_path column from entities table');
      console.log('  ✅ Removed level column from entities table');
      console.log('  ✅ Dropped empty legacy tables');
      console.log('  ✅ Added performance indexes');
      console.log('  ✅ Updated schema.sql file');
      console.log('  ✅ All functionality verified working');
      console.log(`\n💾 Backup available at: ${this.backupPath}`);
      
      return {
        success: true,
        backupPath: this.backupPath
      };
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      console.log(`\n🔄 To restore from backup:\n  cp "${this.backupPath}" "${this.dbPath}"`);
      
      return {
        success: false,
        error: error.message,
        backupPath: this.backupPath
      };
    } finally {
      if (this.db) {
        this.db.pragma('foreign_keys = ON'); // Re-enable FK constraints
        this.db.close();
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const migration = new DatabaseMigration();
  migration.runMigration()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Ready to test the fully refactored system!');
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

module.exports = DatabaseMigration;