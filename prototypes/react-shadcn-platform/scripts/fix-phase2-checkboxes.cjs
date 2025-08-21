#!/usr/bin/env node

/**
 * Fix Phase 2 Sub-task Checkboxes in PROGRESS.md
 * All Phase 2 sub-tasks should be marked as [x] completed
 */

const fs = require('fs');
const path = require('path');

class Phase2CheckboxFixer {
  constructor() {
    this.progressFile = path.join(process.cwd(), 'PROGRESS.md');
  }

  fix() {
    console.log('🔧 Fixing Phase 2 sub-task checkboxes in PROGRESS.md...\n');

    try {
      // Read PROGRESS.md
      let content = fs.readFileSync(this.progressFile, 'utf8');
      console.log('📁 Read PROGRESS.md');

      // Fix Phase 2 sub-task checkboxes specifically
      const updatedContent = this.fixPhase2Checkboxes(content);
      
      // Write back to file
      fs.writeFileSync(this.progressFile, updatedContent);
      
      console.log('✅ Fixed Phase 2 sub-task checkboxes!');
      console.log('\n🔄 Next: Regenerate GitHub Issues with correct completion status');

    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  fixPhase2Checkboxes(content) {
    const lines = content.split('\n');
    let fixedCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Target Phase 2 sub-tasks that are marked incomplete but should be complete
      if (line.match(/^- \[ \] \*\*Sub-task 2\./)) {
        // Check if this line contains completion indicators
        if (line.includes('✅ COMPLETED') || line.includes('(6/6)') || line.includes('100% Complete')) {
          lines[i] = line.replace(/^- \[ \]/, '- [x]');
          console.log(`  ✅ Fixed: ${line.substring(0, 60)}...`);
          fixedCount++;
        }
      }
    }
    
    console.log(`\n📊 Fixed ${fixedCount} Phase 2 sub-task checkboxes`);
    return lines.join('\n');
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new Phase2CheckboxFixer();
  fixer.fix();
}

module.exports = { Phase2CheckboxFixer };