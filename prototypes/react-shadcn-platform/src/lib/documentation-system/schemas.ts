/**
 * JSON Schema generation from existing documentation structure
 */

import { FormSchema } from './types';
// import { ValidationRule } from './types';

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

  // ============================================================================
  // Universal Configuration Management Schemas (Task 5.8.2)
  // ============================================================================

  /**
   * Generate User Instruction creation form schema
   */
  static getUserInstructionSchema(): FormSchema {
    return {
      id: 'user-instruction-creation',
      name: 'userInstruction',
      title: 'Create User Instruction',
      description: 'Create instructions for specific user types and contexts',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: 'Instruction Title',
            minLength: 5,
            maxLength: 200
          },
          content: {
            type: 'string',
            title: 'Instruction Content',
            description: 'Detailed instruction content in markdown format',
            minLength: 20
          },
          userTypes: {
            type: 'array',
            title: 'User Types',
            description: 'Which user types this instruction applies to',
            items: {
              type: 'string',
              enum: ['human_developer', 'project_manager', 'qa_tester', 'ai_agent', 'external_tool', 'consultant']
            },
            minItems: 1,
            uniqueItems: true
          },
          context: {
            type: 'array',
            title: 'Project Contexts',
            description: 'When this instruction should be applied',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 3 },
                category: {
                  type: 'string',
                  enum: ['phase', 'task_type', 'tech_stack', 'environment', 'complexity']
                },
                conditions: {
                  type: 'object',
                  title: 'Context Conditions'
                }
              },
              required: ['name', 'category']
            }
          },
          tags: {
            type: 'array',
            title: 'Tags',
            items: { type: 'string' },
            uniqueItems: true
          },
          priority: {
            type: 'string',
            title: 'Priority Level',
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
          }
        },
        required: ['title', 'content', 'userTypes', 'priority']
      },
      ui_schema: {
        content: {
          'ui:widget': 'textarea',
          'ui:rows': 10
        },
        userTypes: {
          'ui:widget': 'checkboxes'
        },
        tags: {
          'ui:widget': 'tags'
        },
        context: {
          'ui:options': {
            addable: true,
            removable: true
          }
        }
      },
      validation_rules: [
        {
          field: 'title',
          type: 'min_length',
          value: 5,
          message: 'Title must be at least 5 characters'
        }
      ]
    };
  }

  /**
   * Generate Tool Configuration creation form schema
   */
  static getToolConfigurationSchema(): FormSchema {
    return {
      id: 'tool-configuration-creation',
      name: 'toolConfiguration',
      title: 'Create Tool Configuration',
      description: 'Configure development tools and frameworks',
      schema: {
        type: 'object',
        properties: {
          toolName: {
            type: 'string',
            title: 'Tool Name',
            description: 'Name of the tool or framework',
            minLength: 2,
            maxLength: 100
          },
          category: {
            type: 'string',
            title: 'Tool Category',
            enum: ['development_tools', 'testing_frameworks', 'build_systems', 'quality_tools', 'integration_tools']
          },
          environment: {
            type: 'string',
            title: 'Environment',
            enum: ['development', 'staging', 'production', 'testing'],
            default: 'development'
          },
          configuration: {
            type: 'object',
            title: 'Configuration Settings',
            description: 'Tool-specific configuration parameters'
          },
          userTypes: {
            type: 'array',
            title: 'Applicable User Types',
            items: {
              type: 'string',
              enum: ['human_developer', 'project_manager', 'qa_tester', 'ai_agent', 'external_tool', 'consultant']
            },
            minItems: 1,
            uniqueItems: true
          }
        },
        required: ['toolName', 'category', 'environment', 'userTypes']
      },
      ui_schema: {
        configuration: {
          'ui:widget': 'textarea',
          'ui:rows': 8,
          'ui:help': 'Enter configuration as JSON object'
        },
        userTypes: {
          'ui:widget': 'checkboxes'
        }
      },
      validation_rules: []
    };
  }

  /**
   * Generate Template creation form schema
   */
  static getTemplateSchema(): FormSchema {
    return {
      id: 'template-creation',
      name: 'template',
      title: 'Create Template',
      description: 'Create dynamic templates for content generation',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            title: 'Template Name',
            minLength: 3,
            maxLength: 100
          },
          type: {
            type: 'string',
            title: 'Template Type',
            enum: ['task_template', 'issue_template', 'review_template', 'report_template', 'communication_template']
          },
          content: {
            type: 'string',
            title: 'Template Content',
            description: 'Template content with variable placeholders',
            minLength: 10
          },
          variables: {
            type: 'array',
            title: 'Template Variables',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  title: 'Variable Name',
                  pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
                },
                type: {
                  type: 'string',
                  title: 'Variable Type',
                  enum: ['string', 'number', 'boolean', 'array', 'object']
                },
                required: {
                  type: 'boolean',
                  title: 'Required',
                  default: false
                },
                defaultValue: {
                  title: 'Default Value'
                }
              },
              required: ['name', 'type', 'required']
            }
          },
          outputFormats: {
            type: 'array',
            title: 'Output Formats',
            items: {
              type: 'string',
              enum: ['json', 'markdown', 'html', 'api_response', 'plain_text']
            },
            minItems: 1,
            uniqueItems: true,
            default: ['markdown']
          },
          userTypes: {
            type: 'array',
            title: 'Target User Types',
            items: {
              type: 'string',
              enum: ['human_developer', 'project_manager', 'qa_tester', 'ai_agent', 'external_tool', 'consultant']
            },
            minItems: 1,
            uniqueItems: true
          }
        },
        required: ['name', 'type', 'content', 'outputFormats', 'userTypes']
      },
      ui_schema: {
        content: {
          'ui:widget': 'textarea',
          'ui:rows': 12,
          'ui:help': 'Use {{variableName}} for variable placeholders'
        },
        variables: {
          'ui:options': {
            addable: true,
            removable: true
          }
        },
        outputFormats: {
          'ui:widget': 'checkboxes'
        },
        userTypes: {
          'ui:widget': 'checkboxes'
        }
      },
      validation_rules: []
    };
  }

  /**
   * Generate Quality Standard creation form schema
   */
  static getQualityStandardSchema(): FormSchema {
    return {
      id: 'quality-standard-creation',
      name: 'qualityStandard',
      title: 'Create Quality Standard',
      description: 'Define quality standards and rules',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            title: 'Standard Name',
            minLength: 3,
            maxLength: 100
          },
          category: {
            type: 'string',
            title: 'Quality Category',
            enum: ['code_quality', 'documentation_quality', 'process_quality', 'output_quality', 'communication_quality']
          },
          description: {
            type: 'string',
            title: 'Description',
            minLength: 10,
            maxLength: 500
          },
          rules: {
            type: 'array',
            title: 'Quality Rules',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  title: 'Rule Name',
                  minLength: 3
                },
                description: {
                  type: 'string',
                  title: 'Rule Description',
                  minLength: 10
                },
                automated: {
                  type: 'boolean',
                  title: 'Automated Check',
                  default: false
                },
                severity: {
                  type: 'string',
                  title: 'Severity Level',
                  enum: ['info', 'warning', 'error', 'critical'],
                  default: 'warning'
                },
                parameters: {
                  type: 'object',
                  title: 'Rule Parameters'
                }
              },
              required: ['name', 'description', 'automated', 'severity']
            },
            minItems: 1
          },
          userTypes: {
            type: 'array',
            title: 'Applicable User Types',
            items: {
              type: 'string',
              enum: ['human_developer', 'project_manager', 'qa_tester', 'ai_agent', 'external_tool', 'consultant']
            },
            minItems: 1,
            uniqueItems: true
          },
          enabled: {
            type: 'boolean',
            title: 'Enabled',
            default: true
          }
        },
        required: ['name', 'category', 'description', 'rules', 'userTypes']
      },
      ui_schema: {
        description: {
          'ui:widget': 'textarea',
          'ui:rows': 4
        },
        rules: {
          'ui:options': {
            addable: true,
            removable: true
          },
          items: {
            description: {
              'ui:widget': 'textarea',
              'ui:rows': 3
            },
            parameters: {
              'ui:widget': 'textarea',
              'ui:rows': 2,
              'ui:help': 'Enter parameters as JSON object'
            }
          }
        },
        userTypes: {
          'ui:widget': 'checkboxes'
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
      this.getIssueSchema(),
      this.getUserInstructionSchema(),
      this.getToolConfigurationSchema(),
      this.getTemplateSchema(),
      this.getQualityStandardSchema()
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