#!/usr/bin/env node

/**
 * Safe Restart Script
 * Safely stops all development servers and starts them fresh
 * Ensures clean startup without port conflicts
 */

const { spawn } = require('child_process');
const path = require('path');
const { cleanup } = require('./cleanup-ports.cjs');

console.log('🔄 Safe Restart: Development Environment\n');

/**
 * Run command and wait for completion
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * Wait for a specified amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if we're in a React project directory
 */
function validateProjectDirectory() {
  const fs = require('fs');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found. Are you in the right directory?');
    process.exit(1);
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.dev) {
      console.error('❌ No "dev" script found in package.json');
      process.exit(1);
    }
    console.log(`✅ Project: ${packageJson.name || 'Unknown'}`);
  } catch (error) {
    console.error('❌ Invalid package.json:', error.message);
    process.exit(1);
  }
}

/**
 * Main safe restart function
 */
async function safeRestart(options = {}) {
  const { 
    skipCleanup = false, 
    aggressive = false,
    waitTime = 3000 
  } = options;

  try {
    console.log('🔍 Validating project directory...');
    validateProjectDirectory();
    
    if (!skipCleanup) {
      console.log('\n🧹 Step 1: Cleaning up existing processes...');
      const cleanupSuccess = await cleanup({ 
        aggressive,
        ports: [3005, 3006, 5173, 5174, 5175, 5176, 5177] 
      });
      
      if (!cleanupSuccess && !aggressive) {
        console.log('⚠️  Standard cleanup failed, trying aggressive cleanup...');
        const aggressiveSuccess = await cleanup({ 
          aggressive: true,
          ports: [3005, 3006, 5173, 5174, 5175, 5176, 5177] 
        });
        
        if (!aggressiveSuccess) {
          console.error('❌ Failed to cleanup processes. Manual intervention may be required.');
          console.log('💡 Try rebooting your system if the problem persists.');
          process.exit(1);
        }
      }
    }
    
    console.log(`\n⏳ Step 2: Waiting ${waitTime/1000} seconds for ports to be fully released...`);
    await wait(waitTime);
    
    console.log('\n🚀 Step 3: Starting fresh development environment...');
    console.log('📝 This will run: npm run dev');
    console.log('🛑 Press Ctrl+C to stop the development environment when needed\n');
    
    // Start the development environment
    await runCommand('npm', ['run', 'dev'], {
      cwd: process.cwd()
    });
    
  } catch (error) {
    console.error('\n💥 Safe restart failed:', error.message);
    
    if (error.message.includes('EADDRINUSE')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   • Run: node scripts/cleanup-ports.cjs --aggressive');
      console.log('   • Check for other applications using these ports');
      console.log('   • Try restarting your computer');
    }
    
    process.exit(1);
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    skipCleanup: args.includes('--skip-cleanup'),
    aggressive: args.includes('--aggressive') || args.includes('-a'),
    waitTime: 3000
  };
  
  // Custom wait time
  const waitFlag = args.find(arg => arg.startsWith('--wait='));
  if (waitFlag) {
    const waitSeconds = parseInt(waitFlag.split('=')[1]);
    if (!isNaN(waitSeconds)) {
      options.waitTime = waitSeconds * 1000;
    }
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔄 Safe Restart Script

Usage:
  node safe-restart.cjs [options]

Options:
  --skip-cleanup      Skip the port cleanup step
  --aggressive, -a    Use aggressive cleanup (kill all Node.js processes)
  --wait=SECONDS      Wait time after cleanup (default: 3)
  --help, -h          Show this help message

Examples:
  node safe-restart.cjs              # Standard safe restart
  node safe-restart.cjs --aggressive # Aggressive cleanup before restart
  node safe-restart.cjs --wait=5     # Wait 5 seconds after cleanup

This script will:
1. Clean up any existing development servers
2. Wait for ports to be fully released
3. Start a fresh development environment
`);
    process.exit(0);
  }
  
  await safeRestart(options);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Safe restart interrupted by user');
  process.exit(0);
});

// Export for use as module
module.exports = { safeRestart };

// Run if called directly
if (require.main === module) {
  main();
}