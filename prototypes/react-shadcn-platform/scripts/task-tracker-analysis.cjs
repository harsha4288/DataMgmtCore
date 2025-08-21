#!/usr/bin/env node
/**
 * Task Tracking Analysis Tool
 * Scans the codebase for TODO items, task references, and progress tracking inconsistencies
 */

const fs = require('fs');
const path = require('path');

class TaskAnalyzer {
  constructor() {
    this.tasks = new Map();
    this.todoItems = [];
    this.progressFiles = [];
    this.documentedTasks = [];
    this.codebaseTasks = [];
    this.issues = [];
  }

  // Scan the entire codebase for task-related items
  scanCodebase(dir = '.', level = 0) {
    if (level > 5) return; // Prevent infinite recursion
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      // Skip node_modules and other irrelevant directories
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
        continue;
      }
      
      if (stat.isDirectory()) {
        this.scanCodebase(fullPath, level + 1);
      } else if (stat.isFile()) {
        this.analyzeFile(fullPath);
      }
    }
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Track different types of files
      if (filePath.includes('PROGRESS') || filePath.includes('progress')) {
        this.progressFiles.push(filePath);
      }
      
      // Look for TODO/FIXME/HACK comments
      lines.forEach((line, index) => {
        const todoMatch = line.match(/(TODO|FIXME|HACK|XXX|NOTE)[\s:]+(.+)/i);
        if (todoMatch) {
          this.todoItems.push({
            file: filePath,
            line: index + 1,
            type: todoMatch[1].toUpperCase(),
            content: todoMatch[2].trim(),
            context: line.trim()
          });
        }
        
        // Look for task references (Task 1.1, Task 2.3, etc.)
        const taskMatch = line.match(/Task\s+(\d+\.?\d*\.?\d*)/gi);
        if (taskMatch) {
          taskMatch.forEach(match => {
            const taskId = match.replace(/Task\s+/i, '');
            if (!this.tasks.has(taskId)) {
              this.tasks.set(taskId, []);
            }
            this.tasks.get(taskId).push({
              file: filePath,
              line: index + 1,
              context: line.trim()
            });
          });
        }
        
        // Look for phase references
        const phaseMatch = line.match(/Phase\s+(\d+)/gi);
        if (phaseMatch) {
          phaseMatch.forEach(match => {
            const phaseId = match.replace(/Phase\s+/i, '');
            const key = `Phase ${phaseId}`;
            if (!this.tasks.has(key)) {
              this.tasks.set(key, []);
            }
            this.tasks.get(key).push({
              file: filePath,
              line: index + 1,
              context: line.trim()
            });
          });
        }
        
        // Look for status indicators
        const statusMatch = line.match(/(✅|❌|🟡|⏳|COMPLETED|IN_PROGRESS|PENDING|BLOCKED)/gi);
        if (statusMatch && (line.includes('Task') || line.includes('Phase'))) {
          this.codebaseTasks.push({
            file: filePath,
            line: index + 1,
            status: statusMatch[0],
            context: line.trim()
          });
        }
      });
      
    } catch (error) {
      this.issues.push({
        type: 'FILE_READ_ERROR',
        file: filePath,
        error: error.message
      });
    }
  }

  // Analyze PROGRESS.md and similar files
  analyzeProgressFiles() {
    this.progressFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Extract documented tasks from markdown
        const taskMatches = content.match(/^[\s]*[-*]\s*.*Task\s+\d+\.?\d*\.?\d*.*$/gim);
        if (taskMatches) {
          taskMatches.forEach(match => {
            this.documentedTasks.push({
              file,
              content: match.trim()
            });
          });
        }
        
        // Look for completion status
        const completionMatches = content.match(/^[\s]*[-*]\s*.*(✅|❌|🟡|⏳).*$/gim);
        if (completionMatches) {
          completionMatches.forEach(match => {
            this.documentedTasks.push({
              file,
              content: match.trim(),
              hasStatus: true
            });
          });
        }
        
      } catch (error) {
        this.issues.push({
          type: 'PROGRESS_FILE_ERROR',
          file,
          error: error.message
        });
      }
    });
  }

  // Generate comprehensive report
  generateReport() {
    const report = {
      summary: {
        totalTaskReferences: this.tasks.size,
        todoItems: this.todoItems.length,
        progressFiles: this.progressFiles.length,
        documentedTasks: this.documentedTasks.length,
        codebaseTasks: this.codebaseTasks.length,
        issues: this.issues.length
      },
      taskDistribution: {},
      recommendations: [],
      detailedFindings: {}
    };

    // Analyze task distribution
    Array.from(this.tasks.keys()).forEach(taskId => {
      const references = this.tasks.get(taskId);
      report.taskDistribution[taskId] = {
        references: references.length,
        files: [...new Set(references.map(r => r.file))],
        locations: references
      };
    });

    // Generate recommendations
    this.generateRecommendations(report);
    
    // Add detailed findings
    report.detailedFindings = {
      todoItems: this.todoItems,
      progressFiles: this.progressFiles,
      documentedTasks: this.documentedTasks,
      codebaseTasks: this.codebaseTasks,
      issues: this.issues
    };

    return report;
  }

  generateRecommendations(report) {
    // Check for orphaned TODOs
    if (this.todoItems.length > 20) {
      report.recommendations.push({
        priority: 'HIGH',
        category: 'CODE_CLEANUP',
        issue: `Found ${this.todoItems.length} TODO/FIXME items in codebase`,
        suggestion: 'Convert important TODOs to tracked tasks in PROGRESS.md or issue tracker'
      });
    }

    // Check for task reference consistency
    const taskRefs = Array.from(this.tasks.keys()).filter(k => k.match(/^\d+\.?\d*\.?\d*$/));
    if (taskRefs.length > 50) {
      report.recommendations.push({
        priority: 'MEDIUM',
        category: 'TASK_TRACKING',
        issue: `Found ${taskRefs.length} different task references across codebase`,
        suggestion: 'Consider consolidating task tracking in a single source of truth'
      });
    }

    // Check for progress file organization
    if (this.progressFiles.length === 0) {
      report.recommendations.push({
        priority: 'HIGH',
        category: 'DOCUMENTATION',
        issue: 'No PROGRESS.md or similar tracking files found',
        suggestion: 'Create a centralized progress tracking system'
      });
    } else if (this.progressFiles.length > 3) {
      report.recommendations.push({
        priority: 'MEDIUM',
        category: 'DOCUMENTATION',
        issue: `Multiple progress files found: ${this.progressFiles.length}`,
        suggestion: 'Consolidate progress tracking into fewer files'
      });
    }

    // Check for incomplete task documentation
    const undocumentedTasks = taskRefs.filter(taskId => {
      return !this.documentedTasks.some(doc => doc.content.includes(taskId));
    });

    if (undocumentedTasks.length > 0) {
      report.recommendations.push({
        priority: 'MEDIUM',
        category: 'DOCUMENTATION',
        issue: `${undocumentedTasks.length} tasks referenced in code but not documented`,
        suggestion: 'Add documentation for all referenced tasks',
        details: undocumentedTasks.slice(0, 10) // Show first 10
      });
    }
  }

  // Run the complete analysis
  async analyze() {
    console.log('🔍 Starting task tracking analysis...\n');
    
    console.log('📁 Scanning codebase for task references...');
    this.scanCodebase();
    
    console.log('📋 Analyzing progress documentation...');
    this.analyzeProgressFiles();
    
    console.log('📊 Generating report...\n');
    const report = this.generateReport();
    
    return report;
  }
}

// CLI Interface
async function main() {
  const analyzer = new TaskAnalyzer();
  const report = await analyzer.analyze();
  
  console.log('='.repeat(80));
  console.log('🎯 TASK TRACKING ANALYSIS REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📊 SUMMARY:');
  console.log(`• Task References Found: ${report.summary.totalTaskReferences}`);
  console.log(`• TODO Items in Code: ${report.summary.todoItems}`);
  console.log(`• Progress Files: ${report.summary.progressFiles}`);
  console.log(`• Documented Tasks: ${report.summary.documentedTasks}`);
  console.log(`• Issues Found: ${report.summary.issues}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n🚨 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`);
      console.log(`   Issue: ${rec.issue}`);
      console.log(`   Suggestion: ${rec.suggestion}`);
      if (rec.details) {
        console.log(`   Details: ${rec.details.slice(0, 3).join(', ')}${rec.details.length > 3 ? '...' : ''}`);
      }
    });
  }
  
  console.log('\n📋 TOP TASK REFERENCES:');
  const sortedTasks = Object.entries(report.taskDistribution)
    .sort(([,a], [,b]) => b.references - a.references)
    .slice(0, 10);
    
  sortedTasks.forEach(([taskId, data]) => {
    console.log(`• ${taskId}: ${data.references} references across ${data.files.length} files`);
  });
  
  if (report.summary.todoItems > 0) {
    console.log('\n📝 TODO ITEMS BY FILE:');
    const todosByFile = {};
    report.detailedFindings.todoItems.forEach(todo => {
      if (!todosByFile[todo.file]) todosByFile[todo.file] = 0;
      todosByFile[todo.file]++;
    });
    
    Object.entries(todosByFile)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([file, count]) => {
        console.log(`• ${file}: ${count} items`);
      });
  }
  
  console.log('\n📄 PROGRESS FILES FOUND:');
  if (report.detailedFindings.progressFiles.length > 0) {
    report.detailedFindings.progressFiles.forEach(file => {
      console.log(`• ${file}`);
    });
  } else {
    console.log('• No dedicated progress tracking files found');
  }
  
  // Save detailed report to file
  const detailedReport = JSON.stringify(report, null, 2);
  fs.writeFileSync('task-analysis-report.json', detailedReport);
  console.log('\n💾 Detailed report saved to: task-analysis-report.json');
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Analysis complete!');
  
  return report;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TaskAnalyzer };