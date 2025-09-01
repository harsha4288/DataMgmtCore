#!/usr/bin/env node

/**
 * New Streamlined GraphQL Server
 * Replaces the 3600+ line monolithic server with a modular approach
 * Reduced to ~50 lines by extracting components to separate modules
 */

const path = require('path');
const GraphQLServer = require('../src/lib/graphql/server.cjs');

// Configuration
const config = {
  port: process.env.GRAPHQL_PORT || 3006,
  dbPath: path.join(__dirname, '../src/lib/database/database.db'),
  basePath: path.join(__dirname, '../docs/progress')
};

async function startServer() {
  console.log('🚀 Starting modular GraphQL server...');
  console.log(`📍 Database: ${config.dbPath}`);
  console.log(`📁 Docs path: ${config.basePath}`);
  
  const server = new GraphQLServer(config);
  
  try {
    await server.start();
    
    console.log('✅ Server started successfully!');
    console.log(`🔍 GraphiQL playground: http://localhost:${config.port}/graphql`);
    console.log('');
    console.log('📊 Server stats:', JSON.stringify(server.getStats(), null, 2));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  // GraphQLServer handles its own cleanup
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { startServer, config };