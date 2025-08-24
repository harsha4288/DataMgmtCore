#!/usr/bin/env node

/**
 * Documentation Health Check
 * Integrates documentation validation with existing workflow
 * Provides health status for dashboard integration
 */

const fs = require('fs');
const { exec } = require('child_process');

class DocumentationHealthChecker {
  constructor() {
    this.healthReport = {
      timestamp: new Date().toISOString(),
      totalErrors: 0,
      totalWarnings: 0,
      sizeViolations: 0,
      templateViolations: 0,
      brokenLinks: 0,
      status: 'healthy',
      details: []
    };
  }

  async runValidation() {
    return new Promise((resolve, reject) => {
      exec('node validate-documentation.js', (error, stdout, stderr) => {
        if (error) {
          console.error('Validation execution failed:', error);
          resolve(stdout || stderr || error.message);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  parseValidationOutput(output) {
    const lines = output.split('\n');
    
    // Extract error count from summary line
    const summaryLine = lines.find(line => line.includes('Summary:'));
    if (summaryLine) {
      const match = summaryLine.match(/(\d+) errors, (\d+) warnings/);
      if (match) {
        this.healthReport.totalErrors = parseInt(match[1]);
        this.healthReport.totalWarnings = parseInt(match[2]);
      }
    }

    // Count specific violation types
    this.healthReport.sizeViolations = (output.match(/SIZE VIOLATION/g) || []).length;
    this.healthReport.templateViolations = (output.match(/TEMPLATE VIOLATION/g) || []).length;
    this.healthReport.brokenLinks = (output.match(/BROKEN LINK/g) || []).length;

    // Determine status
    if (this.healthReport.totalErrors === 0) {
      this.healthReport.status = 'healthy';
    } else if (this.healthReport.totalErrors > 50) {
      this.healthReport.status = 'critical';
    } else {
      this.healthReport.status = 'issues';
    }

    // Extract key error messages for dashboard
    const errorLines = lines.filter(line => 
      line.includes('SIZE VIOLATION') || 
      line.includes('TEMPLATE VIOLATION') || 
      line.includes('BROKEN LINK')
    );
    
    this.healthReport.details = errorLines.slice(0, 10).map(line => 
      line.replace(/^\d+\.\s*/, '').trim()
    );
  }

  async check(options = {}) {
    console.log('🔍 Running documentation health check...');
    
    try {
      const validationOutput = await this.runValidation();
      this.parseValidationOutput(validationOutput);
      
      // Save health report for dashboard
      const healthFile = './.claude/documentation-health.json';
      const healthDir = './.claude';
      
      if (!fs.existsSync(healthDir)) {
        fs.mkdirSync(healthDir, { recursive: true });
      }
      
      fs.writeFileSync(healthFile, JSON.stringify(this.healthReport, null, 2));
      
      // Output summary
      this.reportSummary(options.verbose);
      
      return this.healthReport;
      
    } catch (error) {
      console.error('❌ Documentation health check failed:', error.message);
      this.healthReport.status = 'critical';
      this.healthReport.details = [`Health check failed: ${error.message}`];
      return this.healthReport;
    }
  }

  reportSummary(verbose = false) {
    console.log('\n📊 DOCUMENTATION HEALTH SUMMARY');
    console.log('='.repeat(50));
    
    const statusIcon = this.healthReport.status === 'healthy' ? '✅' : 
                      this.healthReport.status === 'issues' ? '⚠️' : '❌';
    
    console.log(`${statusIcon} Status: ${this.healthReport.status.toUpperCase()}`);
    console.log(`📋 Total Issues: ${this.healthReport.totalErrors} errors, ${this.healthReport.totalWarnings} warnings`);
    
    if (this.healthReport.totalErrors > 0) {
      console.log(`   • Size violations: ${this.healthReport.sizeViolations}`);
      console.log(`   • Template violations: ${this.healthReport.templateViolations}`);
      console.log(`   • Broken links: ${this.healthReport.brokenLinks}`);
      
      if (verbose && this.healthReport.details.length > 0) {
        console.log('\nTop Issues:');
        this.healthReport.details.slice(0, 5).forEach((detail, i) => {
          console.log(`   ${i + 1}. ${detail}`);
        });
      }
    }
    
    console.log(`🕒 Last checked: ${this.healthReport.timestamp}`);
    
    if (this.healthReport.totalErrors > 0) {
      console.log('\n💡 To fix issues:');
      console.log('   • Run: npm run validate:docs:verbose');
      console.log('   • Follow: docs/DOCUMENTATION_STANDARDS.md');
    }
  }

  // Integration with existing quality pipeline
  static getHealthStatus() {
    const healthFile = './.claude/documentation-health.json';
    
    if (!fs.existsSync(healthFile)) {
      return {
        status: 'unknown',
        message: 'Documentation health not checked',
        timestamp: null
      };
    }
    
    try {
      const health = JSON.parse(fs.readFileSync(healthFile, 'utf8'));
      return {
        status: health.status,
        message: `${health.totalErrors} errors, ${health.totalWarnings} warnings`,
        timestamp: health.timestamp,
        details: health
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to read health report',
        timestamp: null
      };
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose')
  };
  
  const checker = new DocumentationHealthChecker();
  
  checker.check(options).then(report => {
    process.exit(report.totalErrors > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { DocumentationHealthChecker };