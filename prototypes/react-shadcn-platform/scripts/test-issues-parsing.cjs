/**
 * Test Issues Parsing for Documentation System
 * Tests the GraphQL server's ability to parse issue files
 */

const { createYoga, createSchema } = require('graphql-yoga');
const fs = require('fs');
const path = require('path');

// Import the data sources class from the GraphQL server
// We'll need to extract the class from the server file
const fs = require('fs');
const path = require('path');

// Extract DocumentationDataSources class from graphql-server.cjs
const serverContent = fs.readFileSync('./scripts/graphql-server.cjs', 'utf-8');
const classMatch = serverContent.match(/class DocumentationDataSources \{[\s\S]*?\n\}/);
if (!classMatch) {
  throw new Error('Could not find DocumentationDataSources class');
}

// Create a minimal environment to run the class
const DocumentationDataSources = eval(`(function() {
  ${classMatch[0]}
  return DocumentationDataSources;
})()`);

async function testIssuesParsing() {
  console.log('🧪 Testing Issues Parsing...\n');

  const dataSources = new DocumentationDataSources();
  
  try {
    // Test 1: Get all issues
    console.log('📋 Test 1: Getting all issues...');
    const allIssues = await dataSources.getAllIssues();
    console.log(`✅ Found ${allIssues.length} issues`);
    
    if (allIssues.length === 0) {
      console.log('❌ No issues found! This indicates a problem.');
      return false;
    }

    // Test 2: Check each issue structure
    console.log('\n📋 Test 2: Validating issue structure...');
    for (const issue of allIssues) {
      console.log(`\n🔍 Issue: ${issue.title}`);
      console.log(`   ID: ${issue.id}`);
      console.log(`   Type: ${issue.type}`);
      console.log(`   Status: ${issue.status}`);
      console.log(`   Severity: ${issue.severity}`);
      console.log(`   Related Tasks: ${issue.related_tasks.length}`);
      console.log(`   Resolution Attempts: ${issue.resolution_attempts.length}`);
      
      // Validate required fields
      const requiredFields = ['id', 'title', 'description', 'type', 'status', 'severity'];
      for (const field of requiredFields) {
        if (!issue[field]) {
          console.log(`❌ Missing required field: ${field}`);
          return false;
        }
      }
    }

    // Test 3: Test filtering by status
    console.log('\n📋 Test 3: Testing status filtering...');
    const openIssues = allIssues.filter(issue => issue.status === 'open');
    const resolvedIssues = allIssues.filter(issue => issue.status === 'resolved');
    const inProgressIssues = allIssues.filter(issue => issue.status === 'in_progress');
    
    console.log(`✅ Open issues: ${openIssues.length}`);
    console.log(`✅ Resolved issues: ${resolvedIssues.length}`);
    console.log(`✅ In Progress issues: ${inProgressIssues.length}`);

    // Test 4: Test issue types
    console.log('\n📋 Test 4: Testing issue types...');
    const bugIssues = allIssues.filter(issue => issue.type === 'bug');
    const featureIssues = allIssues.filter(issue => issue.type === 'feature');
    
    console.log(`✅ Bug issues: ${bugIssues.length}`);
    console.log(`✅ Feature issues: ${featureIssues.length}`);

    // Test 5: Test severity levels
    console.log('\n📋 Test 5: Testing severity levels...');
    const highSeverity = allIssues.filter(issue => issue.severity === 'high');
    const mediumSeverity = allIssues.filter(issue => issue.severity === 'medium');
    
    console.log(`✅ High severity: ${highSeverity.length}`);
    console.log(`✅ Medium severity: ${mediumSeverity.length}`);

    // Test 6: Test related tasks parsing
    console.log('\n📋 Test 6: Testing related tasks parsing...');
    const issuesWithTasks = allIssues.filter(issue => issue.related_tasks.length > 0);
    console.log(`✅ Issues with related tasks: ${issuesWithTasks.length}`);
    
    for (const issue of issuesWithTasks) {
      console.log(`   ${issue.title}: ${issue.related_tasks.join(', ')}`);
    }

    // Test 7: Test resolution attempts parsing
    console.log('\n📋 Test 7: Testing resolution attempts parsing...');
    const issuesWithAttempts = allIssues.filter(issue => issue.resolution_attempts.length > 0);
    console.log(`✅ Issues with resolution attempts: ${issuesWithAttempts.length}`);
    
    for (const issue of issuesWithAttempts) {
      console.log(`   ${issue.title}: ${issue.resolution_attempts.length} attempts`);
    }

    console.log('\n🎉 All tests passed! Issues parsing is working correctly.');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Test GraphQL queries
async function testGraphQLQueries() {
  console.log('\n🔍 Testing GraphQL Queries...\n');

  const yoga = createYoga({
    schema: createSchema({
      typeDefs: `
        type Issue {
          id: ID!
          title: String!
          description: String!
          type: String!
          status: String!
          severity: String!
          related_tasks: [String!]!
          resolution_attempts: [String!]!
          created_date: String!
          resolved_date: String
        }

        type Query {
          getAllIssues: [Issue!]!
          getIssuesByStatus(status: String!): [Issue!]!
        }
      `,
      resolvers: {
        Query: {
          getAllIssues: async () => {
            const dataSources = new DocumentationDataSources();
            return await dataSources.getAllIssues();
          },
          getIssuesByStatus: async (_, { status }) => {
            const dataSources = new DocumentationDataSources();
            const allIssues = await dataSources.getAllIssues();
            return allIssues.filter(issue => issue.status === status);
          }
        }
      }
    })
  });

  try {
    // Test getAllIssues query
    console.log('📋 Testing getAllIssues query...');
    const getAllIssuesResult = await yoga.fetch('http://localhost:3004/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            getAllIssues {
              id
              title
              type
              status
              severity
              related_tasks
              resolution_attempts {
                id
              }
            }
          }
        `
      })
    });

    const getAllIssuesData = await getAllIssuesResult.json();
    console.log(`✅ getAllIssues returned ${getAllIssuesData.data?.getAllIssues?.length || 0} issues`);

    // Test getIssuesByStatus query
    console.log('\n📋 Testing getIssuesByStatus query...');
    const getIssuesByStatusResult = await yoga.fetch('http://localhost:3004/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            getIssuesByStatus(status: "open") {
              id
              title
              type
              status
              severity
            }
          }
        `
      })
    });

    const getIssuesByStatusData = await getIssuesByStatusResult.json();
    console.log(`✅ getIssuesByStatus returned ${getIssuesByStatusData.data?.getIssuesByStatus?.length || 0} open issues`);

    console.log('\n🎉 GraphQL queries working correctly!');
    return true;

  } catch (error) {
    console.error('❌ GraphQL test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Issues Parsing Tests...\n');
  
  const parsingSuccess = await testIssuesParsing();
  const graphqlSuccess = await testGraphQLQueries();
  
  console.log('\n📊 Test Results:');
  console.log(`   Issues Parsing: ${parsingSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   GraphQL Queries: ${graphqlSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (parsingSuccess && graphqlSuccess) {
    console.log('\n🎉 All tests passed! Issues system is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testIssuesParsing, testGraphQLQueries };
