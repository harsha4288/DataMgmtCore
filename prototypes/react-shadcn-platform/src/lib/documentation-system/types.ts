/* eslint-disable no-unused-vars */
/**
 * Core types for the documentation system
 */

export interface TaskStatus {
  id: string;
  name: string;
  description: string;
  progress: number;
  completion_date?: string;
  subtasks: SubTask[];
  metadata: TaskMetadata;
}

// Alias for compatibility
export type Task = TaskStatus;

export interface SubTask {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completion_date?: string;
}

export interface TaskMetadata {
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  labels: string[];
  dependencies: string[];
  estimated_hours?: number;
  actual_hours?: number;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  tasks: TaskStatus[];
  metadata: PhaseMetadata;
}

export interface PhaseMetadata {
  start_date?: string;
  end_date?: string;
  completion_date?: string;
  total_estimated_hours?: number;
  total_actual_hours?: number;
  dependencies: string[];
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'improvement' | 'qa' | 'uat';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  related_tasks: string[];
  resolution_attempts: ResolutionAttempt[];
  created_date: string;
  resolved_date?: string;
}

export interface ResolutionAttempt {
  id: string;
  approach: string;
  outcome: 'success' | 'failure' | 'partial';
  details: string;
  lessons_learned: string[];
  timestamp: string;
  tokens_used?: number;
}

export interface FormSchema {
  id: string;
  name: string;
  title: string;
  description: string;
  schema: Record<string, any>;
  ui_schema: Record<string, any>;
  validation_rules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
  condition?: string;
}

export interface DocumentationOutput {
  type: 'markdown' | 'json' | 'html' | 'api';
  content: string;
  metadata: {
    generated_at: string;
    source: string;
    consumer: 'human' | 'ai' | 'api' | 'dashboard';
  };
}

export interface QueryResult<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}

// ============================================================================
// Universal Configuration Management Types (Task 5.8.2)
// ============================================================================

export interface UserInstruction {
  id: string;
  title: string;
  content: string;
  userTypes: UserType[];
  context: ProjectContext[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
  version: string;
}

export enum UserType {
  HUMAN_DEVELOPER = 'human_developer',
  PROJECT_MANAGER = 'project_manager',
  QA_TESTER = 'qa_tester',
  AI_AGENT = 'ai_agent',
  EXTERNAL_TOOL = 'external_tool',
  CONSULTANT = 'consultant'
}

export interface ProjectContext {
  id: string;
  name: string;
  category: ContextCategory;
  conditions: Record<string, any>;
}

export enum ContextCategory {
  PHASE = 'phase',
  TASK_TYPE = 'task_type',
  TECH_STACK = 'tech_stack',
  ENVIRONMENT = 'environment',
  COMPLEXITY = 'complexity'
}

export interface ToolConfiguration {
  id: string;
  toolName: string;
  category: ToolCategory;
  environment: Environment;
  configuration: Record<string, any>;
  userTypes: UserType[];
  validationRules: ValidationRule[];
  lastUpdated: string;
}

export enum ToolCategory {
  DEVELOPMENT_TOOLS = 'development_tools',
  TESTING_FRAMEWORKS = 'testing_frameworks',
  BUILD_SYSTEMS = 'build_systems',
  QUALITY_TOOLS = 'quality_tools',
  INTEGRATION_TOOLS = 'integration_tools'
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing'
}

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  outputFormats: OutputFormat[];
  userTypes: UserType[];
}

export enum TemplateType {
  TASK_TEMPLATE = 'task_template',
  ISSUE_TEMPLATE = 'issue_template',
  REVIEW_TEMPLATE = 'review_template',
  REPORT_TEMPLATE = 'report_template',
  COMMUNICATION_TEMPLATE = 'communication_template'
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule;
}

export interface TemplateCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: any;
}

export enum OutputFormat {
  JSON = 'json',
  MARKDOWN = 'markdown',
  HTML = 'html',
  API_RESPONSE = 'api_response',
  PLAIN_TEXT = 'plain_text'
}

export interface QualityStandard {
  id: string;
  name: string;
  category: QualityCategory;
  description: string;
  rules: QualityRule[];
  userTypes: UserType[];
  enabled: boolean;
  lastUpdated: string;
}

export enum QualityCategory {
  CODE_QUALITY = 'code_quality',
  DOCUMENTATION_QUALITY = 'documentation_quality',
  PROCESS_QUALITY = 'process_quality',
  OUTPUT_QUALITY = 'output_quality',
  COMMUNICATION_QUALITY = 'communication_quality'
}

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  automated: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  checkFunction?: string; // Function name for automated checks
  parameters: Record<string, any>;
}