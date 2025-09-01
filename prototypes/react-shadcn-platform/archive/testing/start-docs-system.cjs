/**
 * Documentation System Startup Script
 * Starts GraphQL and Validation servers with health checks
 */

const { spawn } = require('child_process');
const http = require('http');

const GRAPHQL_PORT = 3004;
const VALIDATION_PORT = 3005;
const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds

console.log('🚀 Starting Documentation System');
console.log('================================\n');

let graphqlProcess = null;
let validationProcess = null;

// Health check function
function healthCheck(port, serviceName) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${serviceName} health check timed out`));
    }, HEALTH_CHECK_TIMEOUT);

    const checkHealth = () => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        clearTimeout(timeout);
        if (res.statusCode === 200) {
          resolve(`✅ ${serviceName} is healthy`);
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

      req.setTimeout(5000, () => {
        req.destroy();
        setTimeout(checkHealth, 1000); // Retry in 1 second
      });
    };

    checkHealth();
  });
}

// Graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down Documentation System...');
  
  if (graphqlProcess) {
    console.log('Stopping GraphQL server...');
    graphqlProcess.kill();
  }
  
  if (validationProcess) {
    console.log('Stopping Validation server...');
    validationProcess.kill();
  }
  
  console.log('✅ Documentation System stopped');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function startDocumentationSystem() {
  try {
    console.log('📊 Starting GraphQL Server (port 3004)...');
    graphqlProcess = spawn('node', ['scripts/graphql-server.cjs'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    graphqlProcess.stdout.on('data', (data) => {
      console.log(`[GraphQL] ${data.toString().trim()}`);
    });

    graphqlProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) console.error(`[GraphQL Error] ${error}`);
    });

    graphqlProcess.on('error', (error) => {
      console.error('❌ Failed to start GraphQL server:', error.message);
    });

    console.log('🔍 Starting Validation Server (port 3005)...');
    validationProcess = spawn('node', ['scripts/validation-api-server.cjs'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    validationProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) console.log(`[Validation] ${output}`);
    });

    validationProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error && !error.includes('ExperimentalWarning')) {
        console.error(`[Validation Error] ${error}`);
      }
    });

    validationProcess.on('error', (error) => {
      console.error('❌ Failed to start Validation server:', error.message);
    });

    // Wait for services to be healthy
    console.log('\n⏳ Waiting for services to be ready...\n');
    
    const healthChecks = await Promise.all([
      healthCheck(GRAPHQL_PORT, 'GraphQL Server').catch(err => `❌ GraphQL Server: ${err.message}`),
      healthCheck(VALIDATION_PORT, 'Validation Server').catch(err => `❌ Validation Server: ${err.message}`)
    ]);

    healthChecks.forEach(result => console.log(result));

    console.log('\n🎉 Documentation System is ready!');
    console.log('================================\n');
    
    console.log('📊 Available Services:');
    console.log(`   GraphQL API:      http://localhost:${GRAPHQL_PORT}/graphql`);
    console.log(`   GraphiQL UI:      http://localhost:${GRAPHQL_PORT}/graphql`);
    console.log(`   Validation API:   http://localhost:${VALIDATION_PORT}`);
    console.log(`   Health Checks:    /health on both ports`);
    
    console.log('\n🚀 Quick Start:');
    console.log('   1. Open GraphiQL: http://localhost:3004/graphql');
    console.log('   2. Run test: node test-documentation-system.cjs');
    console.log('   3. Check README: DOCUMENTATION_SYSTEM_README.md');
    
    console.log('\n💡 Example GraphQL Queries:');
    console.log('   query { getAllTasks { id name status progress } }');
    console.log('   query { getProjectStats { total_tasks completion_percentage } }');
    
    console.log('\n🔍 Example Validation:');
    console.log('   curl -X POST http://localhost:3005/validate/task -H "Content-Type: application/json" -d \'{"data":{"id":"task-1","name":"Test"}}\'');
    
    console.log('\n📝 Press Ctrl+C to stop the system\n');

  } catch (error) {
    console.error('❌ Failed to start Documentation System:', error.message);
    shutdown();
  }
}

// Start the system
startDocumentationSystem();