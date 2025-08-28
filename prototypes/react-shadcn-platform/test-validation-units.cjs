#!/usr/bin/env node

/**
 * Test script for validation server unit tests
 */

// Test the regex patterns
function testRegexPatterns() {
  console.log('=== Testing Regex Patterns ===');
  
  const patterns = {
    task: /^task-\d+\.\d+-.+$/,
    phase: /^phase-\d+$/,
    issue: /^issue-.+$/
  };

  const testCases = [
    { type: 'phase', id: 'phase-0', expected: true },
    { type: 'phase', id: 'phase-1', expected: true },
    { type: 'phase', id: 'phase-10', expected: true },
    { type: 'phase', id: 'phase-abc', expected: false },
    { type: 'task', id: 'task-1.1-setup', expected: true },
    { type: 'task', id: 'task-5.8-test', expected: true },
    { type: 'task', id: 'task-invalid', expected: false },
    { type: 'issue', id: 'issue-bug-fix', expected: true },
    { type: 'issue', id: 'issue-', expected: false },
    { type: 'issue', id: 'not-issue', expected: false }
  ];

  let passed = 0;
  let total = testCases.length;

  testCases.forEach(test => {
    const pattern = patterns[test.type];
    const result = pattern.test(test.id);
    const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${status} ${test.type}: '${test.id}' - Expected: ${test.expected}, Got: ${result}`);
    
    if (result === test.expected) passed++;
  });

  console.log(`\nResults: ${passed}/${total} tests passed\n`);
  return passed === total;
}

// Test API endpoint responses
async function testAPIEndpoints() {
  console.log('=== Testing API Endpoints ===');
  
  try {
    const response = await fetch('http://localhost:3006/health');
    const data = await response.json();
    console.log('✅ Health endpoint:', data.status);
    
    // Test phase validation
    const phaseTest = await fetch('http://localhost:3006/validate/phase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          id: 'phase-1',
          name: 'Test Phase',
          description: 'This is a test phase with sufficient length'
        }
      })
    });
    
    const phaseResult = await phaseTest.json();
    console.log('Phase validation result:', JSON.stringify(phaseResult, null, 2));
    
    const hasIdFormatError = phaseResult.results.some(r => r.ruleId === 'id-format');
    if (hasIdFormatError) {
      console.log('❌ ISSUE: Phase ID format validation is failing for valid IDs');
      return false;
    } else {
      console.log('✅ Phase ID validation working correctly');
      return true;
    }
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Running Validation Server Unit Tests\n');
  
  const regexPass = testRegexPatterns();
  const apiPass = await testAPIEndpoints();
  
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Regex tests: ${regexPass ? 'PASSED' : 'FAILED'}`);
  console.log(`API tests: ${apiPass ? 'PASSED' : 'FAILED'}`);
  
  if (regexPass && apiPass) {
    console.log('✅ All validation server unit tests passed');
    return true;
  } else {
    console.log('❌ Some validation server unit tests failed');
    return false;
  }
}

runTests().catch(console.error);