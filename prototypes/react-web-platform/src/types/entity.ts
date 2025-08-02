// Core Entity System Types

export interface EntityDefinition {
  name: string;
  displayName: string;
  description?: string;
  fields: FieldDefinition[];
  relationships: RelationshipDefinition[];
  permissions: PermissionDefinition[];
  businessRules: BusinessRuleDefinition[];
  metadata?: Record<string, any>;
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  displayName: string;
  description?: string;
  required: boolean;
  validation: ValidationRule[];
  defaultValue?: any;
  displayOptions: DisplayOptions;
  metadata?: Record<string, any>;
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'datetime'
  | 'boolean' 
  | 'select' 
  | 'multiselect'
  | 'file'
  | 'richtext'
  | 'email'
  | 'phone'
  | 'url'
  | 'currency'
  | 'percentage';

export interface DisplayOptions {
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  format?: string;
  precision?: number;
  colorCode?: boolean;
  icon?: string;
  placeholder?: string;
  helpText?: string;
  options?: SelectOption[];
  multiple?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

export interface ValidationRule {
  type: ValidationType;
  message: string;
  value?: any;
  condition?: string;
  allowOverride?: boolean;
  overrideRoles?: string[];
}

export type ValidationType = 
  | 'required' 
  | 'format' 
  | 'range' 
  | 'custom'
  | 'min'
  | 'max'
  | 'email'
  | 'phone'
  | 'url'
  | 'pattern';

export interface RelationshipDefinition {
  name: string;
  type: RelationshipType;
  targetEntity: string;
  displayName: string;
  required?: boolean;
  cascadeDelete?: boolean;
  foreignKey?: string;
  displayField?: string;
}

export type RelationshipType = 
  | 'one-to-one' 
  | 'one-to-many' 
  | 'many-to-one' 
  | 'many-to-many'
  | 'lookup';

export interface PermissionDefinition {
  role: string;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
  fieldRestrictions?: FieldPermission[];
}

export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete'
  | 'export'
  | 'import'
  | 'share'
  | 'approve';

export interface PermissionCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
  userField?: string; // Compare against current user's field
}

export interface FieldPermission {
  field: string;
  actions: PermissionAction[];
  condition?: PermissionCondition;
}

export interface BusinessRuleDefinition {
  name: string;
  displayName: string;
  description?: string;
  trigger: RuleTrigger;
  conditions: ConditionDefinition[];
  actions: ActionDefinition[];
  priority: number;
  active: boolean;
}

export type RuleTrigger = 
  | 'before_save' 
  | 'after_save' 
  | 'before_delete'
  | 'after_delete'
  | 'on_change' 
  | 'scheduled'
  | 'on_create'
  | 'on_update';

export interface ConditionDefinition {
  field: string;
  operator: ComparisonOperator;
  value: any;
  valueType?: 'static' | 'field' | 'function' | 'user';
  logicalOperator?: 'and' | 'or';
}

export type ComparisonOperator = 
  | 'eq' 
  | 'ne' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'in' 
  | 'not_in'
  | 'contains' 
  | 'starts_with' 
  | 'ends_with'
  | 'is_null'
  | 'is_not_null'
  | 'between';

export interface ActionDefinition {
  type: ActionType;
  config: ActionConfig;
  condition?: ConditionDefinition;
}

export type ActionType = 
  | 'set_field_value'
  | 'calculate_field'
  | 'show_field'
  | 'hide_field'
  | 'enable_field'
  | 'disable_field'
  | 'send_notification'
  | 'create_record'
  | 'update_record'
  | 'delete_record'
  | 'call_api'
  | 'run_script'
  | 'start_workflow';

export interface ActionConfig {
  [key: string]: any;
  // Specific configurations based on action type
  field?: string;
  value?: any;
  formula?: string;
  message?: string;
  recipients?: string[];
  apiEndpoint?: string;
  script?: string;
  workflowId?: string;
}

// Runtime Data Types

export interface EntityRecord {
  id: string;
  entity: string;
  data: Record<string, any>;
  metadata?: RecordMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}

export interface RecordMetadata {
  source?: string;
  importId?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
  tags?: string[];
  flags?: string[];
  customFields?: Record<string, any>;
}

export interface EntityData {
  entity: string;
  definition: EntityDefinition;
  records: EntityRecord[];
  metadata: EntityMetadata;
}

export interface EntityMetadata {
  totalRecords: number;
  lastUpdated: Date;
  source: string;
  version: string;
  schema: any;
}

// Query and Filter Types

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: SortConfig[];
  filters?: FilterConfig[];
  search?: string;
  include?: string[];
  fields?: string[];
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  operator: ComparisonOperator;
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  metadata?: {
    executionTime: number;
    cacheHit: boolean;
    source: string;
  };
}

// Validation Types

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
  rule?: ValidationRule;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Cache Configuration

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  staleWhileRevalidate: boolean;
  maxAge: number;
  tags?: string[];
  invalidateOn?: string[];
}

// Event Types

export interface EntityEvent {
  type: EntityEventType;
  entity: string;
  recordId?: string;
  data?: any;
  metadata?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export type EntityEventType = 
  | 'entity:created'
  | 'entity:updated'
  | 'entity:deleted'
  | 'record:created'
  | 'record:updated'
  | 'record:deleted'
  | 'validation:failed'
  | 'rule:executed'
  | 'permission:denied';

// Export all types
export type * from './entity';