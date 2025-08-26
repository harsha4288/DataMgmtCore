/**
 * Data sources for GraphQL resolvers
 * Integrates with existing progress file system
 */

import fs from 'fs';
import path from 'path';
import { Task, Phase, Issue, TaskStatus, QueryResult } from './types';
import { FormDataProcessor } from './forms';

export class DocumentationDataSources {
  private basePath: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(basePath: string = './docs/progress') {
    this.basePath = basePath;
  }

  // === PHASE OPERATIONS ===

  async getAllPhases(): Promise<Phase[]> {
    const cacheKey = 'all_phases';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const phases: Phase[] = [];
      const phaseDirs = fs.readdirSync(this.basePath)
        .filter(dir => dir.startsWith('phase-'))
        .sort();

      for (const phaseDir of phaseDirs) {
        const phasePath = path.join(this.basePath, phaseDir);
        const phase = await this.parsePhaseDirectory(phasePath, phaseDir);
        if (phase) {
          phases.push(phase);
        }
      }

      this.setCache(cacheKey, phases);
      return phases;
    } catch (error) {
      console.error('Error loading phases:', error);
      return [];
    }
  }

  async getPhase(id: string): Promise<Phase | null> {
    const phases = await this.getAllPhases();
    return phases.find(phase => phase.id === id) || null;
  }

  async createPhase(input: any): Promise<QueryResult<Phase>> {
    try {
      // Create phase directory
      const phasePath = path.join(this.basePath, input.id);
      if (!fs.existsSync(phasePath)) {
        fs.mkdirSync(phasePath, { recursive: true });
      }

      // Create README.md
      const markdown = FormDataProcessor.transformToDocumentation(input, 'phase-creation');
      const readmePath = path.join(phasePath, 'README.md');
      fs.writeFileSync(readmePath, markdown, 'utf-8');

      // Create phase object
      const phase: Phase = {
        id: input.id,
        name: input.name,
        description: input.description,
        status: 'pending',
        progress: 0,
        tasks: [],
        metadata: {
          start_date: input.metadata?.start_date,
          end_date: input.metadata?.end_date,
          dependencies: input.metadata?.dependencies || []
        }
      };

      this.invalidateCache('all_phases');
      return {
        data: phase,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: {} as Phase,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create phase',
        timestamp: new Date().toISOString()
      };
    }
  }

  // === TASK OPERATIONS ===

  async getAllTasks(): Promise<Task[]> {
    const cacheKey = 'all_tasks';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const tasks: Task[] = [];
      const phases = await this.getAllPhases();
      
      for (const phase of phases) {
        tasks.push(...phase.tasks);
      }

      this.setCache(cacheKey, tasks);
      return tasks;
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  async getTask(id: string): Promise<Task | null> {
    const tasks = await this.getAllTasks();
    return tasks.find(task => task.id === id) || null;
  }

  async getTasksByPhase(phaseId: string): Promise<Task[]> {
    const phase = await this.getPhase(phaseId);
    return phase?.tasks || [];
  }

  async getTasksByStatus(status: TaskStatus['metadata']['status']): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    return tasks.filter(task => task.metadata.status === status);
  }

  async createTask(input: any): Promise<QueryResult<Task>> {
    try {
      const now = new Date().toISOString();
      
      // Create task object
      const task: Task = {
        id: input.id,
        name: input.name,
        description: input.description,
        phase_id: input.phase_id,
        status: input.metadata.status,
        progress: 0,
        subtasks: input.subtasks.map((st: any, index: number) => ({
          id: `${input.id}.${index + 1}`,
          name: st.name,
          description: st.description,
          completed: st.completed || false
        })),
        metadata: {
          status: input.metadata.status,
          priority: input.metadata.priority,
          assignee: input.metadata.assignee,
          labels: input.metadata.labels || [],
          dependencies: input.metadata.dependencies || [],
          estimated_hours: input.metadata.estimated_hours,
          actual_hours: 0
        },
        created_at: now,
        updated_at: now
      };

      // Generate markdown and save to file
      const markdown = FormDataProcessor.transformToDocumentation(input, 'task-creation');
      const taskPath = path.join(this.basePath, input.phase_id, `${input.id}.md`);
      fs.writeFileSync(taskPath, markdown, 'utf-8');

      this.invalidateCache('all_tasks');
      this.invalidateCache('all_phases');
      
      return {
        data: task,
        success: true,
        timestamp: now
      };
    } catch (error) {
      return {
        data: {} as Task,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
        timestamp: new Date().toISOString()
      };
    }
  }

  // === ISSUE OPERATIONS ===

  async getAllIssues(): Promise<Issue[]> {
    const cacheKey = 'all_issues';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const issues: Issue[] = [];
      const issuesPath = path.join(this.basePath, '../issues');
      
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

  async getIssue(id: string): Promise<Issue | null> {
    const issues = await this.getAllIssues();
    return issues.find(issue => issue.id === id) || null;
  }

  async createIssue(input: any): Promise<QueryResult<Issue>> {
    try {
      const now = new Date().toISOString();
      const id = `issue-${Date.now()}`;
      
      // Create issue object
      const issue: Issue = {
        id,
        title: input.title,
        description: input.description,
        type: input.type,
        status: 'open',
        severity: input.severity,
        related_tasks: input.related_tasks || [],
        resolution_attempts: input.resolution_attempts || [],
        created_date: now
      };

      // Create issues directory if it doesn't exist
      const issuesPath = path.join(this.basePath, '../issues');
      if (!fs.existsSync(issuesPath)) {
        fs.mkdirSync(issuesPath, { recursive: true });
      }

      // Generate markdown and save
      const markdown = FormDataProcessor.transformToDocumentation({ ...input, id }, 'issue-creation');
      const issuePath = path.join(issuesPath, `${id}.md`);
      fs.writeFileSync(issuePath, markdown, 'utf-8');

      this.invalidateCache('all_issues');
      
      return {
        data: issue,
        success: true,
        timestamp: now
      };
    } catch (error) {
      return {
        data: {} as Issue,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create issue',
        timestamp: new Date().toISOString()
      };
    }
  }

  // === MARKDOWN GENERATION ===

  generateTaskMarkdown(task: Task, consumer: string = 'human'): string {
    if (consumer === 'ai') {
      return JSON.stringify({
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.metadata.status,
        progress: task.progress,
        subtasks: task.subtasks,
        metadata: task.metadata
      }, null, 2);
    }

    return FormDataProcessor.transformToDocumentation(task, 'task-creation');
  }

  generatePhaseMarkdown(phase: Phase, consumer: string = 'human'): string {
    if (consumer === 'ai') {
      return JSON.stringify({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        status: phase.status,
        progress: phase.progress,
        tasks: phase.tasks.map(t => ({ id: t.id, name: t.name, status: t.metadata.status })),
        metadata: phase.metadata
      }, null, 2);
    }

    return FormDataProcessor.transformToDocumentation(phase, 'phase-creation');
  }

  // === SEARCH AND STATISTICS ===

  async searchTasks(query: string): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    const lowercaseQuery = query.toLowerCase();
    
    return tasks.filter(task => 
      task.name.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery) ||
      task.metadata.labels.some(label => label.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getProjectStats() {
    const phases = await this.getAllPhases();
    const tasks = await this.getAllTasks();
    const issues = await this.getAllIssues();
    
    const completedTasks = tasks.filter(t => t.metadata.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.metadata.status === 'in_progress');
    const blockedTasks = tasks.filter(t => t.metadata.status === 'blocked');
    
    return {
      total_phases: phases.length,
      total_tasks: tasks.length,
      total_issues: issues.length,
      completed_tasks: completedTasks.length,
      in_progress_tasks: inProgressTasks.length,
      blocked_tasks: blockedTasks.length,
      completion_percentage: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0
    };
  }

  // === PRIVATE METHODS ===

  private async parsePhaseDirectory(phasePath: string, phaseDir: string): Promise<Phase | null> {
    try {
      const phaseNumber = phaseDir.replace('phase-', '');
      const readmePath = path.join(phasePath, 'README.md');
      
      if (!fs.existsSync(readmePath)) {
        return null;
      }

      const content = fs.readFileSync(readmePath, 'utf-8');
      const tasks = await this.parseTasksInPhase(phasePath, phaseDir);
      
      // Extract phase info from README
      const nameMatch = content.match(/^# (.+)$/m);
      const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m);
      
      return {
        id: phaseDir,
        name: nameMatch ? nameMatch[1] : `Phase ${phaseNumber}`,
        description: this.extractDescription(content),
        status: this.parsePhaseStatus(statusMatch ? statusMatch[1] : 'Pending'),
        progress: this.calculatePhaseProgress(tasks),
        tasks,
        metadata: {
          dependencies: []
        }
      };
    } catch (error) {
      console.error(`Error parsing phase ${phaseDir}:`, error);
      return null;
    }
  }

  private async parseTasksInPhase(phasePath: string, phaseId: string): Promise<Task[]> {
    const tasks: Task[] = [];
    
    try {
      const files = fs.readdirSync(phasePath).filter(f => f.endsWith('.md') && f !== 'README.md');
      
      for (const file of files) {
        const filePath = path.join(phasePath, file);
        const task = await this.parseTaskFile(filePath, phaseId);
        if (task) {
          tasks.push(task);
        }
      }
    } catch (error) {
      console.error(`Error parsing tasks in ${phaseId}:`, error);
    }

    return tasks;
  }

  private async parseTaskFile(filePath: string, phaseId: string): Promise<Task | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath, '.md');
      
      // Extract task information
      const nameMatch = content.match(/^# (.+)$/m);
      const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m);
      const progressMatch = content.match(/\*\*Progress:\*\* (\d+)% \((\d+)\/(\d+)/);
      
      const task: Task = {
        id: filename,
        name: nameMatch ? nameMatch[1] : filename,
        description: this.extractDescription(content),
        phase_id: phaseId,
        status: this.parseTaskStatus(statusMatch ? statusMatch[1] : 'Pending'),
        progress: progressMatch ? parseInt(progressMatch[1]) : 0,
        subtasks: this.parseSubtasks(content),
        metadata: {
          status: this.parseTaskStatus(statusMatch ? statusMatch[1] : 'Pending'),
          priority: 'medium',
          labels: [],
          dependencies: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return task;
    } catch (error) {
      console.error(`Error parsing task file ${filePath}:`, error);
      return null;
    }
  }

  private async parseIssueFile(filePath: string): Promise<Issue | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath, '.md');
      
      const titleMatch = content.match(/^# Issue: (.+)$/m);
      const typeMatch = content.match(/\*\*Type:\*\* (.+)$/m);
      const severityMatch = content.match(/\*\*Severity:\*\* .+ (.+)$/m);
      
      return {
        id: filename,
        title: titleMatch ? titleMatch[1] : filename,
        description: this.extractDescription(content),
        type: this.parseIssueType(typeMatch ? typeMatch[1] : 'qa'),
        status: 'open',
        severity: this.parseSeverity(severityMatch ? severityMatch[1] : 'medium'),
        related_tasks: [],
        resolution_attempts: [],
        created_date: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error parsing issue file ${filePath}:`, error);
      return null;
    }
  }

  private extractDescription(content: string): string {
    const overviewMatch = content.match(/## (?:Overview|Description)\s*\n(.+?)(?=\n## |\n\n|$)/s);
    return overviewMatch ? overviewMatch[1].trim() : '';
  }

  private parseSubtasks(content: string): any[] {
    const subtaskMatches = content.match(/- \[(x| )\] (.+)/g);
    return subtaskMatches ? subtaskMatches.map((match, index) => {
      const completed = match.includes('[x]');
      const name = match.replace(/- \[(x| )\] /, '');
      return {
        id: `subtask-${index}`,
        name,
        description: '',
        completed
      };
    }) : [];
  }

  private parseTaskStatus(status: string): Task['metadata']['status'] {
    const statusMap: Record<string, Task['metadata']['status']> = {
      'Complete': 'completed',
      'In Progress': 'in_progress',
      'Blocked': 'blocked',
      'Cancelled': 'cancelled',
      'Pending': 'pending'
    };
    
    // Clean status string (remove emoji)
    const cleanStatus = status.replace(/[^\w\s]/g, '').trim();
    return statusMap[cleanStatus] || 'pending';
  }

  private parsePhaseStatus(status: string): Phase['status'] {
    const cleanStatus = status.replace(/[^\w\s]/g, '').trim();
    return cleanStatus === 'Complete' ? 'completed' : 
           cleanStatus === 'In Progress' ? 'in_progress' : 'pending';
  }

  private parseIssueType(type: string): Issue['type'] {
    const cleanType = type.toLowerCase().replace(/[^\w]/g, '');
    const types: Issue['type'][] = ['bug', 'feature', 'improvement', 'qa', 'uat'];
    return types.includes(cleanType as any) ? cleanType as Issue['type'] : 'qa';
  }

  private parseSeverity(severity: string): Issue['severity'] {
    const cleanSeverity = severity.toLowerCase().replace(/[^\w]/g, '');
    const severities: Issue['severity'][] = ['low', 'medium', 'high', 'critical'];
    return severities.includes(cleanSeverity as any) ? cleanSeverity as Issue['severity'] : 'medium';
  }

  private calculatePhaseProgress(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return totalProgress / tasks.length;
  }

  // === CACHE MANAGEMENT ===

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }
}