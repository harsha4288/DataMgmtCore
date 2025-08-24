#!/usr/bin/env node

/**
 * Documentation Validation Pipeline
 * 
 * Validates documentation consistency, size limits, and standards compliance
 * Detects redundancy between PROGRESS.md, phase READMEs, and task files
 * 
 * Usage: node validate-documentation.js [--fix] [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration
const CONFIG = {
  SIZE_LIMITS: {
    'task-*.md': 250,
    'README.md': 150,
    'PROGRESS.md': 300,
    '*STANDARDS*.md': 400,
    '*GUIDELINES*.md': 400,
  },
  
  REQUIRED_SECTIONS: {
    'task-*.md': [
      '# Task',
      ['## 📋 Objective', '## 🎯 Objective'],
      '## ✅ Success Criteria',
      '**Status:**'
    ],
    'phase-*/README.md': [
      '# Phase',
      '## 🎯 Overview', 
      '## 📋 Tasks',
      '**Status:**'
    ]
  },

  DOCUMENTATION_ROOT: './docs',
  IGNORE_PATTERNS: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**'
  ]
};

class DocumentationValidator {
  constructor(options = {}) {
    this.options = { verbose: false, fix: false, ...options };
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
    this.progressData = null;
    this.phaseData = new Map();
    this.taskData = new Map();
  }

  async validate() {
    console.log('📋 Documentation Validation Pipeline\n');
    
    try {
      // Step 1: Load and parse all documentation
      await this.loadDocumentationData();
      
      // Step 2: Size validation
      await this.validateDocumentSizes();
      
      // Step 3: Template compliance
      await this.validateTemplateCompliance();
      
      // Step 4: Consistency validation
      await this.validateConsistency();
      
      // Step 5: Link validation
      await this.validateLinks();
      
      // Step 6: Redundancy detection
      await this.detectRedundancy();
      
      // Step 7: Cross-file content duplication
      await this.detectCrossFileRedundancy();
      
      // Step 8: Single source of truth validation
      await this.validateSourceHierarchy();
      
      this.reportResults();
      
      return this.errors.length === 0;
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  }

  async loadDocumentationData() {
    if (this.options.verbose) console.log('Loading documentation data...');
    
    // Load PROGRESS.md
    try {
      const progressContent = fs.readFileSync('./PROGRESS.md', 'utf8');
      this.progressData = this.parseProgress(progressContent);
    } catch (error) {
      this.errors.push('Cannot read PROGRESS.md: ' + error.message);
    }

    // Load all phase README files
    const phaseFiles = await glob('docs/progress/phase-*/README.md');
    for (const file of phaseFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const phaseNum = file.match(/phase-(\d+)/)?.[1];
        if (phaseNum) {
          this.phaseData.set(phaseNum, {
            file: file,
            content: content,
            data: this.parsePhaseReadme(content)
          });
        }
      } catch (error) {
        this.errors.push(`Cannot read ${file}: ${error.message}`);
      }
    }

    // Load all task files
    const taskFiles = await glob('docs/progress/phase-*/task-*.md');
    for (const file of taskFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const taskMatch = file.match(/task-([\d\.]+)-/);
        if (taskMatch) {
          this.taskData.set(taskMatch[1], {
            file: file,
            content: content,
            data: this.parseTaskFile(content)
          });
        }
      } catch (error) {
        this.errors.push(`Cannot read ${file}: ${error.message}`);
      }
    }
  }

  async validateDocumentSizes() {
    if (this.options.verbose) console.log('Validating document sizes...');
    
    const allFiles = await glob('docs/**/*.md');
    allFiles.push('./PROGRESS.md');
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        const limit = this.getSizeLimit(file);
        
        if (limit && lines > limit) {
          this.errors.push(
            `📏 SIZE VIOLATION: ${file} has ${lines} lines (limit: ${limit})\n` +
            `   → Consider splitting into smaller files`
          );
          
          if (this.options.fix) {
            this.suggestDocumentSplit(file, content, lines, limit);
          }
        }
      } catch (error) {
        this.warnings.push(`Cannot check size of ${file}: ${error.message}`);
      }
    }
  }

  getSizeLimit(filePath) {
    for (const [pattern, limit] of Object.entries(CONFIG.SIZE_LIMITS)) {
      if (this.matchesPattern(filePath, pattern)) {
        return limit;
      }
    }
    return null;
  }

  matchesPattern(filePath, pattern) {
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    
    // Simple pattern matching
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(fileName) || regex.test(filePath);
    }
    return fileName === pattern || filePath.includes(pattern);
  }

  async validateTemplateCompliance() {
    if (this.options.verbose) console.log('Validating template compliance...');
    
    // Check task files
    for (const [taskId, taskInfo] of this.taskData) {
      const requiredSections = CONFIG.REQUIRED_SECTIONS['task-*.md'];
      for (const section of requiredSections) {
        if (Array.isArray(section)) {
          // Handle alternative section patterns
          const hasAnySection = section.some(alt => taskInfo.content.includes(alt));
          if (!hasAnySection) {
            this.errors.push(
              `📋 TEMPLATE VIOLATION: Task ${taskId} missing required section: ${section.join(' OR ')}\n` +
              `   → File: ${taskInfo.file}`
            );
          }
        } else {
          // Handle single section pattern
          if (!taskInfo.content.includes(section)) {
            this.errors.push(
              `📋 TEMPLATE VIOLATION: Task ${taskId} missing required section: ${section}\n` +
              `   → File: ${taskInfo.file}`
            );
          }
        }
      }
    }

    // Check phase README files
    for (const [phaseId, phaseInfo] of this.phaseData) {
      const requiredSections = CONFIG.REQUIRED_SECTIONS['phase-*/README.md'];
      for (const section of requiredSections) {
        if (!phaseInfo.content.includes(section)) {
          this.errors.push(
            `📋 TEMPLATE VIOLATION: Phase ${phaseId} README missing required section: ${section}\n` +
            `   → File: ${phaseInfo.file}`
          );
        }
      }
    }
  }

  async validateConsistency() {
    if (this.options.verbose) console.log('Validating consistency between documents...');
    
    // Check task status consistency between files
    for (const [taskId, taskInfo] of this.taskData) {
      const taskStatus = this.extractStatus(taskInfo.content);
      
      // Check if PROGRESS.md has the same status
      if (this.progressData) {
        const progressStatus = this.getTaskStatusFromProgress(taskId);
        if (progressStatus && progressStatus !== taskStatus) {
          this.errors.push(
            `🔄 STATUS MISMATCH: Task ${taskId}\n` +
            `   → Task file: ${taskStatus}\n` +
            `   → PROGRESS.md: ${progressStatus}\n` +
            `   → Single source of truth violation`
          );
        }
      }
    }
  }

  async validateLinks() {
    if (this.options.verbose) console.log('Validating internal links...');
    
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const allFiles = await glob('docs/**/*.md');
    allFiles.push('./PROGRESS.md');
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        
        while ((match = linkPattern.exec(content)) !== null) {
          const [fullMatch, linkText, linkPath] = match;
          
          // Check internal links (relative paths)
          if (linkPath.startsWith('./') || linkPath.startsWith('../') || !linkPath.includes('://')) {
            const resolvedPath = path.resolve(path.dirname(file), linkPath);
            
            if (!fs.existsSync(resolvedPath)) {
              this.errors.push(
                `🔗 BROKEN LINK: ${file}\n` +
                `   → Link: ${linkText} → ${linkPath}\n` +
                `   → Resolved: ${resolvedPath} (not found)`
              );
            }
          }
        }
      } catch (error) {
        this.warnings.push(`Cannot validate links in ${file}: ${error.message}`);
      }
    }
  }

  async detectRedundancy() {
    if (this.options.verbose) console.log('Detecting redundant content...');
    
    // Check for duplicate task lists between PROGRESS.md and phase READMEs
    if (this.progressData && this.progressData.tasks) {
      for (const [phaseId, phaseInfo] of this.phaseData) {
        const phaseTasks = this.extractTaskList(phaseInfo.content);
        const progressTasks = this.progressData.tasks.filter(t => 
          t.id.startsWith(phaseId + '.')
        );
        
        if (phaseTasks.length > 0 && progressTasks.length > 0) {
          // Check if both contain similar task information
          const redundantTasks = this.findRedundantTasks(phaseTasks, progressTasks);
          
          if (redundantTasks.length > 0) {
            this.errors.push(
              `🔄 REDUNDANCY DETECTED: Phase ${phaseId}\n` +
              `   → Tasks listed in both PROGRESS.md and ${phaseInfo.file}\n` +
              `   → Redundant tasks: ${redundantTasks.join(', ')}\n` +
              `   → Violates single source of truth principle`
            );
          }
        }
      }
    }
  }

  async validateSourceHierarchy() {
    if (this.options.verbose) console.log('Validating single source of truth hierarchy...');
    
    // Verify that phase READMEs are synced from task files
    for (const [phaseId, phaseInfo] of this.phaseData) {
      const phaseTasks = Array.from(this.taskData.entries())
        .filter(([taskId]) => taskId.startsWith(phaseId + '.'));
      
      if (phaseTasks.length > 0) {
        // Check if phase README accurately reflects task file statuses
        const phaseTaskSummary = this.extractTaskSummaryFromPhase(phaseInfo.content);
        
        for (const [taskId, taskInfo] of phaseTasks) {
          const taskStatus = this.extractStatus(taskInfo.content);
          const phaseTaskStatus = phaseTaskSummary[taskId];
          
          if (phaseTaskStatus && phaseTaskStatus !== taskStatus) {
            this.warnings.push(
              `⚠️ SYNC WARNING: Task ${taskId} status mismatch\n` +
              `   → Task file: ${taskStatus}\n` +
              `   → Phase README: ${phaseTaskStatus}\n` +
              `   → May need sync from authoritative source`
            );
          }
        }
      }
    }
  }

  // Helper methods for parsing different document types
  parseProgress(content) {
    // Extract task information from PROGRESS.md
    const tasks = [];
    const taskPattern = /- \[Task (\d+\.\d+): ([^\]]+)\]\([^)]+\) (.+)/g;
    let match;
    
    while ((match = taskPattern.exec(content)) !== null) {
      tasks.push({
        id: match[1],
        title: match[2],
        status: this.parseStatusEmoji(match[3])
      });
    }
    
    return { tasks };
  }

  parsePhaseReadme(content) {
    return {
      status: this.extractStatus(content),
      tasks: this.extractTaskList(content)
    };
  }

  parseTaskFile(content) {
    return {
      status: this.extractStatus(content),
      objective: this.extractSection(content, '## 📋 Objective'),
      successCriteria: this.extractSection(content, '## ✅ Success Criteria')
    };
  }

  extractStatus(content) {
    const statusMatch = content.match(/\*\*Status:\*\*\s*([🟡🟢✅🔴]+)\s*([^*\n]+)/);
    if (statusMatch) {
      return statusMatch[1] + ' ' + statusMatch[2].trim();
    }
    return 'Unknown';
  }

  extractSection(content, header) {
    const lines = content.split('\n');
    const startIdx = lines.findIndex(line => line.includes(header));
    if (startIdx === -1) return null;
    
    const endIdx = lines.findIndex((line, idx) => 
      idx > startIdx && line.startsWith('##')
    );
    
    return lines.slice(startIdx + 1, endIdx === -1 ? undefined : endIdx)
      .join('\n').trim();
  }

  extractTaskList(content) {
    const tasks = [];
    const taskPattern = /- \[([^\]]+)\] (.+)/g;
    let match;
    
    while ((match = taskPattern.exec(content)) !== null) {
      tasks.push({
        id: match[1],
        description: match[2]
      });
    }
    
    return tasks;
  }

  parseStatusEmoji(text) {
    if (text.includes('✅')) return '✅ Complete';
    if (text.includes('🟢')) return '🟢 In Progress';
    if (text.includes('🟡')) return '🟡 Pending';
    if (text.includes('🔴')) return '🔴 On Hold';
    return 'Unknown';
  }

  getTaskStatusFromProgress(taskId) {
    if (!this.progressData || !this.progressData.tasks) return null;
    const task = this.progressData.tasks.find(t => t.id === taskId);
    return task ? task.status : null;
  }

  extractTaskSummaryFromPhase(content) {
    // Extract task summary table or list from phase README
    const summary = {};
    const tableRows = content.match(/\| Task \d+\.\d+ \|.*?\|.*?\|/g);
    
    if (tableRows) {
      for (const row of tableRows) {
        const match = row.match(/\| Task (\d+\.\d+) \|.*?\| ([^|]+) \|/);
        if (match) {
          summary[match[1]] = match[2].trim();
        }
      }
    }
    
    return summary;
  }

  findRedundantTasks(phaseTasks, progressTasks) {
    const redundant = [];
    
    for (const phaseTask of phaseTasks) {
      const matchingProgressTask = progressTasks.find(pt => 
        pt.id === phaseTask.id || 
        pt.title.toLowerCase().includes(phaseTask.description.toLowerCase().substring(0, 20))
      );
      
      if (matchingProgressTask) {
        redundant.push(phaseTask.id || phaseTask.description.substring(0, 30));
      }
    }
    
    return redundant;
  }

  async detectCrossFileRedundancy() {
    if (this.options.verbose) console.log('Detecting cross-file content duplication...');
    
    // Check for content duplication between key files
    const keyFiles = [
      './CLAUDE.md',
      './docs/DOCUMENTATION_STANDARDS.md',
      './docs/AI_GUIDANCE_TEMPLATES.md'
    ];
    
    const fileContents = new Map();
    
    // Load key files for comparison
    for (const file of keyFiles) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          fileContents.set(file, content);
        }
      } catch (error) {
        this.warnings.push(`Cannot read ${file} for redundancy check: ${error.message}`);
      }
    }
    
    // Compare files for duplicated content blocks
    const filePairs = [
      ['./CLAUDE.md', './docs/DOCUMENTATION_STANDARDS.md'],
      ['./CLAUDE.md', './docs/AI_GUIDANCE_TEMPLATES.md'],
      ['./docs/DOCUMENTATION_STANDARDS.md', './docs/AI_GUIDANCE_TEMPLATES.md']
    ];
    
    for (const [file1, file2] of filePairs) {
      if (fileContents.has(file1) && fileContents.has(file2)) {
        const content1 = fileContents.get(file1);
        const content2 = fileContents.get(file2);
        
        const duplicatedBlocks = this.findDuplicatedContentBlocks(content1, content2);
        
        if (duplicatedBlocks.length > 0) {
          this.errors.push(
            `🔄 CROSS-FILE REDUNDANCY: ${file1} and ${file2}\n` +
            `   → Duplicated content blocks: ${duplicatedBlocks.length}\n` +
            `   → Examples: ${duplicatedBlocks.slice(0, 2).map(b => b.substring(0, 50) + '...').join(', ')}\n` +
            `   → Violates single source of truth principle`
          );
        }
      }
    }
  }

  findDuplicatedContentBlocks(content1, content2) {
    const duplicatedBlocks = [];
    
    // Split content into meaningful blocks (by headers or sections)
    const blocks1 = content1.split(/^###?\s+/m).filter(block => block.trim().length > 50);
    const blocks2 = content2.split(/^###?\s+/m).filter(block => block.trim().length > 50);
    
    for (const block1 of blocks1) {
      for (const block2 of blocks2) {
        // Check for substantial similarity (>80% match)
        const similarity = this.calculateContentSimilarity(block1, block2);
        
        if (similarity > 0.8) {
          duplicatedBlocks.push(block1.substring(0, 100));
          break;
        }
      }
    }
    
    return duplicatedBlocks;
  }

  calculateContentSimilarity(text1, text2) {
    // Simple similarity calculation based on common words
    const normalize = (text) => text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    
    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  suggestDocumentSplit(file, content, currentLines, limit) {
    const sections = content.split(/^##\s+/m);
    
    this.fixes.push(
      `📏 SPLIT SUGGESTION for ${file}:\n` +
      `   Current: ${currentLines} lines (limit: ${limit})\n` +
      `   → Split into ${Math.ceil(currentLines / limit)} files\n` +
      `   → Sections found: ${sections.length}\n` +
      `   → Consider creating sub-task files or moving detailed content`
    );
  }

  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DOCUMENTATION VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All documentation validation checks passed!');
    } else {
      if (this.errors.length > 0) {
        console.log(`\n❌ ERRORS (${this.errors.length}):`);
        this.errors.forEach((error, idx) => {
          console.log(`\n${idx + 1}. ${error}`);
        });
      }
      
      if (this.warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
        this.warnings.forEach((warning, idx) => {
          console.log(`\n${idx + 1}. ${warning}`);
        });
      }
      
      if (this.fixes.length > 0 && this.options.fix) {
        console.log(`\n🔧 SUGGESTED FIXES (${this.fixes.length}):`);
        this.fixes.forEach((fix, idx) => {
          console.log(`\n${idx + 1}. ${fix}`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    
    if (this.errors.length > 0) {
      console.log('\n💡 To maintain documentation quality:');
      console.log('   • Fix errors before committing changes');
      console.log('   • Follow docs/DOCUMENTATION_STANDARDS.md');
      console.log('   • Use docs/AI_GUIDANCE_TEMPLATES.md for new docs');
      console.log('   • Run validation as part of quality checks');
    }
  }
}

// CLI execution
const isMainModule = import.meta.url.startsWith('file:') && 
                     process.argv[1] && 
                     import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose'),
    fix: args.includes('--fix')
  };
  
  console.log('Starting Documentation Validation...');
  const validator = new DocumentationValidator(options);
  
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export { DocumentationValidator };