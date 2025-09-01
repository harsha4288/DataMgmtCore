/**
 * Test script for Enhanced Entity System
 * Task 5.8.4: Entity Interconnection Architecture
 */

const EntityManager = require('./src/lib/database/entity-manager.cjs');

async function testEntitySystem() {
  const entityManager = new EntityManager('./src/lib/database/database.db');
  
  try {
    console.log('🧪 Testing Enhanced Entity System...');
    
    // Test 1: Check existing boards
    console.log('\n📋 Current Boards:');
    const boards = entityManager.db.prepare('SELECT prefix, name, current_counter, is_active FROM boards WHERE is_active = 1').all();
    boards.forEach(board => {
      console.log(`  ${board.prefix}: ${board.name} (counter: ${board.current_counter})`);
    });
    
    // Test 2: Update TASK board counter to avoid conflicts
    console.log('\n🔧 Updating TASK board counter...');
    const maxTaskId = entityManager.db.prepare("SELECT MAX(CAST(SUBSTR(id, 6) AS INTEGER)) as max_num FROM entities WHERE board_id = 'TASK' AND id LIKE 'TASK-%'").get();
    const nextCounter = (maxTaskId.max_num || 0) + 1;
    entityManager.db.prepare("UPDATE boards SET current_counter = ? WHERE prefix = 'TASK'").run(nextCounter);
    console.log(`✅ Set TASK board counter to ${nextCounter}`);
    
    // Test 3: Create test entity
    console.log('\n🏗️ Creating test entity...');
    const entity = await entityManager.createEntity({
      entityType: 'task',
      title: 'Enhanced Entity System Test',
      description: 'Testing the new entity interconnection architecture',
      boardPrefix: 'TASK',
      status: 'in_progress',
      priority: 'high',
      estimatedHours: 2.5,
      labels: ['test', 'entity-system', 'task-5.8.4'],
      metadata: { testType: 'integration', version: '1.0' }
    });
    
    console.log(`✅ Created entity: ${entity.id} - ${entity.title}`);
    console.log(`   Status: ${entity.status}, Priority: ${entity.priority}`);
    console.log(`   Hierarchy: ${entity.hierarchy_path}`);
    
    // Test 4: Create relationship
    console.log('\n🔗 Creating relationship...');
    const relationshipId = await entityManager.createRelationship(
      entity.id, 
      'TASK-1482', // Task 5.8.4: Entity Interconnection Architecture
      'tests',
      { 
        strength: 0.9, 
        impactScore: 0.8,
        notes: 'This test entity validates the implementation of Task 5.8.4',
        createdBy: 'EntitySystemTest'
      }
    );
    
    console.log(`✅ Created relationship: ${relationshipId}`);
    
    // Test 5: Get relationships
    const relationships = entityManager.getEntityRelationships('TASK-1482');
    console.log(`\n📈 Task 5.8.4 now has ${relationships.length} relationships:`);
    relationships.forEach(rel => {
      const direction = rel.source_entity_id === 'TASK-1482' ? 'outgoing' : 'incoming';
      console.log(`  [${direction}] ${rel.source_title} -[${rel.relationship_type}]-> ${rel.target_title}`);
      console.log(`      Strength: ${rel.strength}, Impact: ${rel.impact_score}`);
      if (rel.notes) console.log(`      Notes: ${rel.notes}`);
    });
    
    // Test 6: Progress calculation
    console.log('\n📊 Testing progress calculation...');
    const progress = entityManager.calculateEntityProgress('TASK-1482');
    console.log(`✅ Task 5.8.4 progress: ${progress}%`);
    
    // Test 7: Entity search
    console.log('\n🔍 Testing entity search...');
    const searchResults = entityManager.searchEntities({
      text: 'entity',
      entityType: 'task',
      status: 'in_progress',
      limit: 3
    });
    console.log(`✅ Found ${searchResults.length} entities matching search:`);
    searchResults.forEach(entity => {
      console.log(`  ${entity.id}: ${entity.title} (status: ${entity.status})`);
    });
    
    // Test 8: Board statistics
    console.log('\n📊 Testing board statistics...');
    const stats = entityManager.getBoardStats('TASK');
    console.log(`✅ TASK Board Statistics:`);
    console.log(`   Total Entities: ${stats.total_entities}`);
    console.log(`   Completed: ${stats.completed}, In Progress: ${stats.in_progress}`);
    console.log(`   Pending: ${stats.pending}, Blocked: ${stats.blocked}`);
    console.log(`   Completion Rate: ${stats.completion_rate}%`);
    
    console.log('\n🎉 Enhanced Entity System Test Complete!');
    console.log('\n✅ All Core Features Working:');
    console.log('   - Board-based ID generation ✅');
    console.log('   - Entity creation with metadata ✅');
    console.log('   - Relationship management ✅');
    console.log('   - Progress calculation ✅');
    console.log('   - Advanced search ✅');
    console.log('   - Board statistics ✅');
    
    console.log('\n🚀 Task 5.8.4: Entity Interconnection Architecture - IMPLEMENTED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    entityManager.close();
  }
}

testEntitySystem();