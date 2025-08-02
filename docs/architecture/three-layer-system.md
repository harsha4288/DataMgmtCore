# Three-Layer System Architecture

## Overview

The three-layer system is the core architectural pattern that enables maximum component reusability across different business domains while maintaining native-like performance and user experience.

## Layer Architecture

```
┌─────────────────────────────────────────────────┐
│                Layer 3: Render                  │
│         Platform-Specific UI Components         │
│  ┌─────────────┬─────────────┬─────────────┐    │
│  │   Mobile    │   Tablet    │  Desktop    │    │
│  │   Layout    │   Layout    │   Layout    │    │
│  └─────────────┴─────────────┴─────────────┘    │
├─────────────────────────────────────────────────┤
│              Layer 2: Behavior                  │
│       Platform-Agnostic UI Logic                │  
│  ┌─────────────────────────────────────────┐    │
│  │  DataTable, FormBuilder, Dashboard      │    │
│  │  ReportGenerator, WorkflowEngine        │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│              Layer 1: Data Engine               │
│           Headless Business Logic               │
│  ┌─────────────────────────────────────────┐    │
│  │  Entity Management, Validation Engine,  │    │
│  │  Business Rules, Permission System      │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## Layer 1: Data Engine (Headless Business Logic)

### Purpose
Provides headless business logic that is completely independent of UI concerns. This layer handles:
- Entity management and CRUD operations
- Data validation and business rules
- Permission and access control
- External API integration

### Key Components
- **Entity Engine**: Core data operations
- **Validation Engine**: Field and record validation
- **Business Rules Engine**: Workflow automation
- **Permission System**: Access control
- **Data Adapters**: External API integration

### Benefits
- ✅ Complete UI independence
- ✅ Testable business logic
- ✅ Reusable across all platforms
- ✅ Scalable and maintainable

### Example Usage
```typescript
// Entity engine usage (UI-independent)
const entityEngine = new EntityEngine();
const stockData = await entityEngine.list('stocks', {
  filters: [{ field: 'price', operator: 'gt', value: 100 }],
  sort: 'price',
  order: 'desc'
});
```

## Layer 2: Behavior (Platform-Agnostic UI Logic)

### Purpose
Contains UI behavior and logic that works across all platforms but doesn't make assumptions about specific rendering implementation. This layer handles:
- Data fetching and state management
- User interaction logic
- Form validation and submission
- Table sorting, filtering, pagination

### Key Components
- **DataTable**: Table behavior with sorting/filtering
- **FormBuilder**: Dynamic form generation
- **Dashboard**: Widget management and layout
- **Calendar**: Calendar logic and navigation
- **Search**: Search and filtering behavior

### Benefits
- ✅ Platform independence
- ✅ Consistent behavior across devices
- ✅ Reusable interaction patterns
- ✅ Easier testing and maintenance

### Example Usage
```typescript
// DataTable behavior (platform-agnostic)
function useDataTable(entityType: string) {
  const [filters, setFilters] = useState([]);
  const [sort, setSort] = useState('id');
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useEntityData(entityType, {
    filters, sort, page
  });
  
  return {
    data,
    isLoading,
    filters,
    setFilters,
    sort,
    setSort,
    page,
    setPage
  };
}
```

## Layer 3: Render (Platform-Specific UI Components)

### Purpose
Handles platform-specific rendering and interactions. This layer adapts the behavior layer to specific platform requirements:
- Mobile: Touch interactions, bottom sheets, swipe gestures
- Tablet: Split layouts, context menus, drag-and-drop
- Desktop: Multi-panel layouts, keyboard shortcuts, hover states

### Key Components

#### Mobile Components
- **BottomSheet**: Mobile modal replacement
- **SwipeCard**: Swipeable card interactions
- **PullRefresh**: Pull-to-refresh functionality
- **TouchTable**: Touch-optimized table

#### Tablet Components
- **SplitView**: Split panel layouts
- **DragDrop**: Drag and drop interfaces
- **ContextMenu**: Right-click context menus

#### Desktop Components
- **MultiPanel**: Multi-panel layouts
- **Toolbar**: Desktop toolbar with shortcuts
- **Shortcuts**: Keyboard shortcut handling

### Benefits
- ✅ Native experience on each platform
- ✅ Optimized interactions per device
- ✅ Consistent behavior underneath
- ✅ Easy platform-specific customization

### Example Usage
```typescript
// Platform-adaptive rendering
function AdaptiveDataTable({ entityType }: { entityType: string }) {
  const tableLogic = useDataTable(entityType);
  const platform = usePlatform();
  
  if (platform === 'mobile') {
    return <TouchTable {...tableLogic} />;
  }
  
  if (platform === 'tablet') {
    return <SplitViewTable {...tableLogic} />;
  }
  
  return <DesktopTable {...tableLogic} />;
}
```

## Data Flow

### Downward Data Flow
```
Data Engine → Behavior Layer → Render Layer
     ↓             ↓              ↓
  Business      UI Logic     Platform UI
   Logic       (Generic)    (Specific)
```

### Upward Event Flow
```
User Interaction → Render Layer → Behavior Layer → Data Engine
        ↓              ↓              ↓              ↓
   Touch/Click    Event Handler   State Update   Data Change
```

## Component Communication Patterns

### 1. Props Down, Events Up
```typescript
// Layer 2 provides data and handlers to Layer 3
function DataTableBehavior() {
  const [data, setData] = useState([]);
  
  const handleSort = (field: string) => {
    // Sorting logic
  };
  
  const handleFilter = (filters: Filter[]) => {
    // Filtering logic
  };
  
  return (
    <PlatformTable 
      data={data}
      onSort={handleSort}
      onFilter={handleFilter}
    />
  );
}
```

### 2. Context for Cross-Layer State
```typescript
// Entity context provides Layer 1 data to upper layers
export const EntityContext = createContext();

export function EntityProvider({ children }) {
  const [entities, setEntities] = useState({});
  const [loading, setLoading] = useState({});
  
  return (
    <EntityContext.Provider value={{ entities, loading, setEntities, setLoading }}>
      {children}
    </EntityContext.Provider>
  );
}
```

### 3. Custom Hooks for Layer Integration
```typescript
// Hook that bridges Layer 1 and Layer 2
export function useEntity(entityType: string) {
  const entityEngine = useEntityEngine();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    entityEngine.list(entityType)
      .then(setData)
      .finally(() => setLoading(false));
  }, [entityType]);
  
  return { data, loading };
}
```

## Benefits of Three-Layer Architecture

### 1. Maximum Reusability
- **Layer 1**: Reused across all prototypes (React, React Native, Next.js, Vue)
- **Layer 2**: Reused across all platforms within same framework
- **Layer 3**: Platform-specific but follows consistent patterns

### 2. Clean Separation of Concerns
- **Business Logic**: Isolated in Layer 1
- **UI Logic**: Isolated in Layer 2  
- **Platform Logic**: Isolated in Layer 3

### 3. Easier Testing
- **Unit Tests**: Layer 1 business logic
- **Integration Tests**: Layer 2 UI behavior
- **E2E Tests**: Layer 3 platform interactions

### 4. Maintainability
- Changes to business rules only affect Layer 1
- UI behavior changes only affect Layer 2
- Platform-specific changes only affect Layer 3

## Implementation Guidelines

### Do's
- ✅ Keep Layer 1 completely UI-independent
- ✅ Make Layer 2 behavior work across all platforms
- ✅ Optimize Layer 3 for specific platform experiences
- ✅ Use TypeScript interfaces to define layer contracts
- ✅ Test each layer independently

### Don'ts
- ❌ Don't put UI logic in Layer 1
- ❌ Don't put business logic in Layer 3
- ❌ Don't make Layer 2 assume specific platforms
- ❌ Don't tightly couple layers together
- ❌ Don't bypass layers in component hierarchy

## Migration Strategy

### From Traditional Architecture
1. **Extract Business Logic**: Move business rules to Layer 1
2. **Separate UI Behavior**: Create platform-agnostic Layer 2 components
3. **Optimize Rendering**: Create platform-specific Layer 3 components
4. **Test Integration**: Ensure layers work together seamlessly

### Incremental Adoption
- Start with one domain (e.g., stocks)
- Refactor existing components into three layers
- Validate benefits and patterns
- Apply to remaining domains

## Success Metrics

### Reusability Targets
- **90%** code reuse in Layer 1 across prototypes
- **80%** code reuse in Layer 2 across platforms
- **60%** pattern reuse in Layer 3 across platforms

### Performance Targets
- **< 100ms** layer communication overhead
- **90%+** bundle sharing between domains
- **Native-like** performance on all platforms

---

*This architecture enables building once and deploying everywhere while maintaining native-quality user experiences.*