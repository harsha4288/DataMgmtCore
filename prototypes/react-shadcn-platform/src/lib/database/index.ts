import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;

  private constructor() {
    // Initialize SQLite database  
    const dbPath = join(import.meta.dirname || '.', 'database.db');
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initializeSchema(): void {
    try {
      const schemaPath = join(import.meta.dirname || '.', 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
    }
  }

  // User Instructions CRUD
  public getUserInstructions(userType?: string, context?: string) {
    let query = 'SELECT * FROM user_instructions';
    const params: any[] = [];

    if (userType || context) {
      const conditions: string[] = [];
      if (userType) {
        conditions.push('JSON_EXTRACT(user_types, "$") LIKE ?');
        params.push(`%"${userType}"%`);
      }
      if (context) {
        conditions.push('JSON_EXTRACT(context, "$") LIKE ?');
        params.push(`%"${context}"%`);
      }
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updated_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => ({
      ...row,
      userTypes: JSON.parse(row.user_types),
      context: JSON.parse(row.context),
      tags: JSON.parse(row.tags),
      lastUpdated: row.updated_at
    }));
  }

  public getUserInstruction(id: string) {
    const stmt = this.db.prepare('SELECT * FROM user_instructions WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;
    
    return {
      ...row,
      userTypes: JSON.parse(row.user_types),
      context: JSON.parse(row.context),
      tags: JSON.parse(row.tags),
      lastUpdated: row.updated_at
    };
  }

  public createUserInstruction(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO user_instructions (id, title, content, user_types, context, tags, priority, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const id = `inst-${Date.now()}`;
    stmt.run(
      id,
      data.title,
      data.content,
      JSON.stringify(data.userTypes),
      JSON.stringify(data.context || []),
      JSON.stringify(data.tags || []),
      data.priority,
      data.version || '1.0'
    );

    return { success: true, data: { id, ...data } };
  }

  public updateUserInstruction(id: string, data: any) {
    const stmt = this.db.prepare(`
      UPDATE user_instructions 
      SET title = ?, content = ?, user_types = ?, context = ?, tags = ?, priority = ?, version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      data.title,
      data.content,
      JSON.stringify(data.userTypes),
      JSON.stringify(data.context || []),
      JSON.stringify(data.tags || []),
      data.priority,
      data.version,
      id
    );

    return { success: true, data: { id, ...data } };
  }

  public deleteUserInstruction(id: string) {
    const stmt = this.db.prepare('DELETE FROM user_instructions WHERE id = ?');
    const result = stmt.run(id);
    return { success: result.changes > 0 };
  }

  // Tool Configurations CRUD
  public getToolConfigurations(category?: string, environment?: string, userType?: string) {
    let query = 'SELECT * FROM tool_configurations';
    const params: any[] = [];
    const conditions: string[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (environment) {
      conditions.push('environment = ?');
      params.push(environment);
    }
    if (userType) {
      conditions.push('JSON_EXTRACT(user_types, "$") LIKE ?');
      params.push(`%"${userType}"%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updated_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => ({
      ...row,
      toolName: row.tool_name,
      configuration: JSON.parse(row.configuration),
      userTypes: JSON.parse(row.user_types),
      validationRules: JSON.parse(row.validation_rules),
      lastUpdated: row.updated_at
    }));
  }

  public getToolConfiguration(id: string) {
    const stmt = this.db.prepare('SELECT * FROM tool_configurations WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;
    
    return {
      ...row,
      toolName: row.tool_name,
      configuration: JSON.parse(row.configuration),
      userTypes: JSON.parse(row.user_types),
      validationRules: JSON.parse(row.validation_rules),
      lastUpdated: row.updated_at
    };
  }

  public createToolConfiguration(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO tool_configurations (id, tool_name, category, environment, configuration, user_types, validation_rules)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const id = `tool-${Date.now()}`;
    stmt.run(
      id,
      data.toolName,
      data.category,
      data.environment,
      JSON.stringify(data.configuration),
      JSON.stringify(data.userTypes),
      JSON.stringify(data.validationRules || [])
    );

    return { success: true, data: { id, ...data } };
  }

  public updateToolConfiguration(id: string, data: any) {
    const stmt = this.db.prepare(`
      UPDATE tool_configurations 
      SET tool_name = ?, category = ?, environment = ?, configuration = ?, user_types = ?, validation_rules = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      data.toolName,
      data.category,
      data.environment,
      JSON.stringify(data.configuration),
      JSON.stringify(data.userTypes),
      JSON.stringify(data.validationRules || []),
      id
    );

    return { success: true, data: { id, ...data } };
  }

  public deleteToolConfiguration(id: string) {
    const stmt = this.db.prepare('DELETE FROM tool_configurations WHERE id = ?');
    const result = stmt.run(id);
    return { success: result.changes > 0 };
  }

  // Search functionality
  public searchUserInstructions(query: string, userType?: string) {
    let sql = `
      SELECT * FROM user_instructions 
      WHERE (title LIKE ? OR content LIKE ? OR JSON_EXTRACT(tags, "$") LIKE ?)
    `;
    const params = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (userType) {
      sql += ' AND JSON_EXTRACT(user_types, "$") LIKE ?';
      params.push(`%"${userType}"%`);
    }

    sql += ' ORDER BY updated_at DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    
    return rows.map(row => ({
      ...row,
      userTypes: JSON.parse(row.user_types),
      context: JSON.parse(row.context),
      tags: JSON.parse(row.tags)
    }));
  }

  public close(): void {
    this.db.close();
  }
}

export default DatabaseManager;