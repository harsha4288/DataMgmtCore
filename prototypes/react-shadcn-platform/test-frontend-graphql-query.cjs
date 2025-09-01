#!/usr/bin/env node

// Test the updated frontend GraphQL query to ensure relationships are included

const GRAPHQL_URL = 'http://localhost:3004/graphql';

const PHASES_QUERY = `
  query GetAllPhasesWithTasks {
    getAllPhases {
      id
      name
      description
      status
      progress
      tasks {
        id
        name
        description
        status
        progress
        documents {
          id
          taskId
          title
          documentType
          filePath
          version
        }
        subtasks {
          id
          name
          completed
        }
        relationships {
          id
          sourceEntityId
          targetEntityId
          relationshipType
          strength
          impactScore
          isActive
          isBidirectional
          reverseType
          context
          tags
          notes
        }
      }
    }
  }
`;

async function testFrontendQuery() {
  try {
    console.log('🧪 Testing frontend GraphQL query with relationships...');
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: PHASES_QUERY,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return;
    }

    console.log('✅ GraphQL query successful!');
    
    const phases = result.data.getAllPhases;
    console.log(`\n📊 Found ${phases.length} phases`);

    let totalTasksWithRelationships = 0;
    let totalRelationships = 0;

    phases.forEach(phase => {
      console.log(`\n📋 Phase: ${phase.name} (${phase.tasks.length} tasks)`);
      
      phase.tasks.forEach(task => {
        const relationshipsCount = task.relationships?.length || 0;
        if (relationshipsCount > 0) {
          totalTasksWithRelationships++;
          totalRelationships += relationshipsCount;
          
          console.log(`  🔗 ${task.name}: ${relationshipsCount} relationships`);
          task.relationships.forEach(rel => {
            console.log(`    • ${rel.sourceEntityId} → ${rel.targetEntityId} (${rel.relationshipType})`);
          });
        }
      });
    });

    console.log(`\n📈 Summary:`);
    console.log(`  • Tasks with relationships: ${totalTasksWithRelationships}`);
    console.log(`  • Total relationships: ${totalRelationships}`);
    
    if (totalRelationships > 0) {
      console.log('✅ Relationships are successfully included in the frontend query!');
    } else {
      console.log('⚠️ No relationships found in the data');
    }

  } catch (error) {
    console.error('❌ Error testing GraphQL query:', error.message);
  }
}

testFrontendQuery();