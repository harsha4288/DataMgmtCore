#!/usr/bin/env node

/**
 * Robust Development Server
 * Provides intelligent startup with retry logic and comprehensive error recovery
 * Prevents the crashes that occurred in previous sessions
 */

const { spawn } = require('child_process');
const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { cleanup, getProcessOnPort } = require('./cleanup-ports.cjs');

const execAsync = promisify(exec);

console.log('🚀 Robust Development Environment Starting...\n');

// Configuration
const CONFIG = {
  maxRetries: 3,
  retryDelay: 2000, // Start with 2 seconds
  healthCheckTimeout: 15000, // 15 seconds
  ports: {
    graphql: 3006,
    validation: 3005,
    vite: 5173 // Default Vite port, will use next available
  },
  processes: {}
};

let shutdownInProgress = false;

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff calculation
 */
function getBackoffDelay(attempt, baseDelay = CONFIG.retryDelay) {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
}

/**
 * Enhanced health check with timeout and retry
 */
async function healthCheck(port, serviceName, timeout = CONFIG.healthCheckTimeout) {
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let attempts = 0;
    
    const checkHealth = () => {
      attempts++;
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`${serviceName} health check timed out after ${timeout}ms (${attempts} attempts)`));
        return;
      }

      const req = http.get(`http://localhost:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(`✅ ${serviceName} healthy at http://localhost:${port} (attempt ${attempts})`);
        } else {
          console.log(`⚠️  ${serviceName} returned ${res.statusCode}, retrying...`);
          setTimeout(checkHealth, 1000);
        }
      });

      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          // Service still starting, retry
          setTimeout(checkHealth, 1000);
        } else {
          console.log(`⚠️  ${serviceName} health check error: ${err.message}, retrying...`);
          setTimeout(checkHealth, 1000);
        }
      });

      req.setTimeout(3000, () => {
        req.destroy();
        setTimeout(checkHealth, 1000);
      });
    };

    checkHealth();
  });
}

/**
 * Start a process with retry logic
 */
async function startProcessWithRetry(command, args, options, serviceName, maxRetries = CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Starting ${serviceName} (attempt ${attempt}/${maxRetries})...`);
      
      // Check if port is available
      if (options.port) {
        const existingPid = await getProcessOnPort(options.port);
        if (existingPid) {
          console.log(`⚠️  Port ${options.port} is busy, cleaning up...`);
          await cleanup({ ports: [options.port] });
          await sleep(1000); // Wait for cleanup
        }
      }
      
      const process = spawn(command, args, {
        cwd: path.join(__dirname, '..'),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        ...options.spawnOptions
      });

      // Store process reference
      CONFIG.processes[serviceName] = process;

      // Setup logging
      process.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) console.log(`[${serviceName}] ${output}`);
      });

      process.stderr?.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('ExperimentalWarning')) {
          console.error(`[${serviceName} Error] ${output}`);
        }
      });

      // Wait a moment for process to start
      await sleep(2000);

      // Health check if port specified
      if (options.port) {
        await healthCheck(options.port, serviceName);
      }

      console.log(`✅ ${serviceName} started successfully`);
      return process;

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed for ${serviceName}: ${error.message}`);
      
      // Kill any zombie process from failed attempt
      if (CONFIG.processes[serviceName]) {
        try {
          CONFIG.processes[serviceName].kill('SIGTERM');
        } catch (killError) {
          // Ignore kill errors
        }
        delete CONFIG.processes[serviceName];
      }
      
      if (attempt < maxRetries) {
        const delay = getBackoffDelay(attempt);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);
      } else {
        throw new Error(`Failed to start ${serviceName} after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal = 'SIGTERM') {
  if (shutdownInProgress) return;
  shutdownInProgress = true;
  
  console.log(`\n🛑 Shutting down (${signal})...`);
  
  const shutdownPromises = Object.entries(CONFIG.processes).map(async ([name, process]) => {
    if (process && !process.killed) {
      console.log(`Stopping ${name}...`);
      try {
        process.kill('SIGTERM');
        
        // Give process 5 seconds to shutdown gracefully
        await Promise.race([
          new Promise(resolve => process.on('exit', resolve)),
          sleep(5000).then(() => {
            if (!process.killed) {
              console.log(`Force killing ${name}...`);
              process.kill('SIGKILL');
            }
          })
        ]);
      } catch (error) {
        console.error(`Error stopping ${name}:`, error.message);
      }
    }
  });

  await Promise.allSettled(shutdownPromises);
  console.log('✅ All services stopped');
  process.exit(0);
}

/**
 * Setup signal handlers
 */
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  gracefulShutdown('EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('REJECTION');
});

/**
 * Main startup function
 */
async function startRobustDevelopment() {
  try {
    console.log('🔍 Validating environment...');
    
    // Check package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    // Initial port cleanup
    console.log('🧹 Initial cleanup...');
    await cleanup({ 
      ports: [CONFIG.ports.graphql, CONFIG.ports.validation, CONFIG.ports.vite],
      aggressive: false 
    });
    
    console.log('✅ Environment validated\n');

    // Start GraphQL Server
    console.log('📊 Starting GraphQL API...');
    let graphqlScript = 'scripts/graphql-server-new.cjs';
    if (!fs.existsSync(path.join(__dirname, '..', graphqlScript))) {
      console.warn('⚠️ Using fallback GraphQL server script');
      graphqlScript = 'scripts/graphql-server.cjs';
    }

    await startProcessWithRetry('node', [graphqlScript], {
      port: CONFIG.ports.graphql,
      spawnOptions: {}
    }, 'GraphQL');

    // Start Validation Server
    console.log('\n🔍 Starting Validation API...');
    await startProcessWithRetry('node', ['scripts/validation-api-server.cjs'], {
      port: CONFIG.ports.validation,
      spawnOptions: {}
    }, 'Validation');

    // Start Vite
    console.log('\n🎨 Starting Vite Dev Server...');
    const viteProcess = await startProcessWithRetry('npx', ['vite'], {
      spawnOptions: { stdio: 'inherit' }
    }, 'Vite');

    // Monitor Vite process
    viteProcess.on('exit', (code) => {
      if (!shutdownInProgress) {
        console.log(`\n⚠️  Vite exited with code ${code}`);
        gracefulShutdown('VITE_EXIT');
      }
    });

    console.log('\n🎉 Development Environment Ready!');
    console.log('================================');
    console.log(`📊 GraphQL API:     http://localhost:${CONFIG.ports.graphql}/graphql`);
    console.log(`🔍 Validation API:  http://localhost:${CONFIG.ports.validation}`);
    console.log(`🎨 Frontend:        http://localhost:${CONFIG.ports.vite} (or next available)`);
    console.log('\n💡 All services started with robust error handling');
    console.log('🔧 Press Ctrl+C to stop all servers');
    console.log('🛡️  Protected against self-termination crashes\n');

  } catch (error) {
    console.error('\n💥 Failed to start robust development environment:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check if ports are available');
    console.log('   • Try: npm run cleanup:aggressive');
    console.log('   • Verify all script files exist');
    console.log('   • Check system resources');
    
    await gracefulShutdown('ERROR');
  }
}

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 Robust Development Server

Features:
• Intelligent retry logic with exponential backoff
• Comprehensive error recovery
• Process isolation and safety
• Protected against self-termination
• Graceful shutdown handling

Usage:
  node scripts/dev-robust.cjs

This script prevents the crashes experienced in previous sessions by:
1. Never killing its own process
2. Using safety checks before terminating processes
3. Implementing proper error recovery
4. Providing comprehensive logging
`);
  process.exit(0);
}

// Start the robust development environment
startRobustDevelopment();