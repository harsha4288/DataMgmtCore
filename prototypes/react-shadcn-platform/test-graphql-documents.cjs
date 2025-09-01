/**
 * Test GraphQL documents field for Task 5.8.4
 */

async function testGraphQLDocuments() {
  try {
    console.log('🧪 Testing GraphQL documents field...');
    
    // Query for a specific task to see if documents are included
    const taskQuery = `
      query GetTask {
        getTask(id: "TASK-1482") {
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
            createdAt
          }
        }
      }
    `;
    
    const response = await fetch('http://localhost:3004/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: taskQuery,
      }),
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
    console.log('\n📋 Task Details:');
    console.log(`ID: ${result.data.getTask.id}`);
    console.log(`Name: ${result.data.getTask.name}`);
    console.log(`Status: ${result.data.getTask.status}`);
    console.log(`Progress: ${result.data.getTask.progress}%`);
    
    console.log('\n📄 Documents:');
    if (result.data.getTask.documents && result.data.getTask.documents.length > 0) {
      result.data.getTask.documents.forEach(doc => {
        console.log(`  • ${doc.title} (${doc.documentType} v${doc.version})`);
        console.log(`    ID: ${doc.id}`);
        console.log(`    File: ${doc.filePath}`);
        console.log(`    Created: ${doc.createdAt}`);
      });
    } else {
      console.log('  No documents found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGraphQLDocuments();