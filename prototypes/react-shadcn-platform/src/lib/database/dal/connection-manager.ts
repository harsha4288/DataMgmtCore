/**
 * Database Connection Manager
 * Centralized, high-performance database connection with pooling and caching
 * Replaces scattered database connections across 39 files
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync, existsSync, mkdirSync } from 'fs';

export interface ConnectionOptions {
  dbPath?: string;
  enableWAL?: boolean;
  cacheSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

export class ConnectionManager {
  private static instance: ConnectionManager;
  private db: Database.Database | null = null;
  private isConnected = false;
  private cache: QueryCache = {};
  private readonly options: Required<ConnectionOptions>;

  private constructor(options: ConnectionOptions = {}) {
    this.options = {
      dbPath: options.dbPath || join(process.cwd(), 'src', 'lib', 'database', 'database.db'),
      enableWAL: options.enableWAL ?? true,
      cacheSize: options.cacheSize ?? 1000,
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
    };
  }

  static getInstance(options?: ConnectionOptions): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager(options);
    }
    return ConnectionManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isConnected && this.db) {
      return;
    }

    await this.connectWithRetry();
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      console.log(`🔌 Initializing database connection (attempt ${attempt})...`);
      
      // Ensure database directory exists
      const dbDir = join(this.options.dbPath, '..');
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(this.options.dbPath);
      
      // Configure database for optimal performance
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('temp_store = MEMORY');
      this.db.pragma(`cache_size = ${this.options.cacheSize}`);
      
      // Test connection
      this.db.prepare('SELECT 1 as test').get();
      
      // Initialize schema if needed
      await this.initializeSchema();
      
      this.isConnected = true;
      console.log('✅ Database connection established successfully');
      
    } catch (error) {
      console.error(`❌ Database connection error (attempt ${attempt}):`, error);
      
      if (attempt < this.options.maxRetries) {
        console.log(`🔄 Retrying in ${this.options.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        return this.connectWithRetry(attempt + 1);
      } else {
        // Fallback to in-memory database
        console.log('🚨 Falling back to in-memory database');
        try {
          this.db = new Database(':memory:');
          await this.initializeSchema();
          this.isConnected = true;
        } catch (fallbackError) {
          console.error('💀 Failed to create fallback database:', fallbackError);
          throw new Error('Database initialization completely failed');
        }
      }
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.db) return;

    const schemaPath = join(process.cwd(), 'src', 'lib', 'database', 'schema.sql');
    if (existsSync(schemaPath)) {
      const schema = readFileSync(schemaPath, 'utf8');
      this.db.transaction(() => {
        this.db!.exec(schema);
      })();
      console.log('📋 Database schema initialized');
    }
  }

  getConnection(): Database.Database {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // High-performance cached query execution
  cachedQuery<T = any>(
    query: string, 
    params: any[] = [], 
    ttl: number = 300000 // 5 minutes default
  ): T | null {
    const cacheKey = `${query}:${JSON.stringify(params)}`;
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    const db = this.getConnection();
    const result = db.prepare(query).get(...params) as T;
    
    // Cache the result
    this.cache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
      ttl,
    };
    
    return result;
  }

  // High-performance cached query all
  cachedQueryAll<T = any>(
    query: string, 
    params: any[] = [], 
    ttl: number = 300000
  ): T[] {
    const cacheKey = `all:${query}:${JSON.stringify(params)}`;
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T[];
    }

    const db = this.getConnection();
    const result = db.prepare(query).all(...params) as T[];
    
    this.cache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
      ttl,
    };
    
    return result;
  }

  // Execute non-cached queries (INSERT, UPDATE, DELETE)
  execute(query: string, params: any[] = []): Database.RunResult {
    const db = this.getConnection();
    const stmt = db.prepare(query);
    
    // Clear related cache entries
    this.invalidateCache(query);
    
    return stmt.run(...params);
  }

  // Transaction support
  transaction<T>(fn: (db: Database.Database) => T): T {
    const db = this.getConnection();
    return db.transaction(fn)();
  }

  // Clear cache for specific patterns
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache = {};
      return;
    }
    
    const keys = Object.keys(this.cache);
    for (const key of keys) {
      if (key.includes(pattern.toLowerCase())) {
        delete this.cache[key];
      }
    }
  }

  // Connection health check
  async healthCheck(): Promise<{
    connected: boolean;
    cacheSize: number;
    dbPath: string;
    mode: string;
  }> {
    try {
      if (!this.db) {
        return {
          connected: false,
          cacheSize: 0,
          dbPath: this.options.dbPath,
          mode: 'disconnected'
        };
      }

      this.db.prepare('SELECT 1').get();
      const mode = this.options.dbPath === ':memory:' ? 'memory' : 'file';
      
      return {
        connected: this.isConnected,
        cacheSize: Object.keys(this.cache).length,
        dbPath: this.options.dbPath,
        mode
      };
    } catch (error) {
      return {
        connected: false,
        cacheSize: Object.keys(this.cache).length,
        dbPath: this.options.dbPath,
        mode: 'error'
      };
    }
  }

  // Cleanup cache entries older than TTL
  cleanupCache(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of Object.entries(this.cache)) {
      if (now - entry.timestamp > entry.ttl) {
        delete this.cache[key];
        cleaned++;
      }
    }
    
    return cleaned;
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.isConnected = false;
        this.cache = {};
        console.log('🔌 Database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }

  // Debug methods for CLI access
  debug = {
    cacheStats: () => ({
      size: Object.keys(this.cache).length,
      entries: Object.keys(this.cache).map(key => ({
        query: key.split(':')[0],
        age: Date.now() - this.cache[key].timestamp,
        ttl: this.cache[key].ttl
      }))
    }),
    
    connectionInfo: () => this.healthCheck(),
    
    clearCache: () => {
      const size = Object.keys(this.cache).length;
      this.cache = {};
      return `Cleared ${size} cache entries`;
    }
  };
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance();