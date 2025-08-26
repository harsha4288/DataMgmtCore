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