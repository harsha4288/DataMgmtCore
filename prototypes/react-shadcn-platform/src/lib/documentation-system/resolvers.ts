/**
 * GraphQL resolvers for the documentation system
 */

import { GraphQLContext } from './graphql';
import { DocumentationDataSources } from './datasources';

export const resolvers = {
  Query: {
    // Get all data
    getAllPhases: async (_: any, __: any, context: GraphQLContext) => {
      return await context.dataSources.phases.getAllPhases();
    },

    getAllTasks: async (_: any, __: any, context: GraphQLContext) => {
      return await context.dataSources.tasks.getAllTasks();
    },

    getAllIssues: async (_: any, __: any, context: GraphQLContext) => {
      return await context.dataSources.issues.getAllIssues();
    },

    // Get by ID
    getPhase: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return await context.dataSources.phases.getPhase(id);
    },

    getTask: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return await context.dataSources.tasks.getTask(id);
    },

    getIssue: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return await context.dataSources.issues.getIssue(id);
    },

    // Get by status
    getTasksByStatus: async (_: any, { status }: { status: string }, context: GraphQLContext) => {
      return await context.dataSources.tasks.getTasksByStatus(status);
    },

    getPhasesByStatus: async (_: any, { status }: { status: string }, context: GraphQLContext) => {
      const phases = await context.dataSources.phases.getAllPhases();
      return phases.filter((phase: any) => phase.status === status);
    },

    getIssuesByStatus: async (_: any, { status }: { status: string }, context: GraphQLContext) => {
      const issues = await context.dataSources.issues.getAllIssues();
      return issues.filter((issue: any) => issue.status === status);
    },

    // Search and filter
    searchTasks: async (_: any, { query }: { query: string }, context: GraphQLContext) => {
      return await context.dataSources.tasks.searchTasks(query);
    },

    getTasksByPhase: async (_: any, { phase_id }: { phase_id: string }, context: GraphQLContext) => {
      return await context.dataSources.tasks.getTasksByPhase(phase_id);
    },

    getRelatedTasks: async (_: any, { task_id }: { task_id: string }, context: GraphQLContext) => {
      const task = await context.dataSources.tasks.getTask(task_id);
      if (!task || !task.metadata.dependencies.length) return [];
      
      const allTasks = await context.dataSources.tasks.getAllTasks();
      return allTasks.filter((t: any) => 
        task.metadata.dependencies.includes(t.id) || 
        t.metadata.dependencies.includes(task_id)
      );
    },

    // Generate markdown
    generateTaskMarkdown: async (_: any, { id, consumer }: { id: string; consumer?: string }, context: GraphQLContext) => {
      const task = await context.dataSources.tasks.getTask(id);
      if (!task) return null;
      
      const content = context.dataSources.tasks.generateTaskMarkdown(task, consumer || 'human');
      return {
        content,
        metadata: {
          generated_at: new Date().toISOString(),
          source: `task:${id}`,
          consumer: consumer || 'human'
        }
      };
    },

    generatePhaseMarkdown: async (_: any, { id, consumer }: { id: string; consumer?: string }, context: GraphQLContext) => {
      const phase = await context.dataSources.phases.getPhase(id);
      if (!phase) return null;
      
      const content = context.dataSources.phases.generatePhaseMarkdown(phase, consumer || 'human');
      return {
        content,
        metadata: {
          generated_at: new Date().toISOString(),
          source: `phase:${id}`,
          consumer: consumer || 'human'
        }
      };
    },

    generateIssueMarkdown: async (_: any, { id, consumer }: { id: string; consumer?: string }, context: GraphQLContext) => {
      const issue = await context.dataSources.issues.getIssue(id);
      if (!issue) return null;
      
      const content = context.dataSources.issues.generateIssueMarkdown(issue, consumer || 'human');
      return {
        content,
        metadata: {
          generated_at: new Date().toISOString(),
          source: `issue:${id}`,
          consumer: consumer || 'human'
        }
      };
    },

    // Statistics
    getProjectStats: async (_: any, __: any, context: GraphQLContext) => {
      return await context.dataSources.tasks.getProjectStats();
    }
  },

  Mutation: {
    // Create operations
    createTask: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      const result = await context.dataSources.tasks.createTask(input);
      const markdown = result.success ? 
        context.dataSources.tasks.generateTaskMarkdown(result.data, 'human') : null;
      
      return {
        task: result.success ? result.data : null,
        success: result.success,
        error: result.error,
        markdown
      };
    },

    createPhase: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      const result = await context.dataSources.phases.createPhase(input);
      const markdown = result.success ? 
        context.dataSources.phases.generatePhaseMarkdown(result.data, 'human') : null;
      
      return {
        phase: result.success ? result.data : null,
        success: result.success,
        error: result.error,
        markdown
      };
    },

    createIssue: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      const result = await context.dataSources.issues.createIssue(input);
      const markdown = result.success ? 
        context.dataSources.issues.generateIssueMarkdown(result.data, 'human') : null;
      
      return {
        issue: result.success ? result.data : null,
        success: result.success,
        error: result.error,
        markdown
      };
    },

    // Update operations
    updateTaskStatus: async (_: any, { id, status }: { id: string; status: string }, context: GraphQLContext) => {
      const task = await context.dataSources.tasks.getTask(id);
      if (!task) {
        return {
          task: null,
          success: false,
          error: `Task ${id} not found`,
          markdown: null
        };
      }

      // Update task status
      task.metadata.status = status as any;
      task.updated_at = new Date().toISOString();
      
      // If completed, set progress to 100%
      if (status === 'completed') {
        task.progress = 100;
        task.completion_date = new Date().toISOString().split('T')[0];
      }

      // Save updated task (this would typically update the file)
      const markdown = context.dataSources.tasks.generateTaskMarkdown(task, 'human');
      
      return {
        task,
        success: true,
        error: null,
        markdown
      };
    },

    updateTaskProgress: async (_: any, { id, progress }: { id: string; progress: number }, context: GraphQLContext) => {
      const task = await context.dataSources.tasks.getTask(id);
      if (!task) {
        return {
          task: null,
          success: false,
          error: `Task ${id} not found`,
          markdown: null
        };
      }

      task.progress = Math.max(0, Math.min(100, progress));
      task.updated_at = new Date().toISOString();
      
      if (progress >= 100) {
        task.metadata.status = 'completed';
        task.completion_date = new Date().toISOString().split('T')[0];
      }

      const markdown = context.dataSources.tasks.generateTaskMarkdown(task, 'human');
      
      return {
        task,
        success: true,
        error: null,
        markdown
      };
    },

    completeSubtask: async (_: any, { task_id, subtask_index }: { task_id: string; subtask_index: number }, context: GraphQLContext) => {
      const task = await context.dataSources.tasks.getTask(task_id);
      if (!task) {
        return {
          task: null,
          success: false,
          error: `Task ${task_id} not found`,
          markdown: null
        };
      }

      if (subtask_index < 0 || subtask_index >= task.subtasks.length) {
        return {
          task: null,
          success: false,
          error: `Subtask index ${subtask_index} is out of range`,
          markdown: null
        };
      }

      // Complete the subtask
      task.subtasks[subtask_index].completed = true;
      task.subtasks[subtask_index].completion_date = new Date().toISOString().split('T')[0];
      
      // Update overall progress
      const completedSubtasks = task.subtasks.filter(st => st.completed).length;
      task.progress = (completedSubtasks / task.subtasks.length) * 100;
      task.updated_at = new Date().toISOString();
      
      // If all subtasks completed, mark task as completed
      if (completedSubtasks === task.subtasks.length) {
        task.metadata.status = 'completed';
        task.completion_date = new Date().toISOString().split('T')[0];
      }

      const markdown = context.dataSources.tasks.generateTaskMarkdown(task, 'human');
      
      return {
        task,
        success: true,
        error: null,
        markdown
      };
    },

    // Issue operations
    addResolutionAttempt: async (_: any, { issue_id, attempt }: { issue_id: string; attempt: any }, context: GraphQLContext) => {
      const issue = await context.dataSources.issues.getIssue(issue_id);
      if (!issue) {
        return {
          issue: null,
          success: false,
          error: `Issue ${issue_id} not found`,
          markdown: null
        };
      }

      const newAttempt = {
        id: `attempt-${Date.now()}`,
        approach: attempt.approach,
        outcome: attempt.outcome,
        details: attempt.details,
        lessons_learned: attempt.lessons_learned || [],
        timestamp: new Date().toISOString(),
        tokens_used: attempt.tokens_used
      };

      issue.resolution_attempts.push(newAttempt);
      
      // If successful resolution, mark as resolved
      if (attempt.outcome === 'success') {
        issue.status = 'resolved';
        issue.resolved_date = new Date().toISOString().split('T')[0];
      }

      const markdown = context.dataSources.issues.generateIssueMarkdown(issue, 'human');
      
      return {
        issue,
        success: true,
        error: null,
        markdown
      };
    },

    resolveIssue: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const issue = await context.dataSources.issues.getIssue(id);
      if (!issue) {
        return {
          issue: null,
          success: false,
          error: `Issue ${id} not found`,
          markdown: null
        };
      }

      issue.status = 'resolved';
      issue.resolved_date = new Date().toISOString().split('T')[0];

      const markdown = context.dataSources.issues.generateIssueMarkdown(issue, 'human');
      
      return {
        issue,
        success: true,
        error: null,
        markdown
      };
    },

    // File operations (placeholder implementations)
    saveTaskToFile: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const task = await context.dataSources.tasks.getTask(id);
      if (!task) {
        return {
          task: null,
          success: false,
          error: `Task ${id} not found`,
          markdown: null
        };
      }

      // In a real implementation, this would save to the file system
      const markdown = context.dataSources.tasks.generateTaskMarkdown(task, 'human');
      
      return {
        task,
        success: true,
        error: null,
        markdown
      };
    },

    savePhaseToFile: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const phase = await context.dataSources.phases.getPhase(id);
      if (!phase) {
        return {
          phase: null,
          success: false,
          error: `Phase ${id} not found`,
          markdown: null
        };
      }

      const markdown = context.dataSources.phases.generatePhaseMarkdown(phase, 'human');
      
      return {
        phase,
        success: true,
        error: null,
        markdown
      };
    },

    saveIssueToFile: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const issue = await context.dataSources.issues.getIssue(id);
      if (!issue) {
        return {
          issue: null,
          success: false,
          error: `Issue ${id} not found`,
          markdown: null
        };
      }

      const markdown = context.dataSources.issues.generateIssueMarkdown(issue, 'human');
      
      return {
        issue,
        success: true,
        error: null,
        markdown
      };
    }
  }
};