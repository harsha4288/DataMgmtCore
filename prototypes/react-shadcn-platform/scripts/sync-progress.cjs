/**
 * Sync Progress Script
 * Updates PROGRESS.md based on the status in individual task files
 * Individual task files are the single source of truth
 */

const fs = require('fs');
const path = require('path');
const { ProgressParser } = require('./parseProgressFiles.cjs');

class ProgressSync {
  constructor() {
    this.parser = new ProgressParser();
    this.progressPath = './PROGRESS.md';
    this.backupPath = './PROGRESS.md.backup';
  }

  /**
   * Main sync function
   */
  sync() {
    console.log('🔄 Syncing progress from task files to PROGRESS.md...\n');

    // Parse all task files
    const phases = this.parser.parseAll();
    const summary = this.parser.generateSummary(phases);

    // Create backup
    this.createBackup();

    // Read current PROGRESS.md
    const currentContent = fs.readFileSync(this.progressPath, 'utf8');

    // Update content
    const updatedContent = this.updateProgressContent(currentContent, phases, summary);

    // Write updated content
    fs.writeFileSync(this.progressPath, updatedContent);

    console.log('✅ Progress sync completed!');
    console.log(`   Overall Progress: ${summary.overallProgress}%`);
    console.log(`   Phases: ${summary.completedPhases}/${summary.totalPhases} completed`);
    console.log(`   Tasks: ${summary.completedTasks}/${summary.totalTasks} completed`);
  }

  /**
   * Create backup of current PROGRESS.md
   */
  createBackup() {
    if (fs.existsSync(this.progressPath)) {
      fs.copyFileSync(this.progressPath, this.backupPath);
      console.log('📋 Created backup: PROGRESS.md.backup');
    }
  }

  /**
   * Update PROGRESS.md content with parsed data
   */
  updateProgressContent(content, phases, summary) {
    const lines = content.split('\n');
    const updatedLines = [];
    let i = 0;

    // Keep header section until Phase Status Overview
    while (i < lines.length && !lines[i].includes('### Phase Status Overview')) {
      // Update overall completion percentage
      if (lines[i].includes('**Overall Completion:**')) {
        const phaseStats = this.getPhaseCompletionStats(phases);
        updatedLines.push(`**Overall Completion:** ${summary.overallProgress}% (${phaseStats})  `);
      }
      // Update last updated date
      else if (lines[i].includes('**Last Updated:**')) {
        const today = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        updatedLines.push(`**Last Updated:** ${today}`);
      }
      // Update current status
      else if (lines[i].includes('**Current Status:**')) {
        const currentStatus = this.getCurrentStatus(phases);
        updatedLines.push(`**Current Status:** ${currentStatus}  `);
      }
      else {
        updatedLines.push(lines[i]);
      }
      i++;
    }

    // Update Phase Status Overview table
    if (i < lines.length && lines[i].includes('### Phase Status Overview')) {
      updatedLines.push(lines[i]); // Keep header
      i++;
      updatedLines.push(''); // Empty line
      updatedLines.push('| Phase | Status | Progress | Target Date | Actual Date |');
      updatedLines.push('|-------|--------|----------|-------------|-------------|');
      
      // Skip old table
      while (i < lines.length && !lines[i].includes('### Key Metrics')) {
        if (lines[i].startsWith('|') && lines[i].includes('Phase')) {
          // Skip existing table rows
        } else if (lines[i].trim() === '' && lines[i + 1] && lines[i + 1].includes('### Key Metrics')) {
          break;
        }
        i++;
      }

      // Add updated phase rows
      phases.forEach(phase => {
        const phaseLink = `./docs/progress/phase-${phase.id}/README.md`;
        const statusEmoji = this.getPhaseStatusEmoji(phase);
        const statusText = this.getPhaseStatusText(phase);
        const actualDate = phase.status === 'completed' ? 
          this.getPhaseActualDate(phase.id) : '-';
        
        updatedLines.push(`| **[Phase ${phase.id}: ${this.getPhaseShortName(phase)}](${phaseLink})** | ${statusEmoji} ${statusText} | ${phase.progress}% | ${this.getPhaseTargetDate(phase.id)} | ${actualDate} |`);
      });
      updatedLines.push('');
    }

    // Keep rest of content but update phase details
    while (i < lines.length) {
      const line = lines[i];
      
      // Update phase detail sections
      if (line.startsWith('### [Phase')) {
        const phaseMatch = line.match(/Phase (\d+):/);
        if (phaseMatch) {
          const phaseNum = phaseMatch[1];
          const phase = phases.find(p => p.id === phaseNum);
          if (phase) {
            // Update phase header
            updatedLines.push(this.generatePhaseHeader(phase));
            i++;
            
            // Skip old content until next phase or section
            while (i < lines.length && !lines[i].startsWith('### [Phase') && !lines[i].startsWith('## ')) {
              // Look for Tasks section
              if (lines[i].startsWith('**Tasks:**')) {
                updatedLines.push('');
                updatedLines.push('**Status:** ' + this.getPhaseDetailedStatus(phase));
                updatedLines.push('**Key Achievements:**');
                updatedLines.push(this.getPhaseAchievements(phase));
                updatedLines.push('');
                updatedLines.push('**Tasks:**');
                
                // Add task list
                phase.tasks.forEach(task => {
                  const taskLink = `./docs/progress/phase-${phase.id}/task-${task.id}-${this.slugify(task.title)}.md`;
                  const statusEmoji = task.status === 'completed' ? '✅' : 
                                     task.status === 'in_progress' ? '🟡' :
                                     task.status === 'on_hold' ? '🔴' : '🟡';
                  updatedLines.push(`- [Task ${task.id}: ${task.title}](${taskLink}) ${statusEmoji}`);
                });
                
                // Skip old task list
                while (i < lines.length && lines[i].startsWith('- [Task')) {
                  i++;
                }
                i--;
              }
              i++;
            }
            i--;
          }
        }
      } else {
        updatedLines.push(line);
      }
      i++;
    }

    return updatedLines.join('\n');
  }

  /**
   * Get current status string
   */
  getCurrentStatus(phases) {
    const active = phases.find(p => p.status === 'in_progress');
    const next = phases.find(p => p.status === 'pending' || 
                             (p.status === 'on_hold' && p.priority === 'high'));
    
    if (active) {
      return `🟡 Phase ${active.id} - ${active.title.replace(/Phase \d+:\s*/, '')} (${active.progress}% Complete)`;
    } else if (next) {
      return `🟡 Ready for Phase ${next.id} - ${next.title.replace(/Phase \d+:\s*/, '')}`;
    }
    return '🟢 All phases complete';
  }

  /**
   * Get phase completion statistics string
   */
  getPhaseCompletionStats(phases) {
    const summary = this.parser.generateSummary(phases);
    return `${summary.completedTasks}/${summary.totalTasks} tasks, ${summary.completedPhases}/${summary.totalPhases} phases`;
  }

  /**
   * Get phase status emoji
   */
  getPhaseStatusEmoji(phase) {
    if (phase.status === 'completed') return '✅';
    if (phase.status === 'in_progress') return '🟡';
    if (phase.status === 'on_hold') return '🔴';
    return '🟡';
  }

  /**
   * Get phase status text
   */
  getPhaseStatusText(phase) {
    if (phase.status === 'completed') return 'Completed';
    if (phase.status === 'in_progress') return 'Active';
    if (phase.status === 'on_hold') return 'On Hold';
    return 'Pending';
  }

  /**
   * Get phase short name for table
   */
  getPhaseShortName(phase) {
    const nameMap = {
      '0': 'Planning & Documentation',
      '1': 'Foundation',
      '2': 'Gita Alumni Mock UI',
      '3': 'Multi-Domain',
      '4': 'Polish',
      '5': 'Development Infrastructure',
      '6': 'Alumni Production Implementation'
    };
    return nameMap[phase.id] || phase.title.replace(/Phase \d+:\s*/, '');
  }

  /**
   * Get phase target date
   */
  getPhaseTargetDate(phaseId) {
    const dates = {
      '0': 'Week 0',
      '1': 'Week 1',
      '2': 'Week 2',
      '3': 'Week 3',
      '4': 'Week 4',
      '5': 'Week 5',
      '6': 'Week 6-14'
    };
    return dates[phaseId] || 'TBD';
  }

  /**
   * Get phase actual completion date
   */
  getPhaseActualDate(phaseId) {
    const dates = {
      '0': 'December 19, 2024',
      '2': 'August 20, 2025'
    };
    return dates[phaseId] || '-';
  }

  /**
   * Generate phase header for detailed section
   */
  generatePhaseHeader(phase) {
    const emoji = phase.status === 'completed' ? '✅' : 
                  phase.status === 'on_hold' ? '🔴' : '🟡';
    const status = phase.status === 'completed' ? 'Complete' :
                   phase.status === 'on_hold' ? 'On Hold' :
                   phase.status === 'in_progress' ? 'Active' : 'Pending';
    
    return `### [Phase ${phase.id}: ${this.getPhaseShortName(phase)}](./docs/progress/phase-${phase.id}/README.md) ${emoji} ${status}`;
  }

  /**
   * Get phase detailed status
   */
  getPhaseDetailedStatus(phase) {
    const percentage = `${phase.progress}% Complete`;
    const taskInfo = phase.totalTasks > 0 ? 
      ` - ${phase.completedTasks}/${phase.totalTasks} tasks completed` : '';
    
    if (phase.status === 'on_hold') {
      return `${percentage}${taskInfo} - On hold for infrastructure`;
    }
    return `${percentage}${taskInfo}`;
  }

  /**
   * Get phase achievements
   */
  getPhaseAchievements(phase) {
    const achievements = [];
    
    // Add completed tasks as achievements
    phase.tasks.filter(t => t.status === 'completed').forEach(task => {
      achievements.push(`- ✅ ${task.title}`);
    });
    
    // Add in-progress tasks
    phase.tasks.filter(t => t.status === 'in_progress').forEach(task => {
      achievements.push(`- 🟡 ${task.title} (${task.progress}% complete)`);
    });
    
    return achievements.join('\n') || '- No tasks completed yet';
  }

  /**
   * Convert title to URL slug
   */
  slugify(text) {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Restore from backup
   */
  restore() {
    if (fs.existsSync(this.backupPath)) {
      fs.copyFileSync(this.backupPath, this.progressPath);
      console.log('✅ Restored PROGRESS.md from backup');
    } else {
      console.error('❌ No backup file found');
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProgressSync };
}

// CLI usage
if (require.main === module) {
  const sync = new ProgressSync();
  
  const args = process.argv.slice(2);
  if (args.includes('--restore')) {
    sync.restore();
  } else {
    sync.sync();
  }
}