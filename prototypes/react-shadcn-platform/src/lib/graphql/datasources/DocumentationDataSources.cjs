/**
 * Documentation Data Sources
 * Handles data loading from database and file system fallbacks
 */

const fs = require('fs');
const path = require('path');

class DocumentationDataSources {
  constructor(basePath = '../docs/progress', database = null) {
    this.basePath = path.resolve(__dirname, basePath);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.db = database;
  }

  setDatabase(database) {
    this.db = database;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getAllPhases() {
    const cacheKey = 'all_phases';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // NEW: Use entities table instead of reading .md files
      if (!this.db) {
        console.error('Database not available, falling back to file system');
        return await this.getAllPhasesFromFiles();
      }

      const stmt = this.db.prepare(`
        SELECT * FROM entities 
        WHERE entity_type = 'phase' 
          AND board_id = 'SGS-PROJECT-BOARD'
        ORDER BY id
      `);
      const phaseRows = stmt.all();
      
      const phases = [];
      for (const row of phaseRows) {
        // Use entity_relationships table to find tasks for this phase
        let tasks = [];
        try {
          // Get tasks related to this phase via relationships
          const relationshipStmt = this.db.prepare(`
            SELECT e.* FROM entities e
            JOIN entity_relationships er ON e.id = er.target_entity_id
            WHERE er.source_entity_id = ? 
              AND e.entity_type = 'task'
              AND er.relationship_type IN ('parent_of', 'contains')
              AND er.is_active = 1
            ORDER BY e.sort_order, e.id
          `);
          let taskRows = relationshipStmt.all(row.id);
          
          // Fallback: If no relationships found, try pattern matching for task IDs
          if (taskRows.length === 0) {
            // For phases like "phase-0", look for tasks starting with "TASK-0."
            const phaseNumber = row.id.replace(/^(PHASE-|phase-)/, '');
            const taskPatternStmt = this.db.prepare(`
              SELECT * FROM entities
              WHERE entity_type = 'task' 
                AND (id LIKE ? OR id LIKE ?)
              ORDER BY sort_order, id
            `);
            taskRows = taskPatternStmt.all(`TASK-${phaseNumber}.%`, `TASK-${phaseNumber}`);
          }
          
          tasks = this.buildEntityHierarchy(taskRows, row.id);
        } catch (taskError) {
          console.warn(`Could not load tasks for phase ${row.id}:`, taskError.message);
          tasks = [];
        }

        const phase = {
          id: row.id,
          name: row.title,
          description: row.description || '',
          status: this.parsePhaseStatus(row.status),
          progress: this.calculatePhaseProgressFromTasks(tasks),
          tasks,
          metadata: {
            start_date: row.metadata ? JSON.parse(row.metadata).start_date : null,
            end_date: row.metadata ? JSON.parse(row.metadata).end_date : null,
            completion_date: row.status === 'completed' ? (row.updated_at ? row.updated_at.split('T')[0] : null) : null,
            total_estimated_hours: row.estimated_hours,
            total_actual_hours: row.actual_hours,
            dependencies: row.dependencies ? JSON.parse(row.dependencies) : []
          }
        };
        
        phases.push(phase);
      }

      this.setCache(cacheKey, phases);
      return phases;
    } catch (error) {
      console.error('Error loading phases from database:', error);
      // Fallback to file system
      return await this.getAllPhasesFromFiles();
    }
  }

  async getAllTasks() {
    try {
      // NEW: Use entities table directly instead of going through phases
      if (!this.db) {
        console.error('Database not available, falling back to file system');
        const phases = await this.getAllPhasesFromFiles();
        const tasks = [];
        for (const phase of phases) {
          tasks.push(...phase.tasks);
        }
        return tasks;
      }

      const stmt = this.db.prepare(`
        SELECT * FROM entities 
        WHERE entity_type IN ('task', 'subtask')
        ORDER BY hierarchy_path, level, sort_order
      `);
      const taskRows = stmt.all();
      
      const tasks = taskRows.map(row => ({
        id: row.id,
        name: row.title,
        description: row.description || '',
        phase_id: row.parent_id || row.hierarchy_path.split('/')[0], // Extract phase from hierarchy
        status: row.status,
        progress: row.progress || 0,
        completion_date: row.status === 'completed' ? (row.updated_at ? row.updated_at.split('T')[0] : null) : null,
        subtasks: [], // Could be populated if needed
        metadata: {
          status: row.status,
          priority: row.priority || 'medium',
          assignee: row.assignee || '',
          labels: this.parseJsonField(row.labels, []),
          dependencies: this.parseJsonField(row.dependencies, []),
          estimated_hours: row.estimated_hours,
          actual_hours: row.actual_hours
        },
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      return tasks;
    } catch (error) {
      console.error('Error loading tasks from database:', error);
      // Fallback to file system
      const phases = await this.getAllPhasesFromFiles();
      const tasks = [];
      for (const phase of phases) {
        tasks.push(...phase.tasks);
      }
      return tasks;
    }
  }

  async getAllIssues() {
    const cacheKey = 'all_issues';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const issues = [];
      const issuesPath = path.join(path.dirname(this.basePath), 'issues');
      
      if (fs.existsSync(issuesPath)) {
        const issueFiles = fs.readdirSync(issuesPath)
          .filter(file => file.endsWith('.md'))
          .sort();

        for (const file of issueFiles) {
          const filePath = path.join(issuesPath, file);
          const issue = await this.parseIssueFile(filePath);
          if (issue) {
            issues.push(issue);
          }
        }
      }

      this.setCache(cacheKey, issues);
      return issues;
    } catch (error) {
      console.error('Error loading issues:', error);
      return [];
    }
  }

  async getPhase(id) {
    const phases = await this.getAllPhases();
    return phases.find(phase => phase.id === id) || null;
  }

  async getTask(id) {
    const tasks = await this.getAllTasks();
    return tasks.find(task => task.id === id) || null;
  }

  async getIssue(id) {
    const issues = await this.getAllIssues();
    return issues.find(issue => issue.id === id) || null;
  }

  async searchTasks(query) {
    const tasks = await this.getAllTasks();
    const lowercaseQuery = query.toLowerCase();
    
    return tasks.filter(task => 
      task.name.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery) ||
      task.metadata.labels.some(label => label.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Helper methods
  parseJsonField(field, defaultValue = []) {
    if (!field || field === 'null' || field === '[]') {
      return defaultValue;
    }
    try {
      return JSON.parse(field);
    } catch (e) {
      console.warn('Failed to parse JSON field:', field, e.message);
      return defaultValue;
    }
  }

  buildEntityHierarchy(entityRows, parentId = null) {
    try {
      const result = entityRows.filter(row => row.entity_type === 'task').map(row => {
        // Load subtasks for this task using relationships
        let subtasks = [];
        try {
          const subtaskStmt = this.db.prepare(`
            SELECT e.* FROM entities e
            JOIN entity_relationships er ON e.id = er.target_entity_id
            WHERE er.source_entity_id = ? 
              AND e.entity_type = 'subtask'
              AND er.relationship_type = 'parent_of'
              AND er.is_active = 1
            ORDER BY e.sort_order, e.id
          `);
          const subtaskRows = subtaskStmt.all(row.id);
          
          subtasks = subtaskRows.map(subtaskRow => ({
            id: subtaskRow.id,
            name: subtaskRow.title || '',
            completed: subtaskRow.status === 'completed',
            description: subtaskRow.description || '',
            status: subtaskRow.status || 'pending',
            progress: subtaskRow.progress || 0
          }));
        } catch (subtaskError) {
          console.warn(`Could not load subtasks for task ${row.id}:`, subtaskError.message);
          subtasks = [];
        }

        // Load relationships for this task
        let relationships = [];
        try {
          const relationshipStmt = this.db.prepare(`
            SELECT * FROM entity_relationships
            WHERE (source_entity_id = ? OR target_entity_id = ?)
              AND is_active = 1
            ORDER BY relationship_type
          `);
          const relationshipRows = relationshipStmt.all(row.id, row.id);
          
          relationships = relationshipRows
            .filter(relRow => relRow.source_entity_id && relRow.target_entity_id && relRow.relationship_type) // Filter out invalid relationships
            .map(relRow => ({
              id: relRow.id || `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sourceEntityId: relRow.source_entity_id,
              targetEntityId: relRow.target_entity_id,
              relationshipType: relRow.relationship_type,
              strength: relRow.strength || 0.5,
              impactScore: relRow.impact_score || 0.5,
              isActive: relRow.is_active === 1,
              isBidirectional: relRow.is_bidirectional === 1,
              reverseType: relRow.reverse_type || null,
              context: relRow.context || null,
              tags: this.parseJsonField(relRow.tags, []),
              notes: relRow.notes || null
            }));
        } catch (relationshipError) {
          console.warn(`Could not load relationships for task ${row.id}:`, relationshipError.message);
          relationships = [];
        }
        
        return {
          id: row.id,
          name: row.title || '',
          description: row.description || '',
          phase_id: parentId,
          status: row.status || 'pending',
          progress: row.progress || 0,
          completion_date: row.status === 'completed' ? (row.updated_at ? row.updated_at.split('T')[0] : null) : null,
          subtasks,
          documents: [], // Will be loaded by separate document resolver
          relationships,
          metadata: {
            status: row.status || 'pending',
            priority: row.priority || 'medium',
            assignee: row.assignee || '',
            labels: this.parseJsonField(row.labels, []),
            dependencies: this.parseJsonField(row.dependencies, []),
            estimated_hours: row.estimated_hours || 0,
            actual_hours: row.actual_hours || 0
          },
          created_at: row.created_at,
          updated_at: row.updated_at,
          entity_type: row.entity_type
        };
      });
      
      return result;
    } catch (error) {
      console.error('Error in buildEntityHierarchy:', error);
      return [];
    }
  }

  parsePhaseStatus(status) {
    // Map database statuses to GraphQL enum values
    const statusMap = {
      'pending': 'pending',
      'in_progress': 'in_progress', 
      'completed': 'completed',
      'blocked': 'pending', // Map blocked to pending for phases
      'cancelled': 'pending' // Map cancelled to pending for phases
    };
    return statusMap[status] || 'pending';
  }

  calculatePhaseProgressFromTasks(tasks) {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / tasks.length);
  }

  // Add missing methods for markdown generation
  generateMarkdownOutput(data, type, consumer = 'human') {
    const content = consumer === 'ai' ? 
      JSON.stringify(data, null, 2) : 
      this.transformToMarkdown(data, type);
    
    return {
      content,
      metadata: {
        generated_at: new Date().toISOString(),
        source: `${type}:${data.id}`,
        consumer
      }
    };
  }

  transformToMarkdown(data, type) {
    // Simple markdown generation - in a real system this would be more sophisticated
    switch (type) {
      case 'task':
        return '# ' + data.name + '\n\n' +
               '**Status:** ' + data.metadata.status + '\n' +
               '**Progress:** ' + data.progress + '%\n' +
               '**Phase:** ' + data.phase_id + '\n\n' +
               '## Description\n' +
               data.description + '\n\n' +
               '## Sub-tasks\n' +
               data.subtasks.map(st => '- [' + (st.completed ? 'x' : ' ') + '] ' + st.name).join('\n');

      case 'phase':
        return '# ' + data.name + '\n\n' +
               '**Status:** ' + data.status + '\n' +
               '**Progress:** ' + data.progress + '%\n\n' +
               '## Description\n' +
               data.description + '\n\n' +
               '## Tasks\n' +
               data.tasks.map(t => '- ' + t.name + ' (' + t.metadata.status + ')').join('\n');

      case 'issue':
        return '# Issue: ' + data.title + '\n\n' +
               '**Type:** ' + data.type + '\n' +
               '**Severity:** ' + data.severity + '\n' +
               '**Status:** ' + data.status + '\n\n' +
               '## Description\n' +
               data.description;

      default:
        return JSON.stringify(data, null, 2);
    }
  }

  async getProjectStats() {
    try {
      const tasks = await this.getAllTasks();
      const phases = await this.getAllPhases();
      
      return {
        total_phases: phases.length,
        total_tasks: tasks.length,
        total_issues: 0, // Issues not implemented in new system yet
        completed_tasks: tasks.filter(t => t.status === 'completed').length,
        in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
        blocked_tasks: tasks.filter(t => t.status === 'blocked').length,
        completion_percentage: tasks.length > 0 ? 
          Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
        avg_task_completion_time: null // Not implemented yet
      };
    } catch (error) {
      console.error('Error getting project stats:', error);
      return {
        total_phases: 0,
        total_tasks: 0,
        total_issues: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        blocked_tasks: 0,
        completion_percentage: 0,
        avg_task_completion_time: null
      };
    }
  }

  // Document methods required by GraphQL resolvers
  async getDocumentsByEntity(entityId, entityType) {
    try {
      if (!this.db) {
        console.warn('Database not available for document queries');
        return [];
      }

      const stmt = this.db.prepare(`
        SELECT * FROM documents 
        WHERE entity_id = ? AND entity_type = ?
        ORDER BY version DESC, updated_at DESC
      `);
      const documentRows = stmt.all(entityId, entityType);

      return documentRows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type,
        status: row.status,
        entityId: row.entity_id,
        entityType: row.entity_type,
        author: row.author,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error loading documents by entity:', error);
      return [];
    }
  }

  async getDocument(id) {
    try {
      if (!this.db) {
        console.warn('Database not available for document queries');
        return null;
      }

      const stmt = this.db.prepare(`
        SELECT * FROM documents 
        WHERE id = ?
      `);
      const row = stmt.get(id);

      if (!row) return null;

      return {
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type,
        status: row.status,
        entityId: row.entity_id,
        entityType: row.entity_type,
        author: row.author,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error loading document:', error);
      return null;
    }
  }

  async getDocumentContent(entityId, entityType) {
    try {
      const documents = await this.getDocumentsByEntity(entityId, entityType);
      if (documents.length === 0) return null;
      
      // Return the latest document's content
      return {
        content: documents[0].content,
        metadata: {
          title: documents[0].title,
          author: documents[0].author,
          version: documents[0].version,
          lastUpdated: documents[0].updatedAt
        }
      };
    } catch (error) {
      console.error('Error loading document content:', error);
      return null;
    }
  }

  // Fallback file system methods (legacy support)
  async getAllPhasesFromFiles() {
    // Implementation would go here for file system fallback
    // For now, return empty array as database is the primary source
    console.warn('File system fallback not fully implemented');
    return [];
  }

  async parseIssueFile(filePath) {
    // Implementation would go here for parsing issue files
    // For now, return null as this is legacy functionality
    console.warn('Issue file parsing not fully implemented');
    return null;
  }
}

module.exports = DocumentationDataSources;