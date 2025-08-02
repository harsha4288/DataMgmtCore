# Entity Management System

## Overview

The Entity Management System is the foundation of Layer 1 (Data Engine) that provides a unified interface for managing business data across all domains. It enables configuration-driven CRUD operations, validation, and business rules without requiring custom code for each data type.

## Core Concepts

### Entity Definition
An entity represents a business object (e.g., User, Product, Event) with its fields, validation rules, relationships, and permissions.

```typescript
interface EntityDefinition {
  name: string;                    // Unique identifier
  displayName: string;            // Human-readable name
  description?: string;           // Entity description
  fields: FieldDefinition[];      // Field definitions
  relationships: Relationship[];  // Entity relationships
  permissions: Permission[];      // Access control rules
  businessRules: BusinessRule[];  // Workflow automation
  displayOptions: DisplayOptions; // UI rendering hints
}
```

### Field Types
The system supports comprehensive field types covering all business data needs:

```typescript
type FieldType = 
  | 'text'          // Single line text
  | 'textarea'      // Multi-line text
  | 'richtext'      // Rich text editor
  | 'number'        // Numeric values
  | 'decimal'       // Decimal numbers
  | 'currency'      // Monetary values
  | 'percentage'    // Percentage values
  | 'boolean'       // True/false values
  | 'date'          // Date only
  | 'time'          // Time only
  | 'datetime'      // Date and time
  | 'duration'      // Time duration
  | 'email'         // Email address
  | 'phone'         // Phone number
  | 'url'           // Web URL
  | 'select'        // Single selection
  | 'multiselect'   // Multiple selection
  | 'file'          // File upload
  | 'image'         // Image upload
  | 'json'          // JSON data
  | 'relationship'  // Entity relationship
  | 'calculated'    // Computed field
```

### Field Definition Structure
```typescript
interface FieldDefinition {
  name: string;                   // Field identifier
  type: FieldType;               // Field data type
  displayName: string;           // Human-readable label
  description?: string;          // Field description
  required: boolean;             // Required field flag
  defaultValue?: any;            // Default value
  validation: ValidationRule[];  // Validation rules
  displayOptions: FieldDisplayOptions; // UI options
  businessRules?: BusinessRule[]; // Field-specific rules
}
```

## Entity Engine

### Core Operations
The Entity Engine provides standard CRUD operations for all entities:

```typescript
class EntityEngine {
  // Create new record
  async create(entityName: string, data: Record<string, any>): Promise<EntityRecord> {
    const definition = this.getEntityDefinition(entityName);
    
    // Validate data
    await this.validateRecord(definition, data);
    
    // Apply business rules (before create)
    await this.applyBusinessRules(definition, 'before_create', data);
    
    // Create record
    const record = await this.dataAdapter.create(entityName, data);
    
    // Apply business rules (after create)
    await this.applyBusinessRules(definition, 'after_create', record);
    
    return record;
  }
  
  // Read records with filtering and pagination
  async list(entityName: string, options?: ListOptions): Promise<PaginatedResult<EntityRecord>> {
    const definition = this.getEntityDefinition(entityName);
    
    // Apply permission filters
    const permissionFilters = await this.getPermissionFilters(definition);
    const combinedFilters = [...(options?.filters || []), ...permissionFilters];
    
    // Fetch data
    const result = await this.dataAdapter.list(entityName, {
      ...options,
      filters: combinedFilters
    });
    
    // Apply field-level permissions
    result.data = result.data.map(record => 
      this.applyFieldPermissions(definition, record)
    );
    
    return result;
  }
  
  // Update existing record
  async update(entityName: string, id: string, changes: Partial<Record<string, any>>): Promise<EntityRecord> {
    const definition = this.getEntityDefinition(entityName);
    const existingRecord = await this.get(entityName, id);
    
    // Validate changes
    await this.validateRecord(definition, { ...existingRecord.data, ...changes });
    
    // Apply business rules (before update)
    await this.applyBusinessRules(definition, 'before_update', changes, existingRecord);
    
    // Update record
    const updatedRecord = await this.dataAdapter.update(entityName, id, changes);
    
    // Apply business rules (after update)
    await this.applyBusinessRules(definition, 'after_update', updatedRecord, existingRecord);
    
    return updatedRecord;
  }
  
  // Delete record
  async delete(entityName: string, id: string): Promise<void> {
    const definition = this.getEntityDefinition(entityName);
    const existingRecord = await this.get(entityName, id);
    
    // Check delete permissions
    await this.checkPermission(definition, 'delete', existingRecord);
    
    // Apply business rules (before delete)
    await this.applyBusinessRules(definition, 'before_delete', existingRecord);
    
    // Delete record
    await this.dataAdapter.delete(entityName, id);
    
    // Apply business rules (after delete)
    await this.applyBusinessRules(definition, 'after_delete', existingRecord);
  }
}
```

### Advanced Querying
```typescript
interface ListOptions {
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sort?: string;
  order?: 'asc' | 'desc';
  
  // Filtering
  filters?: FilterCondition[];
  
  // Field selection
  fields?: string[];
  
  // Relationship inclusion
  include?: string[];
  
  // Search
  search?: string;
  searchFields?: string[];
}

interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startswith' | 'endswith';
  value: any;
  logicalOperator?: 'and' | 'or';
}
```

## Validation System

### Field Validation Rules
```typescript
interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom' | 'unique' | 'relationship';
  message: string;
  value?: any;
  customValidator?: (value: any, record: any) => boolean | Promise<boolean>;
}

// Example validation rules
const userEntityFields: FieldDefinition[] = [
  {
    name: 'email',
    type: 'email',
    displayName: 'Email Address',
    required: true,
    validation: [
      { type: 'required', message: 'Email is required' },
      { type: 'pattern', value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Invalid email format' },
      { type: 'unique', message: 'Email already exists' }
    ]
  },
  {
    name: 'age',
    type: 'number',
    displayName: 'Age',
    required: false,
    validation: [
      { type: 'min', value: 0, message: 'Age must be positive' },
      { type: 'max', value: 150, message: 'Age must be realistic' }
    ]
  },
  {
    name: 'password',
    type: 'text',
    displayName: 'Password',
    required: true,
    validation: [
      { type: 'required', message: 'Password is required' },
      { type: 'min', value: 8, message: 'Password must be at least 8 characters' },
      { 
        type: 'custom', 
        message: 'Password must contain uppercase, lowercase, and number',
        customValidator: (value) => {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value);
        }
      }
    ]
  }
];
```

### Cross-Field Validation
```typescript
// Entity-level validation rules
const businessRules: BusinessRule[] = [
  {
    name: 'start_before_end_date',
    trigger: 'on_validate',
    conditions: [
      { field: 'startDate', operator: 'exists' },
      { field: 'endDate', operator: 'exists' }
    ],
    actions: [
      {
        type: 'validate',
        customValidator: (record) => {
          return new Date(record.startDate) < new Date(record.endDate);
        },
        message: 'Start date must be before end date'
      }
    ]
  }
];
```

## Relationship Management

### Relationship Types
```typescript
interface Relationship {
  name: string;                    // Relationship identifier
  type: 'oneToOne' | 'oneToMany' | 'manyToMany'; // Relationship type
  targetEntity: string;           // Related entity name
  foreignKey?: string;            // Foreign key field
  displayField?: string;          // Field to display in UI
  cascadeDelete?: boolean;        // Delete related records
  required?: boolean;             // Required relationship
}

// Example relationships
const relationships: Relationship[] = [
  {
    name: 'author',
    type: 'oneToOne',
    targetEntity: 'users',
    foreignKey: 'authorId',
    displayField: 'name',
    required: true
  },
  {
    name: 'categories',
    type: 'manyToMany',
    targetEntity: 'categories',
    displayField: 'name'
  },
  {
    name: 'comments',
    type: 'oneToMany',
    targetEntity: 'comments',
    foreignKey: 'articleId',
    cascadeDelete: true
  }
];
```

### Relationship Loading
```typescript
// Eager loading relationships
const articleWithAuthor = await entityEngine.get('articles', '123', {
  include: ['author', 'categories']
});

// Lazy loading relationships
const author = await entityEngine.getRelated('articles', '123', 'author');
const categories = await entityEngine.getRelated('articles', '123', 'categories');

// Relationship queries
const articlesByAuthor = await entityEngine.list('articles', {
  filters: [{ field: 'author.id', operator: 'eq', value: 'author123' }]
});
```

## Business Rules Engine

### Rule Structure
```typescript
interface BusinessRule {
  name: string;                   // Rule identifier
  description?: string;           // Rule description
  priority: number;               // Execution priority
  trigger: RuleTrigger;          // When to execute
  conditions: RuleCondition[];    // Execution conditions
  actions: RuleAction[];         // Actions to perform
  active: boolean;               // Rule enabled/disabled
}

type RuleTrigger = 
  | 'before_create' | 'after_create'
  | 'before_update' | 'after_update'  
  | 'before_delete' | 'after_delete'
  | 'on_change'     | 'on_validate'
  | 'scheduled'     | 'manual';

interface RuleCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists' | 'changed';
  value?: any;
  logicalOperator?: 'and' | 'or';
}

interface RuleAction {
  type: 'setValue' | 'notification' | 'webhook' | 'workflow' | 'validate' | 'calculate';
  parameters: Record<string, any>;
}
```

### Example Business Rules
```typescript
const stockAlertRule: BusinessRule = {
  name: 'stock_price_alert',
  description: 'Send notification when stock price changes significantly',
  priority: 1,
  trigger: 'after_update',
  conditions: [
    { field: 'changePercent', operator: 'gt', value: 5 }
  ],
  actions: [
    {
      type: 'notification',
      parameters: {
        message: 'Stock {{symbol}} is up {{changePercent}}%',
        channels: ['push', 'email'],
        recipients: 'subscribers'
      }
    }
  ],
  active: true
};

const auditTrailRule: BusinessRule = {
  name: 'audit_trail',
  description: 'Create audit log for sensitive data changes',
  priority: 10,
  trigger: 'after_update',
  conditions: [
    { field: 'sensitive', operator: 'eq', value: true }
  ],
  actions: [
    {
      type: 'webhook',
      parameters: {
        url: '/api/audit/log',
        method: 'POST',
        data: {
          entity: '{{entityName}}',
          recordId: '{{id}}',
          changes: '{{changes}}',
          userId: '{{currentUser.id}}',
          timestamp: '{{now}}'
        }
      }
    }
  ],
  active: true
};
```

## Permission System

### Role-Based Access Control (RBAC)
```typescript
interface Permission {
  role: string;                   // User role
  actions: PermissionAction[];    // Allowed actions
  conditions?: PermissionCondition[]; // Access conditions
  fieldPermissions?: FieldPermission[]; // Field-level access
}

type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';

interface PermissionCondition {
  field: string;
  operator: string;
  value: any;
}

interface FieldPermission {
  field: string;
  access: 'hidden' | 'readonly' | 'editable';
  conditions?: PermissionCondition[];
}

// Example permissions
const userPermissions: Permission[] = [
  {
    role: 'admin',
    actions: ['create', 'read', 'update', 'delete', 'export', 'import']
  },
  {
    role: 'editor',
    actions: ['create', 'read', 'update'],
    conditions: [
      { field: 'createdBy', operator: 'eq', value: '{{currentUser.id}}' }
    ]
  },
  {
    role: 'viewer',
    actions: ['read'],
    fieldPermissions: [
      { field: 'salary', access: 'hidden' },
      { field: 'email', access: 'readonly' }
    ]
  }
];
```

## Data Adapter Integration

### Adapter Interface
```typescript
interface DataAdapter {
  // Basic CRUD operations
  create(entity: string, data: any): Promise<EntityRecord>;
  get(entity: string, id: string): Promise<EntityRecord>;
  list(entity: string, options: ListOptions): Promise<PaginatedResult<EntityRecord>>;
  update(entity: string, id: string, changes: any): Promise<EntityRecord>;
  delete(entity: string, id: string): Promise<void>;
  
  // Advanced operations
  search(entity: string, query: string): Promise<EntityRecord[]>;
  count(entity: string, filters?: FilterCondition[]): Promise<number>;
  bulkCreate(entity: string, records: any[]): Promise<EntityRecord[]>;
  bulkUpdate(entity: string, updates: { id: string; changes: any }[]): Promise<EntityRecord[]>;
  bulkDelete(entity: string, ids: string[]): Promise<void>;
}
```

### Multiple Data Sources
```typescript
// Entity can use different data adapters
const entityConfig = {
  users: 'database',        // Database adapter
  stocks: 'alpha-vantage',  // External API adapter
  news: 'cms',             // CMS adapter
  products: 'ecommerce'    // E-commerce platform adapter
};

// Adapter selection
class EntityEngine {
  private adapters: Map<string, DataAdapter>;
  
  private getAdapter(entityName: string): DataAdapter {
    const adapterName = this.entityConfig[entityName] || 'default';
    return this.adapters.get(adapterName);
  }
}
```

## Performance Optimization

### Caching Strategy
```typescript
interface CacheConfig {
  ttl: number;                    // Time to live (seconds)
  maxSize: number;               // Maximum cache size
  strategy: 'lru' | 'fifo' | 'ttl'; // Eviction strategy
  invalidateOn: string[];        // Events that invalidate cache
}

// Entity-specific caching
const cacheConfig: Record<string, CacheConfig> = {
  stocks: {
    ttl: 60,              // 1 minute for real-time data
    maxSize: 1000,
    strategy: 'ttl',
    invalidateOn: ['market_close']
  },
  users: {
    ttl: 3600,            // 1 hour for user data
    maxSize: 5000,
    strategy: 'lru',
    invalidateOn: ['user_update', 'role_change']
  }
};
```

### Query Optimization
```typescript
// Automatic query optimization
class QueryOptimizer {
  optimizeQuery(entityName: string, options: ListOptions): ListOptions {
    // Index usage optimization
    const indexes = this.getEntityIndexes(entityName);
    const optimizedFilters = this.optimizeFilters(options.filters, indexes);
    
    // Field selection optimization
    const optimizedFields = this.optimizeFieldSelection(options.fields);
    
    // Join optimization
    const optimizedIncludes = this.optimizeIncludes(options.include);
    
    return {
      ...options,
      filters: optimizedFilters,
      fields: optimizedFields,
      include: optimizedIncludes
    };
  }
}
```

## Usage Examples

### Define Entity
```typescript
const articleEntity: EntityDefinition = {
  name: 'articles',
  displayName: 'Articles',
  description: 'Blog articles and news content',
  fields: [
    {
      name: 'title',
      type: 'text',
      displayName: 'Title',
      required: true,
      validation: [
        { type: 'required', message: 'Title is required' },
        { type: 'max', value: 200, message: 'Title too long' }
      ]
    },
    {
      name: 'content',
      type: 'richtext',
      displayName: 'Content',
      required: true
    },
    {
      name: 'publishedAt',
      type: 'datetime',
      displayName: 'Published Date'
    },
    {
      name: 'status',
      type: 'select',
      displayName: 'Status',
      defaultValue: 'draft',
      validation: [
        { type: 'required', message: 'Status is required' }
      ]
    }
  ],
  relationships: [
    {
      name: 'author',
      type: 'oneToOne',
      targetEntity: 'users',
      foreignKey: 'authorId',
      required: true
    }
  ],
  permissions: [
    {
      role: 'admin',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      role: 'author',
      actions: ['create', 'read', 'update'],
      conditions: [
        { field: 'authorId', operator: 'eq', value: '{{currentUser.id}}' }
      ]
    }
  ]
};
```

### Use Entity Engine
```typescript
// Initialize entity engine
const entityEngine = new EntityEngine();
entityEngine.registerEntity(articleEntity);

// Create article
const newArticle = await entityEngine.create('articles', {
  title: 'Getting Started with Entity Management',
  content: '<p>This is the article content...</p>',
  authorId: 'user123',
  status: 'draft'
});

// List articles with filtering
const publishedArticles = await entityEngine.list('articles', {
  filters: [
    { field: 'status', operator: 'eq', value: 'published' }
  ],
  sort: 'publishedAt',
  order: 'desc',
  page: 1,
  limit: 10,
  include: ['author']
});

// Update article
await entityEngine.update('articles', newArticle.id, {
  status: 'published',
  publishedAt: new Date()
});

// Search articles
const searchResults = await entityEngine.list('articles', {
  search: 'entity management',
  searchFields: ['title', 'content']
});
```

---

*The Entity Management System provides a powerful, flexible foundation for building data-driven applications with minimal code while maintaining type safety and performance.*