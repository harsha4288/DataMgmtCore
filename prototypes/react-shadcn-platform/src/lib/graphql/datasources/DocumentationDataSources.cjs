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
        ORDER BY id
      `);
      const phaseRows = stmt.all();
      
      const phases = [];
      for (const row of phaseRows) {
        // Get tasks for this phase
        const taskStmt = this.db.prepare(`
          SELECT * FROM entities 
          WHERE entity_type IN ('task', 'subtask') 
          AND (parent_id = ? OR hierarchy_path LIKE ?)
          ORDER BY level, sort_order
        `);
        const taskRows = taskStmt.all(row.id, `${row.hierarchy_path}%`);
        
        const tasks = taskRows.map(taskRow => ({
          id: taskRow.id,
          name: taskRow.title,
          description: taskRow.description || '',
          phase_id: row.id,
          status: taskRow.status,
          progress: taskRow.progress || 0,
          completion_date: taskRow.updated_at ? taskRow.updated_at.split('T')[0] : null,
          subtasks: [], // Will be populated by parseSubtasksFromDB if needed
          metadata: {
            status: taskRow.status,
            priority: taskRow.priority || 'medium',
            assignee: taskRow.assignee,
            labels: taskRow.labels ? JSON.parse(taskRow.labels) : [],
            dependencies: taskRow.dependencies ? JSON.parse(taskRow.dependencies) : [],
            estimated_hours: taskRow.estimated_hours,
            actual_hours: taskRow.actual_hours
          },
          created_at: taskRow.created_at,
          updated_at: taskRow.updated_at
        }));

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
          assignee: row.assignee,
          labels: row.labels ? JSON.parse(row.labels) : [],
          dependencies: row.dependencies ? JSON.parse(row.dependencies) : [],
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