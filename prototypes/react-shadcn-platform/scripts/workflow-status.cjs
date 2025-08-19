#!/usr/bin/env node

/**
 * Workflow Status Display
 * Shows detailed current status and progress
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function loadConfig() {
  try {
    const configPath = path.join(__dirname, '..', '.workflow-config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error(`${colors.red}Error loading config:${colors.reset}`, error.message);
    return null;
  }
}

function readProgressFile() {
  try {
    const progressPath = path.join(__dirname, '..', 'PROGRESS.md');
    const content = fs.readFileSync(progressPath, 'utf8');
    
    // Extract key metrics from PROGRESS.md
    const metrics = {
      totalTasks: (content.match(/\[ \]/g) || []).length,
      completedTasks: (content.match(/\[x\]/g) || []).length,
      currentPhaseMatch: content.match(/### Phase (\d+):.*?\((\d+)% Complete\)/),
      blockedTasks: (content.match(/❌/g) || []).length,
      inProgressTasks: (content.match(/🔄/g) || []).length
    };
    
    return metrics;
  } catch (error) {
    return null;
  }
}

function displayStatus() {
  const config = loadConfig();
  const progress = readProgressFile();
  
  if (!config) {
    console.error('Unable to load workflow configuration');
    return;
  }

  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║              WORKFLOW STATUS SUMMARY                    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Current Status Box
  console.log(`${colors.bright}📍 CURRENT POSITION${colors.reset}`);
  console.log(`┌────────────────────────────────────────────────────────┐`);
  console.log(`│ Phase: ${colors.yellow}${config.currentStatus.phase}${colors.reset}`);
  console.log(`│ Progress: ${colors.green}${config.currentStatus.phaseProgress}%${colors.reset}`);
  console.log(`│ Active Task: ${colors.cyan}${config.currentStatus.activeTask}${colors.reset}`);
  console.log(`│ Last Completed: ${colors.dim}${config.currentStatus.lastCompleted}${colors.reset}`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  // Progress Metrics
  if (progress) {
    console.log(`${colors.bright}📊 PROGRESS METRICS${colors.reset}`);
    console.log(`┌────────────────────────────────────────────────────────┐`);
    
    const completionRate = progress.totalTasks > 0 
      ? Math.round((progress.completedTasks / progress.totalTasks) * 100) 
      : 0;
    
    console.log(`│ Total Tasks: ${progress.totalTasks}`);
    console.log(`│ Completed: ${colors.green}${progress.completedTasks}${colors.reset}`);
    console.log(`│ In Progress: ${colors.yellow}${progress.inProgressTasks}${colors.reset}`);
    console.log(`│ Blocked: ${colors.red}${progress.blockedTasks}${colors.reset}`);
    console.log(`│ Completion Rate: ${completionRate}%`);
    console.log(`└────────────────────────────────────────────────────────┘\n`);
  }

  // Next Steps
  console.log(`${colors.bright}🎯 NEXT STEPS${colors.reset}`);
  console.log(`┌────────────────────────────────────────────────────────┐`);
  console.log(`│ 1. Complete ${colors.cyan}${config.currentStatus.activeTask}${colors.reset}`);
  console.log(`│ 2. Run quality checks: ${colors.dim}npm run workflow:validate${colors.reset}`);
  console.log(`│ 3. Get user approval for manual testing`);
  console.log(`│ 4. Commit changes: ${colors.dim}npm run workflow:commit${colors.reset}`);
  console.log(`│ 5. Move to next task in PROGRESS.md`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  // Quality Standards Reminder
  console.log(`${colors.bright}✅ QUALITY STANDARDS${colors.reset}`);
  console.log(`┌────────────────────────────────────────────────────────┐`);
  console.log(`│ • Zero ESLint errors/warnings`);
  console.log(`│ • Zero TypeScript errors`);
  console.log(`│ • Theme validation must pass`);
  console.log(`│ • Component reusability > 85%`);
  console.log(`│ • Manual testing approved by user`);
  console.log(`│ • No hardcoded colors or styles`);
  console.log(`└────────────────────────────────────────────────────────┘\n`);

  // Quick Commands
  console.log(`${colors.bright}⚡ QUICK COMMANDS${colors.reset}`);
  console.log(`${colors.cyan}npm run dev${colors.reset}              - Start development server`);
  console.log(`${colors.cyan}npm run workflow:check${colors.reset}   - Full environment check`);
  console.log(`${colors.cyan}npm run workflow:validate${colors.reset} - Run all quality gates`);
  console.log(`${colors.cyan}npm run task:checklist${colors.reset}   - Show task checklist`);
  console.log(`${colors.cyan}npm run gates:report${colors.reset}     - Generate quality report\n`);

  console.log(`${colors.dim}Last updated: ${new Date().toLocaleString()}${colors.reset}\n`);
}

// Run status display
displayStatus();