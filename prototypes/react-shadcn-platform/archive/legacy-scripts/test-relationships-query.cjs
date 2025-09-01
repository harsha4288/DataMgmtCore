#!/usr/bin/env node

// Test GraphQL relationships query directly

const GRAPHQL_URL = 'http://localhost:3004/graphql';

const query = `
query GetTaskWithRelationships($taskId: ID!) {
  getTask(id: $taskId) {
    id
    name
    status
    progress
    description
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
    documents {
      id
      title
      documentType
      version
      filePath
      createdAt
    }
  }
}
`;

async function testRelationshipsQuery() {
  try {
    console.log('🧪 Testing GraphQL relationships query...');
    
    // Use global fetch (available in Node.js 18+)
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          taskId: 'TASK-1482'
        }
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
    
    const task = result.data.getTask;
    console.log('\n📋 Task Details:');
    console.log(`ID: ${task.id}`);
    console.log(`Name: ${task.name}`);
    console.log(`Status: ${task.status}`);
    console.log(`Progress: ${task.progress}%`);

    console.log('\n📄 Documents:', task.documents?.length || 0);
    if (task.documents && task.documents.length > 0) {
      task.documents.forEach(doc => {
        console.log(`  • ${doc.title} (${doc.documentType} ${doc.version})`);
        console.log(`    ID: ${doc.id}`);
        console.log(`    File: ${doc.filePath || ''}`);
        console.log(`    Created: ${new Date(parseInt(doc.createdAt)).toLocaleString()}`);
      });
    }

    console.log('\n🔗 Relationships:', task.relationships?.length || 0);
    if (task.relationships && task.relationships.length > 0) {
      task.relationships.forEach(rel => {
        console.log(`  • ${rel.sourceEntityId} → ${rel.targetEntityId}`);
        console.log(`    Type: ${rel.relationshipType}`);
        console.log(`    ID: ${rel.id}`);
        console.log(`    Strength: ${rel.strength}`);
        console.log(`    Impact Score: ${rel.impactScore}`);
        console.log(`    Active: ${rel.isActive}`);
        console.log(`    Bidirectional: ${rel.isBidirectional}`);
        if (rel.context) console.log(`    Context: ${rel.context}`);
        if (rel.tags && rel.tags.length > 0) console.log(`    Tags: ${rel.tags.join(', ')}`);
        if (rel.notes) console.log(`    Notes: ${rel.notes}`);
      });
    } else {
      console.log('  No relationships found');
    }

  } catch (error) {
    console.error('❌ Error testing GraphQL query:', error.message);
  }
}

testRelationshipsQuery();