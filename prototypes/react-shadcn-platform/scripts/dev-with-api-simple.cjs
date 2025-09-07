
// Shebang removed for Windows compatibility

// === SAFETY CHECK: Ensure script is run from correct directory ===
const expectedDir = require('path').resolve(__dirname, '..');
const cwd = process.cwd();
if (cwd !== expectedDir) {
  console.error('\n❌ ERROR: You are running this script from the wrong directory.');
  console.error('   Current working directory: ' + cwd);
  console.error('   Expected:                 ' + expectedDir);
  console.error('\nPlease cd to the correct project folder and try again.');
  process.exit(1);
}

/**
 * Development Server with Universal Project Management System
 * Starts Vite dev server, GraphQL API, and Validation API concurrently
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('🚀 Starting Universal Project Management Development Environment...\n');

let graphqlProcess = null;
let validationProcess = null;
let viteProcess = null;

// Health check function
function healthCheck(port, serviceName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${serviceName} health check timed out`));
    }, 10000); // 10 seconds timeout

    const checkHealth = () => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        clearTimeout(timeout);
        if (res.statusCode === 200) {
          resolve(`✅ ${serviceName} ready at http://localhost:${port}`);
        } else {
          reject(new Error(`${serviceName} health check failed: ${res.statusCode}`));
        }
      });

      req.on('error', (err) => {
        // If connection refused, service might still be starting
        if (err.code === 'ECONNREFUSED') {
          setTimeout(checkHealth, 1000); // Retry in 1 second
        } else {
          clearTimeout(timeout);
          reject(err);
        }
      });

      req.setTimeout(3000, () => {
        req.destroy();
        setTimeout(checkHealth, 1000); // Retry in 1 second
      });
    };

    checkHealth();
  });
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down development environment...`);
  
  const processes = [
    { process: viteProcess, name: 'Vite' },
    { process: graphqlProcess, name: 'GraphQL' },
    { process: validationProcess, name: 'Validation API' }
  ];

  processes.forEach(({ process, name }) => {
    if (process && !process.killed) {
      console.log(`Stopping ${name} server...`);
      process.kill('SIGTERM');
    }
  });
  
  console.log('✅ Development environment stopped');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function startDevelopmentEnvironment() {
  try {
    // Start GraphQL Server (port 3006) - New Modular Server
    console.log('📊 Starting GraphQL Server (port 3006)...');
    graphqlProcess = spawn('node', ['scripts/graphql-server-new.cjs'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['inherit', 'pipe', 'pipe']
    });

    graphqlProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.log(`[GraphQL] ${output}`);
    });

    graphqlProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.error(`[GraphQL Error] ${output}`);
    });

    // Start Validation API Server (port 3005)
    console.log('🔍 Starting Validation API Server (port 3005)...');
    validationProcess = spawn('node', ['scripts/validation-api-server.cjs'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['inherit', 'pipe', 'pipe']
    });

    validationProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.log(`[Validation] ${output}`);
    });

    validationProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.error(`[Validation Error] ${output}`);
    });

    // Wait for APIs to be healthy
    console.log('\n⏳ Waiting for APIs to be ready...\n');
    
    const healthChecks = await Promise.allSettled([
      healthCheck(3006, 'GraphQL Server'),
      healthCheck(3005, 'Validation Server')
    ]);

    healthChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(result.value);
      } else {
        console.warn(`⚠️ ${index === 0 ? 'GraphQL' : 'Validation'} Server: ${result.reason.message}`);
      }
    });

    // Start Vite dev server
    console.log('\n🎨 Starting Vite Development Server...\n');
    viteProcess = spawn('npx', ['vite'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    viteProcess.on('close', (code) => {
      console.log(`\n🛑 Vite dev server stopped with code ${code}. Cleaning up...`);
      shutdown('VITE_EXIT');
    });

    console.log('\n🎉 Development Environment Ready!');
    console.log('================================\n');
    console.log('📊 GraphQL API:      http://localhost:3004/graphql');
    console.log('🔍 Validation API:   http://localhost:3005');
    console.log('🎨 Frontend:         http://localhost:5173 (or next available port)');
    console.log('\n💡 Dashboard will now show real data from APIs instead of "TBD"');
    console.log('🔧 Press Ctrl+C to stop all servers\n');

  } catch (error) {
    console.error('❌ Failed to start development environment:', error.message);
    shutdown('ERROR');
  }
}

// Start the development environment
startDevelopmentEnvironment();