/**
 * Markdown generation utilities
 * Provides dynamic markdown generation for different consumption contexts
 */

import { Task, Phase, Issue, DocumentationOutput } from './types';

export class MarkdownGenerator {
  /**
   * Generate markdown for different consumption contexts
   */
  static generateForContext(data: any, type: 'task' | 'phase' | 'issue', consumer: 'human' | 'ai' | 'api' | 'dashboard'): DocumentationOutput {
    const content = this.generateContent(data, type, consumer);
    
    return {
      type: 'markdown',
      content,
      metadata: {
        generated_at: new Date().toISOString(),
        source: `${type}:${data.id}`,
        consumer
      }
    };
  }

  /**
   * Generate content based on consumer type
   */
  private static generateContent(data: any, type: string, consumer: string): string {
    switch (consumer) {
      case 'ai':
        return this.generateForAI(data, type);
      case 'api':
        return this.generateForAPI(data, type);
      case 'dashboard':
        return this.generateForDashboard(data, type);
      case 'human':
      default:
        return this.generateForHuman(data, type);
    }
  }

  /**
   * Generate structured data for AI consumption
   */
  private static generateForAI(data: any, type: string): string {
    const structured = {
      type,
      id: data.id,
      name: data.name || data.title,
      status: data.status || data.metadata?.status,
      description: data.description,
      metadata: this.extractRelevantMetadata(data, type),
      context: this.generateContext(data, type)
    };

    return JSON.stringify(structured, null, 2);
  }

  /**
   * Generate JSON for API consumption
   */
  private static generateForAPI(data: any, _type: string): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate compact summary for dashboard
   */
  private static generateForDashboard(data: any, type: string): string {
    switch (type) {
      case 'task':
        return `**${data.name}** (${data.progress}%)\n${data.metadata.status} | ${data.subtasks?.length || 0} subtasks | ${data.phase_id}`;
      case 'phase':
        return `**${data.name}** (${data.progress}%)\n${data.status} | ${data.tasks?.length || 0} tasks`;
      case 'issue':
        return `**${data.title}** | ${data.type} | ${data.severity}\n${data.status} | ${data.resolution_attempts?.length || 0} attempts`;
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Generate full markdown for human consumption
   */
  private static generateForHuman(data: any, type: string): string {
    switch (type) {
      case 'task':
        return this.generateTaskMarkdown(data);
      case 'phase':
        return this.generatePhaseMarkdown(data);
      case 'issue':
        return this.generateIssueMarkdown(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Generate comprehensive task markdown
   */
  private static generateTaskMarkdown(task: Task): string {
    const now = new Date().toISOString().split('T')[0];
    const statusEmoji = this.getStatusEmoji(task.metadata.status);
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    
    return `# ${task.name}

**Status:** ${statusEmoji} ${this.capitalizeFirst(task.metadata.status)}  
**Progress:** ${task.progress}% (${completedSubtasks}/${task.subtasks.length} sub-tasks)  
**Phase:** ${task.phase_id}  
**Created:** ${task.created_at?.split('T')[0] || now}  
${task.completion_date ? `**Completed:** ${task.completion_date}` : ''}

## Overview
${task.description}

## Sub-tasks

${task.subtasks.map((subtask, index) => 
  `### Sub-task ${task.id}.${index + 1}: ${subtask.name} ${subtask.completed ? '✅' : '⏳'}
- [${subtask.completed ? 'x' : ' '}] ${subtask.description || subtask.name}${
    subtask.completion_date ? `\n  - **Completed:** ${subtask.completion_date}` : ''
  }`
).join('\n\n')}

## Key Deliverables
${task.subtasks.map((subtask) => `- [${subtask.completed ? 'x' : ' '}] ${subtask.name}`).join('\n')}

## Metadata
- **Priority:** ${this.capitalizeFirst(task.metadata.priority)}
- **Estimated Hours:** ${task.metadata.estimated_hours || 'TBD'}
- **Actual Hours:** ${task.metadata.actual_hours || 'TBD'}
${task.metadata.assignee ? `- **Assignee:** ${task.metadata.assignee}` : ''}
${task.metadata.labels.length > 0 ? `- **Labels:** ${task.metadata.labels.join(', ')}` : ''}

## Dependencies
${task.metadata.dependencies.length > 0 ? 
  task.metadata.dependencies.map((dep: string) => `- ${dep}`).join('\n') :
  '- None'
}

---
**Last Updated:** ${task.updated_at?.split('T')[0] || now}
`;
  }

  /**
   * Generate comprehensive phase markdown
   */
  private static generatePhaseMarkdown(phase: Phase): string {
    const statusEmoji = this.getPhaseStatusEmoji(phase.status);
    const completedTasks = phase.tasks.filter(t => t.metadata.status === 'completed').length;
    const inProgressTasks = phase.tasks.filter(t => t.metadata.status === 'in_progress').length;
    const pendingTasks = phase.tasks.filter(t => t.metadata.status === 'pending').length;
    const blockedTasks = phase.tasks.filter(t => t.metadata.status === 'blocked').length;

    return `# ${phase.name}

> **Phase:** ${phase.id.toUpperCase()}  
> **Status:** ${statusEmoji} ${this.capitalizeFirst(phase.status)}  
> **Progress:** ${phase.progress.toFixed(1)}% (${completedTasks}/${phase.tasks.length} tasks completed)

## 📋 Overview
${phase.description}

## 📊 Progress Tracking
- **Total Tasks:** ${phase.tasks.length}
- **Completed:** ${completedTasks} ✅
- **In Progress:** ${inProgressTasks} 🔵
- **Pending:** ${pendingTasks} 🟡
- **Blocked:** ${blockedTasks} 🔴

## 📋 Tasks

${phase.tasks.map((task) => {
  const taskStatusEmoji = this.getStatusEmoji(task.metadata.status);
  return `### ${task.name}
- **ID:** ${task.id}
- **Status:** ${taskStatusEmoji} ${this.capitalizeFirst(task.metadata.status)}
- **Progress:** ${task.progress}%
- **Priority:** ${this.capitalizeFirst(task.metadata.priority)}
${task.metadata.estimated_hours ? `- **Estimated:** ${task.metadata.estimated_hours}h` : ''}`;
}).join('\n\n')}

## ⏰ Timeline
${phase.metadata.start_date ? `- **Start Date:** ${phase.metadata.start_date}` : '- **Start Date:** TBD'}
${phase.metadata.end_date ? `- **End Date:** ${phase.metadata.end_date}` : '- **End Date:** TBD'}
${phase.metadata.completion_date ? `- **Completion Date:** ${phase.metadata.completion_date}` : ''}
${phase.metadata.total_estimated_hours ? `- **Total Estimated Hours:** ${phase.metadata.total_estimated_hours}h` : ''}
${phase.metadata.total_actual_hours ? `- **Total Actual Hours:** ${phase.metadata.total_actual_hours}h` : ''}

## 🔗 Dependencies
${phase.metadata.dependencies?.length > 0 ? 
  phase.metadata.dependencies.map((dep: string) => `- ${dep}`).join('\n') :
  '- None'
}

---
**Generated:** ${new Date().toISOString().split('T')[0]}
`;
  }

  /**
   * Generate comprehensive issue markdown
   */
  private static generateIssueMarkdown(issue: Issue): string {
    const severityEmoji = this.getSeverityEmoji(issue.severity);
    const statusEmoji = this.getIssueStatusEmoji(issue.status);
    const typeEmoji = this.getIssueTypeEmoji(issue.type);
    
    return `# Issue: ${issue.title}

> **Type:** ${typeEmoji} ${issue.type.toUpperCase()}  
> **Severity:** ${severityEmoji} ${issue.severity.toUpperCase()}  
> **Status:** ${statusEmoji} ${issue.status.toUpperCase()}  
> **Created:** ${issue.created_date.split('T')[0]}  
${issue.resolved_date ? `> **Resolved:** ${issue.resolved_date}` : ''}

## 📋 Description
${issue.description}

## 🔗 Related Tasks
${issue.related_tasks?.length > 0 ? 
  issue.related_tasks.map((task: string) => `- ${task}`).join('\n') :
  '- None'
}

## 🔄 Resolution Attempts

${issue.resolution_attempts?.length > 0 ?
  issue.resolution_attempts.map((attempt, index) => {
    const outcomeEmoji = this.getOutcomeEmoji(attempt.outcome);
    return `### Attempt ${index + 1}: ${attempt.approach}
**Outcome:** ${outcomeEmoji} ${attempt.outcome.toUpperCase()}  
**Timestamp:** ${attempt.timestamp.split('T')[0]}  
${attempt.tokens_used ? `**Tokens Used:** ${attempt.tokens_used}` : ''}

**Details:**  
${attempt.details}

${attempt.lessons_learned?.length > 0 ? 
  '**Lessons Learned:**\n' + attempt.lessons_learned.map((lesson: string) => `- ${lesson}`).join('\n') :
  ''
}`;
  }).join('\n\n') :
  'No resolution attempts yet.'
}

## 📊 Summary
- **Total Attempts:** ${issue.resolution_attempts?.length || 0}
- **Successful:** ${issue.resolution_attempts?.filter((a: any) => a.outcome === 'success').length || 0}
- **Failed:** ${issue.resolution_attempts?.filter((a: any) => a.outcome === 'failure').length || 0}
- **Partial:** ${issue.resolution_attempts?.filter((a: any) => a.outcome === 'partial').length || 0}
${issue.resolution_attempts?.length > 0 ? 
  `- **Total Tokens:** ${issue.resolution_attempts.reduce((sum: number, a: any) => sum + (a.tokens_used || 0), 0)}` : 
  ''
}

---
**Last Updated:** ${new Date().toISOString().split('T')[0]}
`;
  }

  /**
   * Extract relevant metadata for AI context
   */
  private static extractRelevantMetadata(data: any, type: string): any {
    switch (type) {
      case 'task':
        return {
          phase_id: data.phase_id,
          priority: data.metadata.priority,
          status: data.metadata.status,
          progress: data.progress,
          subtasks_total: data.subtasks?.length || 0,
          subtasks_completed: data.subtasks?.filter((st: any) => st.completed).length || 0,
          dependencies: data.metadata.dependencies,
          labels: data.metadata.labels
        };
      case 'phase':
        return {
          status: data.status,
          progress: data.progress,
          total_tasks: data.tasks?.length || 0,
          completed_tasks: data.tasks?.filter((t: any) => t.metadata.status === 'completed').length || 0,
          dependencies: data.metadata.dependencies
        };
      case 'issue':
        return {
          type: data.type,
          severity: data.severity,
          status: data.status,
          total_attempts: data.resolution_attempts?.length || 0,
          successful_attempts: data.resolution_attempts?.filter((a: any) => a.outcome === 'success').length || 0,
          related_tasks: data.related_tasks
        };
      default:
        return {};
    }
  }

  /**
   * Generate context information for AI
   */
  private static generateContext(data: any, type: string): string {
    switch (type) {
      case 'task':
        return `Task in ${data.phase_id} with ${data.subtasks?.length || 0} subtasks. Current status: ${data.metadata.status}. Progress: ${data.progress}%.`;
      case 'phase':
        return `Phase with ${data.tasks?.length || 0} tasks. Current status: ${data.status}. Overall progress: ${data.progress.toFixed(1)}%.`;
      case 'issue':
        return `${data.type} issue with ${data.severity} severity. Current status: ${data.status}. ${data.resolution_attempts?.length || 0} resolution attempts.`;
      default:
        return '';
    }
  }

  // Emoji utilities
  private static getStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
      'pending': '🟡',
      'in_progress': '🔵',
      'completed': '✅',
      'blocked': '🔴',
      'cancelled': '⚫'
    };
    return emojiMap[status] || '🟡';
  }

  private static getPhaseStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
      'pending': '🟡',
      'in_progress': '🔵',
      'completed': '✅'
    };
    return emojiMap[status] || '🟡';
  }

  private static getSeverityEmoji(severity: string): string {
    const emojiMap: Record<string, string> = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🟠',
      'critical': '🔴'
    };
    return emojiMap[severity] || '🟡';
  }

  private static getIssueStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
      'open': '🔴',
      'in_progress': '🟡',
      'resolved': '✅',
      'closed': '⚫'
    };
    return emojiMap[status] || '🔴';
  }

  private static getIssueTypeEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      'bug': '🐛',
      'feature': '✨',
      'improvement': '⚡',
      'qa': '🔍',
      'uat': '👤'
    };
    return emojiMap[type] || '🔍';
  }

  private static getOutcomeEmoji(outcome: string): string {
    const emojiMap: Record<string, string> = {
      'success': '✅',
      'failure': '❌',
      'partial': '🟡'
    };
    return emojiMap[outcome] || '🟡';
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
  }
}

export class MarkdownParser {
  /**
   * Parse existing markdown files back to structured data
   */
  static parseTaskMarkdown(content: string): Partial<Task> {
    const nameMatch = content.match(/^# (.+)$/m);
    const statusMatch = content.match(/\*\*Status:\*\* .+ (.+)$/m);
    const progressMatch = content.match(/\*\*Progress:\*\* (\d+)% \((\d+)\/(\d+)/);
    const phaseMatch = content.match(/\*\*Phase:\*\* (.+)$/m);
    const descriptionMatch = content.match(/## Overview\s*\n(.+?)(?=\n## |\n\n|$)/s);
    
    // Parse subtasks
    const subtaskMatches = content.match(/- \[(x| )\] (.+)/g);
    const subtasks = subtaskMatches ? subtaskMatches.map((match, index) => {
      const completed = match.includes('[x]');
      const name = match.replace(/- \[(x| )\] /, '');
      return {
        id: `subtask-${index}`,
        name,
        description: '',
        completed
      };
    }) : [];

    return {
      name: nameMatch ? nameMatch[1] : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      phase_id: phaseMatch ? phaseMatch[1] : '',
      progress: progressMatch ? parseInt(progressMatch[1]) : 0,
      subtasks,
      metadata: {
        status: this.parseStatus(statusMatch ? statusMatch[1] : 'pending'),
        priority: 'medium',
        labels: [],
        dependencies: []
      }
    };
  }

  /**
   * Parse phase markdown
   */
  static parsePhaseMarkdown(content: string): Partial<Phase> {
    const nameMatch = content.match(/^# (.+)$/m);
    const statusMatch = content.match(/\*\*Status:\*\* .+ (.+)$/m);
    const progressMatch = content.match(/\*\*Progress:\*\* ([\d.]+)%/);
    const descriptionMatch = content.match(/## (?:📋 )?Overview\s*\n(.+?)(?=\n## |\n\n|$)/s);
    
    return {
      name: nameMatch ? nameMatch[1] : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      status: this.parsePhaseStatus(statusMatch ? statusMatch[1] : 'pending'),
      progress: progressMatch ? parseFloat(progressMatch[1]) : 0,
      tasks: [],
      metadata: {
        dependencies: []
      }
    };
  }

  /**
   * Parse issue markdown
   */
  static parseIssueMarkdown(content: string): Partial<Issue> {
    const titleMatch = content.match(/^# Issue: (.+)$/m);
    const typeMatch = content.match(/\*\*Type:\*\* .+ (.+)$/m);
    const severityMatch = content.match(/\*\*Severity:\*\* .+ (.+)$/m);
    const statusMatch = content.match(/\*\*Status:\*\* .+ (.+)$/m);
    const descriptionMatch = content.match(/## 📋 Description\s*\n(.+?)(?=\n## |\n\n|$)/s);
    
    return {
      title: titleMatch ? titleMatch[1] : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      type: this.parseIssueType(typeMatch ? typeMatch[1] : 'qa'),
      severity: this.parseSeverity(severityMatch ? severityMatch[1] : 'medium'),
      status: this.parseIssueStatus(statusMatch ? statusMatch[1] : 'open'),
      related_tasks: [],
      resolution_attempts: []
    };
  }

  // Status parsing utilities
  private static parseStatus(status: string): Task['metadata']['status'] {
    const cleanStatus = status.toLowerCase().replace(/[^\w]/g, '');
    const statusMap: Record<string, Task['metadata']['status']> = {
      'complete': 'completed',
      'completed': 'completed',
      'inprogress': 'in_progress',
      'blocked': 'blocked',
      'cancelled': 'cancelled',
      'pending': 'pending'
    };
    return statusMap[cleanStatus] || 'pending';
  }

  private static parsePhaseStatus(status: string): Phase['status'] {
    const cleanStatus = status.toLowerCase().replace(/[^\w]/g, '');
    return cleanStatus === 'completed' ? 'completed' : 
           cleanStatus === 'inprogress' ? 'in_progress' : 'pending';
  }

  private static parseIssueType(type: string): Issue['type'] {
    const cleanType = type.toLowerCase().replace(/[^\w]/g, '');
    const types: Issue['type'][] = ['bug', 'feature', 'improvement', 'qa', 'uat'];
    return types.includes(cleanType as any) ? cleanType as Issue['type'] : 'qa';
  }

  private static parseSeverity(severity: string): Issue['severity'] {
    const cleanSeverity = severity.toLowerCase().replace(/[^\w]/g, '');
    const severities: Issue['severity'][] = ['low', 'medium', 'high', 'critical'];
    return severities.includes(cleanSeverity as any) ? cleanSeverity as Issue['severity'] : 'medium';
  }

  private static parseIssueStatus(status: string): Issue['status'] {
    const cleanStatus = status.toLowerCase().replace(/[^\w]/g, '');
    const statuses: Issue['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
    return statuses.includes(cleanStatus as any) ? cleanStatus as Issue['status'] : 'open';
  }
}