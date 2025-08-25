#!/usr/bin/env node

/**
 * Development Server with Progress API
 * Starts both Vite dev server and Progress API server concurrently
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting development servers...\n');

// Colors for console output
const colors = {
  vite: '\x1b[36m', // Cyan
  api: '\x1b[35m',  // Magenta
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};

// Start Vite dev server
const viteProcess = spawn('npm', ['run', 'dev:vite-only'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'pipe',
  shell: true
});

// Start Progress API server
const apiProcess = spawn('node', ['scripts/progress-api.cjs'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'pipe',
  shell: true
});

// Handle Vite output
viteProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`${colors.vite}[VITE]${colors.reset} ${output}`);
  }
});

viteProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`${colors.vite}[VITE]${colors.reset} ${output}`);
  }
});

// Handle API output
apiProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`${colors.api}[API]${colors.reset} ${output}`);
  }
});

apiProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`${colors.api}[API]${colors.reset} ${output}`);
  }
});

// Handle process exits
viteProcess.on('close', (code) => {
  console.log(`\n${colors.vite}[VITE]${colors.reset} Process exited with code ${code}`);
  if (code !== 0) {
    console.log(`${colors.yellow}⚠️  Vite dev server stopped unexpectedly${colors.reset}`);
  }
  process.exit(code);
});

apiProcess.on('close', (code) => {
  console.log(`\n${colors.api}[API]${colors.reset} Process exited with code ${code}`);
  if (code !== 0) {
    console.log(`${colors.yellow}⚠️  Progress API server stopped unexpectedly${colors.reset}`);
  }
  process.exit(code);
});

// Handle script termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}🛑 Shutting down development servers...${colors.reset}`);
  
  viteProcess.kill('SIGTERM');
  apiProcess.kill('SIGTERM');
  
  setTimeout(() => {
    viteProcess.kill('SIGKILL');
    apiProcess.kill('SIGKILL');
    process.exit(0);
  }, 5000);
});

process.on('SIGTERM', () => {
  viteProcess.kill('SIGTERM');
  apiProcess.kill('SIGTERM');
  process.exit(0);
});

// Success message after a delay to let servers start
setTimeout(() => {
  console.log(`\n${colors.green}✅ Development environment ready!${colors.reset}`);
  console.log(`   📱 Frontend: ${colors.vite}http://localhost:5173${colors.reset}`);
  console.log(`   📊 API: ${colors.api}http://localhost:3002${colors.reset}`);
  console.log(`   🔧 Workflow Dashboard: Fully functional with live data\n`);
}, 2000);