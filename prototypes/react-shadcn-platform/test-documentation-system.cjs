/**
 * Comprehensive Documentation System Unit Tests
 * Tests each component individually to identify NULL value issues
 */

const fs = require('fs');
const path = require('path');

async function runComprehensiveTests() {
  console.log('🧪 Comprehensive Documentation System Tests');
  console.log('===========================================\n');

  const testResults = {
    graphql: { passed: 0, failed: 0, errors: [] },
    validation: { passed: 0, failed: 0, errors: [] },
    parsing: { passed: 0, failed: 0, errors: [] },
    integration: { passed: 0, failed: 0, errors: [] }
  };

  try {
    // Test 1: GraphQL Server Health
    console.log('🔍 Test 1: GraphQL Server Health Check');
    console.log('--------------------------------------');
    await testGraphQLHealth(testResults);

    // Test 2: Data Parsing
    console.log('\n📄 Test 2: Markdown File Parsing');
    console.log('----------------------------------');
    await testMarkdownParsing(testResults);

    // Test 3: GraphQL Queries
    console.log('\n🔍 Test 3: GraphQL Query Testing');
    console.log('---------------------------------');
    await testGraphQLQueries(testResults);

    // Test 4: Validation System
    console.log('\n✅ Test 4: Validation System Testing');
    console.log('------------------------------------');
    await testValidationSystem(testResults);

    // Test 5: Integration Tests
    console.log('\n🔗 Test 5: Integration Tests');
    console.log('----------------------------');
    await testIntegration(testResults);

    // Summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    printTestSummary(testResults);

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error(error.stack);
  }
}

async function testGraphQLHealth(results) {
  try {
    const response = await fetch('http://localhost:3004/health');
    if (response.ok) {
      console.log('✅ GraphQL server is healthy');
      results.graphql.passed++;
    } else {
      console.log('❌ GraphQL server health check failed');
      results.graphql.failed++;
      results.graphql.errors.push('Health check failed');
    }
  } catch (error) {
    console.log('❌ GraphQL server not reachable:', error.message);
    results.graphql.failed++;
    results.graphql.errors.push(`Server not reachable: ${error.message}`);
  }
}

async function testMarkdownParsing(results) {
  const docsPath = path.join(__dirname, 'docs', 'progress');
  
  try {
    // Test phase directory parsing
    const phases = fs.readdirSync(docsPath).filter(dir => dir.startsWith('phase-'));
    console.log(`✅ Found ${phases.length} phase directories`);

    // Test individual phase parsing
    for (const phaseDir of phases.slice(0, 3)) { // Test first 3 phases
      const phasePath = path.join(docsPath, phaseDir);
      const readmePath = path.join(phasePath, 'README.md');
      
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');
        const nameMatch = content.match(/^# (.+)$/m);
        const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m);
        
        console.log(`✅ Phase ${phaseDir}: ${nameMatch ? nameMatch[1] : 'No name found'}`);
        console.log(`   Status: ${statusMatch ? statusMatch[1] : 'No status found'}`);
        
        // Test task files in phase
        const taskFiles = fs.readdirSync(phasePath).filter(f => f.endsWith('.md') && f !== 'README.md');
        console.log(`   Tasks: ${taskFiles.length} found`);
        
        for (const taskFile of taskFiles.slice(0, 2)) { // Test first 2 tasks
          const taskPath = path.join(phasePath, taskFile);
          const taskContent = fs.readFileSync(taskPath, 'utf-8');
          
          const taskNameMatch = taskContent.match(/^# (.+)$/m);
          const taskStatusMatch = taskContent.match(/\*\*Status:\*\* (.+)$/m);
          const taskProgressMatch = taskContent.match(/\*\*Progress:\*\* (\d+)%/);
          
          console.log(`     Task ${taskFile}: ${taskNameMatch ? taskNameMatch[1] : 'No name'}`);
          console.log(`       Status: ${taskStatusMatch ? taskStatusMatch[1] : 'No status'}`);
          console.log(`       Progress: ${taskProgressMatch ? taskProgressMatch[1] + '%' : 'No progress'}`);
          
          if (!taskNameMatch || !taskStatusMatch || !taskProgressMatch) {
            results.parsing.failed++;
            results.parsing.errors.push(`Incomplete task data in ${taskFile}`);
          } else {
            results.parsing.passed++;
          }
        }
      } else {
        console.log(`❌ No README.md found in ${phaseDir}`);
        results.parsing.failed++;
        results.parsing.errors.push(`Missing README.md in ${phaseDir}`);
      }
    }
  } catch (error) {
    console.log('❌ Markdown parsing test failed:', error.message);
    results.parsing.failed++;
    results.parsing.errors.push(`Parsing error: ${error.message}`);
  }
}

async function testGraphQLQueries(results) {
  const graphqlUrl = 'http://localhost:3004/graphql';
  
  const queries = [
    {
      name: 'Project Stats',
      query: `
        query GetProjectStats {
          getProjectStats {
            total_phases
            total_tasks
            total_issues
            completed_tasks
            in_progress_tasks
            completion_percentage
          }
        }
      `
    },
    {
      name: 'All Phases',
      query: `
        query GetAllPhases {
          getAllPhases {
            id
            name
            status
            progress
            tasks {
              id
              name
              status
              progress
            }
          }
        }
      `
    },
    {
      name: 'All Tasks',
      query: `
        query GetAllTasks {
          getAllTasks {
            id
            name
            status
            progress
            metadata {
              status
              priority
            }
          }
        }
      `
    }
  ];

  for (const queryTest of queries) {
    try {
      console.log(`Testing ${queryTest.name}...`);
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryTest.query })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.data) {
          console.log(`✅ ${queryTest.name} returned data`);
          
          // Check for null values
          const nullValues = findNullValues(result.data);
          if (nullValues.length > 0) {
            console.log(`⚠️  Found null values in ${queryTest.name}:`, nullValues);
            results.graphql.failed++;
            results.graphql.errors.push(`Null values in ${queryTest.name}: ${nullValues.join(', ')}`);
          } else {
            console.log(`✅ No null values found in ${queryTest.name}`);
            results.graphql.passed++;
          }
          
          // Log sample data
          console.log(`   Sample data:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
        } else {
          console.log(`❌ ${queryTest.name} returned no data`);
          results.graphql.failed++;
          results.graphql.errors.push(`No data returned for ${queryTest.name}`);
        }
      } else {
        console.log(`❌ ${queryTest.name} request failed: ${response.status}`);
        results.graphql.failed++;
        results.graphql.errors.push(`${queryTest.name} failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${queryTest.name} test failed:`, error.message);
      results.graphql.failed++;
      results.graphql.errors.push(`${queryTest.name} error: ${error.message}`);
    }
  }
}

async function testValidationSystem(results) {
  const validationUrl = 'http://localhost:3005';
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${validationUrl}/health`);
    if (healthResponse.ok) {
      console.log('✅ Validation server is healthy');
      results.validation.passed++;
    } else {
      console.log('❌ Validation server health check failed');
      results.validation.failed++;
      results.validation.errors.push('Health check failed');
    }

    // Test task validation
    const testTask = {
      id: 'task-test-1',
      name: 'Test Task',
      description: 'This is a test task for validation',
      phase_id: 'phase-1',
      metadata: {
        status: 'completed',
        priority: 'high',
        labels: ['test', 'validation']
      },
      subtasks: [
        { name: 'Subtask 1', completed: true },
        { name: 'Subtask 2', completed: false }
      ]
    };

    const validationResponse = await fetch(`${validationUrl}/validate/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: testTask })
    });

    if (validationResponse.ok) {
      const validationResult = await validationResponse.json();
      console.log('✅ Task validation successful');
      console.log(`   Quality Score: ${validationResult.score}/100`);
      console.log(`   Issues: ${validationResult.summary.errors} errors, ${validationResult.summary.warnings} warnings`);
      results.validation.passed++;
    } else {
      console.log('❌ Task validation failed');
      results.validation.failed++;
      results.validation.errors.push('Task validation failed');
    }

  } catch (error) {
    console.log('❌ Validation system test failed:', error.message);
    results.validation.failed++;
    results.validation.errors.push(`Validation error: ${error.message}`);
  }
}

async function testIntegration(results) {
  try {
    // Test complete workflow
    console.log('Testing complete workflow...');
    
    // 1. Get project stats
    const statsResponse = await fetch('http://localhost:3004/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'query { getProjectStats { total_tasks completed_tasks completion_percentage } }'
      })
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Project stats retrieved successfully');
      
      // 2. Validate the data
      if (stats.data && stats.data.getProjectStats) {
        const projectStats = stats.data.getProjectStats;
        console.log(`   Total tasks: ${projectStats.total_tasks}`);
        console.log(`   Completed tasks: ${projectStats.completed_tasks}`);
        console.log(`   Completion percentage: ${projectStats.completion_percentage}%`);
        
        if (projectStats.total_tasks > 0 && projectStats.completed_tasks === 0) {
          console.log('⚠️  Warning: Tasks found but none marked as completed');
          results.integration.failed++;
          results.integration.errors.push('No completed tasks found despite having tasks');
        } else {
          results.integration.passed++;
        }
      } else {
        console.log('❌ No project stats data returned');
        results.integration.failed++;
        results.integration.errors.push('No project stats data');
      }
    } else {
      console.log('❌ Failed to get project stats');
      results.integration.failed++;
      results.integration.errors.push('Failed to get project stats');
    }

  } catch (error) {
    console.log('❌ Integration test failed:', error.message);
    results.integration.failed++;
    results.integration.errors.push(`Integration error: ${error.message}`);
  }
}

function findNullValues(obj, path = '') {
  const nulls = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (value === null || value === undefined) {
      nulls.push(currentPath);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          nulls.push(...findNullValues(item, `${currentPath}[${index}]`));
        }
      });
    } else if (typeof value === 'object') {
      nulls.push(...findNullValues(value, currentPath));
    }
  }
  
  return nulls;
}

function printTestSummary(results) {
  const totalTests = Object.values(results).reduce((sum, category) => 
    sum + category.passed + category.failed, 0);
  const totalPassed = Object.values(results).reduce((sum, category) => 
    sum + category.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, category) => 
    sum + category.failed, 0);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed} ✅`);
  console.log(`Failed: ${totalFailed} ❌`);
  console.log(`Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);

  console.log('\n📋 Detailed Results:');
  Object.entries(results).forEach(([category, result]) => {
    const categoryTotal = result.passed + result.failed;
    const successRate = categoryTotal > 0 ? ((result.passed / categoryTotal) * 100).toFixed(1) : 0;
    console.log(`${category.toUpperCase()}: ${result.passed}/${categoryTotal} (${successRate}%)`);
    
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.join(', ')}`);
    }
  });

  if (totalFailed > 0) {
    console.log('\n🔧 Recommendations:');
    console.log('1. Check GraphQL server logs for parsing errors');
    console.log('2. Verify markdown file formats match expected patterns');
    console.log('3. Ensure all required fields are present in task files');
    console.log('4. Check validation server configuration');
  }
}

// Run the comprehensive tests
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests };