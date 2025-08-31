/**
 * Comprehensive Validation Rules
 * Configurable rules for documentation quality and consistency
 */

import { ValidationRule, ValidationContext, ValidationResult } from './core';

export const VALIDATION_RULES: ValidationRule[] = [
  // === STRUCTURE RULES ===
  {
    id: 'required-fields',
    name: 'Required Fields',
    description: 'Ensure all required fields are present',
    category: 'structure',
    severity: 'error',
    enabled: true,
    validator: (data: any, context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      const requiredFields = getRequiredFields(context.type);

      for (const field of requiredFields) {
        const value = getNestedValue(data, field.path);
        if (value === undefined || value === null || value === '') {
          results.push({
            ruleId: 'required-fields',
            severity: 'error',
            message: `Required field '${field.name}' is missing`,
            field: field.path,
            suggestion: field.suggestion,
            autoFixable: field.autoFixable || false,
            location: { path: field.path }
          });
        }
      }

      return results;
    }
  },

  {
    id: 'id-format',
    name: 'ID Format Validation',
    description: 'Validate ID formatting according to conventions',
    category: 'structure',
    severity: 'error',
    enabled: true,
    validator: (data: any, context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      
      if (!data.id) return results;

      const patterns = {
        task: /^task-\d+\.\d+-.+$/,
        phase: /^phase-\d+$/,
        issue: /^issue-.+$/,
        project: /^project-.+$/
      };

      const pattern = patterns[context.type];
      if (pattern && !pattern.test(data.id)) {
        results.push({
          ruleId: 'id-format',
          severity: 'error',
          message: `Invalid ID format for ${context.type}: '${data.id}'`,
          field: 'id',
          suggestion: getIdFormatSuggestion(context.type),
          autoFixable: false,
          location: { path: 'id' }
        });
      }

      return results;
    }
  },

  // === CONTENT QUALITY RULES ===
  {
    id: 'content-length',
    name: 'Content Length Validation',
    description: 'Ensure content meets minimum and maximum length requirements',
    category: 'content',
    severity: 'warning',
    enabled: true,
    validator: (data: any, context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      const contentFields = getContentFields(context.type);

      for (const field of contentFields) {
        const value = getNestedValue(data, field.path);
        if (typeof value === 'string') {
          if (value.length < field.minLength) {
            results.push({
              ruleId: 'content-length',
              severity: 'warning',
              message: `${field.name} is too short (${value.length} chars, minimum: ${field.minLength})`,
              field: field.path,
              suggestion: `Expand ${field.name} with more detailed information`,
              autoFixable: false,
              location: { path: field.path }
            });
          }

          if (field.maxLength && value.length > field.maxLength) {
            results.push({
              ruleId: 'content-length',
              severity: 'info',
              message: `${field.name} is very long (${value.length} chars, consider splitting)`,
              field: field.path,
              suggestion: `Consider breaking down ${field.name} into smaller sections`,
              autoFixable: false,
              location: { path: field.path }
            });
          }
        }
      }

      return results;
    }
  },

  {
    id: 'content-quality',
    name: 'Content Quality Check',
    description: 'Check for content quality indicators',
    category: 'content',
    severity: 'suggestion',
    enabled: true,
    validator: (data: any, _context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      
      // Check for placeholder text
      const placeholders = ['TODO', 'TBD', 'PLACEHOLDER', 'lorem ipsum', 'test test'];
      const contentFields = ['name', 'title', 'description'];

      for (const field of contentFields) {
        const value = getNestedValue(data, field);
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          
          for (const placeholder of placeholders) {
            if (lowerValue.includes(placeholder.toLowerCase())) {
              results.push({
                ruleId: 'content-quality',
                severity: 'suggestion',
                message: `${field} contains placeholder text: "${placeholder}"`,
                field,
                suggestion: `Replace placeholder with meaningful content`,
                autoFixable: false,
                location: { path: field }
              });
            }
          }

          // Check for excessive repetition
          const words = value.toLowerCase().split(/\s+/);
          const wordCount = new Map<string, number>();
          words.forEach(word => {
            if (word.length > 3) {
              wordCount.set(word, (wordCount.get(word) || 0) + 1);
            }
          });

          for (const [word, count] of wordCount.entries()) {
            if (count > 3) {
              results.push({
                ruleId: 'content-quality',
                severity: 'info',
                message: `Word "${word}" repeated ${count} times in ${field}`,
                field,
                suggestion: 'Consider using synonyms or rephrasing for better readability',
                autoFixable: false,
                location: { path: field }
              });
            }
          }
        }
      }

      return results;
    }
  },

  // === METADATA RULES ===
  {
    id: 'status-consistency',
    name: 'Status Consistency',
    description: 'Ensure status values are valid and consistent',
    category: 'metadata',
    severity: 'error',
    enabled: true,
    validator: (data: any, context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      
      const validStatuses = getValidStatuses(context.type);
      const status = getNestedValue(data, 'status') || getNestedValue(data, 'metadata.status');
      
      if (status && !validStatuses.includes(status)) {
        results.push({
          ruleId: 'status-consistency',
          severity: 'error',
          message: `Invalid status: '${status}' for ${context.type}`,
          field: 'status',
          suggestion: `Use one of: ${validStatuses.join(', ')}`,
          autoFixable: true,
          location: { path: 'status' }
        });
      }

      return results;
    }
  },

  {
    id: 'progress-validation',
    name: 'Progress Validation',
    description: 'Validate progress values and consistency with status',
    category: 'metadata',
    severity: 'warning',
    enabled: true,
    conditions: [
      { field: 'progress', operator: 'exists', value: true }
    ],
    validator: (data: any, context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      const progress = data.progress;
      const status = data.status || data.metadata?.status;

      // Validate progress range
      if (typeof progress === 'number') {
        if (progress < 0 || progress > 100) {
          results.push({
            ruleId: 'progress-validation',
            severity: 'error',
            message: `Progress must be between 0 and 100, got: ${progress}`,
            field: 'progress',
            suggestion: 'Set progress to a value between 0 and 100',
            autoFixable: true,
            location: { path: 'progress' }
          });
        }

        // Check consistency with status
        if (status === 'completed' && progress < 100) {
          results.push({
            ruleId: 'progress-validation',
            severity: 'warning',
            message: `Task marked as completed but progress is ${progress}%`,
            field: 'progress',
            suggestion: 'Set progress to 100% for completed tasks',
            autoFixable: true,
            location: { path: 'progress' }
          });
        }

        if (status === 'pending' && progress > 0) {
          results.push({
            ruleId: 'progress-validation',
            severity: 'info',
            message: `Task marked as pending but has ${progress}% progress`,
            field: 'status',
            suggestion: 'Consider changing status to "in_progress"',
            autoFixable: true,
            location: { path: 'status' }
          });
        }

        // Check subtask consistency for tasks
        if (context.type === 'task' && data.subtasks) {
          const completedSubtasks = data.subtasks.filter((st: any) => st.completed).length;
          const expectedProgress = Math.round((completedSubtasks / data.subtasks.length) * 100);
          
          if (Math.abs(progress - expectedProgress) > 10) {
            results.push({
              ruleId: 'progress-validation',
              severity: 'warning',
              message: `Progress (${progress}%) doesn't match subtask completion (${expectedProgress}%)`,
              field: 'progress',
              suggestion: `Consider updating progress to ${expectedProgress}%`,
              autoFixable: true,
              location: { path: 'progress' }
            });
          }
        }
      }

      return results;
    }
  },

  // === RELATIONSHIP RULES ===
  {
    id: 'dependency-validation',
    name: 'Dependency Validation',
    description: 'Validate task and phase dependencies',
    category: 'relationships',
    severity: 'warning',
    enabled: true,
    validator: (data: any, context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      
      if (!context.allData) return results;

      const dependencies = getNestedValue(data, 'metadata.dependencies') || 
                          getNestedValue(data, 'dependencies') || [];

      if (Array.isArray(dependencies)) {
        for (const depId of dependencies) {
          // Check if dependency exists
          const allEntities = [
            ...context.allData.tasks,
            ...context.allData.phases,
            ...context.allData.issues
          ];
          
          const depExists = allEntities.some(entity => entity.id === depId);
          if (!depExists) {
            results.push({
              ruleId: 'dependency-validation',
              severity: 'warning',
              message: `Dependency '${depId}' not found`,
              field: 'metadata.dependencies',
              suggestion: 'Remove invalid dependency or create the referenced entity',
              autoFixable: false,
              location: { path: 'metadata.dependencies' }
            });
          }

          // Check for circular dependencies
          if (depId === data.id) {
            results.push({
              ruleId: 'dependency-validation',
              severity: 'error',
              message: 'Circular dependency detected: entity depends on itself',
              field: 'metadata.dependencies',
              suggestion: 'Remove self-reference from dependencies',
              autoFixable: true,
              location: { path: 'metadata.dependencies' }
            });
          }
        }
      }

      return results;
    }
  },

  {
    id: 'phase-task-relationship',
    name: 'Phase-Task Relationship',
    description: 'Validate task-phase relationships',
    category: 'relationships',
    severity: 'error',
    enabled: true,
    conditions: [
      { field: 'phase_id', operator: 'exists', value: true }
    ],
    validator: (data: any, context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      
      if (context.type !== 'task' || !context.allData) return results;

      const phaseId = data.phase_id;
      const phaseExists = context.allData.phases.some(phase => phase.id === phaseId);
      
      if (!phaseExists) {
        results.push({
          ruleId: 'phase-task-relationship',
          severity: 'error',
          message: `Referenced phase '${phaseId}' does not exist`,
          field: 'phase_id',
          suggestion: 'Update phase_id to reference an existing phase',
          autoFixable: false,
          location: { path: 'phase_id' }
        });
      }

      return results;
    }
  },

  // === CONSISTENCY RULES ===
  {
    id: 'naming-conventions',
    name: 'Naming Conventions',
    description: 'Enforce consistent naming conventions',
    category: 'consistency',
    severity: 'suggestion',
    enabled: true,
    validator: (data: any, _context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      
      const name = data.name || data.title;
      if (typeof name === 'string') {
        // Check for consistent capitalization
        const words = name.split(/\s+/);
        const hasInconsistentCaps = words.some((word, index) => {
          if (index === 0) return false; // First word can be capitalized
          return /^[A-Z]/.test(word) && word.length > 3 && 
                 !['API', 'UI', 'UX', 'QA', 'UAT'].includes(word);
        });

        if (hasInconsistentCaps) {
          results.push({
            ruleId: 'naming-conventions',
            severity: 'suggestion',
            message: 'Consider using consistent title case or sentence case',
            field: 'name',
            suggestion: 'Use sentence case for better readability',
            autoFixable: true,
            location: { path: 'name' }
          });
        }

        // Check for technical jargon without context
        const jargonWords = ['refactor', 'optimize', 'enhance', 'improve'];
        const hasJargon = jargonWords.some(jargon => 
          name.toLowerCase().includes(jargon) && 
          !name.toLowerCase().includes('performance') &&
          !name.toLowerCase().includes('user')
        );

        if (hasJargon) {
          results.push({
            ruleId: 'naming-conventions',
            severity: 'info',
            message: 'Consider adding context to technical terms',
            field: 'name',
            suggestion: 'Specify what is being refactored/optimized/enhanced',
            autoFixable: false,
            location: { path: 'name' }
          });
        }
      }

      return results;
    }
  },

  {
    id: 'date-consistency',
    name: 'Date Consistency',
    description: 'Validate date fields and logical consistency',
    category: 'consistency',
    severity: 'warning',
    enabled: true,
    validator: (data: any, _context: ValidationContext): ValidationResult[] => {
      const results: ValidationResult[] = [];
      
      const dateFields = getDateFields(data);
      const now = new Date();

      for (const field of dateFields) {
        const dateValue = field.value;
        const parsedDate = new Date(dateValue);

        // Check for valid date
        if (isNaN(parsedDate.getTime())) {
          results.push({
            ruleId: 'date-consistency',
            severity: 'error',
            message: `Invalid date format in ${field.name}: '${dateValue}'`,
            field: field.path,
            suggestion: 'Use ISO date format (YYYY-MM-DD or ISO 8601)',
            autoFixable: false,
            location: { path: field.path }
          });
          continue;
        }

        // Check for future completion dates
        if (field.name.includes('completion') && parsedDate > now) {
          results.push({
            ruleId: 'date-consistency',
            severity: 'warning',
            message: `Completion date is in the future: ${field.name}`,
            field: field.path,
            suggestion: 'Completion dates should be in the past',
            autoFixable: false,
            location: { path: field.path }
          });
        }
      }

      return results;
    }
  }
];

// === HELPER FUNCTIONS ===

function getRequiredFields(entityType: string) {
  const fieldMap = {
    task: [
      { path: 'id', name: 'ID', suggestion: 'Use format: task-X.Y-description', autoFixable: false },
      { path: 'name', name: 'Name', suggestion: 'Provide a descriptive task name', autoFixable: false },
      { path: 'description', name: 'Description', suggestion: 'Add detailed task description', autoFixable: false },
      { path: 'phase_id', name: 'Phase ID', suggestion: 'Specify which phase this task belongs to', autoFixable: false },
      { path: 'metadata.status', name: 'Status', suggestion: 'Set initial status (typically "pending")', autoFixable: true },
      { path: 'subtasks', name: 'Subtasks', suggestion: 'Break down task into actionable subtasks', autoFixable: false }
    ],
    phase: [
      { path: 'id', name: 'ID', suggestion: 'Use format: phase-X', autoFixable: false },
      { path: 'name', name: 'Name', suggestion: 'Provide a descriptive phase name', autoFixable: false },
      { path: 'description', name: 'Description', suggestion: 'Describe phase objectives and scope', autoFixable: false }
    ],
    issue: [
      { path: 'title', name: 'Title', suggestion: 'Provide a clear issue title', autoFixable: false },
      { path: 'description', name: 'Description', suggestion: 'Describe the issue in detail', autoFixable: false },
      { path: 'type', name: 'Type', suggestion: 'Specify issue type (bug, feature, qa, etc.)', autoFixable: false },
      { path: 'severity', name: 'Severity', suggestion: 'Set issue severity level', autoFixable: false }
    ]
  };

  return fieldMap[entityType as keyof typeof fieldMap] || [];
}

function getContentFields(entityType: string) {
  const fieldMap = {
    task: [
      { path: 'name', name: 'Task Name', minLength: 5, maxLength: 100 },
      { path: 'description', name: 'Description', minLength: 20, maxLength: 1000 }
    ],
    phase: [
      { path: 'name', name: 'Phase Name', minLength: 5, maxLength: 100 },
      { path: 'description', name: 'Description', minLength: 20, maxLength: 2000 }
    ],
    issue: [
      { path: 'title', name: 'Issue Title', minLength: 10, maxLength: 200 },
      { path: 'description', name: 'Description', minLength: 20, maxLength: 2000 }
    ]
  };

  return fieldMap[entityType as keyof typeof fieldMap] || [];
}

function getValidStatuses(entityType: string): string[] {
  const statusMap = {
    task: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'],
    phase: ['pending', 'in_progress', 'completed'],
    issue: ['open', 'in_progress', 'resolved', 'closed']
  };

  return statusMap[entityType as keyof typeof statusMap] || [];
}

function getIdFormatSuggestion(entityType: string): string {
  const suggestions = {
    task: 'Use format: task-X.Y-description (e.g., task-1.1-setup-project)',
    phase: 'Use format: phase-X (e.g., phase-1)',
    issue: 'Use format: issue-description (e.g., issue-login-bug)'
  };

  return suggestions[entityType as keyof typeof suggestions] || 'Follow ID naming conventions';
}

function getDateFields(data: any): Array<{name: string, path: string, value: any}> {
  const dateFields: Array<{name: string, path: string, value: any}> = [];
  
  const checkFields = [
    'created_at', 'updated_at', 'completion_date', 'resolved_date',
    'created_date', 'start_date', 'end_date'
  ];

  function traverse(obj: any, basePath: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      
      if (checkFields.includes(key) && value) {
        dateFields.push({
          name: key,
          path: currentPath,
          value
        });
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, currentPath);
      }
    }
  }

  traverse(data);
  return dateFields;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}