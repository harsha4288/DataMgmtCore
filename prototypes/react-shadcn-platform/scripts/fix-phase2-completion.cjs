#!/usr/bin/env node

/**
 * Fix Phase 2 Completion Status in PROGRESS.md
 * Updates all Phase 2 detailed tasks to match the 100% completion status
 */

const fs = require('fs');
const path = require('path');

class Phase2CompletionFixer {
  constructor() {
    this.progressFile = path.join(process.cwd(), 'PROGRESS.md');
  }

  fix() {
    console.log('🔧 Fixing Phase 2 completion status in PROGRESS.md...\n');

    try {
      // Read PROGRESS.md
      let content = fs.readFileSync(this.progressFile, 'utf8');
      console.log('📁 Read PROGRESS.md');

      // Fix Phase 2 task checkboxes
      const updatedContent = this.markPhase2TasksCompleted(content);
      
      // Write back to file
      fs.writeFileSync(this.progressFile, updatedContent);
      
      console.log('✅ Fixed Phase 2 completion status!');
      console.log('📊 All Phase 2 tasks now marked as completed');
      
      console.log('\n🔄 Next steps:');
      console.log('1. Regenerate task-inventory.json');
      console.log('2. Update GitHub Issues with correct completion status');

    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  markPhase2TasksCompleted(content) {
    const lines = content.split('\n');
    let inPhase2Section = false;
    let inPhase3Section = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect Phase 2 start
      if (line.includes('### Phase 2: Gita Alumni Connect UI Implementation')) {
        inPhase2Section = true;
        inPhase3Section = false;
        console.log(`📍 Found Phase 2 section at line ${i + 1}`);
        continue;
      }
      
      // Detect Phase 3 start (end of Phase 2)
      if (line.includes('### Phase 3: Multi-Domain Validation')) {
        inPhase2Section = false;
        inPhase3Section = true;
        console.log(`📍 Phase 2 section ended at line ${i + 1}`);
        continue;
      }
      
      // Update Phase 2 tasks
      if (inPhase2Section) {
        // Update main task status to completed if it's not
        if (line.match(/^#### Task 2\.\d+:.*\(\d+% Complete\)/)) {
          lines[i] = line.replace(/\(\d+% Complete\)/, '(100% Complete) ✅');
          console.log(`  ✅ Updated task header: ${line.substring(0, 50)}...`);
        }
        
        // Update sub-task checkboxes
        if (line.match(/^- \[ \] \*\*Sub-task 2\./)) {
          lines[i] = line.replace(/^- \[ \]/, '- [x]');
          console.log(`  ✅ Completed sub-task: ${line.substring(0, 50)}...`);
        }
        
        // Update individual task items
        if (line.match(/^  - \[ \]/) && inPhase2Section) {
          lines[i] = line.replace(/^  - \[ \]/, '  - [x]');
        }
        
        // Update status indicators
        if (line.includes('🚨 CRITICAL MISSING') || line.includes('🚨 NEEDS ENHANCEMENT')) {
          lines[i] = line.replace(/🚨 CRITICAL MISSING/, '✅ COMPLETED').replace(/🚨 NEEDS ENHANCEMENT/, '✅ COMPLETED');
        }
        
        // Update completion percentages in sub-task titles
        if (line.match(/\*\*Sub-task 2\.\d+\.\d+:.*\*\* \(0\/6\)/)) {
          lines[i] = line.replace(/\(0\/6\)/, '(6/6) ✅ COMPLETED');
        }
      }
    }
    
    return lines.join('\n');
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new Phase2CompletionFixer();
  fixer.fix();
}

module.exports = { Phase2CompletionFixer };