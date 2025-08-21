#!/usr/bin/env node

/**
 * Regenerate task-inventory.json accurately from PROGRESS.md
 * Fixes the mismatch between actual progress and generated tasks
 */

const fs = require('fs');
const path = require('path');

class TaskInventoryRegenerator {
  constructor() {
    this.progressFile = path.join(process.cwd(), 'PROGRESS.md');
    this.outputFile = path.join(process.cwd(), 'task-inventory-corrected.json');
  }

  regenerate() {
    console.log('🔄 Regenerating task-inventory.json from PROGRESS.md...\n');

    try {
      // Read PROGRESS.md
      const progressContent = fs.readFileSync(this.progressFile, 'utf8');
      
      // Parse actual tasks from PROGRESS.md
      const taskData = this.parseTasksFromProgress(progressContent);
      
      // Generate corrected inventory
      this.generateInventory(taskData);
      
      console.log('✅ Corrected task inventory generated!');
      console.log(`📁 Output: ${this.outputFile}`);
      console.log('\n🔄 Next: Replace task-inventory.json with corrected version');

    } catch (error) {
      console.error('❌ Regeneration failed:', error.message);
      process.exit(1);
    }
  }

  parseTasksFromProgress(content) {
    const phases = [];
    const lines = content.split('\n');
    
    let currentPhase = null;
    let currentTask = null;
    let currentSubTask = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Phase detection
      if (line.match(/^### Phase \d+:/)) {
        if (currentPhase) phases.push(currentPhase);
        
        const phaseMatch = line.match(/^### Phase (\d+): (.+) \((.+)\)/);
        if (phaseMatch) {
          currentPhase = {
            id: `phase-${phaseMatch[1]}`,
            name: `Phase ${phaseMatch[1]}: ${phaseMatch[2]}`,
            status: phaseMatch[3],
            tasks: []
          };
        }
        continue;
      }

      // Task detection
      if (line.match(/^#### Task \d+\./)) {
        if (currentTask && currentPhase) {
          currentPhase.tasks.push(currentTask);
        }
        
        const taskMatch = line.match(/^#### Task (\d+\.\d+): (.+) \((.+)\)/);
        if (taskMatch) {
          currentTask = {
            id: taskMatch[1],
            title: taskMatch[2],
            status: taskMatch[3],
            subTasks: []
          };
        }
        continue;
      }

      // Sub-task detection
      if (line.match(/^- \[.\] \*\*Sub-task \d+\./)) {
        const subTaskMatch = line.match(/^- \[(.)\] \*\*Sub-task (\d+\.\d+\.\d+): (.+)\*\* \((.+)\)/);
        if (subTaskMatch && currentTask) {
          const isCompleted = subTaskMatch[1] === 'x';
          currentSubTask = {
            id: subTaskMatch[2],
            title: subTaskMatch[3],
            progress: subTaskMatch[4],
            completed: isCompleted,
            items: []
          };
          currentTask.subTasks.push(currentSubTask);
        }
        continue;
      }

      // Sub-task items
      if (line.match(/^  - \[.\]/) && currentSubTask) {
        const itemMatch = line.match(/^  - \[(.)\] (.+)/);
        if (itemMatch) {
          const isCompleted = itemMatch[1] === 'x';
          currentSubTask.items.push({
            text: itemMatch[2],
            completed: isCompleted
          });
        }
      }
    }

    // Add last task and phase
    if (currentTask && currentPhase) {
      currentPhase.tasks.push(currentTask);
    }
    if (currentPhase) {
      phases.push(currentPhase);
    }

    return { phases };
  }

  generateInventory(taskData) {
    const inventory = {
      metadata: {
        generatedAt: new Date().toISOString(),
        source: "PROGRESS.md (corrected parsing)",
        totalPhases: taskData.phases.length,
        totalTasks: 0,
        completedTasks: 0
      },
      phases: []
    };

    // Process each phase
    for (const phase of taskData.phases) {
      const processedPhase = {
        id: phase.id,
        name: phase.name,
        status: phase.status,
        description: this.getPhaseDescription(phase.id),
        tasks: []
      };

      // Process each task in phase
      for (const task of phase.tasks) {
        for (const subTask of task.subTasks) {
          const processedTask = {
            id: subTask.id,
            title: subTask.title,
            category: this.categorizeTask(subTask.title),
            priority: this.prioritizeTask(subTask.title),
            completed: subTask.completed,
            progress: subTask.progress,
            items: subTask.items
          };

          processedPhase.tasks.push(processedTask);
          inventory.metadata.totalTasks++;
          if (subTask.completed) {
            inventory.metadata.completedTasks++;
          }
        }
      }

      inventory.phases.push(processedPhase);
    }

    // Add completion percentage
    inventory.metadata.completionPercentage = 
      Math.round((inventory.metadata.completedTasks / inventory.metadata.totalTasks) * 100);

    // Write to file
    fs.writeFileSync(this.outputFile, JSON.stringify(inventory, null, 2));
    
    console.log(`📊 Tasks found: ${inventory.metadata.totalTasks}`);
    console.log(`✅ Completed: ${inventory.metadata.completedTasks}`);
    console.log(`📈 Progress: ${inventory.metadata.completionPercentage}%`);
  }

  getPhaseDescription(phaseId) {
    const descriptions = {
      'phase-1': 'Foundation setup with Vite, React, TypeScript, and shadcn/ui components',
      'phase-2': 'Complete Gita Alumni Connect platform implementation with UI/UX',
      'phase-3': 'Multi-domain validation with volunteer, education, and event platforms'
    };
    return descriptions[phaseId] || 'Phase description';
  }

  categorizeTask(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('project') || titleLower.includes('setup') || titleLower.includes('init')) return 'setup';
    if (titleLower.includes('theme') || titleLower.includes('css')) return 'theming';
    if (titleLower.includes('component') || titleLower.includes('ui')) return 'components';
    if (titleLower.includes('table') || titleLower.includes('data')) return 'table';
    if (titleLower.includes('auth') || titleLower.includes('login') || titleLower.includes('profile')) return 'auth';
    if (titleLower.includes('dashboard')) return 'dashboard';
    if (titleLower.includes('posting') || titleLower.includes('post')) return 'posting';
    if (titleLower.includes('browse') || titleLower.includes('directory')) return 'browse';
    if (titleLower.includes('preference') || titleLower.includes('setting')) return 'preferences';
    if (titleLower.includes('chat') || titleLower.includes('message')) return 'messaging';
    if (titleLower.includes('moderation') || titleLower.includes('review')) return 'moderation';
    if (titleLower.includes('analytics') || titleLower.includes('report')) return 'analytics';
    if (titleLower.includes('volunteer')) return 'volunteer';
    if (titleLower.includes('education') || titleLower.includes('course')) return 'education';
    if (titleLower.includes('event')) return 'events';
    if (titleLower.includes('quality') || titleLower.includes('test')) return 'quality';
    if (titleLower.includes('doc')) return 'docs';
    
    return 'misc';
  }

  prioritizeTask(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('critical') || titleLower.includes('foundation') || titleLower.includes('core')) return 'critical';
    if (titleLower.includes('authentication') || titleLower.includes('login') || titleLower.includes('theme system')) return 'high';
    if (titleLower.includes('advanced') || titleLower.includes('enhancement')) return 'medium';
    
    return 'medium';
  }
}

// CLI execution
if (require.main === module) {
  const regenerator = new TaskInventoryRegenerator();
  regenerator.regenerate();
}

module.exports = { TaskInventoryRegenerator };