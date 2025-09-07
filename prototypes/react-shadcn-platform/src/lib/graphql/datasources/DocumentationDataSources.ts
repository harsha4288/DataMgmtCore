/**
 * Documentation Data Sources (Modernized with DAL)
 * High-performance data source using centralized Database Access Layer
 * Replaces direct database queries with repository pattern
 */

import { DAL } from '../../database/dal/index';

export interface Phase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  tasks: Task[];
  metadata: {
    start_date?: string | null;
    end_date?: string | null;
    completion_date?: string | null;
    total_estimated_hours?: number;
    total_actual_hours?: number;
    dependencies: string[];
  };
}

export interface Task {
  id: string;
  name: string;
  description: string;
  phase_id: string;
  status: string;
  progress: number;
  completion_date?: string | null;
  subtasks: any[];
  metadata: {
    status: string;
    priority: string;
    assignee?: string;
    labels: string[];
    dependencies: string[];
    estimated_hours?: number;
    actual_hours?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  total_phases: number;
  total_tasks: number;
  total_issues: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  completion_percentage: number;
  avg_task_completion_time?: number | null;
}

export class DocumentationDataSources {
  private initialized = false;

  constructor() {
    this.ensureInitialized();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await DAL.initialize();
      this.initialized = true;
      console.log('✅ DocumentationDataSources initialized with DAL');
    } catch (error) {
      console.error('❌ Failed to initialize DocumentationDataSources:', error);
      throw error;
    }
  }

  async getAllPhases(): Promise<Phase[]> {
    await this.ensureInitialized();

    try {
      // Get all phase entities using DAL
      const phaseEntities = await DAL.entities.searchEntities({
        entityType: 'phase',
        orderBy: 'sort_order, created_at',
        limit: 100
      });

      const phases: Phase[] = [];

      for (const phaseEntity of phaseEntities) {
        // Get tasks for this phase using hierarchy
        const taskEntities = await DAL.entities.searchEntities({
          parentId: phaseEntity.id,
          entityType: 'task',
          orderBy: 'level, sort_order, created_at',
          limit: 1000
        });

        // Convert tasks to GraphQL format
        const tasks: Task[] = taskEntities.map(taskEntity => ({
          id: taskEntity.id,
          name: taskEntity.title,
          description: taskEntity.description || '',
          phase_id: phaseEntity.id,
          status: taskEntity.status,
          progress: taskEntity.progress,
          completion_date: taskEntity.status === 'completed' ? 
            (taskEntity.updated_at ? taskEntity.updated_at.split('T')[0] : null) : null,
          subtasks: [], // Could be populated from child entities if needed
          metadata: {
            status: taskEntity.status,
            priority: taskEntity.priority,
            assignee: taskEntity.assignee || undefined,
            labels: taskEntity.labels || [],
            dependencies: taskEntity.dependencies || [],
            estimated_hours: taskEntity.estimated_hours || undefined,
            actual_hours: taskEntity.actual_hours || undefined
          },
          created_at: taskEntity.created_at!,
          updated_at: taskEntity.updated_at!
        }));

        // Convert phase to GraphQL format
        const phase: Phase = {
          id: phaseEntity.id,
          name: phaseEntity.title,
          description: phaseEntity.description || '',
          status: this.parsePhaseStatus(phaseEntity.status),
          progress: this.calculatePhaseProgressFromTasks(tasks),
          tasks,
          metadata: {
            start_date: phaseEntity.metadata?.start_date || null,
            end_date: phaseEntity.metadata?.end_date || null,
            completion_date: phaseEntity.status === 'completed' ? 
              (phaseEntity.updated_at ? phaseEntity.updated_at.split('T')[0] : null) : null,
            total_estimated_hours: phaseEntity.estimated_hours || undefined,
            total_actual_hours: phaseEntity.actual_hours || undefined,
            dependencies: phaseEntity.dependencies || []
          }
        };

        phases.push(phase);
      }

      console.log(`📋 Loaded ${phases.length} phases with ${phases.reduce((sum, p) => sum + p.tasks.length, 0)} tasks`);
      return phases;

    } catch (error) {
      console.error('❌ Error loading phases from DAL:', error);
      throw error;
    }
  }

  async getAllTasks(): Promise<Task[]> {
    await this.ensureInitialized();

    try {
      // Get all task entities directly using DAL
      const taskEntities = await DAL.entities.searchEntities({
        entityType: 'task',
        orderBy: 'hierarchy_path, level, sort_order',
        limit: 5000
      });

      const tasks: Task[] = taskEntities.map(taskEntity => ({
        id: taskEntity.id,
        name: taskEntity.title,
        description: taskEntity.description || '',
        phase_id: taskEntity.parent_id || this.extractPhaseFromHierarchy(taskEntity.hierarchy_path),
        status: taskEntity.status,
        progress: taskEntity.progress,
        completion_date: taskEntity.status === 'completed' ? 
          (taskEntity.updated_at ? taskEntity.updated_at.split('T')[0] : null) : null,
        subtasks: [], // Could be populated from child entities if needed
        metadata: {
          status: taskEntity.status,
          priority: taskEntity.priority,
          assignee: taskEntity.assignee || undefined,
          labels: taskEntity.labels || [],
          dependencies: taskEntity.dependencies || [],
          estimated_hours: taskEntity.estimated_hours || undefined,
          actual_hours: taskEntity.actual_hours || undefined
        },
        created_at: taskEntity.created_at!,
        updated_at: taskEntity.updated_at!
      }));

      console.log(`📋 Loaded ${tasks.length} tasks directly from DAL`);
      return tasks;

    } catch (error) {
      console.error('❌ Error loading tasks from DAL:', error);
      throw error;
    }
  }

  async getAllIssues(): Promise<any[]> {
    await this.ensureInitialized();

    try {
      // Get issue entities using DAL
      const issueEntities = await DAL.entities.searchEntities({
        entityType: 'issue',
        orderBy: 'priority DESC, created_at DESC',
        limit: 1000
      });

      // Convert to legacy format for compatibility
      const issues = issueEntities.map(issueEntity => ({
        id: issueEntity.id,
        title: issueEntity.title,
        description: issueEntity.description || '',
        type: issueEntity.attributes?.type || 'bug',
        severity: issueEntity.priority === 'critical' ? 'high' : 
                 issueEntity.priority === 'high' ? 'medium' : 'low',
        status: issueEntity.status,
        assignee: issueEntity.assignee,
        labels: issueEntity.labels || [],
        created_at: issueEntity.created_at,
        updated_at: issueEntity.updated_at
      }));

      console.log(`🐛 Loaded ${issues.length} issues from DAL`);
      return issues;

    } catch (error) {
      console.error('❌ Error loading issues from DAL:', error);
      return []; // Return empty array as fallback
    }
  }

  async getPhase(id: string): Promise<Phase | null> {
    await this.ensureInitialized();

    try {
      const phaseEntity = await DAL.entities.getEntityWithRelations(id);
      if (!phaseEntity || phaseEntity.entity_type !== 'phase') {
        return null;
      }

      // Get tasks for this phase
      const taskEntities = await DAL.entities.getEntityChildren(id);
      const tasks: Task[] = taskEntities
        .filter(child => child.entity_type === 'task')
        .map(taskEntity => ({
          id: taskEntity.id,
          name: taskEntity.title,
          description: taskEntity.description || '',
          phase_id: id,
          status: taskEntity.status,
          progress: taskEntity.progress,
          completion_date: taskEntity.status === 'completed' ? 
            (taskEntity.updated_at ? taskEntity.updated_at.split('T')[0] : null) : null,
          subtasks: [],
          metadata: {
            status: taskEntity.status,
            priority: taskEntity.priority,
            assignee: taskEntity.assignee || undefined,
            labels: taskEntity.labels || [],
            dependencies: taskEntity.dependencies || [],
            estimated_hours: taskEntity.estimated_hours || undefined,
            actual_hours: taskEntity.actual_hours || undefined
          },
          created_at: taskEntity.created_at!,
          updated_at: taskEntity.updated_at!
        }));

      return {
        id: phaseEntity.id,
        name: phaseEntity.title,
        description: phaseEntity.description || '',
        status: this.parsePhaseStatus(phaseEntity.status),
        progress: this.calculatePhaseProgressFromTasks(tasks),
        tasks,
        metadata: {
          start_date: phaseEntity.metadata?.start_date || null,
          end_date: phaseEntity.metadata?.end_date || null,
          completion_date: phaseEntity.status === 'completed' ? 
            (phaseEntity.updated_at ? phaseEntity.updated_at.split('T')[0] : null) : null,
          total_estimated_hours: phaseEntity.estimated_hours || undefined,
          total_actual_hours: phaseEntity.actual_hours || undefined,
          dependencies: phaseEntity.dependencies || []
        }
      };

    } catch (error) {
      console.error(`❌ Error loading phase ${id} from DAL:`, error);
      return null;
    }
  }

  async getTask(id: string): Promise<Task | null> {
    await this.ensureInitialized();

    try {
      const taskEntity = await DAL.entities.findById(id);
      if (!taskEntity || !['task', 'subtask'].includes(taskEntity.entity_type)) {
        return null;
      }

      return {
        id: taskEntity.id,
        name: taskEntity.title,
        description: taskEntity.description || '',
        phase_id: taskEntity.parent_id || this.extractPhaseFromHierarchy(taskEntity.hierarchy_path),
        status: taskEntity.status,
        progress: taskEntity.progress,
        completion_date: taskEntity.status === 'completed' ? 
          (taskEntity.updated_at ? taskEntity.updated_at.split('T')[0] : null) : null,
        subtasks: [],
        metadata: {
          status: taskEntity.status,
          priority: taskEntity.priority,
          assignee: taskEntity.assignee || undefined,
          labels: taskEntity.labels || [],
          dependencies: taskEntity.dependencies || [],
          estimated_hours: taskEntity.estimated_hours || undefined,
          actual_hours: taskEntity.actual_hours || undefined
        },
        created_at: taskEntity.created_at!,
        updated_at: taskEntity.updated_at!
      };

    } catch (error) {
      console.error(`❌ Error loading task ${id} from DAL:`, error);
      return null;
    }
  }

  async getIssue(id: string): Promise<any | null> {
    await this.ensureInitialized();

    try {
      const issueEntity = await DAL.entities.findById(id);
      if (!issueEntity || issueEntity.entity_type !== 'issue') {
        return null;
      }

      return {
        id: issueEntity.id,
        title: issueEntity.title,
        description: issueEntity.description || '',
        type: issueEntity.attributes?.type || 'bug',
        severity: issueEntity.priority === 'critical' ? 'high' : 
                 issueEntity.priority === 'high' ? 'medium' : 'low',
        status: issueEntity.status,
        assignee: issueEntity.assignee,
        labels: issueEntity.labels || [],
        created_at: issueEntity.created_at,
        updated_at: issueEntity.updated_at
      };

    } catch (error) {
      console.error(`❌ Error loading issue ${id} from DAL:`, error);
      return null;
    }
  }

  async searchTasks(query: string): Promise<Task[]> {
    await this.ensureInitialized();

    try {
      const taskEntities = await DAL.entities.searchEntities({
        text: query,
        entityType: 'task',
        orderBy: 'updated_at DESC',
        limit: 100
      });

      return taskEntities.map(taskEntity => ({
        id: taskEntity.id,
        name: taskEntity.title,
        description: taskEntity.description || '',
        phase_id: taskEntity.parent_id || this.extractPhaseFromHierarchy(taskEntity.hierarchy_path),
        status: taskEntity.status,
        progress: taskEntity.progress,
        completion_date: taskEntity.status === 'completed' ? 
          (taskEntity.updated_at ? taskEntity.updated_at.split('T')[0] : null) : null,
        subtasks: [],
        metadata: {
          status: taskEntity.status,
          priority: taskEntity.priority,
          assignee: taskEntity.assignee || undefined,
          labels: taskEntity.labels || [],
          dependencies: taskEntity.dependencies || [],
          estimated_hours: taskEntity.estimated_hours || undefined,
          actual_hours: taskEntity.actual_hours || undefined
        },
        created_at: taskEntity.created_at!,
        updated_at: taskEntity.updated_at!
      }));

    } catch (error) {
      console.error(`❌ Error searching tasks with query "${query}":`, error);
      return [];
    }
  }

  async getProjectStats(): Promise<ProjectStats> {
    await this.ensureInitialized();

    try {
      const [phases, tasks, issues] = await Promise.all([
        DAL.entities.count({ entity_type: 'phase' }),
        DAL.entities.count({ entity_type: 'task' }),
        DAL.entities.count({ entity_type: 'issue' })
      ]);

      const [completedTasks, inProgressTasks, blockedTasks] = await Promise.all([
        DAL.entities.count({ entity_type: 'task', status: 'completed' }),
        DAL.entities.count({ entity_type: 'task', status: 'in_progress' }),
        DAL.entities.count({ entity_type: 'task', status: 'blocked' })
      ]);

      return {
        total_phases: phases,
        total_tasks: tasks,
        total_issues: issues,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        blocked_tasks: blockedTasks,
        completion_percentage: tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0,
        avg_task_completion_time: null // Could be calculated if needed
      };

    } catch (error) {
      console.error('❌ Error getting project stats from DAL:', error);
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

  // Document generation methods
  generateMarkdownOutput(data: any, type: string, consumer: 'human' | 'ai' = 'human'): {
    content: string;
    metadata: {
      generated_at: string;
      source: string;
      consumer: string;
    };
  } {
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

  transformToMarkdown(data: any, type: string): string {
    switch (type) {
      case 'task':
        return `# ${data.name}

**Status:** ${data.metadata.status}  
**Progress:** ${data.progress}%  
**Phase:** ${data.phase_id}  

## Description

${data.description}

## Sub-tasks

${data.subtasks?.map((st: any) => `- [${st.completed ? 'x' : ' '}] ${st.name}`).join('\n') || 'None'}

## Metadata

- **Priority:** ${data.metadata.priority}
- **Assignee:** ${data.metadata.assignee || 'Unassigned'}
- **Labels:** ${data.metadata.labels.join(', ') || 'None'}
- **Estimated Hours:** ${data.metadata.estimated_hours || 'Not specified'}
- **Actual Hours:** ${data.metadata.actual_hours || 'Not specified'}

---
*Generated on: ${new Date().toISOString()}*
`;

      case 'phase':
        return `# ${data.name}

**Status:** ${data.status}  
**Progress:** ${data.progress}%  

## Description

${data.description}

## Tasks

${data.tasks?.map((t: Task) => `- ${t.name} (${t.metadata.status})`).join('\n') || 'No tasks'}

## Metadata

- **Total Estimated Hours:** ${data.metadata.total_estimated_hours || 'Not specified'}
- **Total Actual Hours:** ${data.metadata.total_actual_hours || 'Not specified'}
- **Start Date:** ${data.metadata.start_date || 'Not specified'}
- **End Date:** ${data.metadata.end_date || 'Not specified'}

---
*Generated on: ${new Date().toISOString()}*
`;

      case 'issue':
        return `# Issue: ${data.title}

**Type:** ${data.type}  
**Severity:** ${data.severity}  
**Status:** ${data.status}  
**Assignee:** ${data.assignee || 'Unassigned'}  

## Description

${data.description}

## Labels

${data.labels?.join(', ') || 'None'}

---
*Generated on: ${new Date().toISOString()}*
`;

      default:
        return JSON.stringify(data, null, 2);
    }
  }

  // Helper methods
  private parsePhaseStatus(status: string): 'pending' | 'in_progress' | 'completed' {
    const statusMap: Record<string, 'pending' | 'in_progress' | 'completed'> = {
      'pending': 'pending',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'blocked': 'pending', // Map blocked to pending for phases
      'cancelled': 'pending' // Map cancelled to pending for phases
    };
    return statusMap[status] || 'pending';
  }

  private calculatePhaseProgressFromTasks(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / tasks.length);
  }

  private extractPhaseFromHierarchy(hierarchyPath: string): string {
    // Extract phase ID from hierarchy path (e.g., "PHASE-1/TASK-123" -> "PHASE-1")
    return hierarchyPath.split('/')[0];
  }

  // Health check method
  async healthCheck(): Promise<{
    initialized: boolean;
    dal_healthy: boolean;
    cache_size: number;
    last_query: string | null;
  }> {
    const dalHealth = await DAL.healthCheck();
    
    return {
      initialized: this.initialized,
      dal_healthy: dalHealth.initialized && dalHealth.connection.connected,
      cache_size: dalHealth.connection.cacheSize || 0,
      last_query: null // Could be implemented if needed
    };
  }
}

export default DocumentationDataSources;