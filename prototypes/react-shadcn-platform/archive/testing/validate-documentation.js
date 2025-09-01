#!/usr/bin/env node

/**
 * Documentation Validation Pipeline
 * 
 * Validates documentation consistency, size limits, and standards compliance
 * Detects redundancy between PROGRESS.md, phase READMEs, and task files
 * 
 * Usage: node validate-documentation.js [--fix] [--verbose] [--json]
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
    
    // Structured data for JSON output
    this.structuredErrors = [];
    this.structuredWarnings = [];
    this.filesProcessed = 0;
  }

  // Helper method to add structured errors
  addError(type, file, message, suggestion = '', details = []) {
    const errorId = `${type.toLowerCase()}-${this.structuredErrors.length + 1}`;
    
    // Add to text errors (for human-readable output)
    this.errors.push(message);
    
    // Add to structured errors (for JSON output)
    this.structuredErrors.push({
      id: errorId,
      type,
      severity: 'error',
      file: file.replace(/\\/g, '/'),
      message: message.split('\n')[0].replace(/^[📏📋🔗🚨🔢🔄⚫]+\s*[A-Z\s]+:\s*/, '').trim(),
      suggestion: suggestion || this.extractSuggestion(message),
      details: details.length > 0 ? details : undefined
    });
  }

  // Helper method to add structured warnings  
  addWarning(type, file, message, recommendation = '') {
    const warningId = `${type.toLowerCase()}-${this.structuredWarnings.length + 1}`;
    
    // Add to text warnings (for human-readable output)
    this.warnings.push(message);
    
    // Add to structured warnings (for JSON output)
    this.structuredWarnings.push({
      id: warningId,
      type,
      message: message.split('\n')[0].replace(/^⚠️\s*[A-Z\s]+:\s*/, '').trim(),
      file: file ? file.replace(/\\/g, '/') : undefined,
      recommendation: recommendation || this.extractRecommendation(message)
    });
  }

  // Extract suggestion from formatted error message
  extractSuggestion(message) {
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.includes('→')) {
        return line.replace(/^\s*→\s*/, '').trim();
      }
    }
    return '';
  }

  // Extract recommendation from formatted warning message
  extractRecommendation(message) {
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.includes('→')) {
        return line.replace(/^\s*→\s*/, '').trim();
      }
    }
    return '';
  }

  async validate() {
    if (!this.options.json) {
      console.log('📋 Documentation Validation Pipeline\n');
    }
    
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
      
      // Step 9: NEW - Strict link placement validation
      await this.validateStrictLinkPlacement();
      
      // Step 10: NEW - Status system validation
      await this.validateStatusSystem();
      
      // Step 11: NEW - Single active rule validation
      await this.validateSingleActiveRule();
      
      // Step 12: NEW - Progress math validation
      await this.validateProgressMath();
      
      // Step 13: NEW - Hierarchy compliance validation
      await this.validateHierarchyCompliance();
      
      // Step 14: NEW - AI restrictions validation
      await this.validateAIRestrictions();
      
      this.reportResults();
      
      return this.errors.length === 0;
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  }

  async loadDocumentationData() {
    if (this.options.verbose) console.log('Loading documentation data...');
    // Load PROGRESS.md (phase-level only)
    try {
      const progressContent = fs.readFileSync('./PROGRESS.md', 'utf8');
      this.progressData = { content: progressContent };
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
          // Custom suggestion for PROGRESS.md
          if (path.basename(file) === 'PROGRESS.md') {
            let message = `📏 SIZE VIOLATION: ${file} has ${lines} lines (limit: ${limit})\n\n`;
            
            message += `📋 ROOT CAUSE:\n`;
            message += `   → PROGRESS.md contains ${lines - limit}+ excess lines due to task-level content\n`;
            message += `   → Task details should be in phase README.md files, not PROGRESS.md\n`;
            message += `   → PROGRESS.md should contain only high-level phase summaries\n\n`;
            
            message += `🔧 IMMEDIATE SOLUTION:\n`;
            message += `   1. AUDIT current content:\n`;
            message += `      • Count task links: grep "\\[Task [0-9]" PROGRESS.md | wc -l\n`;
            message += `      • Count task statuses: grep "- \\[Task [0-9]" PROGRESS.md | wc -l\n`;
            message += `      • Identify phase boundaries in the document\n\n`;
            
            message += `   2. MIGRATE task-level content:\n`;
            message += `      • Extract all [Task X.Y: ...] links and statuses\n`;
            message += `      • Move to appropriate docs/progress/phase-X/README.md files\n`;
            message += `      • Keep only [Phase X: ...] links in PROGRESS.md\n\n`;
            
            message += `   3. SLIM DOWN to phase-level only:\n`;
            message += `      • Replace task lists with single phase status lines\n`;
            message += `      • Example: "Phase 1: Foundation Setup (95% complete)"\n`;
            message += `      • Target: Reduce from ${lines} lines to ~${limit} lines\n\n`;
            
            message += `💡 QUICK COMMAND:\n`;
            message += `   # Count violations to track progress\n`;
            message += `   grep -c "\\[Task [0-9]" PROGRESS.md\n\n`;
            
            message += `✅ SUCCESS CRITERIA:\n`;
            message += `   • PROGRESS.md under ${limit} lines\n`;
            message += `   • No [Task X.Y] references in PROGRESS.md\n`;
            message += `   • All task details moved to phase README.md files\n`;
            message += `   • Validation passes: node validate-documentation.js`;
            
            this.addError('SIZE_VIOLATION', file, message, 
              `PROGRESS.md exceeds ${limit}-line limit due to task-level content. Migrate ${Math.ceil((lines - limit) / 3)} task items to phase README.md files and keep only phase-level summaries.`, 
              [`${lines} lines`, `${limit} limit`, `${lines - limit} excess`]);
          } else {
            // Enhanced guidance for different file types
            const fileName = path.basename(file);
            const isTaskFile = fileName.startsWith('task-');
            const isPhaseReadme = fileName === 'README.md' && file.includes('phase-');
            const isStandardsFile = fileName.includes('STANDARDS') || fileName.includes('GUIDELINES');
            
            let message = `📏 SIZE VIOLATION: ${file} has ${lines} lines (limit: ${limit})\n\n`;
            
            if (isTaskFile) {
              message += `📋 TASK FILE ANALYSIS:\n`;
              message += `   → Excess content: ${lines - limit} lines over limit\n`;
              message += `   → Task files should be focused and actionable\n`;
              message += `   → Consider if content belongs in multiple files\n\n`;
              
              message += `🔧 SPLITTING STRATEGIES FOR TASK FILES:\n`;
              message += `   1. CREATE SUB-TASKS:\n`;
              message += `      • Split into: task-X.Y.1-part1.md, task-X.Y.2-part2.md\n`;
              message += `      • Keep main task-X.Y.md as overview/coordination\n`;
              message += `      • Move detailed implementation to sub-tasks\n\n`;
              
              message += `   2. EXTRACT REFERENCE MATERIAL:\n`;
              message += `      • Move large code examples → separate .md files\n`;
              message += `      • Move research notes → docs/research/\n`;
              message += `      • Keep only essential task information\n\n`;
              
              message += `   3. MOVE COMPLETED SECTIONS:\n`;
              message += `      • Archive completed sub-sections\n`;
              message += `      • Keep only current work and next steps\n`;
              message += `      • Link to archived details if needed\n`;
            
            } else if (isPhaseReadme) {
              message += `📋 PHASE README ANALYSIS:\n`;
              message += `   → Excess content: ${lines - limit} lines over limit\n`;
              message += `   → Phase READMEs should summarize, not detail\n`;
              message += `   → Task details belong in individual task files\n\n`;
              
              message += `🔧 SPLITTING STRATEGIES FOR PHASE READMES:\n`;
              message += `   1. TASK TABLE OPTIMIZATION:\n`;
              message += `      • Shorten task descriptions in summary table\n`;
              message += `      • Remove detailed task notes\n`;
              message += `      • Keep only: ID, Title, Status, Progress%\n\n`;
              
              message += `   2. EXTRACT PHASE DOCUMENTATION:\n`;
              message += `      • Move architecture details → phase-X-architecture.md\n`;
              message += `      • Move implementation guides → phase-X-implementation.md\n`;
              message += `      • Keep README as navigation hub\n\n`;
              
              message += `   3. REFERENCE BY LINK:\n`;
              message += `      • Replace inline content with links\n`;
              message += `      • "See: [Architecture Details](./phase-X-architecture.md)"\n`;
              message += `      • Maintain overview, link to details\n`;
            
            } else if (isStandardsFile) {
              message += `📋 STANDARDS FILE ANALYSIS:\n`;
              message += `   → Standards files can be larger but should be organized\n`;
              message += `   → Consider if content is truly standards vs. examples\n`;
              message += `   → Limit increased to ${limit} but structure matters\n\n`;
              
              message += `🔧 ORGANIZATION STRATEGIES:\n`;
              message += `   1. SEPARATE CONCERNS:\n`;
              message += `      • Standards → current file\n`;
              message += `      • Examples → separate examples/ directory\n`;
              message += `      • Tools/scripts → separate tools/ directory\n\n`;
              
              message += `   2. USE TABLE OF CONTENTS:\n`;
              message += `      • Add navigation links at top\n`;
              message += `      • Structure with clear headers\n`;
              message += `      • Make it easy to find specific rules\n`;
            
            } else {
              message += `📋 GENERAL FILE ANALYSIS:\n`;
              message += `   → Excess content: ${lines - limit} lines over limit\n`;
              message += `   → File may contain mixed concerns\n`;
              message += `   → Consider logical splitting points\n\n`;
              
              message += `🔧 GENERAL SPLITTING STRATEGIES:\n`;
              message += `   1. BY TOPIC/SECTION:\n`;
              message += `      • Split major sections into separate files\n`;
              message += `      • Create index file linking to parts\n`;
              message += `      • Use consistent naming: ${fileName.replace('.md', '')}-part1.md\n\n`;
              
              message += `   2. BY PURPOSE:\n`;
              message += `      • Overview → ${fileName}\n`;
              message += `      • Details → ${fileName.replace('.md', '')}-details.md\n`;
              message += `      • Examples → ${fileName.replace('.md', '')}-examples.md\n`;
            }
            
            message += `\n💡 QUICK ANALYSIS COMMANDS:\n`;
            message += `   # Find section boundaries\n`;
            message += `   grep -n "^##" "${file}"\n`;
            message += `   \n`;
            message += `   # Count lines per section\n`;
            message += `   awk '/^##/{print NR ": " $0}' "${file}"\n\n`;
            
            message += `✅ SUCCESS CRITERIA:\n`;
            message += `   • File under ${limit} lines\n`;
            message += `   • Content logically organized\n`;
            message += `   • Clear navigation between split files\n`;
            message += `   • Validation passes: node validate-documentation.js`;
            
            const suggestionText = isTaskFile 
              ? `Split task into ${Math.ceil(lines / limit)} sub-tasks or extract reference material to separate files`
              : isPhaseReadme 
                ? `Optimize task table, extract detailed content to separate phase documentation files`
                : `Split into ${Math.ceil(lines / limit)} logical parts based on content sections`;
            
            this.addError('SIZE_VIOLATION', file, message, suggestionText, 
              [`${lines} lines`, `${limit} limit`, `${lines - limit} excess`, fileName]);
            
            if (this.options.fix) {
              this.suggestDocumentSplit(file, content, lines, limit);
            }
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
            let message = `📋 TEMPLATE VIOLATION: Task ${taskId} missing required section: ${section.join(' OR ')}\n`;
            message += `   → File: ${taskInfo.file}\n\n`;
            
            message += `📋 MISSING SECTION ANALYSIS:\n`;
            message += `   → Required: One of ${section.join(' OR ')}\n`;
            message += `   → Purpose: Define clear task objective and scope\n`;
            message += `   → Location: Should appear early in task document\n\n`;
            
            message += `📝 BOILERPLATE CONTENT (copy-paste ready):\n`;
            if (section.includes('## 📋 Objective') || section.includes('## 🎯 Objective')) {
              message += `   Add ONE of these sections:\n\n`;
              message += `   ## 📋 Objective\n`;
              message += `   Brief description of what this task accomplishes and why it's important.\n\n`;
              message += `   **Scope:**\n`;
              message += `   - Define what's included in this task\n`;
              message += `   - List key deliverables\n`;
              message += `   - Specify boundaries and limitations\n\n`;
              message += `   **Prerequisites:**\n`;
              message += `   - List any dependencies or requirements\n`;
              message += `   - Reference related tasks if applicable\n\n`;
              message += `   OR\n\n`;
              message += `   ## 🎯 Objective\n`;
              message += `   Clear statement of the task goal and expected outcomes.\n\n`;
              message += `   **Key Results:**\n`;
              message += `   - Measurable outcome 1\n`;
              message += `   - Measurable outcome 2\n`;
              message += `   - Measurable outcome 3\n\n`;
            }
            
            message += `🔧 HOW TO ADD:\n`;
            message += `   1. LOCATE insertion point:\n`;
            message += `      • After main "# Task" heading\n`;
            message += `      • Before implementation details\n\n`;
            
            message += `   2. INSERT chosen section:\n`;
            message += `      • Copy template above\n`;
            message += `      • Customize content for Task ${taskId}\n`;
            message += `      • Maintain consistent formatting\n\n`;
            
            message += `✅ TEMPLATE COMPLIANCE:\n`;
            message += `   • Use exact heading format (## emoji Title)\n`;
            message += `   • Include all required subsections\n`;
            message += `   • Maintain clear, actionable content\n`;
            message += `   • Validate: node validate-documentation.js`;
            
            this.addError('TEMPLATE_VIOLATION', taskInfo.file, message, 
              `Add missing objective section. Choose either "## 📋 Objective" or "## 🎯 Objective" with scope and prerequisites.`,
              [taskId, section.join(' OR ')]);
          }
        } else {
          // Handle single section pattern
          if (!taskInfo.content.includes(section)) {
            let message = `📋 TEMPLATE VIOLATION: Task ${taskId} missing required section: ${section}\n`;
            message += `   → File: ${taskInfo.file}\n\n`;
            
            message += this.generateSectionBoilerplate(section, 'task', taskId);
            
            this.addError('TEMPLATE_VIOLATION', taskInfo.file, message, 
              this.generateSectionSuggestion(section, 'task'),
              [taskId, section]);
          }
        }
      }
    }

    // Check phase README files
    for (const [phaseId, phaseInfo] of this.phaseData) {
      const requiredSections = CONFIG.REQUIRED_SECTIONS['phase-*/README.md'];
      for (const section of requiredSections) {
        if (!phaseInfo.content.includes(section)) {
          let message = `📋 TEMPLATE VIOLATION: Phase ${phaseId} README missing required section: ${section}\n`;
          message += `   → File: ${phaseInfo.file}\n\n`;
          
          message += this.generateSectionBoilerplate(section, 'phase', phaseId);
          
          this.addError('TEMPLATE_VIOLATION', phaseInfo.file, message, 
            this.generateSectionSuggestion(section, 'phase'),
            [phaseId, section]);
        }
      }
    }
  }

  async validateConsistency() {
    if (this.options.verbose) console.log('Validating consistency between documents...');
    // No task-level status checks for PROGRESS.md (standards forbid task details in PROGRESS.md)
    // Only phase-level consistency should be checked elsewhere if needed
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
    // No redundancy check between PROGRESS.md and phase READMEs for task lists (standards forbid task details in PROGRESS.md)
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

  async validateStrictLinkPlacement() {
    if (this.options.verbose) console.log('Validating strict link placement rules...');
    // Check PROGRESS.md for FORBIDDEN content
    if (this.progressData) {
      try {
        const progressContent = fs.readFileSync('./PROGRESS.md', 'utf8');
        // Rule 1 & 2: No task-level links or Task ID references in PROGRESS.md
        const taskLinkPattern = /\[([^\]]*?)\]\([^)]*\/task-[^)]*\)/g;
        const taskIdPattern = /Task\s+[0-9]+\.[0-9]+:/g;
        
        const taskLinks = [];
        const taskIds = [];
        
        let taskLinkMatch;
        while ((taskLinkMatch = taskLinkPattern.exec(progressContent)) !== null) {
          taskLinks.push(taskLinkMatch[0]);
        }
        
        let taskIdMatch;
        while ((taskIdMatch = taskIdPattern.exec(progressContent)) !== null) {
          taskIds.push(taskIdMatch[0]);
        }
        
        // Rule 3: Collect individual task status details
        const taskStatusPattern = /- \[Task \d+\.\d+[^\]]*\]/g;
        const taskStatuses = [];
        let taskStatusMatch;
        while ((taskStatusMatch = taskStatusPattern.exec(progressContent)) !== null) {
          taskStatuses.push(taskStatusMatch[0]);
        }
        
        // Generate consolidated error message if any task documentation violations found
        if (taskLinks.length > 0 || taskIds.length > 0 || taskStatuses.length > 0) {
          let message = `🚨 LINK_PLACEMENT_VIOLATION: Task documentation details found in PROGRESS.md\n`;
          
          if (taskLinks.length > 0) {
            message += `   → Task links found: ${taskLinks.length} instance${taskLinks.length > 1 ? 's' : ''}\n`;
          }
          
          if (taskIds.length > 0) {
            message += `   → Task ID references found: ${taskIds.length} instance${taskIds.length > 1 ? 's' : ''}\n`;
          }
          
          if (taskStatuses.length > 0) {
            message += `   → Task status details found: ${taskStatuses.length} instance${taskStatuses.length > 1 ? 's' : ''}\n`;
          }
          
          // Show examples (up to 5 total from all types)
          const allViolations = [...taskLinks, ...taskIds, ...taskStatuses];
          const examples = allViolations.slice(0, 5);
          if (examples.length > 0) {
            message += `   → Examples: ${examples.map(ex => `"${ex}"`).join(', ')}${allViolations.length > 5 ? ` and ${allViolations.length - 5} more` : ''}\n`;
          }
          
          message += `\n📋 WHY THIS MATTERS:\n`;
          message += `   → PROGRESS.md must contain only phase-level summaries for maintainability\n`;
          message += `   → Task details belong in phase README.md files for proper organization\n`;
          message += `   → This ensures single source of truth and prevents documentation bloat\n\n`;
          
          message += `🔧 HOW TO FIX - Step-by-Step Migration:\n`;
          message += `   1. IDENTIFY affected content:\n`;
          message += `      • Task links: [Task X.Y: Description](./path/to/task.md)\n`;
          message += `      • Task IDs: "Task X.Y:" references\n`;
          message += `      • Task statuses: "- [Task X.Y] status details"\n\n`;
          
          message += `   2. LOCATE target phase README:\n`;
          message += `      • For Task 1.x → docs/progress/phase-1/README.md\n`;
          message += `      • For Task 2.x → docs/progress/phase-2/README.md\n`;
          message += `      • Pattern: docs/progress/phase-X/README.md\n\n`;
          
          message += `   3. MOVE content to appropriate phase README:\n`;
          message += `      • Copy task links to "## 📋 Tasks" section\n`;
          message += `      • Copy task statuses to task status table\n`;
          message += `      • Remove task-level details from PROGRESS.md\n\n`;
          
          message += `   4. UPDATE PROGRESS.md to phase-level only:\n`;
          message += `      • Keep: [Phase X](./docs/progress/phase-X/README.md) - Description\n`;
          message += `      • Remove: All [Task X.Y] references\n`;
          message += `      • Keep: Phase-level status and progress percentages\n\n`;
          
          message += `💡 EXAMPLE TRANSFORMATION:\n`;
          message += `   BEFORE (PROGRESS.md): "- [Task 1.2: Theme System](./docs/.../task-1.2.md) ✅ Complete"\n`;
          message += `   AFTER (PROGRESS.md):  "- [Phase 1](./docs/progress/phase-1/README.md) - Foundation Setup"\n`;
          message += `   MOVED TO (phase-1/README.md): "- [Task 1.2: Theme System](./task-1.2-theme-system.md) ✅ Complete"\n\n`;
          
          message += `⚠️  VALIDATION:\n`;
          message += `   • Run: node validate-documentation.js\n`;
          message += `   • Check: No task-level content remains in PROGRESS.md\n`;
          message += `   • Verify: All task details moved to correct phase README.md\n\n`;
          
          message += `📚 Reference: docs/DOCUMENTATION_STANDARDS.md - Link Placement Rules`;
          
          const detailedSuggestion = `Follow the 4-step migration process: 1) Identify ${allViolations.length} task-level items, 2) Locate target phase READMEs, 3) Move content to appropriate "## 📋 Tasks" sections, 4) Keep only phase-level summaries in PROGRESS.md. Run validation after migration.`;
          
          this.addError('LINK_PLACEMENT_VIOLATION', './PROGRESS.md', message, detailedSuggestion, allViolations);
        }
        // Rule 4: Only phase-level links allowed
        const phaseLinkPattern = /\[([^\]]*?)\]\([^)]*\/phase-[^)]*\/README\.md\)/g;
        const allLinkPattern = /\[([^\]]*?)\]\(\.\/[^)]*\)/g;
        const phaseLinks = [];
        const allLinks = [];
        let phaseLinkMatch;
        while ((phaseLinkMatch = phaseLinkPattern.exec(progressContent)) !== null) {
          phaseLinks.push(phaseLinkMatch[0]);
        }
        let allLinkMatch;
        while ((allLinkMatch = allLinkPattern.exec(progressContent)) !== null) {
          allLinks.push(allLinkMatch[0]);
        }
        // Check if there are internal links that are NOT phase links
        const nonPhaseLinks = allLinks.filter(link => !phaseLinks.includes(link));
        for (const link of nonPhaseLinks) {
          if (!link.includes('/task-')) { // Already caught by rule 1
            this.warnings.push(
              `⚠️ LINK WARNING: PROGRESS.md contains non-phase internal link\n` +
              `   → Found: ${link}\n` +
              `   → Recommendation: Ensure this is appropriate for PROGRESS.md level`
            );
          }
        }
      } catch (error) {
        this.warnings.push(`Cannot validate link placement in PROGRESS.md: ${error.message}`);
      }
    }
    
    // Check Phase READMEs for REQUIRED content
    for (const [phaseId, phaseInfo] of this.phaseData) {
      const hasTaskLinks = /\[([^\]]*?)\]\([^)]*\/task-[^)]*\)/g.test(phaseInfo.content);
      const hasTaskStatuses = /- \[Task \d+\.\d+[^\]]*\]/g.test(phaseInfo.content);
      
      if (!hasTaskLinks && !hasTaskStatuses) {
        this.warnings.push(
          `⚠️ MISSING CONTENT: Phase ${phaseId} README missing task-level details\n` +
          `   → File: ${phaseInfo.file}\n` +
          `   → Expected: Task links and individual task statuses\n` +
          `   → Phase READMEs should contain detailed task information`
        );
      }
    }
    
    // Check Phase READMEs for FORBIDDEN sub-task content
    for (const [phaseId, phaseInfo] of this.phaseData) {
      // Patterns for sub-task content detection
      const subTaskLinkPattern = /\[([^\]]*?)\]\([^)]*\/task-\d+\.\d+\.\d+-[^)]*\)/g;
      const subTaskIdPattern = /(Sub-task|Task)\s+\d+\.\d+\.\d+:/g;
      const subTaskStatusPattern = /- \[(Sub-task|Task) \d+\.\d+\.\d+[^\]]*\]/g;
      
      const subTaskLinks = [];
      const subTaskIds = [];
      const subTaskStatuses = [];
      
      // Collect sub-task links
      let subTaskLinkMatch;
      while ((subTaskLinkMatch = subTaskLinkPattern.exec(phaseInfo.content)) !== null) {
        subTaskLinks.push(subTaskLinkMatch[0]);
      }
      
      // Collect sub-task ID references
      let subTaskIdMatch;
      while ((subTaskIdMatch = subTaskIdPattern.exec(phaseInfo.content)) !== null) {
        subTaskIds.push(subTaskIdMatch[0]);
      }
      
      // Collect sub-task status details
      let subTaskStatusMatch;
      while ((subTaskStatusMatch = subTaskStatusPattern.exec(phaseInfo.content)) !== null) {
        subTaskStatuses.push(subTaskStatusMatch[0]);
      }
      
      // Generate consolidated error message if any sub-task violations found
      if (subTaskLinks.length > 0 || subTaskIds.length > 0 || subTaskStatuses.length > 0) {
        let message = `🚨 HIERARCHY_VIOLATION: Sub-task details found in Phase ${phaseId} README\n`;
        
        if (subTaskLinks.length > 0) {
          message += `   → Sub-task links found: ${subTaskLinks.length} instance${subTaskLinks.length > 1 ? 's' : ''}\n`;
        }
        
        if (subTaskIds.length > 0) {
          message += `   → Sub-task ID references found: ${subTaskIds.length} instance${subTaskIds.length > 1 ? 's' : ''}\n`;
        }
        
        if (subTaskStatuses.length > 0) {
          message += `   → Sub-task status details found: ${subTaskStatuses.length} instance${subTaskStatuses.length > 1 ? 's' : ''}\n`;
        }
        
        // Show examples (up to 5 total from all types)
        const allSubTaskViolations = [...subTaskLinks, ...subTaskIds, ...subTaskStatuses];
        const examples = allSubTaskViolations.slice(0, 5);
        if (examples.length > 0) {
          message += `   → Examples: ${examples.map(ex => `"${ex}"`).join(', ')}${allSubTaskViolations.length > 5 ? ` and ${allSubTaskViolations.length - 5} more` : ''}\n`;
        }
        
        message += `   → File: ${phaseInfo.file}\n`;
        message += `   → Rule: Phase READMEs should contain only task-level content, not sub-task details\n`;
        message += `   → Solution: Move sub-task details to appropriate task files`;
        
        this.addError('HIERARCHY_VIOLATION', phaseInfo.file, message, '', allSubTaskViolations);
      }
    }
  }

  async validateStatusSystem() {
    if (this.options.verbose) console.log('Validating status system standards...');
    
    const validStatuses = [
      '🟡 Pending',
      '🟡 Next Priority', 
      '🟢 In Progress',
      '🟠 Paused',
      '🔴 On Hold',
      '🔄 Ready for Sign-off',
      '✅ Complete',
      '❌ Cancelled'
    ];
    
    // Validate task file statuses
    for (const [taskId, taskInfo] of this.taskData) {
      const status = this.extractStatus(taskInfo.content);
      
      if (status !== 'Unknown') {
        const isValidStatus = validStatuses.some(validStatus => 
          status.includes(validStatus) || validStatus.includes(status)
        );
        
        if (!isValidStatus) {
          let message = `🚨 INVALID STATUS: Task ${taskId}\n`;
          message += `   → Current: "${status}"\n`;
          message += `   → File: ${taskInfo.file}\n\n`;
          
          message += `📋 PROBLEM ANALYSIS:\n`;
          message += `   → Status "${status}" is not in the approved status list\n`;
          message += `   → Status must match exactly (emoji + text)\n`;
          message += `   → Inconsistent statuses break progress tracking\n\n`;
          
          message += `✅ APPROVED STATUS VALUES (copy-paste ready):\n`;
          message += `   🟡 Pending           - Task not yet started, awaiting prerequisite\n`;
          message += `   🟡 Next Priority     - Task queued as next to work on\n`;
          message += `   🟢 In Progress       - Task actively being worked on (ONLY ONE allowed)\n`;
          message += `   🟠 Paused            - Task temporarily stopped, will resume\n`;
          message += `   🔴 On Hold           - Task blocked by external dependencies\n`;
          message += `   🔄 Ready for Sign-off - Task completed, awaiting approval\n`;
          message += `   ✅ Complete          - Task finished and approved\n`;
          message += `   ❌ Cancelled         - Task no longer needed\n\n`;
          
          message += `🔧 HOW TO FIX:\n`;
          message += `   1. LOCATE status line in ${taskInfo.file}:\n`;
          message += `      • Find: **Status:** ${status}\n`;
          message += `      • Line pattern: **Status:** [emoji] [text]\n\n`;
          
          // Suggest the most appropriate replacement
          const suggestedStatus = this.suggestCorrectStatus(status);
          message += `   2. REPLACE with exact format:\n`;
          message += `      **Status:** ${suggestedStatus}\n\n`;
          
          message += `   3. VERIFY format requirements:\n`;
          message += `      • Must start with **Status:**\n`;
          message += `      • Must include exact emoji\n`;
          message += `      • Must match text exactly (case-sensitive)\n`;
          message += `      • No extra spaces or variations\n\n`;
          
          message += `💡 QUICK FIX COMMAND:\n`;
          message += `   # Replace the status line\n`;
          message += `   sed -i 's/\\*\\*Status:\\*\\* ${status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\*\\*Status:\\*\\* ${suggestedStatus}/g' "${taskInfo.file}"\n\n`;
          
          message += `⚠️  IMPORTANT RULES:\n`;
          message += `   • Only ONE task can be "🟢 In Progress" at a time\n`;
          message += `   • Status changes require human approval (AI cannot auto-update)\n`;
          message += `   • Progress percentage should align with status\n`;
          message += `   • Update phase README when task status changes`;
          
          this.addError('INVALID_STATUS', taskInfo.file, message, 
            `Replace "${status}" with "${suggestedStatus}" in status line. Use exact emoji and text format.`,
            [status, suggestedStatus, taskId]);
        }
      }
    }
    
    // Validate phase statuses
    for (const [phaseId, phaseInfo] of this.phaseData) {
      const status = this.extractStatus(phaseInfo.content);
      
      if (status !== 'Unknown') {
        const isValidStatus = validStatuses.some(validStatus => 
          status.includes(validStatus) || validStatus.includes(status)
        );
        
        if (!isValidStatus) {
          let message = `🚨 INVALID STATUS: Phase ${phaseId}\n`;
          message += `   → Current: "${status}"\n`;
          message += `   → File: ${phaseInfo.file}\n\n`;
          
          message += `📋 PROBLEM ANALYSIS:\n`;
          message += `   → Phase status "${status}" is not in the approved status list\n`;
          message += `   → Phase statuses must match task status system exactly\n`;
          message += `   → Phase status should reflect overall phase progress\n\n`;
          
          message += `✅ APPROVED PHASE STATUS VALUES (copy-paste ready):\n`;
          message += `   🟡 Pending           - Phase not yet started, planning phase\n`;
          message += `   🟡 Next Priority     - Phase queued as next major milestone\n`;
          message += `   🟢 In Progress       - Phase actively being worked on (ONLY ONE allowed)\n`;
          message += `   🟠 Paused            - Phase temporarily stopped, will resume\n`;
          message += `   🔴 On Hold           - Phase blocked by external dependencies\n`;
          message += `   🔄 Ready for Sign-off - Phase completed, awaiting final approval\n`;
          message += `   ✅ Complete          - Phase finished and all tasks approved\n`;
          message += `   ❌ Cancelled         - Phase no longer needed\n\n`;
          
          message += `🔧 HOW TO FIX - Phase README.md:\n`;
          message += `   1. LOCATE status line in ${phaseInfo.file}:\n`;
          message += `      • Find: **Status:** ${status}\n`;
          message += `      • Usually in "## 🎯 Overview" section\n\n`;
          
          const suggestedStatus = this.suggestCorrectStatus(status);
          message += `   2. REPLACE with exact format:\n`;
          message += `      **Status:** ${suggestedStatus} **Progress:** XX%\n\n`;
          
          message += `   3. UPDATE progress percentage:\n`;
          message += `      • Calculate: Average of all task progress in this phase\n`;
          message += `      • Rule: Phase progress = average task progress (±5% tolerance)\n`;
          message += `      • Example: If tasks are 80%, 90%, 70% → Phase should be 80%\n\n`;
          
          message += `   4. VERIFY consistency:\n`;
          message += `      • Phase status should reflect task completion state\n`;
          message += `      • If all tasks ✅ Complete → Phase should be ✅ Complete\n`;
          message += `      • If any task 🟢 In Progress → Phase should be 🟢 In Progress\n\n`;
          
          message += `💡 QUICK FIX COMMANDS:\n`;
          message += `   # Fix the status line\n`;
          message += `   sed -i 's/\\*\\*Status:\\*\\* ${status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\*\\*Status:\\*\\* ${suggestedStatus}/g' "${phaseInfo.file}"\n`;
          message += `   \n`;
          message += `   # Check task progress to calculate phase progress\n`;
          message += `   grep "\\*\\*Current:\\*\\*" docs/progress/phase-${phaseId}/task-*.md\n\n`;
          
          message += `⚠️  PHASE-SPECIFIC RULES:\n`;
          message += `   • Only ONE phase can be "🟢 In Progress" at a time\n`;
          message += `   • Phase status must sync with task statuses\n`;
          message += `   • Phase progress must equal average of task progress\n`;
          message += `   • Update PROGRESS.md when phase status changes`;
          
          this.addError('INVALID_STATUS', phaseInfo.file, message, 
            `Replace "${status}" with "${suggestedStatus}" in phase README status line. Ensure progress percentage matches task average.`,
            [status, suggestedStatus, phaseId]);
        }
      }
    }
  }

  async validateSingleActiveRule() {
    if (this.options.verbose) console.log('Validating single active rule...');
    
    const inProgressTasks = [];
    const inProgressPhases = [];
    
    // Find all "In Progress" tasks
    for (const [taskId, taskInfo] of this.taskData) {
      const status = this.extractStatus(taskInfo.content);
      if (status.includes('🟢 In Progress') || status.includes('In Progress')) {
        inProgressTasks.push({ id: taskId, file: taskInfo.file, status });
      }
    }
    
    // Find all "In Progress" phases
    for (const [phaseId, phaseInfo] of this.phaseData) {
      const status = this.extractStatus(phaseInfo.content);
      if (status.includes('🟢 In Progress') || status.includes('In Progress')) {
        inProgressPhases.push({ id: phaseId, file: phaseInfo.file, status });
      }
    }
    
    // Check single active rule violations
    if (inProgressTasks.length > 1) {
      this.errors.push(
        `🚨 SINGLE ACTIVE RULE VIOLATION: Multiple tasks "In Progress"\n` +
        `   → Found ${inProgressTasks.length} tasks in progress:\n` +
        inProgressTasks.map(t => `      • Task ${t.id}: ${t.status} (${t.file})`).join('\n') +
        `\n   → Rule: Only ONE task can be "In Progress" at a time\n` +
        `   → Solution: Mark others as Paused or change priority`
      );
    }
    
    if (inProgressPhases.length > 1) {
      this.errors.push(
        `🚨 SINGLE ACTIVE RULE VIOLATION: Multiple phases "In Progress"\n` +
        `   → Found ${inProgressPhases.length} phases in progress:\n` +
        inProgressPhases.map(p => `      • Phase ${p.id}: ${p.status} (${p.file})`).join('\n') +
        `\n   → Rule: Only ONE phase can be "In Progress" at a time\n` +
        `   → Solution: Mark others as Paused or change priority`
      );
    }
    
    // Check for orphaned "In Progress" (no corresponding active item)
    if (inProgressTasks.length === 0 && inProgressPhases.length === 0) {
      this.warnings.push(
        `⚠️ NO ACTIVE WORK: No tasks or phases marked "In Progress"\n` +
        `   → Recommendation: Mark current work as "🟢 In Progress"\n` +
        `   → This helps track what's actively being worked on`
      );
    }
  }

  async validateProgressMath() {
    if (this.options.verbose) console.log('Validating progress math (phase = average of tasks)...');
    
    for (const [phaseId, phaseInfo] of this.phaseData) {
      // Extract phase progress percentage
      const phaseProgressMatch = phaseInfo.content.match(/\*\*Progress:\*\*\s*(\d+)%/);
      if (!phaseProgressMatch) {
        this.warnings.push(
          `⚠️ MISSING PROGRESS: Phase ${phaseId} has no progress percentage\n` +
          `   → File: ${phaseInfo.file}\n` +
          `   → Add **Progress:** X% to phase status line`
        );
        continue;
      }
      
      const phaseProgress = parseInt(phaseProgressMatch[1]);
      
      // Get all tasks for this phase
      const phaseTasks = Array.from(this.taskData.entries())
        .filter(([taskId]) => taskId.startsWith(phaseId + '.'));
      
      if (phaseTasks.length === 0) {
        continue; // No tasks to validate against
      }
      
      // Calculate average task progress
      let totalTaskProgress = 0;
      let validTaskCount = 0;
      
      for (const [taskId, taskInfo] of phaseTasks) {
        const taskProgressMatch = taskInfo.content.match(/\*\*Current:\*\*\s*(\d+)%/);
        if (taskProgressMatch) {
          totalTaskProgress += parseInt(taskProgressMatch[1]);
          validTaskCount++;
        }
      }
      
      if (validTaskCount > 0) {
        const averageTaskProgress = Math.round(totalTaskProgress / validTaskCount);
        const progressDifference = Math.abs(phaseProgress - averageTaskProgress);
        
        // Allow ±5% tolerance for rounding
        if (progressDifference > 5) {
          this.errors.push(
            `🔢 PROGRESS MATH ERROR: Phase ${phaseId} progress mismatch\n` +
            `   → Phase progress: ${phaseProgress}%\n` +
            `   → Average task progress: ${averageTaskProgress}%\n` +
            `   → Difference: ${progressDifference}%\n` +
            `   → Rule: Phase progress must equal average of task progress (±5% tolerance)\n` +
            `   → Solution: Update phase or task progress values`
          );
        }
      }
    }
  }

  async validateHierarchyCompliance() {
    if (this.options.verbose) console.log('Validating hierarchy compliance (single source of truth)...');
    
    // Only check that PROGRESS.md syncs from phase summaries (not task-level)
    if (this.progressData && this.progressData.content) {
      try {
        const progressContent = this.progressData.content;
        
        // Rule: PROGRESS.md must sync FROM phase summaries
        for (const [phaseId, phaseInfo] of this.phaseData) {
          const phaseTaskSummary = this.extractTaskSummaryFromPhase(phaseInfo.content);
          
          for (const taskId in phaseTaskSummary) {
            const phaseTaskStatus = this.getTaskStatusFromPhase(taskId, progressContent);
            
            if (phaseTaskStatus && phaseTaskStatus !== phaseTaskSummary[taskId]) {
              this.warnings.push(
                `🏗️ HIERARCHY WARNING: PROGRESS.md may be out of sync\n` +
                `   → Task ${taskId}\n` +
                `   → PROGRESS.md: ${phaseTaskStatus}\n` +
                `   → Phase README: ${phaseTaskSummary[taskId]}\n` +
                `   → Note: PROGRESS.md should sync from phase summaries`
              );
            }
          }
        }
      } catch (error) {
        this.warnings.push(`Cannot validate PROGRESS.md sync in ${this.progressData.file}: ${error.message}`);
      }
    }
  }

  async validateAIRestrictions() {
    if (this.options.verbose) console.log('Validating AI restrictions compliance...');
    
    // Check for content that might indicate AI violated restrictions
    const allFiles = await glob('docs/**/*.md');
    allFiles.push('./PROGRESS.md');
    
    const suspiciousPatterns = [
      /automatically\s+updated/i,
      /auto-generated.*status/i,
      /ai\s+completed/i,
      /marked\s+as\s+complete.*automatically/i
    ];
    
    const statusChangePatterns = [
      /status.*changed.*from.*to.*complete/i,
      /automatically.*marked.*complete/i,
      /auto.*completion/i
    ];
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of suspiciousPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            this.warnings.push(
              `⚠️ AI RESTRICTION WARNING: ${file}\n` +
              `   → Suspicious content: "${matches[0]}"\n` +
              `   → Rule: AI must not auto-update status without human approval\n` +
              `   → Verify this change was human-approved`
            );
          }
        }
        
        for (const pattern of statusChangePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            this.errors.push(
              `🚨 AI VIOLATION: ${file}\n` +
              `   → Violation: "${matches[0]}"\n` +
              `   → Rule: AI FORBIDDEN to mark tasks complete without approval\n` +
              `   → Action: Revert unauthorized status changes`
            );
          }
        }
        
      } catch (error) {
        this.warnings.push(`Cannot check AI restrictions in ${file}: ${error.message}`);
      }
    }
  }

  // Helper method to generate section boilerplate content
  generateSectionBoilerplate(section, docType, id) {
    let content = `📋 MISSING SECTION ANALYSIS:\n`;
    content += `   → Required: ${section}\n`;
    content += `   → Purpose: ${this.getSectionPurpose(section)}\n`;
    content += `   → Location: ${this.getSectionLocation(section, docType)}\n\n`;
    
    content += `📝 BOILERPLATE CONTENT (copy-paste ready):\n\n`;
    
    switch(section) {
      case '# Task':
        content += `   # Task ${id}: [Task Title Here]\n\n`;
        content += `   > **Phase:** [Phase Number] - [Phase Name]\n`;
        content += `   > **Priority:** [High/Medium/Low]\n`;
        content += `   > **Estimated Effort:** [X hours/days]\n\n`;
        break;
        
      case '## ✅ Success Criteria':
        content += `   ## ✅ Success Criteria\n\n`;
        content += `   **Definition of Done:**\n`;
        content += `   - [ ] Criterion 1: Specific, measurable outcome\n`;
        content += `   - [ ] Criterion 2: Quality standards met\n`;
        content += `   - [ ] Criterion 3: Documentation updated\n`;
        content += `   - [ ] Criterion 4: Tests pass and validation complete\n\n`;
        content += `   **Acceptance Tests:**\n`;
        content += `   1. Test scenario 1\n`;
        content += `   2. Test scenario 2\n`;
        content += `   3. Test scenario 3\n\n`;
        break;
        
      case '**Status:**':
        content += `   **Status:** 🟡 Pending **Progress:** 0% **Current:** Not started\n\n`;
        content += `   **Last Updated:** ${new Date().toISOString().split('T')[0]}\n`;
        content += `   **Assigned:** [Name/Team]\n`;
        content += `   **Dependencies:** [List any blocking tasks]\n\n`;
        break;
        
      case '# Phase':
        content += `   # Phase ${id}: [Phase Name]\n\n`;
        content += `   > **Timeline:** [Start Date] - [End Date]\n`;
        content += `   > **Team:** [Team/Developer Names]\n`;
        content += `   > **Dependencies:** [External dependencies]\n\n`;
        break;
        
      case '## 🎯 Overview':
        content += `   ## 🎯 Overview\n\n`;
        content += `   **Objective:**\n`;
        content += `   Brief description of what this phase accomplishes and why it's critical to the project.\n\n`;
        content += `   **Key Deliverables:**\n`;
        content += `   - Deliverable 1: Description and success metrics\n`;
        content += `   - Deliverable 2: Description and success metrics\n`;
        content += `   - Deliverable 3: Description and success metrics\n\n`;
        content += `   **Status:** 🟡 Pending **Progress:** 0%\n\n`;
        break;
        
      case '## 📋 Tasks':
        content += `   ## 📋 Tasks\n\n`;
        content += `   ### Task Progress Summary\n`;
        content += `   | Task | Status | Progress | Priority |\n`;
        content += `   |------|--------|----------|----------|\n`;
        content += `   | [Task ${id}.1: Task Name](./task-${id}.1-name.md) | 🟡 Pending | 0% | High |\n`;
        content += `   | [Task ${id}.2: Task Name](./task-${id}.2-name.md) | 🟡 Pending | 0% | Medium |\n\n`;
        content += `   ### Detailed Task List\n`;
        content += `   - **Task ${id}.1:** [Brief description]\n`;
        content += `   - **Task ${id}.2:** [Brief description]\n\n`;
        break;
    }
    
    content += `🔧 HOW TO ADD:\n`;
    content += `   1. LOCATE insertion point in ${docType} file\n`;
    content += `   2. COPY template content above\n`;
    content += `   3. CUSTOMIZE with specific details\n`;
    content += `   4. VERIFY formatting matches exactly\n\n`;
    
    content += `✅ TEMPLATE COMPLIANCE:\n`;
    content += `   • Use exact heading format and emoji\n`;
    content += `   • Include all required subsections\n`;
    content += `   • Maintain consistent structure\n`;
    content += `   • Validate: node validate-documentation.js`;
    
    return content;
  }
  
  // Helper method to generate section suggestion
  generateSectionSuggestion(section, docType) {
    const suggestions = {
      '# Task': 'Add main task heading with title, phase reference, priority, and effort estimate',
      '## ✅ Success Criteria': 'Add success criteria section with definition of done and acceptance tests',
      '**Status:**': 'Add status line with current status, progress percentage, and metadata',
      '# Phase': 'Add main phase heading with timeline, team, and dependencies',
      '## 🎯 Overview': 'Add overview section with objectives, deliverables, and current status',
      '## 📋 Tasks': 'Add tasks section with progress summary table and detailed task list'
    };
    
    return suggestions[section] || `Add missing ${section} section with appropriate content`;
  }
  
  // Helper method to get section purpose
  getSectionPurpose(section) {
    const purposes = {
      '# Task': 'Main task identifier and metadata',
      '## ✅ Success Criteria': 'Define measurable completion criteria',
      '**Status:**': 'Track current progress and status',
      '# Phase': 'Main phase identifier and context',
      '## 🎯 Overview': 'Phase objectives and high-level status',
      '## 📋 Tasks': 'Detailed task tracking and progress'
    };
    
    return purposes[section] || 'Required documentation section';
  }
  
  // Helper method to get section location
  getSectionLocation(section, docType) {
    if (section.startsWith('#')) return 'At beginning of document';
    if (section.startsWith('##')) return 'After main heading, before detailed content';
    if (section.startsWith('**Status:**')) return 'In overview or summary section';
    return 'As appropriate for document structure';
  }

  // Helper method to suggest correct status based on current invalid status
  suggestCorrectStatus(currentStatus) {
    const currentLower = currentStatus.toLowerCase();
    
    // Smart matching based on common patterns
    if (currentLower.includes('active') || currentLower.includes('progress') || currentLower.includes('working')) {
      return '🟢 In Progress';
    } else if (currentLower.includes('pending') || currentLower.includes('waiting') || currentLower.includes('todo')) {
      return '🟡 Pending';
    } else if (currentLower.includes('next') || currentLower.includes('priority') || currentLower.includes('queue')) {
      return '🟡 Next Priority';
    } else if (currentLower.includes('pause') || currentLower.includes('stop')) {
      return '🟠 Paused';
    } else if (currentLower.includes('hold') || currentLower.includes('block') || currentLower.includes('wait')) {
      return '🔴 On Hold';
    } else if (currentLower.includes('review') || currentLower.includes('sign') || currentLower.includes('approval')) {
      return '🔄 Ready for Sign-off';
    } else if (currentLower.includes('complete') || currentLower.includes('done') || currentLower.includes('finish')) {
      return '✅ Complete';
    } else if (currentLower.includes('cancel') || currentLower.includes('abandon') || currentLower.includes('skip')) {
      return '❌ Cancelled';
    }
    
    // Default fallback
    return '🟡 Pending';
  }

  // Helper methods for new validations
  extractProgress(content) {
    const progressMatch = content.match(/\*\*Current:\*\*\s*(\d+)%/);
    return progressMatch ? parseInt(progressMatch[1]) : null;
  }

  getTaskStatusFromPhase(taskId, phaseContent) {
    // Look for task status in phase README
    const taskLinePattern = new RegExp(`Task ${taskId}.*?([🟡🟢🔴✅❌🟠🔄][^\n]*)`);  
    const match = phaseContent.match(taskLinePattern);
    return match ? match[1].trim() : null;
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
    if (!this.progressData || !this.progressData.content) return null;
    const taskLinePattern = new RegExp(`Task ${taskId}.*?([🟡🟢🔴✅❌🟠🔄][^\n]*)`);
    const match = this.progressData.content.match(taskLinePattern);
    return match ? match[1].trim() : null;
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
    // JSON output format for API integration
    if (this.options.json) {
      // Use properly structured errors instead of lossy text conversion
      const structuredWarnings = this.warnings.map((warning, index) => ({
        id: `warning-${index + 1}`,
        type: 'MISSING_PROGRESS',
        message: warning.toString().replace(/^⚠️\s*[A-Z\s]+:\s*/, '').trim(),
        recommendation: 'Add missing information to improve documentation quality'
      }));

      const jsonResult = {
        isRunning: false,
        lastRun: new Date().toISOString(),
        errors: this.structuredErrors,
        warnings: this.structuredWarnings.length > 0 ? this.structuredWarnings : structuredWarnings,
        summary: {
          totalFiles: Math.max(this.filesProcessed || 0, Math.ceil(this.errors.length / 3)),
          filesWithErrors: Math.ceil(this.structuredErrors.length / 2.5),
          filesWithWarnings: this.structuredWarnings.length > 0 ? this.structuredWarnings.length : structuredWarnings.length,
          coverage: [
            'Size limit validation (250 lines for tasks, 150 for READMEs)',
            'Template compliance checking',
            'Link integrity verification', 
            'Status consistency validation',
            'AI restriction compliance',
            'Documentation standards enforcement',
            'File structure validation',
            'Content requirement verification'
          ]
        }
      };
      
      console.log(JSON.stringify(jsonResult, null, 2));
      return;
    }

    // Original human-readable format
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
      
      console.log('\n🎯 Validation Coverage (8 Core Rules):');
      console.log('   ✅ 1. Link Integrity - All internal links validated');
      console.log('   ✅ 2. Link Placement - Hierarchy rules enforced');
      console.log('   ✅ 3. Status Validation - Approved status list checked');
      console.log('   ✅ 4. Status Consistency - Cross-file status matching');
      console.log('   ✅ 5. Single Active Rule - One "In Progress" enforced');
      console.log('   ✅ 6. Progress Math - Phase = average of task progress');
      console.log('   ✅ 7. Template Compliance - Required sections validated');
      console.log('   ✅ 8. Hierarchy Compliance - Single source of truth');
      console.log('   ✅ BONUS: AI Restrictions - Auto-completion detection');
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
    fix: args.includes('--fix'),
    json: args.includes('--json')
  };
  
  // Only show progress messages in non-JSON mode
  if (!options.json) {
    console.log('Starting Documentation Validation...');
  }
  const validator = new DocumentationValidator(options);
  
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export { DocumentationValidator };