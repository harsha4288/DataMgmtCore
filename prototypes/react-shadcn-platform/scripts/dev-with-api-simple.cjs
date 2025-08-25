#!/usr/bin/env node

/**
 * Development Server with Progress API
 * Starts both Vite dev server and Progress API server concurrently
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting development servers...\n');

// Start Progress API server in background
console.log('📊 Starting Progress API server...');
const apiProcess = spawn('node', ['scripts/progress-api.cjs'], {
  cwd: path.join(__dirname, '..'),
  detached: false,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Give API server a moment to start
setTimeout(() => {
  console.log('🎨 Starting Vite dev server...\n');
  
  // Start Vite dev server in foreground
  const viteProcess = spawn('npx', ['vite'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  viteProcess.on('close', (code) => {
    console.log('\n🛑 Vite dev server stopped. Cleaning up...');
    apiProcess.kill('SIGTERM');
    process.exit(code);
  });
}, 1000);

// Handle API output quietly
apiProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output && output.includes('Progress API server running')) {
    console.log('✅ Progress API server ready at http://localhost:3002');
    console.log('📱 Starting Vite dev server...\n');
  }
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  apiProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  apiProcess.kill('SIGTERM');
  process.exit(0);
});