/**
 * Utility functions for the documentation system
 */

import { Task, Phase, Issue } from './types';
// import { FormSchema } from './types';

export class DocumentationUtils {
  /**
   * Generate unique ID for new entities
   */
  static generateId(type: 'task' | 'phase' | 'issue', prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    
    switch (type) {
      case 'task':
        return prefix ? `task-${prefix}-${random}` : `task-${timestamp}-${random}`;
      case 'phase':
        return prefix ? `phase-${prefix}` : `phase-${timestamp}`;
      case 'issue':
        return `issue-${timestamp}-${random}`;
      default:
        return `${type}-${timestamp}-${random}`;
    }
  }

  /**
   * Validate entity data
   */
  static validateEntity(data: any, type: 'task' | 'phase' | 'issue'): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (type) {
      case 'task':
        return this.validateTask(data);
      case 'phase':
        return this.validatePhase(data);
      case 'issue':
        return this.validateIssue(data);
      default:
        errors.push(`Unknown entity type: ${type}`);
        return { valid: false, errors };
    }
  }

  /**
   * Validate task data
   */
  private static validateTask(task: Partial<Task>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.name || task.name.length < 3) {
      errors.push('Task name must be at least 3 characters long');
    }

    if (!task.description || task.description.length < 10) {
      errors.push('Task description must be at least 10 characters long');
    }

    if (!task.phase_id) {
      errors.push('Task must belong to a phase');
    }

    if (!task.subtasks || task.subtasks.length === 0) {
      errors.push('Task must have at least one subtask');
    }

    if (task.metadata) {
      if (!['pending', 'in_progress', 'completed', 'blocked', 'cancelled'].includes(task.metadata.status)) {
        errors.push('Invalid task status');
      }

      if (!['low', 'medium', 'high', 'critical'].includes(task.metadata.priority)) {
        errors.push('Invalid task priority');
      }

      if (task.metadata.estimated_hours && task.metadata.estimated_hours < 0) {
        errors.push('Estimated hours cannot be negative');
      }
    }

    if (task.progress !== undefined && (task.progress < 0 || task.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate phase data
   */
  private static validatePhase(phase: Partial<Phase>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!phase.name || phase.name.length < 3) {
      errors.push('Phase name must be at least 3 characters long');
    }

    if (!phase.description || phase.description.length < 10) {
      errors.push('Phase description must be at least 10 characters long');
    }

    if (!phase.id || !phase.id.startsWith('phase-')) {
      errors.push('Phase ID must start with "phase-"');
    }

    if (phase.status && !['pending', 'in_progress', 'completed'].includes(phase.status)) {
      errors.push('Invalid phase status');
    }

    if (phase.progress !== undefined && (phase.progress < 0 || phase.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate issue data
   */
  private static validateIssue(issue: Partial<Issue>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!issue.title || issue.title.length < 5) {
      errors.push('Issue title must be at least 5 characters long');
    }

    if (!issue.description || issue.description.length < 10) {
      errors.push('Issue description must be at least 10 characters long');
    }

    if (!['bug', 'feature', 'improvement', 'qa', 'uat'].includes(issue.type!)) {
      errors.push('Invalid issue type');
    }

    if (!['low', 'medium', 'high', 'critical'].includes(issue.severity!)) {
      errors.push('Invalid issue severity');
    }

    if (issue.status && !['open', 'in_progress', 'resolved', 'closed'].includes(issue.status)) {
      errors.push('Invalid issue status');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculate task progress based on completed subtasks
   */
  static calculateTaskProgress(subtasks: Task['subtasks']): number {
    if (!subtasks || subtasks.length === 0) return 0;
    
    const completedCount = subtasks.filter(st => st.completed).length;
    return Math.round((completedCount / subtasks.length) * 100);
  }

  /**
   * Calculate phase progress based on task progress
   */
  static calculatePhaseProgress(tasks: Task[]): number {
    if (!tasks || tasks.length === 0) return 0;
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  }

  /**
   * Get status priority for sorting
   */
  static getStatusPriority(status: string): number {
    const priorityMap: Record<string, number> = {
      'blocked': 1,
      'in_progress': 2,
      'pending': 3,
      'completed': 4,
      'cancelled': 5
    };
    return priorityMap[status] || 3;
  }

  /**
   * Sort tasks by priority and status
   */
  static sortTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // First sort by status priority
      const statusPriorityA = this.getStatusPriority(a.metadata.status);
      const statusPriorityB = this.getStatusPriority(b.metadata.status);
      
      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB;
      }
      
      // Then sort by task priority
      const taskPriorityMap: Record<string, number> = {
        'critical': 1,
        'high': 2,
        'medium': 3,
        'low': 4
      };
      
      const priorityA = taskPriorityMap[a.metadata.priority] || 3;
      const priorityB = taskPriorityMap[b.metadata.priority] || 3;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Finally sort by name
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Filter tasks by various criteria
   */
  static filterTasks(tasks: Task[], filters: {
    status?: string[];
    priority?: string[];
    phase?: string;
    assignee?: string;
    labels?: string[];
    search?: string;
  }): Task[] {
    return tasks.filter(task => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(task.metadata.status)) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(task.metadata.priority)) return false;
      }

      // Phase filter
      if (filters.phase) {
        if (task.phase_id !== filters.phase) return false;
      }

      // Assignee filter
      if (filters.assignee) {
        if (task.metadata.assignee !== filters.assignee) return false;
      }

      // Labels filter
      if (filters.labels && filters.labels.length > 0) {
        const hasLabel = filters.labels.some(label => 
          task.metadata.labels.includes(label)
        );
        if (!hasLabel) return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          task.name,
          task.description,
          ...task.metadata.labels,
          ...task.subtasks.map(st => st.name)
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }

      return true;
    });
  }

  /**
   * Get task statistics
   */
  static getTaskStatistics(tasks: Task[]) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.metadata.status === 'completed').length;
    const inProgress = tasks.filter(t => t.metadata.status === 'in_progress').length;
    const blocked = tasks.filter(t => t.metadata.status === 'blocked').length;
    const pending = tasks.filter(t => t.metadata.status === 'pending').length;
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const averageProgress = total > 0 ? totalProgress / total : 0;
    
    const estimatedHours = tasks.reduce((sum, task) => 
      sum + (task.metadata.estimated_hours || 0), 0
    );
    const actualHours = tasks.reduce((sum, task) => 
      sum + (task.metadata.actual_hours || 0), 0
    );

    return {
      total,
      completed,
      inProgress,
      blocked,
      pending,
      averageProgress: Math.round(averageProgress),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      estimatedHours,
      actualHours,
      efficiencyRate: estimatedHours > 0 ? Math.round((actualHours / estimatedHours) * 100) : 0
    };
  }

  /**
   * Get phase statistics
   */
  static getPhaseStatistics(phases: Phase[]) {
    const total = phases.length;
    const completed = phases.filter(p => p.status === 'completed').length;
    const inProgress = phases.filter(p => p.status === 'in_progress').length;
    const pending = phases.filter(p => p.status === 'pending').length;

    const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
    const averageProgress = total > 0 ? totalProgress / total : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      totalTasks,
      averageProgress: Math.round(averageProgress),
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * Get issue statistics
   */
  static getIssueStatistics(issues: Issue[]) {
    const total = issues.length;
    const open = issues.filter(i => i.status === 'open').length;
    const inProgress = issues.filter(i => i.status === 'in_progress').length;
    const resolved = issues.filter(i => i.status === 'resolved').length;
    const closed = issues.filter(i => i.status === 'closed').length;

    const totalAttempts = issues.reduce((sum, issue) => 
      sum + (issue.resolution_attempts?.length || 0), 0
    );
    const successfulAttempts = issues.reduce((sum, issue) => 
      sum + (issue.resolution_attempts?.filter(a => a.outcome === 'success').length || 0), 0
    );

    const severityBreakdown = {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length
    };

    const typeBreakdown = {
      bug: issues.filter(i => i.type === 'bug').length,
      feature: issues.filter(i => i.type === 'feature').length,
      improvement: issues.filter(i => i.type === 'improvement').length,
      qa: issues.filter(i => i.type === 'qa').length,
      uat: issues.filter(i => i.type === 'uat').length
    };

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      totalAttempts,
      successfulAttempts,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      successRate: totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0,
      severityBreakdown,
      typeBreakdown
    };
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string, format: 'short' | 'long' | 'relative' = 'short'): string {
    const date = new Date(dateString);
    const now = new Date();
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'relative': {
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
      }
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Format duration in hours to human readable
   */
  static formatDuration(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 8) return `${hours.toFixed(1)}h`;
    
    const days = Math.floor(hours / 8);
    const remainingHours = hours % 8;
    
    if (remainingHours === 0) return `${days}d`;
    return `${days}d ${remainingHours.toFixed(1)}h`;
  }

  /**
   * Get color for status
   */
  static getStatusColor(status: string, type: 'task' | 'phase' | 'issue' = 'task'): string {
    const colorMaps = {
      task: {
        'pending': 'hsl(var(--muted-foreground))',
        'in_progress': 'hsl(220, 90%, 56%)',
        'completed': 'hsl(142, 76%, 36%)',
        'blocked': 'hsl(0, 84%, 60%)',
        'cancelled': 'hsl(var(--muted-foreground))'
      },
      phase: {
        'pending': 'hsl(var(--muted-foreground))',
        'in_progress': 'hsl(220, 90%, 56%)',
        'completed': 'hsl(142, 76%, 36%)'
      },
      issue: {
        'open': 'hsl(0, 84%, 60%)',
        'in_progress': 'hsl(45, 93%, 47%)',
        'resolved': 'hsl(142, 76%, 36%)',
        'closed': 'hsl(var(--muted-foreground))'
      }
    };

    return colorMaps[type][status as keyof typeof colorMaps[typeof type]] || 'hsl(var(--muted-foreground))';
  }

  /**
   * Get priority color
   */
  static getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      'low': 'hsl(142, 76%, 36%)',
      'medium': 'hsl(45, 93%, 47%)',
      'high': 'hsl(25, 95%, 53%)',
      'critical': 'hsl(0, 84%, 60%)'
    };

    return colorMap[priority] || 'hsl(var(--muted-foreground))';
  }

  /**
   * Check if entity has unsaved changes
   */
  static hasUnsavedChanges(original: any, current: any): boolean {
    return JSON.stringify(original) !== JSON.stringify(current);
  }

  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (..._args: any[]) => any>(
    func: T,
    wait: number
  ): (..._args: Parameters<T>) => void {
    let timeout: any;
    
    return (..._args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(..._args), wait);
    };
  }

  /**
   * Generate filename for entity
   */
  static generateFilename(entity: { id: string; name: string }, extension: string = 'md'): string {
    const sanitizedName = entity.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    return `${entity.id}-${sanitizedName}.${extension}`;
  }
}