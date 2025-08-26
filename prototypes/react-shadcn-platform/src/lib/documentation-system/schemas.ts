/**
 * JSON Schema generation from existing documentation structure
 */

import { FormSchema, ValidationRule } from './types';

export class SchemaGenerator {
  /**
   * Generate Task creation form schema
   */
  static getTaskSchema(): FormSchema {
    return {
      id: 'task-creation',
      name: 'task',
      title: 'Create New Task',
      description: 'Create a new task with structured information',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            title: 'Task ID',
            description: 'Unique identifier (e.g., task-1.1-project-setup)',
            pattern: '^task-\\d+\\.\\d+-.+$'
          },
          name: {
            type: 'string',
            title: 'Task Name',
            description: 'Brief descriptive name for the task',
            minLength: 5,
            maxLength: 100
          },
          description: {
            type: 'string',
            title: 'Description',
            description: 'Detailed description of what needs to be accomplished',
            minLength: 20,
            maxLength: 500
          },
          phase_id: {
            type: 'string',
            title: 'Phase',
            description: 'Which phase this task belongs to',
            enum: ['phase-0', 'phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5', 'phase-6']
          },
          metadata: {
            type: 'object',
            title: 'Task Metadata',
            properties: {
              status: {
                type: 'string',
                title: 'Status',
                enum: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'],
                default: 'pending'
              },
              priority: {
                type: 'string',
                title: 'Priority',
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'medium'
              },
              estimated_hours: {
                type: 'number',
                title: 'Estimated Hours',
                minimum: 0.5,
                maximum: 100
              },
              labels: {
                type: 'array',
                title: 'Labels',
                items: {
                  type: 'string'
                },
                uniqueItems: true
              },
              dependencies: {
                type: 'array',
                title: 'Dependencies',
                description: 'Task IDs that must be completed first',
                items: {
                  type: 'string',
                  pattern: '^task-\\d+\\.\\d+-.+$'
                }
              }
            },
            required: ['status', 'priority']
          },
          subtasks: {
            type: 'array',
            title: 'Sub-tasks',
            description: 'Breakdown of work items',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  title: 'Sub-task Name',
                  minLength: 5,
                  maxLength: 200
                },
                description: {
                  type: 'string',
                  title: 'Description',
                  maxLength: 300
                },
                completed: {
                  type: 'boolean',
                  title: 'Completed',
                  default: false
                }
              },
              required: ['name', 'completed']
            },
            minItems: 1
          }
        },
        required: ['id', 'name', 'description', 'phase_id', 'metadata', 'subtasks']
      },
      ui_schema: {
        id: {
          'ui:help': 'Use format: task-X.Y-description-with-hyphens'
        },
        description: {
          'ui:widget': 'textarea',
          'ui:rows': 4
        },
        metadata: {
          labels: {
            'ui:widget': 'tags'
          },
          dependencies: {
            'ui:widget': 'tags',
            'ui:help': 'Enter task IDs that must be completed first'
          }
        },
        subtasks: {
          'ui:options': {
            addable: true,
            removable: true
          },
          items: {
            description: {
              'ui:widget': 'textarea',
              'ui:rows': 2
            }
          }
        }
      },
      validation_rules: [
        {
          field: 'id',
          type: 'pattern',
          value: '^task-\\d+\\.\\d+-.+$',
          message: 'Task ID must follow format: task-X.Y-description'
        },
        {
          field: 'name',
          type: 'min_length',
          value: 5,
          message: 'Task name must be at least 5 characters'
        },
        {
          field: 'subtasks',
          type: 'required',
          message: 'At least one sub-task is required'
        }
      ]
    };
  }

  /**
   * Generate Phase creation form schema
   */
  static getPhaseSchema(): FormSchema {
    return {
      id: 'phase-creation',
      name: 'phase',
      title: 'Create New Phase',
      description: 'Create a new project phase',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            title: 'Phase ID',
            description: 'Unique identifier (e.g., phase-1)',
            pattern: '^phase-\\d+$'
          },
          name: {
            type: 'string',
            title: 'Phase Name',
            description: 'Brief descriptive name',
            minLength: 5,
            maxLength: 100
          },
          description: {
            type: 'string',
            title: 'Description',
            description: 'Detailed description of the phase objectives',
            minLength: 20,
            maxLength: 1000
          },
          metadata: {
            type: 'object',
            title: 'Phase Metadata',
            properties: {
              start_date: {
                type: 'string',
                format: 'date',
                title: 'Start Date'
              },
              end_date: {
                type: 'string',
                format: 'date',
                title: 'End Date'
              },
              total_estimated_hours: {
                type: 'number',
                title: 'Total Estimated Hours',
                minimum: 1
              },
              dependencies: {
                type: 'array',
                title: 'Phase Dependencies',
                items: {
                  type: 'string',
                  pattern: '^phase-\\d+$'
                }
              }
            }
          }
        },
        required: ['id', 'name', 'description']
      },
      ui_schema: {
        description: {
          'ui:widget': 'textarea',
          'ui:rows': 6
        },
        metadata: {
          dependencies: {
            'ui:widget': 'tags',
            'ui:help': 'Enter phase IDs that must be completed first'
          }
        }
      },
      validation_rules: [
        {
          field: 'id',
          type: 'pattern',
          value: '^phase-\\d+$',
          message: 'Phase ID must follow format: phase-X'
        }
      ]
    };
  }

  /**
   * Generate Issue tracking form schema
   */
  static getIssueSchema(): FormSchema {
    return {
      id: 'issue-creation',
      name: 'issue',
      title: 'Create New Issue',
      description: 'Track QA/UAT issues and resolution attempts',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: 'Issue Title',
            minLength: 10,
            maxLength: 200
          },
          description: {
            type: 'string',
            title: 'Description',
            description: 'Detailed description of the issue',
            minLength: 20
          },
          type: {
            type: 'string',
            title: 'Issue Type',
            enum: ['bug', 'feature', 'improvement', 'qa', 'uat'],
            default: 'qa'
          },
          severity: {
            type: 'string',
            title: 'Severity',
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
          },
          related_tasks: {
            type: 'array',
            title: 'Related Tasks',
            description: 'Tasks related to this issue',
            items: {
              type: 'string'
            }
          },
          resolution_attempts: {
            type: 'array',
            title: 'Resolution Attempts',
            items: {
              type: 'object',
              properties: {
                approach: {
                  type: 'string',
                  title: 'Approach Taken',
                  minLength: 10
                },
                outcome: {
                  type: 'string',
                  title: 'Outcome',
                  enum: ['success', 'failure', 'partial']
                },
                details: {
                  type: 'string',
                  title: 'Details',
                  description: 'Detailed explanation of what was tried'
                },
                lessons_learned: {
                  type: 'array',
                  title: 'Lessons Learned',
                  items: {
                    type: 'string'
                  }
                },
                tokens_used: {
                  type: 'number',
                  title: 'Tokens Used',
                  description: 'For AI assistance tracking',
                  minimum: 0
                }
              },
              required: ['approach', 'outcome', 'details']
            }
          }
        },
        required: ['title', 'description', 'type', 'severity']
      },
      ui_schema: {
        description: {
          'ui:widget': 'textarea',
          'ui:rows': 4
        },
        related_tasks: {
          'ui:widget': 'tags'
        },
        resolution_attempts: {
          'ui:options': {
            addable: true,
            removable: true
          },
          items: {
            details: {
              'ui:widget': 'textarea',
              'ui:rows': 3
            },
            lessons_learned: {
              'ui:widget': 'tags'
            }
          }
        }
      },
      validation_rules: []
    };
  }

  /**
   * Get all available schemas
   */
  static getAllSchemas(): FormSchema[] {
    return [
      this.getTaskSchema(),
      this.getPhaseSchema(),
      this.getIssueSchema()
    ];
  }

  /**
   * Get schema by ID
   */
  static getSchemaById(id: string): FormSchema | null {
    const schemas = this.getAllSchemas();
    return schemas.find(schema => schema.id === id) || null;
  }
}