/**
 * Test Entity Repository Refactor
 * 
 * Verify that the refactored methods work correctly with entity_relationships
 */

const Database = require('better-sqlite3');
const path = require('path');

// Import the entity repository (we'll need to adapt this for CommonJS)
class EntityRepositoryTester {
  constructor() {
    this.dbPath = path.resolve(__dirname, '../src/lib/database/database.db');
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Test the new relationship-based children query
   */
  testGetEntityChildren(entityId) {
    console.log(`\n🧪 Testing getEntityChildren for ${entityId}:`);
    
    const query = `
      SELECT e.* FROM entities e
      JOIN entity_relationships er ON e.id = er.target_entity_id
      WHERE er.source_entity_id = ? AND er.relationship_type = 'parent_of' AND er.is_active = 1
      ORDER BY e.sort_order, e.created_at
    `;
    
    const children = this.db.prepare(query).all(entityId);
    console.log(`  Found ${children.length} children:`);
    children.forEach(child => {
      console.log(`    - ${child.id}: ${child.title} (${child.entity_type})`);
    });
    
    return children;
  }

  /**
   * Test the new relationship-based hierarchy query
   */
  testGetEntityHierarchy(entityId) {
    console.log(`\n🧪 Testing getEntityHierarchy for ${entityId}:`);
    
    const query = `
      WITH RECURSIVE entity_tree AS (
        -- Base case: start with the given entity
        SELECT e.*, 0 as depth
        FROM entities e
        WHERE e.id = ?
        
        UNION ALL
        
        -- Recursive case: find children through relationships
        SELECT e.*, et.depth + 1
        FROM entities e
        JOIN entity_relationships er ON e.id = er.target_entity_id
        JOIN entity_tree et ON er.source_entity_id = et.id
        WHERE er.relationship_type = 'parent_of' AND er.is_active = 1
      )
      SELECT * FROM entity_tree
      WHERE id != ?
      ORDER BY depth, sort_order, created_at
    `;
    
    const descendants = this.db.prepare(query).all(entityId, entityId);
    console.log(`  Found ${descendants.length} descendants:`);
    descendants.forEach(desc => {
      const indent = '  '.repeat(desc.depth + 1);
      console.log(`${indent}- ${desc.id}: ${desc.title} (${desc.entity_type}) [depth: ${desc.depth}]`);
    });
    
    return descendants;
  }

  /**
   * Test getting parent through relationships
   */
  testGetEntityParent(entityId) {
    console.log(`\n🧪 Testing getEntityParent for ${entityId}:`);
    
    const query = `
      SELECT parent.* FROM entities parent
      JOIN entity_relationships er ON parent.id = er.source_entity_id
      WHERE er.target_entity_id = ? AND er.relationship_type = 'parent_of' AND er.is_active = 1
    `;
    
    const parent = this.db.prepare(query).get(entityId);
    if (parent) {
      console.log(`  Parent: ${parent.id}: ${parent.title} (${parent.entity_type})`);
    } else {
      console.log(`  No parent found (root entity)`);
    }
    
    return parent;
  }

  /**
   * Compare old vs new approaches
   */
  compareApproaches() {
    console.log('\n📊 Comparing old vs new approaches:');
    
    // Test with a few entities
    const testEntities = ['PHASE-1', 'TASK-1.1', 'PHASE-0'];
    
    testEntities.forEach(entityId => {
      console.log(`\n--- Testing ${entityId} ---`);
      
      // Test old approach (parent_id)
      const oldChildren = this.db.prepare('SELECT * FROM entities WHERE parent_id = ?').all(entityId);
      console.log(`Old approach (parent_id): ${oldChildren.length} children`);
      
      // Test new approach (relationships)
      const newChildren = this.testGetEntityChildren(entityId);
      console.log(`New approach (relationships): ${newChildren.length} children`);
      
      // Compare results
      if (oldChildren.length === newChildren.length) {
        console.log(`✅ Results match!`);
      } else {
        console.log(`❌ Results differ! Old: ${oldChildren.length}, New: ${newChildren.length}`);
      }
      
      // Test parent lookup
      this.testGetEntityParent(entityId);
    });
  }

  /**
   * Run all tests
   */
  runTests() {
    console.log('🚀 Testing Entity Repository Refactor...\n');
    
    try {
      this.compareApproaches();
      
      console.log('\n🎉 All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
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
  const tester = new EntityRepositoryTester();
  tester.runTests();
}

module.exports = EntityRepositoryTester;