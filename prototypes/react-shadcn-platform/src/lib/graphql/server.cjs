/**
 * Modular GraphQL Server
 * Refactored from the monolithic scripts/graphql-server.cjs
 * Reduced from ~3600 lines to ~150 lines by extracting modules
 */

const { createYoga, createSchema } = require('graphql-yoga');
const { createServer } = require('http');
const path = require('path');

// Import modular components
const { typeDefs } = require('./schema/index.cjs');
const DocumentationDataSources = require('./datasources/DocumentationDataSources.cjs');
const { getDatabaseConnection } = require('./database/connection.cjs');
const EntityManager = require('../database/entity-manager.cjs');

// Import resolvers (will be created in next step)
const resolvers = require('./resolvers/index.cjs');

class GraphQLServer {
  constructor(options = {}) {
    this.port = options.port || 3005;
    this.dbPath = options.dbPath || path.join(__dirname, '../database/database.db');
    this.basePath = options.basePath || '../docs/progress';
    
    this.db = null;
    this.dataSources = null;
    this.entityManager = null;
    this.server = null;
  }

  async initialize() {
    try {
      // Initialize database connection
      const dbConnection = getDatabaseConnection(this.dbPath);
      this.db = await dbConnection.initialize();
      
      if (!this.db) {
        throw new Error('Failed to initialize database');
      }

      // Initialize entity manager
      this.entityManager = new EntityManager(this.dbPath);

      // Initialize data sources with database
      this.dataSources = new DocumentationDataSources(this.basePath, this.db);

      // Create GraphQL schema with context
      const schema = createSchema({
        typeDefs,
        resolvers: resolvers(this.dataSources, this.entityManager, this.db)
      });

      // Create Yoga server
      const yoga = createYoga({
        schema,
        context: {
          dataSources: this.dataSources,
          entityManager: this.entityManager,
          db: this.db
        },
        cors: {
          origin: [
            'http://localhost:3000', 
            'http://localhost:3001', 
            'http://localhost:5173',
            /^http:\/\/192\.168\.1\.\d+:5173$/,  // Allow network access
            /^http:\/\/localhost:\d+$/,          // Allow any localhost port
            /^http:\/\/127\.0\.0\.1:\d+$/        // Allow any 127.0.0.1 port
          ],
          credentials: true
        }
      });

      // Create HTTP server
      this.server = createServer(yoga);

      console.log(`🚀 GraphQL Server initialized on port ${this.port}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize GraphQL server:', error);
      return false;
    }
  }

  async start() {
    if (!this.server) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize server');
      }
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🚀 GraphQL Server running on http://localhost:${this.port}/graphql`);
          console.log(`🔍 GraphiQL available at http://localhost:${this.port}/graphql`);
          resolve(this.server);
        }
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('GraphQL Server stopped');
          
          // Close database connection
          if (this.db) {
            const dbConnection = getDatabaseConnection();
            dbConnection.close();
          }
          
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getStats() {
    const dbConnection = getDatabaseConnection();
    return {
      port: this.port,
      running: this.server && this.server.listening,
      database: dbConnection.getStats()
    };
  }
}

// Export for use as module
module.exports = GraphQLServer;

// Run server if this file is executed directly
if (require.main === module) {
  const server = new GraphQLServer();
  
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully');
    await server.stop();
    process.exit(0);
  });
}