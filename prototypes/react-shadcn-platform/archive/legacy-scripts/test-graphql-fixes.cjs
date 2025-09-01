// Test GraphQL fixes for documents and relationships
async function testGraphQLFixes() {
  try {
    // Test documents count
    const documentsQuery = `
      query {
        getTask(id: "TASK-1482") {
          id
          name
          documents {
            id
            title
            documentType
            isActive
          }
        }
      }
    `;
    
    const docsResponse = await fetch('http://localhost:3004/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: documentsQuery })
    });
    
    const docsData = await docsResponse.json();
    console.log('=== DOCUMENTS QUERY RESULT ===');
    console.log('Task:', docsData.data?.getTask?.name);
    console.log('Documents count:', docsData.data?.getTask?.documents?.length);
    docsData.data?.getTask?.documents?.forEach((doc, i) => {
      console.log(`${i+1}. ${doc.title} (${doc.documentType}) - Active: ${doc.isActive}`);
    });
    
    // Test relationships
    const relationshipsQuery = `
      query {
        getTask(id: "TASK-1482") {
          id
          name
          relationships {
            id
            relationshipType
            sourceEntityId
            targetEntityId
            strength
            notes
          }
        }
      }
    `;
    
    const relsResponse = await fetch('http://localhost:3004/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: relationshipsQuery })
    });
    
    const relsData = await relsResponse.json();
    console.log('\n=== RELATIONSHIPS QUERY RESULT ===');
    console.log('Task:', relsData.data?.getTask?.name);
    console.log('Relationships count:', relsData.data?.getTask?.relationships?.length);
    relsData.data?.getTask?.relationships?.forEach((rel, i) => {
      console.log(`${i+1}. ${rel.relationshipType}: ${rel.sourceEntityId} -> ${rel.targetEntityId}`);
      console.log(`   Strength: ${rel.strength} | ${rel.notes}`);
    });
    
    if (relsData.errors) {
      console.log('\nGraphQL Errors:', relsData.errors);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGraphQLFixes();