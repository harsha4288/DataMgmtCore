/**
 * Form utilities and validation for the documentation system
 */

import { FormSchema, ValidationRule, QueryResult } from './types';

export class FormValidator {
  /**
   * Validate form data against schema
   */
  static validate(data: any, schema: FormSchema): QueryResult<boolean> {
    const errors: string[] = [];

    // Basic schema validation
    const schemaErrors = this.validateAgainstJsonSchema(data, schema.schema);
    errors.push(...schemaErrors);

    // Custom validation rules
    for (const rule of schema.validation_rules) {
      const ruleError = this.validateRule(data, rule);
      if (ruleError) {
        errors.push(ruleError);
      }
    }

    return {
      data: errors.length === 0,
      success: errors.length === 0,
      error: errors.length > 0 ? errors.join(', ') : undefined,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate against JSON Schema
   */
  private static validateAgainstJsonSchema(data: any, schema: any): string[] {
    const errors: string[] = [];

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!data[field] && data[field] !== 0 && data[field] !== false) {
          errors.push(`Field '${field}' is required`);
        }
      }
    }

    // Check properties
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties) as [string, any][]) {
        if (data[key] !== undefined) {
          const fieldErrors = this.validateProperty(data[key], prop, key);
          errors.push(...fieldErrors);
        }
      }
    }

    return errors;
  }

  /**
   * Validate individual property
   */
  private static validateProperty(value: any, schema: any, fieldName: string): string[] {
    const errors: string[] = [];

    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schema.type) {
        errors.push(`Field '${fieldName}' must be of type ${schema.type}`);
        return errors; // Don't continue if type is wrong
      }
    }

    // String validation
    if (schema.type === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`Field '${fieldName}' must be at least ${schema.minLength} characters`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`Field '${fieldName}' must be at most ${schema.maxLength} characters`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`Field '${fieldName}' format is invalid`);
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`Field '${fieldName}' must be one of: ${schema.enum.join(', ')}`);
      }
    }

    // Number validation
    if (schema.type === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`Field '${fieldName}' must be at least ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`Field '${fieldName}' must be at most ${schema.maximum}`);
      }
    }

    // Array validation
    if (schema.type === 'array') {
      if (schema.minItems && value.length < schema.minItems) {
        errors.push(`Field '${fieldName}' must have at least ${schema.minItems} items`);
      }
      if (schema.maxItems && value.length > schema.maxItems) {
        errors.push(`Field '${fieldName}' must have at most ${schema.maxItems} items`);
      }
      if (schema.uniqueItems && new Set(value).size !== value.length) {
        errors.push(`Field '${fieldName}' items must be unique`);
      }
      if (schema.items) {
        value.forEach((item: any, index: number) => {
          const itemErrors = this.validateProperty(item, schema.items, `${fieldName}[${index}]`);
          errors.push(...itemErrors);
        });
      }
    }

    // Object validation
    if (schema.type === 'object' && schema.properties) {
      const objErrors = this.validateAgainstJsonSchema(value, schema);
      errors.push(...objErrors);
    }

    return errors;
  }

  /**
   * Validate custom rule
   */
  private static validateRule(data: any, rule: ValidationRule): string | null {
    const value = this.getNestedValue(data, rule.field);

    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return rule.message;
        }
        break;
      case 'min_length':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message;
        }
        break;
      case 'max_length':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message;
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          return rule.message;
        }
        break;
    }

    return null;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export class FormDataProcessor {
  /**
   * Transform form data to documentation format
   */
  static transformToDocumentation(data: any, schemaId: string): string {
    switch (schemaId) {
      case 'task-creation':
        return this.transformTaskToMarkdown(data);
      case 'phase-creation':
        return this.transformPhaseToMarkdown(data);
      case 'issue-creation':
        return this.transformIssueToMarkdown(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Transform task data to markdown
   */
  private static transformTaskToMarkdown(data: any): string {
    const now = new Date().toISOString().split('T')[0];
    const statusEmoji = this.getStatusEmoji(data.metadata.status);
    
    return `# ${data.name}

**Status:** ${statusEmoji} ${this.capitalizeFirst(data.metadata.status)}  
**Progress:** 0% (0/${data.subtasks.length} sub-tasks)  
**Created:** ${now}

## Overview
${data.description}

## Sub-tasks

${data.subtasks.map((subtask: any, index: number) => 
  `### Sub-task ${data.id}.${index + 1}: ${subtask.name} (0/1)
- [ ] ${subtask.description || subtask.name}`
).join('\n\n')}

## Key Deliverables
${data.subtasks.map((subtask: any) => `- [ ] ${subtask.name}`).join('\n')}

## Dependencies
${data.metadata.dependencies.length > 0 ? 
  data.metadata.dependencies.map((dep: string) => `- ${dep}`).join('\n') :
  '- None'
}

## Metadata
- **Priority:** ${data.metadata.priority}
- **Estimated Hours:** ${data.metadata.estimated_hours || 'TBD'}
- **Labels:** ${data.metadata.labels.join(', ') || 'None'}
`;
  }

  /**
   * Transform phase data to markdown
   */
  private static transformPhaseToMarkdown(data: any): string {
    return `# ${data.name}

> **Phase:** ${data.id.toUpperCase()}  
> **Status:** 🟡 Pending  
> **Progress:** 0% (0/0 tasks completed)

## 📋 Overview
${data.description}

## 🎯 Objectives
- Implementation objectives to be defined
- Success criteria to be established

## 📊 Progress Tracking
- **Total Tasks:** 0
- **Completed:** 0
- **In Progress:** 0
- **Pending:** 0

## ⏰ Timeline
${data.metadata.start_date ? `- **Start Date:** ${data.metadata.start_date}` : '- **Start Date:** TBD'}
${data.metadata.end_date ? `- **End Date:** ${data.metadata.end_date}` : '- **End Date:** TBD'}
${data.metadata.total_estimated_hours ? `- **Estimated Hours:** ${data.metadata.total_estimated_hours}` : '- **Estimated Hours:** TBD'}

## 🔗 Dependencies
${data.metadata.dependencies?.length > 0 ? 
  data.metadata.dependencies.map((dep: string) => `- ${dep}`).join('\n') :
  '- None'
}
`;
  }

  /**
   * Transform issue data to markdown
   */
  private static transformIssueToMarkdown(data: any): string {
    const now = new Date().toISOString();
    const severityEmoji = this.getSeverityEmoji(data.severity);
    
    return `# Issue: ${data.title}

> **Type:** ${data.type.toUpperCase()}  
> **Severity:** ${severityEmoji} ${data.severity.toUpperCase()}  
> **Status:** 🔴 Open  
> **Created:** ${now}

## 📋 Description
${data.description}

## 🔗 Related Tasks
${data.related_tasks?.length > 0 ? 
  data.related_tasks.map((task: string) => `- ${task}`).join('\n') :
  '- None'
}

## 🔄 Resolution Attempts

${data.resolution_attempts?.length > 0 ?
  data.resolution_attempts.map((attempt: any, index: number) => 
    `### Attempt ${index + 1}: ${attempt.approach}
**Outcome:** ${this.getOutcomeEmoji(attempt.outcome)} ${attempt.outcome.toUpperCase()}
**Details:** ${attempt.details}
${attempt.lessons_learned?.length > 0 ? 
  '**Lessons Learned:**\n' + attempt.lessons_learned.map((lesson: string) => `- ${lesson}`).join('\n') :
  ''
}
${attempt.tokens_used ? `**Tokens Used:** ${attempt.tokens_used}` : ''}`
  ).join('\n\n') :
  'No resolution attempts yet.'
}
`;
  }

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

  private static getSeverityEmoji(severity: string): string {
    const emojiMap: Record<string, string> = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🟠',
      'critical': '🔴'
    };
    return emojiMap[severity] || '🟡';
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