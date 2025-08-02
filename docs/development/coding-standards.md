# Coding Standards and Best Practices

## Overview

This document establishes coding standards, patterns, and best practices for developing the Generic Data Management Platform. These standards ensure code consistency, maintainability, and optimal performance across all prototypes.

## TypeScript Standards

### 1. Type Definitions
```typescript
// ✅ Good: Explicit, descriptive interfaces
interface UserEntity {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

// ✅ Good: Use enums for constrained values
enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

// ✅ Good: Use union types for alternatives
type ThemeMode = 'light' | 'dark' | 'system';

// ❌ Bad: Using any
function processData(data: any): any {
  return data;
}

// ✅ Good: Generic types
function processData<T>(data: T): T {
  return data;
}
```

### 2. Function and Variable Naming
```typescript
// ✅ Good: Descriptive, verb-based function names
function validateEmailAddress(email: string): boolean;
function transformApiResponseToEntity(response: ApiResponse): EntityRecord;
async function fetchUserById(id: string): Promise<User>;

// ✅ Good: Descriptive variable names
const isUserAuthenticated = true;
const maxRetryAttempts = 3;
const apiBaseUrl = 'https://api.example.com';

// ❌ Bad: Abbreviations and unclear names
const usr = getCurrentUsr();
const resp = await api.get('/data');
const tmp = processStuff(resp);
```

### 3. Interface and Type Organization
```typescript
// ✅ Good: Group related types together
// types/entity.ts
export interface EntityDefinition {
  name: string;
  displayName: string;
  fields: FieldDefinition[];
  relationships: Relationship[];
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  validation: ValidationRule[];
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'boolean' 
  | 'date'
  | 'select'
  | 'relationship';

// ✅ Good: Re-export from index
// types/index.ts
export type { EntityDefinition, FieldDefinition, FieldType } from './entity';
export type { ApiResponse, PaginatedResponse } from './api';
export type { ThemeConfig, PlatformTokens } from './theme';
```

## React Component Standards

### 1. Component Styling Consistency Policy

**CRITICAL:** All visual styling and behavior must be implemented in the core component, not in domain-specific implementations.

```typescript
// ❌ BAD: Styling implemented in domain dashboards
// StockDashboard.tsx
const columns = [
  {
    key: 'price',
    label: 'Price',
    render: (value) => <span className="font-mono text-blue-600">${value}</span>
  }
];

// NewsDashboard.tsx - Different styling for same concept
const columns = [
  {
    key: 'price', 
    label: 'Price',
    render: (value) => <span className="text-green-500 font-bold">${value}</span>
  }
];

// ✅ GOOD: Styling configured through core component system
// StockDashboard.tsx
const columns = [
  {
    key: 'price',
    label: 'Price',
    groupHeader: 'Market Data',
    badge: { value: stockCount, variant: 'info' },
    render: (value) => <span className="font-mono">${value}</span>
  }
];

// NewsDashboard.tsx - Consistent styling through same system
const columns = [
  {
    key: 'publishedAt',
    label: 'Published Date', 
    groupHeader: 'Article Metadata',
    badge: { value: recentCount, variant: 'success' },
    render: (value) => formatDate(value)
  }
];
```

**Enforcement Rules:**
1. **Multi-level headers** must use `groupHeader` property, not custom JSX
2. **Visual indicators** must use `badge` system, not inline styling
3. **Interactive controls** must use provided UI components (`InlineQuantityEditor`, `Badge`)
4. **Styling variants** must be defined in core components with consistent `variant` props
5. **Color schemes** must use design tokens, not hardcoded colors

**Before adding any visual enhancement:**
1. Check if the core component supports the pattern
2. If not, enhance the core component first  
3. Then use the enhanced API in domain implementations
4. Verify all existing domains use the same enhanced API

### 2. Component Structure
```typescript
// ✅ Good: Consistent component structure
interface DataTableProps {
  entityType: string;
  data: EntityRecord[];
  loading: boolean;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: FilterCondition[]) => void;
  className?: string;
}

export function DataTable({
  entityType,
  data,
  loading,
  onSort,
  onFilter,
  className
}: DataTableProps) {
  // 1. Hooks
  const { platform } = useTheme();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // 2. Computed values
  const columns = useMemo(() => 
    getEntityColumns(entityType), [entityType]
  );
  
  // 3. Event handlers
  const handleRowSelect = useCallback((id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  }, []);
  
  // 4. Effects
  useEffect(() => {
    // Reset selection when data changes
    setSelectedRows([]);
  }, [data]);
  
  // 5. Early returns
  if (loading) {
    return <TableSkeleton />;
  }
  
  if (!data.length) {
    return <EmptyState message="No data available" />;
  }
  
  // 6. Render
  return (
    <div className={cn('data-table', className)}>
      {/* Component JSX */}
    </div>
  );
}

// ✅ Good: Export with display name
DataTable.displayName = 'DataTable';
```

### 2. Custom Hooks
```typescript
// ✅ Good: Custom hook structure
export function useEntityData(entityType: string, options?: EntityQueryOptions) {
  // 1. State
  const [data, setData] = useState<EntityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Refs (if needed)
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 3. Computed values
  const isEmpty = data.length === 0;
  const hasError = error !== null;
  
  // 4. Memoized callbacks
  const refetch = useCallback(async () => {
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await entityEngine.list(entityType, {
        ...options,
        signal: abortControllerRef.current.signal
      });
      setData(result.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [entityType, options]);
  
  // 5. Effects
  useEffect(() => {
    refetch();
    
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [refetch]);
  
  // 6. Return object
  return {
    data,
    loading,
    error,
    isEmpty,
    hasError,
    refetch
  };
}
```

### 3. Component Composition Patterns
```typescript
// ✅ Good: Compound component pattern
export function DataTable({ children, ...props }: DataTableProps) {
  return (
    <DataTableProvider {...props}>
      <div className="data-table">
        {children}
      </div>
    </DataTableProvider>
  );
}

export function DataTableHeader({ children }: { children: ReactNode }) {
  const { columns, onSort } = useDataTableContext();
  
  return (
    <thead className="data-table-header">
      {children}
    </thead>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="data-table-body">
      {children}
    </tbody>
  );
}

// Usage
<DataTable entityType="users" data={users}>
  <DataTableHeader>
    <DataTableRow>
      <DataTableColumn field="name">Name</DataTableColumn>
      <DataTableColumn field="email">Email</DataTableColumn>
    </DataTableRow>
  </DataTableHeader>
  <DataTableBody>
    {users.map(user => (
      <DataTableRow key={user.id}>
        <DataTableCell>{user.name}</DataTableCell>
        <DataTableCell>{user.email}</DataTableCell>
      </DataTableRow>
    ))}
  </DataTableBody>
</DataTable>
```

## State Management Patterns

### 1. Zustand Store Structure
```typescript
// ✅ Good: Well-structured Zustand store
interface EntityStoreState {
  // State
  entities: Record<string, EntityData>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  
  // Computed getters
  getEntity: (entityType: string) => EntityData | undefined;
  isLoading: (entityType: string) => boolean;
  getError: (entityType: string) => string | null;
  
  // Actions
  setEntityData: (entityType: string, data: EntityData) => void;
  setLoading: (entityType: string, loading: boolean) => void;
  setError: (entityType: string, error: string | null) => void;
  updateRecord: (entityType: string, id: string, changes: Partial<EntityRecord>) => void;
  reset: () => void;
}

export const useEntityStore = create<EntityStoreState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      entities: {},
      loading: {},
      errors: {},
      
      // Computed getters
      getEntity: (entityType) => get().entities[entityType],
      isLoading: (entityType) => get().loading[entityType] || false,
      getError: (entityType) => get().errors[entityType],
      
      // Actions
      setEntityData: (entityType, data) =>
        set((state) => {
          state.entities[entityType] = data;
          state.loading[entityType] = false;
          state.errors[entityType] = null;
        }),
        
      setLoading: (entityType, loading) =>
        set((state) => {
          state.loading[entityType] = loading;
        }),
        
      setError: (entityType, error) =>
        set((state) => {
          state.errors[entityType] = error;
          state.loading[entityType] = false;
        }),
        
      updateRecord: (entityType, id, changes) =>
        set((state) => {
          const entity = state.entities[entityType];
          if (entity) {
            const recordIndex = entity.records.findIndex(r => r.id === id);
            if (recordIndex !== -1) {
              Object.assign(entity.records[recordIndex].data, changes);
              entity.records[recordIndex].updatedAt = new Date();
            }
          }
        }),
        
      reset: () =>
        set(() => ({
          entities: {},
          loading: {},
          errors: {}
        }))
    }))
  )
);
```

### 2. TanStack Query Integration
```typescript
// ✅ Good: TanStack Query patterns
export function useEntityQuery(entityType: string, options?: EntityQueryOptions) {
  return useQuery({
    queryKey: ['entity', entityType, options],
    queryFn: async ({ signal }) => {
      const adapter = adapterRegistry.get(entityType);
      return adapter.list({ ...options, signal });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    ...options?.queryOptions
  });
}

export function useEntityMutation(entityType: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEntityData) => {
      const adapter = adapterRegistry.get(entityType);
      return adapter.create(data);
    },
    onMutate: async (newData) => {
      // Optimistic update
      await queryClient.cancelQueries(['entity', entityType]);
      
      const previousData = queryClient.getQueryData(['entity', entityType]);
      
      queryClient.setQueryData(['entity', entityType], (old: any) => ({
        ...old,
        data: [...(old?.data || []), { ...newData, id: 'temp-' + Date.now() }]
      }));
      
      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(['entity', entityType], context?.previousData);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['entity', entityType]);
    }
  });
}
```

## Performance Best Practices

### 1. Component Memoization
```typescript
// ✅ Good: Strategic memoization
const DataTableRow = memo(({ record, columns, onSelect }: DataTableRowProps) => {
  const handleSelect = useCallback(() => {
    onSelect(record.id);
  }, [record.id, onSelect]);
  
  return (
    <tr onClick={handleSelect}>
      {columns.map(column => (
        <td key={column.id}>
          {record.data[column.field]}
        </td>
      ))}
    </tr>
  );
});

// ✅ Good: Custom comparison function when needed
const ExpensiveComponent = memo(({ data, config }: Props) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return (
    prevProps.data.id === nextProps.data.id &&
    prevProps.config.version === nextProps.config.version
  );
});
```

### 2. Virtual Scrolling Implementation
```typescript
// ✅ Good: Virtual scrolling with @tanstack/react-virtual
function VirtualizedTable({ data, columns }: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
    overscan: 10 // Render extra items for smooth scrolling
  });
  
  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <DataTableRow
              record={data[virtualItem.index]}
              columns={columns}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Bundle Optimization
```typescript
// ✅ Good: Lazy loading with code splitting
const StockDashboard = lazy(() => 
  import('@/domains/stocks/StockDashboard').then(module => ({
    default: module.StockDashboard
  }))
);

const NewsManager = lazy(() => import('@/domains/news/NewsManager'));

// ✅ Good: Dynamic imports for large dependencies
async function loadChartLibrary() {
  const { Chart } = await import('chart.js');
  return Chart;
}

// ✅ Good: Tree shaking with named imports
import { format, parseISO } from 'date-fns';
import { debounce, throttle } from 'lodash-es';
```

## Error Handling Standards

### 1. Error Boundaries
```typescript
// ✅ Good: Comprehensive error boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{ fallback?: ComponentType<ErrorBoundaryProps> }>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

### 2. Async Error Handling
```typescript
// ✅ Good: Comprehensive async error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Type-safe error handling
    if (error instanceof ApiError) {
      throw new ApplicationError(
        `${context}: ${error.message}`,
        error.statusCode,
        error.data
      );
    }
    
    if (error instanceof NetworkError) {
      throw new ApplicationError(
        `${context}: Network request failed`,
        0,
        { originalError: error }
      );
    }
    
    // Unknown error
    throw new ApplicationError(
      `${context}: Unexpected error occurred`,
      -1,
      { originalError: error }
    );
  }
}

// Usage
const data = await withErrorHandling(
  () => api.fetchUserData(userId),
  'User data fetch'
);
```

## Testing Standards

### 1. Component Testing
```typescript
// ✅ Good: Comprehensive component tests
describe('DataTable', () => {
  const mockData = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  it('renders data correctly', () => {
    render(
      <DataTable
        entityType="users"
        data={mockData}
        loading={false}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    render(
      <DataTable
        entityType="users"
        data={[]}
        loading={true}
      />
    );
    
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });
  
  it('handles sorting', async () => {
    const onSort = jest.fn();
    
    render(
      <DataTable
        entityType="users"
        data={mockData}
        loading={false}
        onSort={onSort}
      />
    );
    
    const nameHeader = screen.getByText('Name');
    await userEvent.click(nameHeader);
    
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });
});
```

### 2. Hook Testing
```typescript
// ✅ Good: Custom hook testing
describe('useEntityData', () => {
  beforeEach(() => {
    // Mock API responses
    jest.mocked(entityEngine.list).mockResolvedValue({
      data: mockEntityData,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
    });
  });
  
  it('fetches data on mount', async () => {
    const { result } = renderHook(() => useEntityData('users'));
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockEntityData);
    expect(entityEngine.list).toHaveBeenCalledWith('users', undefined);
  });
  
  it('handles errors gracefully', async () => {
    const errorMessage = 'API Error';
    jest.mocked(entityEngine.list).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useEntityData('users'));
    
    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });
    
    expect(result.current.error).toBe(errorMessage);
  });
});
```

## File Organization Standards

### 1. Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── primitives/      # Headless components
│   ├── behaviors/       # Business logic components
│   └── ui/              # Styled components
├── domains/             # Domain-specific code
│   ├── stocks/
│   ├── news/
│   ├── users/
│   └── products/
├── core/                # Core business logic
│   ├── entity/
│   ├── data-adapters/
│   └── permissions/
├── lib/                 # Utilities and configuration
│   ├── api/
│   ├── hooks/
│   ├── theme/
│   └── utils/
├── types/               # TypeScript type definitions
└── assets/              # Static assets
```

### 2. Import/Export Patterns
```typescript
// ✅ Good: Barrel exports for clean imports
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';
export { DataTable } from './DataTable';

// ✅ Good: Organized imports
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { Button, Input, Modal } from '@/components/ui';
import { useTheme, useEntityStore } from '@/lib/hooks';
import { EntityRecord, FilterCondition } from '@/types';

import type { DataTableProps } from './types';
```

## DataTable Usage Patterns

### 1. SGS-Inspired Enterprise Features

**Required for all DataTable implementations:**

```typescript
// ✅ GOOD: Complete DataTable configuration
const columns: Column<EntityType>[] = [
  // Basic information columns (ungrouped)
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    searchable: true,
    resizable: true,
    width: 150
  },
  
  // Grouped columns with badges and interactive controls
  {
    key: 'quantity_issued',
    label: 'Issued',
    groupHeader: 'Inventory Tracking', // Multi-level header
    badge: { 
      value: totalAvailable, 
      variant: 'info' 
    }, // Real-time indicator
    render: (issued, item) => (
      <InlineQuantityEditor
        value={issued as number}
        min={0}
        max={item.quantity_max as number}
        onChange={(newValue) => handleQuantityChange(item.id, newValue)}
      />
    )
  },
  
  // Status columns with visual indicators
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <Badge variant={
        value === 'active' ? 'success' : 
        value === 'pending' ? 'warning' : 'error'
      }>
        {String(value).toUpperCase()}
      </Badge>
    )
  }
];

// Required DataTable props
<DataTable
  data={data}
  columns={columns}
  loading={loading}
  pagination={{ enabled: true, pageSize: 10, showPageSizeOptions: true }}
  search={{ enabled: true, placeholder: 'Search...' }}
  export={{ enabled: true, filename: 'entity-data' }}
  columnControls={{ resizable: true, reorderable: true }}
  selection={{ enabled: true, bulkActions: bulkActions }}
  onColumnsChange={setColumns}
  onSelectionChange={handleSelectionChange}
/>
```

### 2. Required Bulk Actions Pattern

```typescript
// ✅ GOOD: Standard bulk actions for all domains
const bulkActions: BulkAction<EntityType>[] = [
  {
    id: 'action-primary',
    label: 'Primary Action',
    icon: '⭐',
    action: (selectedItems) => {
      // Business logic for primary action
      console.log('Primary action for:', selectedItems.length, 'items');
    }
  },
  {
    id: 'export-selected', 
    label: 'Export Selected',
    icon: '📤',
    action: (selectedItems) => {
      // Standard CSV export
      const csv = generateCSV(selectedItems);
      downloadCSV(csv, 'selected-items.csv');
    }
  },
  {
    id: 'bulk-delete',
    label: 'Delete Selected',
    icon: '🗑️',
    variant: 'destructive' as const,
    action: (selectedItems) => {
      const confirmed = confirm(`Delete ${selectedItems.length} items?`);
      if (confirmed) {
        // Handle bulk deletion
      }
    }
  }
];
```

### 3. Styling Consistency Validation

**Pre-implementation checklist:**
- [ ] All tables use consistent multi-level headers via `groupHeader`
- [ ] All status indicators use `Badge` component with standard variants
- [ ] All interactive controls use provided UI components
- [ ] All domains have similar bulk action patterns
- [ ] No hardcoded colors or custom styling in domain implementations

**Post-implementation verification:**
1. Build and run all domains side-by-side
2. Verify visual consistency across all tables
3. Test all interactive features work identically
4. Confirm responsive behavior is consistent

## Code Review Checklist

### Before Submitting
- [ ] All TypeScript errors resolved
- [ ] Code follows established patterns
- [ ] **Component styling consistency verified** (all DataTables use unified styling)
- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Accessibility considerations
- [ ] No console.log statements in production code

### Review Criteria
- [ ] Code readability and maintainability
- [ ] Proper error handling
- [ ] **Visual consistency across all DataTable implementations**
- [ ] **No styling duplication between domain implementations**
- [ ] Performance implications
- [ ] Security considerations
- [ ] Test coverage
- [ ] Documentation quality
- [ ] Follows established patterns
- [ ] No code duplication

---

*These coding standards ensure consistent, maintainable, and performant code across all team members and prototypes.*