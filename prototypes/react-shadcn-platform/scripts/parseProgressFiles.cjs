/**
 * Parse Progress Files
 * Reads all task .md files from docs/progress/ and extracts status information
 * This is the single source of truth for task status
 */

const fs = require('fs');
const path = require('path');

class ProgressParser {
  constructor(basePath = './docs/progress') {
    this.basePath = basePath;
  }

  /**
   * Parse all progress files and return structured data
   */
  parseAll() {
    const phases = [];
    
    // Get all phase directories
    const phaseDirs = fs.readdirSync(this.basePath)
      .filter(dir => dir.startsWith('phase-'))
      .sort();

    for (const phaseDir of phaseDirs) {
      const phasePath = path.join(this.basePath, phaseDir);
      const phaseData = this.parsePhase(phasePath, phaseDir);
      if (phaseData) {
        phases.push(phaseData);
      }
    }

    return phases;
  }

  /**
   * Parse a single phase directory
   */
  parsePhase(phasePath, phaseDir) {
    const phaseNumber = phaseDir.replace('phase-', '');
    const phaseReadmePath = path.join(phasePath, 'README.md');
    
    if (!fs.existsSync(phaseReadmePath)) {
      return null;
    }

    const phaseContent = fs.readFileSync(phaseReadmePath, 'utf8');
    const phaseInfo = this.extractPhaseInfo(phaseContent, phaseNumber);

    // Parse all task files in this phase
    const taskFiles = fs.readdirSync(phasePath)
      .filter(file => file.startsWith('task-') && file.endsWith('.md'))
      .sort();

    const tasks = [];
    for (const taskFile of taskFiles) {
      const taskPath = path.join(phasePath, taskFile);
      const taskData = this.parseTaskFile(taskPath, taskFile);
      if (taskData) {
        tasks.push(taskData);
      }
    }

    // Calculate phase progress based on tasks
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...phaseInfo,
      progress,
      tasks,
      completedTasks,
      totalTasks
    };
  }

  /**
   * Extract phase information from README.md
   */
  extractPhaseInfo(content, phaseNumber) {
    const lines = content.split('\n');
    
    // Extract title (first # line)
    const titleLine = lines.find(line => line.startsWith('#'));
    const title = titleLine ? titleLine.replace(/^#+\s*/, '').trim() : `Phase ${phaseNumber}`;
    
    // Extract status
    const statusMatch = content.match(/\*\*Status:\*\*\s*([^*\n]+)/);
    const statusText = statusMatch ? statusMatch[1].trim() : '';
    
    // Parse status emoji and text
    let status = 'pending';
    let statusEmoji = '🟡';
    if (statusText.includes('Complete') || statusText.includes('100%')) {
      status = 'completed';
      statusEmoji = '✅';
    } else if (statusText.includes('Active') || statusText.includes('In Progress')) {
      status = 'in_progress';
      statusEmoji = '🟡';
    } else if (statusText.includes('On Hold') || statusText.includes('Blocked')) {
      status = 'on_hold';
      statusEmoji = '🔴';
    }

    // Extract focus/description
    const focusMatch = content.match(/\*\*Focus:\*\*\s*([^*\n]+)/);
    const description = focusMatch ? focusMatch[1].trim() : '';

    // Extract timeline
    const timelineMatch = content.match(/\*\*Timeline:\*\*\s*([^*\n]+)/);
    const timeline = timelineMatch ? timelineMatch[1].trim() : '';

    return {
      id: phaseNumber,
      title,
      status,
      statusEmoji,
      statusText,
      description,
      timeline
    };
  }

  /**
   * Parse a single task file
   */
  parseTaskFile(taskPath, filename) {
    const content = fs.readFileSync(taskPath, 'utf8');
    const lines = content.split('\n');
    
    // Extract task ID from filename
    const taskIdMatch = filename.match(/task-(\d+\.\d+)/);
    const taskId = taskIdMatch ? taskIdMatch[1] : filename.replace('.md', '');
    
    // Extract title
    const titleLine = lines.find(line => line.startsWith('#'));
    const title = titleLine ? titleLine.replace(/^#+\s*/, '').trim() : filename;
    
    // Extract status
    const statusMatch = content.match(/\*\*Status:\*\*\s*([^*\n]+)/);
    const statusText = statusMatch ? statusMatch[1].trim() : '';
    
    // Determine status
    let status = 'pending';
    let statusEmoji = '🟡';
    if (statusText.includes('Complete') || statusText.includes('✅')) {
      status = 'completed';
      statusEmoji = '✅';
    } else if (statusText.includes('In Progress') || statusText.includes('Active')) {
      status = 'in_progress';
      statusEmoji = '🟡';
    } else if (statusText.includes('On Hold') || statusText.includes('Blocked')) {
      status = 'on_hold';
      statusEmoji = '🔴';
    } else if (statusText.includes('Pending')) {
      status = 'pending';
      statusEmoji = '🟡';
    }

    // Extract progress percentage
    const progressMatch = content.match(/\*\*Progress:\*\*\s*(\d+)%/);
    const progress = progressMatch ? parseInt(progressMatch[1]) : 
                    (status === 'completed' ? 100 : 0);

    // Extract priority
    const priorityMatch = content.match(/\*\*Priority:\*\*\s*([^*\n]+)/);
    const priority = priorityMatch ? priorityMatch[1].trim() : 'Medium';

    // Extract complexity
    const complexityMatch = content.match(/\*\*Complexity:\*\*\s*([^*\n]+)/);
    const complexity = complexityMatch ? complexityMatch[1].trim() : 'Medium';

    // Count subtasks
    const subtasks = this.extractSubtasks(content);
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const totalSubtasks = subtasks.length;
    
    // Calculate progress from subtasks if not explicitly set
    const calculatedProgress = totalSubtasks > 0 
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : progress;

    return {
      id: taskId,
      title: title.replace(/^Task \d+\.\d+:\s*/, ''), // Remove "Task X.Y:" prefix
      status,
      statusEmoji,
      statusText,
      progress: calculatedProgress,
      priority,
      complexity,
      subtasks,
      completedSubtasks,
      totalSubtasks,
      filePath: taskPath
    };
  }

  /**
   * Extract subtasks from content
   */
  extractSubtasks(content) {
    const subtasks = [];
    const lines = content.split('\n');
    
    let inSubtaskSection = false;
    for (const line of lines) {
      // Check if we're entering a subtask section
      if (line.match(/##.*Sub-?tasks?/i)) {
        inSubtaskSection = true;
        continue;
      }
      
      // Check if we're leaving the subtask section
      if (inSubtaskSection && line.startsWith('##') && !line.match(/Sub-?tasks?/i)) {
        inSubtaskSection = false;
        continue;
      }
      
      // Parse checkbox items
      if (inSubtaskSection && line.trim().match(/^-\s*\[[ x]\]/)) {
        const completed = line.includes('[x]');
        const title = line.replace(/^-\s*\[[ x]\]\s*/, '').trim();
        if (title) {
          subtasks.push({ title, completed });
        }
      }
    }
    
    return subtasks;
  }

  /**
   * Generate summary statistics
   */
  generateSummary(phases) {
    const totalPhases = phases.length;
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const activePhases = phases.filter(p => p.status === 'in_progress').length;
    const onHoldPhases = phases.filter(p => p.status === 'on_hold').length;
    
    const allTasks = phases.flatMap(p => p.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    
    const overallProgress = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    return {
      totalPhases,
      completedPhases,
      activePhases,
      onHoldPhases,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overallProgress
    };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProgressParser };
}

// CLI usage
if (require.main === module) {
  const parser = new ProgressParser();
  const phases = parser.parseAll();
  const summary = parser.generateSummary(phases);
  
  console.log('Progress Summary:');
  console.log('================');
  console.log(`Overall Progress: ${summary.overallProgress}%`);
  console.log(`Phases: ${summary.completedPhases}/${summary.totalPhases} completed`);
  console.log(`Tasks: ${summary.completedTasks}/${summary.totalTasks} completed`);
  console.log('');
  
  phases.forEach(phase => {
    console.log(`${phase.statusEmoji} Phase ${phase.id}: ${phase.title}`);
    console.log(`  Progress: ${phase.progress}% (${phase.completedTasks}/${phase.totalTasks} tasks)`);
    phase.tasks.forEach(task => {
      console.log(`    ${task.statusEmoji} Task ${task.id}: ${task.title} (${task.progress}%)`);
    });
    console.log('');
  });
}