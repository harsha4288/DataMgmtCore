/**
 * Base Repository
 * Abstract base class for all repositories with common CRUD operations
 * Provides caching, error handling, and transaction support
 */

import Database from 'better-sqlite3';
import { connectionManager } from '../connection-manager';

export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface SearchOptions {
  text?: string;
  filters?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected abstract tableName: string;
  protected abstract idPrefix: string;

  constructor() {
    // Ensure connection is initialized
    this.ensureConnection();
  }

  private async ensureConnection(): Promise<void> {
    await connectionManager.initialize();
  }

  protected getDb(): Database.Database {
    return connectionManager.getConnection();
  }

  // Generate unique IDs with board prefixes (TASK-123, ISSUE-45 style)
  protected async generateId(): Promise<string> {
    try {
      // Get next counter from boards table
      const board = this.getDb().prepare(`
        SELECT * FROM boards 
        WHERE prefix = ? AND is_active = 1
      `).get(this.idPrefix);

      if (!board) {
        // Fallback to timestamp-based ID
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 3);
        return `${this.idPrefix}-${timestamp}-${random}`;
      }

      const nextNum = (board.current_counter || 0) + 1;
      
      // Update counter
      const updateResult = this.getDb().prepare(`
        UPDATE boards SET current_counter = ? WHERE prefix = ?
      `).run(nextNum, this.idPrefix);

      if (updateResult.changes === 0) {
        throw new Error(`Failed to update counter for board ${this.idPrefix}`);
      }

      return `${this.idPrefix}-${nextNum}`;
    } catch (error) {
      // Fallback ID generation
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substr(2, 3);
      return `${this.idPrefix}-${timestamp}-${random}`;
    }
  }

  // Core CRUD operations
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const id = await this.generateId();
    const now = new Date().toISOString();
    
    const entityData = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    } as T;

    const columns = Object.keys(entityData).join(', ');
    const placeholders = Object.keys(entityData).map(() => '?').join(', ');
    const values = Object.values(entityData);

    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
    `;

    try {
      const result = this.getDb().prepare(query).run(...values);
      
      if (result.changes > 0) {
        // Invalidate cache for this table
        connectionManager.invalidateCache(this.tableName);
        
        console.log(`✅ Created ${this.tableName}: ${id}`);
        return entityData;
      } else {
        throw new Error(`Failed to create ${this.tableName} entity`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    const { useCache = true, cacheTTL = 300000 } = options;
    
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    
    try {
      let result: T | null;
      
      if (useCache) {
        result = connectionManager.cachedQuery<T>(query, [id], cacheTTL);
      } else {
        result = this.getDb().prepare(query).get(id) as T | undefined || null;
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error finding ${this.tableName} by ID ${id}:`, error);
      throw error;
    }
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    const { 
      useCache = true, 
      cacheTTL = 300000, 
      orderBy = 'updated_at DESC',
      limit,
      offset = 0
    } = options;
    
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    try {
      let results: T[];
      
      if (useCache) {
        results = connectionManager.cachedQueryAll<T>(query, params, cacheTTL);
      } else {
        results = this.getDb().prepare(query).all(...params) as T[];
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T | null> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const setClause = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updateData), id];
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause}
      WHERE id = ?
    `;

    try {
      const result = this.getDb().prepare(query).run(...values);
      
      if (result.changes > 0) {
        // Invalidate cache
        connectionManager.invalidateCache(this.tableName);
        
        console.log(`✅ Updated ${this.tableName}: ${id}`);
        return await this.findById(id, { useCache: false });
      } else {
        console.warn(`⚠️ No ${this.tableName} found with ID: ${id}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error updating ${this.tableName} ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    
    try {
      const result = this.getDb().prepare(query).run(id);
      
      if (result.changes > 0) {
        // Invalidate cache
        connectionManager.invalidateCache(this.tableName);
        
        console.log(`✅ Deleted ${this.tableName}: ${id}`);
        return true;
      } else {
        console.warn(`⚠️ No ${this.tableName} found with ID: ${id}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error deleting ${this.tableName} ${id}:`, error);
      throw error;
    }
  }

  async search(searchOptions: SearchOptions): Promise<T[]> {
    const {
      text,
      filters = {},
      orderBy = 'updated_at DESC',
      limit = 50,
      offset = 0
    } = searchOptions;

    let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];

    // Text search
    if (text) {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      const searchText = `%${text}%`;
      params.push(searchText, searchText);
    }

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query += ` AND ${key} = ?`;
        params.push(value);
      }
    }

    // Order and pagination
    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    try {
      const results = this.getDb().prepare(query).all(...params) as T[];
      return results;
    } catch (error) {
      console.error(`❌ Error searching ${this.tableName}:`, error);
      throw error;
    }
  }

  async count(filters: Record<string, any> = {}): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query += ` AND ${key} = ?`;
        params.push(value);
      }
    }

    try {
      const result = connectionManager.cachedQuery<{ count: number }>(
        query, 
        params, 
        60000 // 1 minute cache for counts
      );
      
      return result?.count || 0;
    } catch (error) {
      console.error(`❌ Error counting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Batch operations for high performance
  async batchCreate(entities: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T[]> {
    return connectionManager.transaction(() => {
      const created: T[] = [];
      
      for (const entity of entities) {
        // Note: this will call generateId for each, but within transaction
        const result = this.getDb().prepare(`
          INSERT INTO ${this.tableName} (id, ${Object.keys(entity).join(', ')}, created_at, updated_at)
          VALUES (?, ${Object.keys(entity).map(() => '?').join(', ')}, ?, ?)
        `);
        
        // For batch operations, use simpler ID generation
        const id = `${this.idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const now = new Date().toISOString();
        
        result.run(id, ...Object.values(entity), now, now);
        
        created.push({ id, ...entity, created_at: now, updated_at: now } as T);
      }
      
      // Invalidate cache after batch operation
      connectionManager.invalidateCache(this.tableName);
      
      return created;
    });
  }

  // Health check for repository
  async healthCheck(): Promise<{
    tableName: string;
    totalRecords: number;
    lastUpdated: string | null;
    cacheHitRate: number;
  }> {
    try {
      const totalRecords = await this.count();
      
      const lastRecord = this.getDb().prepare(`
        SELECT updated_at FROM ${this.tableName} 
        ORDER BY updated_at DESC LIMIT 1
      `).get() as { updated_at?: string } | undefined;
      
      return {
        tableName: this.tableName,
        totalRecords,
        lastUpdated: lastRecord?.updated_at || null,
        cacheHitRate: 0, // Could be implemented with cache hit tracking
      };
    } catch (error) {
      console.error(`❌ Health check failed for ${this.tableName}:`, error);
      throw error;
    }
  }
}