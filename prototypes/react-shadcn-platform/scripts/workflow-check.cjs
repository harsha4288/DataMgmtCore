#!/usr/bin/env node

/**
 * Workflow Status Checker
 * Displays current project status and runs basic environment checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function loadConfig() {
  try {
    const configPath = path.join(__dirname, '..', '.workflow-config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error(`${colors.red}❌ Error loading workflow config:${colors.reset}`, error.message);
    process.exit(1);
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    return {
      hasChanges: status.length > 0,
      changeCount: status.split('\n').filter(line => line.trim()).length,
      currentBranch: branch
    };
  } catch (error) {
    return {
      hasChanges: false,
      changeCount: 0,
      currentBranch: 'unknown'
    };
  }
}

function runCommand(command, suppressError = false) {
  try {
    execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    return { success: true };
  } catch (error) {
    if (!suppressError) {
      return { success: false, error: error.message };
    }
    return { success: false };
  }
}

function checkEnvironment() {
  const checks = {
    node: { command: 'node --version', required: true },
    npm: { command: 'npm --version', required: true },
    git: { command: 'git --version', required: true },
    typescript: { command: 'npx tsc --version', required: false }
  };

  const results = {};
  for (const [tool, config] of Object.entries(checks)) {
    const result = runCommand(config.command, true);
    results[tool] = {
      ...result,
      required: config.required
    };
  }

  return results;
}

function formatProgressBar(percentage) {
  const width = 30;
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  
  return `[${'█'.repeat(filled)}${'-'.repeat(empty)}] ${percentage}%`;
}

function main() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}          WORKFLOW STATUS CHECK${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Load configuration
  const config = loadConfig();
  const gitStatus = checkGitStatus();
  const envCheck = checkEnvironment();

  // Project Status
  console.log(`${colors.bright}📊 PROJECT STATUS${colors.reset}`);
  console.log(`├─ Project: ${colors.cyan}${config.project.name}${colors.reset}`);
  console.log(`├─ Branch: ${colors.magenta}${gitStatus.currentBranch}${colors.reset}`);
  console.log(`├─ Phase: ${colors.yellow}${config.currentStatus.phase}${colors.reset}`);
  console.log(`├─ Progress: ${formatProgressBar(config.currentStatus.phaseProgress)}`);
  console.log(`├─ Active Task: ${colors.green}${config.currentStatus.activeTask}${colors.reset}`);
  console.log(`└─ Last Updated: ${config.currentStatus.lastUpdated}\n`);

  // Git Status
  console.log(`${colors.bright}📁 GIT STATUS${colors.reset}`);
  if (gitStatus.hasChanges) {
    console.log(`├─ ${colors.yellow}⚠ ${gitStatus.changeCount} uncommitted changes${colors.reset}`);
  } else {
    console.log(`├─ ${colors.green}✓ Working directory clean${colors.reset}`);
  }
  console.log(`└─ Branch: ${gitStatus.currentBranch}\n`);

  // Environment Check
  console.log(`${colors.bright}🔧 ENVIRONMENT CHECK${colors.reset}`);
  let allChecksPassed = true;
  
  for (const [tool, result] of Object.entries(envCheck)) {
    const icon = result.success ? `${colors.green}✓` : `${colors.red}✗`;
    const status = result.success ? 'Installed' : 'Not found';
    const requiredTag = result.required && !result.success ? ` ${colors.red}(REQUIRED)` : '';
    
    console.log(`├─ ${icon} ${tool}: ${status}${requiredTag}${colors.reset}`);
    
    if (result.required && !result.success) {
      allChecksPassed = false;
    }
  }
  console.log('');

  // Quality Gates Status
  console.log(`${colors.bright}🚦 QUALITY GATES${colors.reset}`);
  const qualityChecks = [
    { name: 'ESLint', command: 'npm run lint', icon: '📝' },
    { name: 'TypeScript', command: 'npm run type-check', icon: '🔷' },
    { name: 'Theme Validation', command: 'npm run validate:theme', icon: '🎨' },
    { name: 'Build', command: 'npm run build', icon: '🏗️' }
  ];

  console.log('Running quality checks...');
  
  for (const check of qualityChecks) {
    process.stdout.write(`├─ ${check.icon} ${check.name}: `);
    const result = runCommand(check.command, true);
    
    if (result.success) {
      console.log(`${colors.green}✓ Passed${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Failed${colors.reset}`);
      allChecksPassed = false;
    }
  }
  console.log('');

  // Workflow Actions
  console.log(`${colors.bright}🎯 AVAILABLE ACTIONS${colors.reset}`);
  console.log(`├─ ${colors.cyan}npm run workflow:validate${colors.reset} - Run all quality checks`);
  console.log(`├─ ${colors.cyan}npm run workflow:commit${colors.reset} - Guided commit process`);
  console.log(`├─ ${colors.cyan}npm run task:start${colors.reset} - Start a new task`);
  console.log(`├─ ${colors.cyan}npm run task:complete${colors.reset} - Complete current task`);
  console.log(`└─ ${colors.cyan}npm run gates:report${colors.reset} - Generate quality report\n`);

  // Summary
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  
  if (allChecksPassed && !gitStatus.hasChanges) {
    console.log(`${colors.green}✅ Environment ready! All checks passed.${colors.reset}`);
  } else if (allChecksPassed && gitStatus.hasChanges) {
    console.log(`${colors.yellow}⚠️  Environment ready, but you have uncommitted changes.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Some checks failed. Please fix issues before proceeding.${colors.reset}`);
  }
  
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Exit code based on status
  process.exit(allChecksPassed ? 0 : 1);
}

// Run the checker
main();