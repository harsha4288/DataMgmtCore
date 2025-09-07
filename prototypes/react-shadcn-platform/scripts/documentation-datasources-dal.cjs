/**
 * Documentation Data Sources (CommonJS with Direct Database Access)
 * High-performance data source using database queries directly
 * Temporary implementation while DAL ES module issues are resolved
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DocumentationDataSources {
  constructor(basePath = '../docs/progress') {
    this.basePath = path.resolve(__dirname, basePath);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.dbPath = path.resolve(__dirname, '../src/lib/database/database.db');
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection and schema
   */
  initializeDatabase() {
    if (this.db && this.initialized) return this.db;

    try {
      this.db = new Database(this.dbPath);
      
      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = MEMORY');
      
      console.log('✅ Database connection established for GraphQL');
      
      // Initialize schema if needed
      if (!this.initialized) {
        const schemaPath = path.resolve(__dirname, '../src/lib/database/schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf8');
          try {
            this.db.exec(schema);
            console.log('📋 Database schema initialized for GraphQL');
            this.initialized = true;
          } catch (schemaError) {
            // Schema might already exist, check if tables are there
            try {
              const tableCheck = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entities'").get();
              if (tableCheck) {
                console.log('📋 Database schema already exists');
                this.initialized = true;
              } else {
                throw schemaError;
              }
            } catch (e) {
              console.error('❌ Schema initialization failed:', e);
              throw schemaError;
            }
          }
        } else {
          console.log('⚠️ Schema file not found, assuming database is initialized');
          this.initialized = true;
        }
      }
      
      return this.db;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get all phases with task counts and progress
   */
  async getAllPhases() {
    const cacheKey = 'all_phases';
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const db = this.initializeDatabase();
      
      // Get phases with task summaries
      const phases = db.prepare(`
        SELECT 
          p.id,
          p.title as name,
          p.description,
          p.status,
          p.progress,
          p.created_at,
          p.updated_at,
          COUNT(t.id) as task_count,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
        FROM entities p
        LEFT JOIN entity_relationships er ON p.id = er.source_entity_id
        LEFT JOIN entities t ON er.target_entity_id = t.id AND t.entity_type = 'task'
        WHERE p.entity_type = 'phase'
        GROUP BY p.id, p.title, p.description, p.status, p.progress
        ORDER BY p.title
      `).all();

      const result = phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || '',
        status: phase.status,
        progress: phase.progress || 0,
        created_at: phase.created_at,
        updated_at: phase.updated_at,
        task_count: phase.task_count || 0,
        completed_tasks: phase.completed_tasks || 0,
        completion_percentage: phase.task_count > 0 
          ? Math.round((phase.completed_tasks / phase.task_count) * 100)
          : 0,
        tasks: [] // Will be populated by separate query if needed
      }));

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
      
    } catch (error) {
      console.error('❌ Error in getAllPhases:', error);
      return [];
    }
  }

  /**
   * Get all tasks
   */
  async getAllTasks() {
    try {
      const db = this.initializeDatabase();
      
      const tasks = db.prepare(`
        SELECT 
          id,
          title as name,
          status,
          progress,
          created_at,
          updated_at,
          entity_type as type
        FROM entities 
        WHERE entity_type = 'task'
        ORDER BY title
      `).all();

      return tasks;
      
    } catch (error) {
      console.error('❌ Error in getAllTasks:', error);
      return [];
    }
  }

  /**
   * Get all issues (entities with type 'issue')
   */
  async getAllIssues() {
    try {
      const db = this.initializeDatabase();
      
      const issues = db.prepare(`
        SELECT 
          id,
          title as name,
          status,
          progress,
          created_at,
          updated_at
        FROM entities 
        WHERE entity_type = 'issue'
        ORDER BY created_at DESC
      `).all();

      return issues;
      
    } catch (error) {
      console.error('❌ Error in getAllIssues:', error);
      return [];
    }
  }

  /**
   * Get phase by ID with tasks
   */
  async getPhase(id) {
    try {
      const db = this.initializeDatabase();
      
      // Get phase details
      const phase = db.prepare(`
        SELECT id, title as name, description, status, progress, created_at, updated_at
        FROM entities 
        WHERE id = ? AND entity_type = 'phase'
      `).get(id);

      if (!phase) return null;

      // Get phase tasks
      const tasks = db.prepare(`
        SELECT 
          t.id,
          t.title as name,
          t.status,
          t.progress,
          t.created_at,
          t.updated_at
        FROM entities t
        JOIN entity_relationships er ON t.id = er.target_entity_id
        WHERE er.source_entity_id = ? AND t.entity_type = 'task'
        ORDER BY t.title
      `).all(id);
      
      return {
        ...phase,
        description: phase.description || '',
        tasks
      };
      
    } catch (error) {
      console.error('❌ Error in getPhase:', error);
      return null;
    }
  }

  /**
   * Get task by ID
   */
  async getTask(id) {
    try {
      const db = this.initializeDatabase();
      
      const task = db.prepare(`
        SELECT id, title as name, status, progress, created_at, updated_at
        FROM entities 
        WHERE id = ? AND entity_type = 'task'
      `).get(id);

      return task;
      
    } catch (error) {
      console.error('❌ Error in getTask:', error);
      return null;
    }
  }

  /**
   * Get issue by ID
   */
  async getIssue(id) {
    try {
      const db = this.initializeDatabase();
      
      const issue = db.prepare(`
        SELECT id, title as name, status, progress, created_at, updated_at
        FROM entities 
        WHERE id = ? AND entity_type = 'issue'
      `).get(id);

      return issue;
      
    } catch (error) {
      console.error('❌ Error in getIssue:', error);
      return null;
    }
  }

  /**
   * Search tasks by query
   */
  async searchTasks(query) {
    try {
      const db = this.initializeDatabase();
      
      const tasks = db.prepare(`
        SELECT 
          id,
          title as name,
          status,
          progress,
          created_at,
          updated_at
        FROM entities 
        WHERE entity_type = 'task' AND (
          title LIKE ? OR 
          status LIKE ? OR
          id LIKE ?
        )
        ORDER BY title
        LIMIT 50
      `).all(`%${query}%`, `%${query}%`, `%${query}%`);

      return tasks;
      
    } catch (error) {
      console.error('❌ Error in searchTasks:', error);
      return [];
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats() {
    try {
      const db = this.initializeDatabase();
      
      const stats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN entity_type = 'phase' THEN 1 END) as total_phases,
          COUNT(CASE WHEN entity_type = 'phase' AND status = 'completed' THEN 1 END) as completed_phases,
          COUNT(CASE WHEN entity_type = 'task' THEN 1 END) as total_tasks,
          COUNT(CASE WHEN entity_type = 'task' AND status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN entity_type = 'issue' THEN 1 END) as total_issues,
          COUNT(CASE WHEN entity_type = 'issue' AND status = 'resolved' THEN 1 END) as resolved_issues
        FROM entities
      `).get();

      const overallProgress = stats.total_tasks > 0 
        ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
        : 0;

      return {
        ...stats,
        overall_progress: overallProgress
      };
      
    } catch (error) {
      console.error('❌ Error in getProjectStats:', error);
      return {
        total_phases: 0,
        completed_phases: 0,
        total_tasks: 0,
        completed_tasks: 0,
        total_issues: 0,
        resolved_issues: 0,
        overall_progress: 0
      };
    }
  }

  /**
   * Generate markdown output (simplified)
   */
  generateMarkdownOutput(data, type, consumer = 'human') {
    if (type === 'phases') {
      return this.formatPhasesAsMarkdown(data);
    } else if (type === 'tasks') {
      return this.formatTasksAsMarkdown(data);
    }
    return JSON.stringify(data, null, 2);
  }

  /**
   * Transform data to markdown (alias)
   */
  transformToMarkdown(data, type) {
    return this.generateMarkdownOutput(data, type);
  }

  /**
   * Format phases as markdown
   */
  formatPhasesAsMarkdown(phases) {
    let markdown = '# Project Phases\n\n';
    
    phases.forEach(phase => {
      markdown += `## ${phase.name}\n`;
      markdown += `- **Status**: ${phase.status}\n`;
      markdown += `- **Progress**: ${phase.progress}%\n`;
      markdown += `- **Tasks**: ${phase.completed_tasks}/${phase.task_count}\n\n`;
    });
    
    return markdown;
  }

  /**
   * Format tasks as markdown
   */
  formatTasksAsMarkdown(tasks) {
    let markdown = '# Tasks\n\n';
    
    tasks.forEach(task => {
      markdown += `- **${task.name}** (${task.status})\n`;
    });
    
    return markdown;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const db = this.initializeDatabase();
      const count = db.prepare('SELECT COUNT(*) as count FROM entities').get();
      
      return {
        initialized: true,
        dal_healthy: true,
        database_connected: true,
        total_entities: count.count,
        cache_size: this.cache.size,
        last_query: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        initialized: false,
        dal_healthy: false,
        database_connected: false,
        error: error.message,
        cache_size: 0,
        last_query: null
      };
    }
  }

  // Legacy methods for backward compatibility with existing GraphQL server
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Get documents by entity ID (placeholder implementation)
   */
  async getDocumentsByEntity(entityId) {
    try {
      // For now, return empty array since we don't have documents table yet
      // This will be implemented when document management is added
      return [];
    } catch (error) {
      console.error('❌ Error in getDocumentsByEntity:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.cache.clear();
  }
}

module.exports = DocumentationDataSources;