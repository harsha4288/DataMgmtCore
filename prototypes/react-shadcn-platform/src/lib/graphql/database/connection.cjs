/**
 * Database Connection Manager
 * Centralized database connection with retry logic and proper error handling
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseConnection {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(__dirname, '../../database/database.db');
    this.db = null;
    this.isConnected = false;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async initialize() {
    return this.initWithRetry();
  }

  initWithRetry(attempt = 1) {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);
      
      // Configure database for better performance and crash prevention
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');
      
      // Create tables if they don't exist
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        // Execute schema in transaction to prevent partial failures
        this.db.transaction(() => {
          this.db.exec(schema);
        })();
      }
      
      this.isConnected = true;
      console.log('Database initialized successfully');
      return this.db;
    } catch (error) {
      console.error(`Database initialization error (attempt ${attempt}):`, error);
      
      if (attempt < this.maxRetries) {
        console.log(`Retrying in ${this.retryDelay}ms...`);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.initWithRetry(attempt + 1));
          }, this.retryDelay);
        });
      } else {
        // Create an in-memory database as fallback
        console.log('Falling back to in-memory database');
        try {
          this.db = new Database(':memory:');
          this.isConnected = true;
          return this.db;
        } catch (fallbackError) {
          console.error('Failed to create fallback database:', fallbackError);
          this.isConnected = false;
          return null;
        }
      }
    }
  }

  getDatabase() {
    if (!this.isConnected || !this.db) {
      console.warn('Database not initialized. Call initialize() first.');
      return null;
    }
    return this.db;
  }

  close() {
    if (this.db) {
      try {
        this.db.close();
        this.isConnected = false;
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }

  // Test connection
  async testConnection() {
    if (!this.db) {
      return false;
    }

    try {
      // Simple query to test connection
      this.db.prepare('SELECT 1 as test').get();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Get connection stats
  getStats() {
    if (!this.db) {
      return { connected: false };
    }

    try {
      const result = this.db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
      return {
        connected: this.isConnected,
        tablesCount: result.count,
        dbPath: this.dbPath,
        mode: this.dbPath === ':memory:' ? 'memory' : 'file'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let instance = null;

function getDatabaseConnection(dbPath = null) {
  if (!instance || (dbPath && instance.dbPath !== dbPath)) {
    instance = new DatabaseConnection(dbPath);
  }
  return instance;
}

module.exports = {
  DatabaseConnection,
  getDatabaseConnection
};