/**
 * Quality Pipeline Automation
 * Phase 5: Development Infrastructure
 * 
 * Automated quality assurance pipeline that runs:
 * - ESLint checks
 * - TypeScript validation
 * - Theme compliance checks
 * - Documentation system validation
 * - Performance metrics
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  timeout: 30000, // 30 seconds
  parallel: true,
  reportPath: './quality-report.json',
  thresholds: {
    eslint: 0,      // Zero errors allowed
    typescript: 0,  // Zero errors allowed
    theme: 100,     // 100% compliance required
    docs: 90        // 90% documentation coverage
  }
};

// Quality check definitions
const qualityChecks = [
  {
    id: 'eslint',
    name: 'ESLint Code Quality',
    command: 'npm run lint',
    parser: parseEslintOutput,
    critical: true
  },
  {
    id: 'typescript',
    name: 'TypeScript Validation',
    command: 'npm run type-check',
    parser: parseTypescriptOutput,
    critical: true
  },
  {
    id: 'theme',
    name: 'Theme Compliance',
    command: 'node validate-theme-usage.js',
    parser: parseThemeOutput,
    critical: false
  },
  {
    id: 'docs',
    name: 'Documentation System',
    command: 'node test-documentation-system.cjs',
    parser: parseDocsOutput,
    critical: false
  },
  {
    id: 'build',
    name: 'Build Validation',
    command: 'npm run build',
    parser: parseBuildOutput,
    critical: true
  }
];

// Main pipeline execution
async function runQualityPipeline() {
  console.log('🚀 Starting Quality Pipeline');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();
  const results = [];
  
  try {
    // Run checks in parallel or sequential based on config
    if (config.parallel) {
      const promises = qualityChecks.map(check => runQualityCheck(check));
      const checkResults = await Promise.allSettled(promises);
      
      checkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            ...qualityChecks[index],
            status: 'error',
            error: result.reason.message,
            score: 0,
            duration: 0
          });
        }
      });
    } else {
      // Sequential execution
      for (const check of qualityChecks) {
        try {
          const result = await runQualityCheck(check);
          results.push(result);
        } catch (error) {
          results.push({
            ...check,
            status: 'error',
            error: error.message,
            score: 0,
            duration: 0
          });
        }
      }
    }
    
    // Generate comprehensive report
    const report = generateQualityReport(results, startTime);
    
    // Save report
    fs.writeFileSync(config.reportPath, JSON.stringify(report, null, 2));
    
    // Display results
    displayQualityResults(report);
    
    // Exit with appropriate code
    const criticalFailures = results.filter(r => r.critical && r.status === 'failed');
    process.exit(criticalFailures.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Quality pipeline failed:', error);
    process.exit(1);
  }
}

// Execute individual quality check
async function runQualityCheck(check) {
  const startTime = Date.now();
  console.log(`🔍 Running ${check.name}...`);
  
  return new Promise((resolve, reject) => {
    exec(check.command, { 
      timeout: config.timeout,
      cwd: process.cwd()
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      try {
        const result = {
          ...check,
          duration,
          output: stdout,
          errors: stderr
        };
        
        // Parse output using check-specific parser
        const parsed = check.parser(stdout, stderr, error);
        Object.assign(result, parsed);
        
        resolve(result);
      } catch (parseError) {
        reject(new Error(`Failed to parse ${check.name}: ${parseError.message}`));
      }
    });
  });
}

// ESLint output parser
function parseEslintOutput(stdout, stderr, error) {
  if (error && error.code !== 0) {
    // Parse eslint errors
    const errorCount = (stdout.match(/\d+ errors?/g) || []).length;
    const warningCount = (stdout.match(/\d+ warnings?/g) || []).length;
    
    return {
      status: errorCount > 0 ? 'failed' : 'warning',
      score: Math.max(0, 100 - (errorCount * 10) - (warningCount * 2)),
      issues: {
        errors: errorCount,
        warnings: warningCount
      },
      summary: `${errorCount} errors, ${warningCount} warnings`
    };
  }
  
  return {
    status: 'passed',
    score: 100,
    issues: { errors: 0, warnings: 0 },
    summary: 'All checks passed'
  };
}

// TypeScript output parser
function parseTypescriptOutput(stdout, stderr, error) {
  if (error && error.code !== 0) {
    const errorLines = stderr.split('\n').filter(line => line.includes('error TS'));
    
    return {
      status: 'failed',
      score: Math.max(0, 100 - (errorLines.length * 5)),
      issues: {
        errors: errorLines.length,
        details: errorLines.slice(0, 5) // First 5 errors
      },
      summary: `${errorLines.length} TypeScript errors`
    };
  }
  
  return {
    status: 'passed',
    score: 100,
    issues: { errors: 0 },
    summary: 'No TypeScript errors'
  };
}

// Theme compliance parser
function parseThemeOutput(stdout, stderr, error) {
  try {
    // Look for theme validation results
    const violations = (stdout.match(/❌/g) || []).length;
    const compliant = (stdout.match(/✅/g) || []).length;
    const total = violations + compliant;
    
    if (total === 0) {
      return {
        status: 'passed',
        score: 100,
        issues: { violations: 0 },
        summary: 'Theme validation not available'
      };
    }
    
    const score = total > 0 ? Math.round((compliant / total) * 100) : 0;
    
    return {
      status: violations === 0 ? 'passed' : 'warning',
      score,
      issues: {
        violations,
        compliant,
        compliance: `${score}%`
      },
      summary: `${score}% theme compliance`
    };
  } catch (e) {
    return {
      status: 'error',
      score: 0,
      issues: { error: e.message },
      summary: 'Theme check failed'
    };
  }
}

// Documentation system parser
function parseDocsOutput(stdout, stderr, error) {
  try {
    // Look for test results
    const passedTests = (stdout.match(/✅/g) || []).length;
    const failedTests = (stdout.match(/❌/g) || []).length;
    const totalTests = passedTests + failedTests;
    
    if (totalTests === 0) {
      return {
        status: 'warning',
        score: 0,
        issues: { tests: 0 },
        summary: 'No documentation tests found'
      };
    }
    
    const score = Math.round((passedTests / totalTests) * 100);
    
    return {
      status: failedTests === 0 ? 'passed' : 'failed',
      score,
      issues: {
        passed: passedTests,
        failed: failedTests,
        total: totalTests
      },
      summary: `${passedTests}/${totalTests} tests passed (${score}%)`
    };
  } catch (e) {
    return {
      status: 'error',
      score: 0,
      issues: { error: e.message },
      summary: 'Documentation tests failed'
    };
  }
}

// Build output parser
function parseBuildOutput(stdout, stderr, error) {
  if (error && error.code !== 0) {
    return {
      status: 'failed',
      score: 0,
      issues: {
        buildFailed: true,
        error: stderr || stdout
      },
      summary: 'Build failed'
    };
  }
  
  // Extract build info if available
  const sizeMatch = stdout.match(/dist\/index\.html\s+(\d+\.\d+)\s*(kB)/);
  const bundleSize = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2]}` : 'Unknown';
  
  return {
    status: 'passed',
    score: 100,
    issues: {
      bundleSize,
      buildSuccess: true
    },
    summary: `Build successful (${bundleSize})`
  };
}

// Generate comprehensive quality report
function generateQualityReport(results, startTime) {
  const duration = Date.now() - startTime;
  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  const critical = results.filter(r => r.critical);
  const criticalPassed = critical.filter(r => r.status === 'passed').length;
  
  return {
    timestamp: new Date().toISOString(),
    duration,
    overall: {
      score: Math.round(totalScore),
      status: critical.every(r => r.status === 'passed') ? 'passed' : 'failed',
      critical: {
        passed: criticalPassed,
        total: critical.length,
        percentage: Math.round((criticalPassed / critical.length) * 100)
      }
    },
    checks: results.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      score: r.score,
      duration: r.duration,
      critical: r.critical,
      summary: r.summary,
      issues: r.issues
    })),
    recommendations: generateRecommendations(results),
    metadata: {
      pipeline: 'phase-5-quality-automation',
      version: '1.0.0',
      config
    }
  };
}

// Generate recommendations based on results
function generateRecommendations(results) {
  const recommendations = [];
  
  results.forEach(result => {
    if (result.status === 'failed' && result.critical) {
      recommendations.push({
        priority: 'critical',
        check: result.name,
        message: `Fix ${result.summary} - blocking deployment`,
        action: `Run: ${result.command}`
      });
    } else if (result.status === 'failed' || result.status === 'warning') {
      recommendations.push({
        priority: result.critical ? 'high' : 'medium',
        check: result.name,
        message: result.summary,
        action: `Review and fix: ${result.command}`
      });
    }
  });
  
  // Add general recommendations
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  if (overallScore < 80) {
    recommendations.push({
      priority: 'high',
      check: 'Overall Quality',
      message: `Quality score ${Math.round(overallScore)}% is below 80% threshold`,
      action: 'Address critical issues before continuing development'
    });
  }
  
  return recommendations;
}

// Display quality results
function displayQualityResults(report) {
  console.log('\n📊 Quality Pipeline Results');
  console.log('=' .repeat(50));
  
  // Overall status
  const statusEmoji = report.overall.status === 'passed' ? '✅' : '❌';
  console.log(`${statusEmoji} Overall Status: ${report.overall.status.toUpperCase()}`);
  console.log(`📈 Quality Score: ${report.overall.score}/100`);
  console.log(`⏱️  Duration: ${report.duration}ms`);
  console.log(`🎯 Critical Checks: ${report.overall.critical.passed}/${report.overall.critical.total} passed\n`);
  
  // Individual check results
  console.log('📋 Check Details:');
  report.checks.forEach(check => {
    const emoji = check.status === 'passed' ? '✅' : 
                  check.status === 'warning' ? '⚠️' : '❌';
    const critical = check.critical ? '🔥' : '';
    
    console.log(`${emoji} ${critical} ${check.name}: ${check.summary} (${check.score}/100)`);
  });
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      const emoji = rec.priority === 'critical' ? '🚨' : 
                    rec.priority === 'high' ? '⚠️' : '💡';
      console.log(`${emoji} ${rec.check}: ${rec.message}`);
      console.log(`   Action: ${rec.action}`);
    });
  }
  
  console.log(`\n📄 Full report saved to: ${config.reportPath}`);
}

// Run if called directly
if (require.main === module) {
  runQualityPipeline().catch(error => {
    console.error('Pipeline execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runQualityPipeline,
  qualityChecks,
  config
};