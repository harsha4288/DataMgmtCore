# Behavior Components - Interactive & Smart Components

## 📋 Overview

Advanced components that encapsulate complex user interactions, business logic, and intelligent behaviors. These components bridge the gap between basic UI and domain-specific functionality.

**Component Status**: ✅ **Production Ready**  
**Specialization**: Complex interactions, state management, business logic  
**Reusability**: High reuse across applicable domains

---

## ✏️ **UnifiedInlineEditor Component**

### **Core Implementation**
**File**: `src/components/behaviors/UnifiedInlineEditor.tsx`

**Purpose**: Provides consistent inline editing experience across all data types and domains, eliminating the need for separate modal forms or page navigation.

#### **Type-Safe Configuration**
```typescript
interface InlineEditorProps<T> {
  value: T;
  fieldType: 'text' | 'number' | 'currency' | 'date' | 'email' | 'phone';
  validation?: ValidationRule<T>;
  formatting?: FormatFunction<T>;
  onSave: (newValue: T) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
}
```

#### **Field Type Specializations**

**Text Fields**:
```typescript
// Multi-line text with character limits
<UnifiedInlineEditor
  value={description}
  fieldType="text"
  validation={{
    maxLength: 500,
    required: true
  }}
  onSave={updateDescription}
  placeholder="Enter description..."
/>
```

**Number Fields**:
```typescript
// Quantity with bounds and step validation
<UnifiedInlineEditor
  value={quantity}
  fieldType="number"
  validation={{
    min: 0,
    max: 1000,
    step: 1,
    required: true
  }}
  formatting={{
    suffix: ' items',
    precision: 0
  }}
  onSave={updateQuantity}
/>
```

**Currency Fields**:
```typescript
// Financial data with proper formatting
<UnifiedInlineEditor
  value={price}
  fieldType="currency"
  validation={{
    min: 0,
    max: 99999.99
  }}
  formatting={{
    currency: 'USD',
    locale: 'en-US'
  }}
  onSave={updatePrice}
/>
```

### **Domain Usage Validation**

#### **Stock Market Dashboard** 📈 ✅
**Use Case**: Portfolio quantity adjustments
```typescript
<UnifiedInlineEditor
  value={portfolio.shares}
  fieldType="number"
  validation={{
    min: 0,
    step: 0.01,
    required: true
  }}
  formatting={{
    suffix: ' shares',
    precision: 2
  }}
  onSave={async (newShares) => {
    await updatePortfolio(portfolio.id, { shares: newShares });
    showSuccessToast('Portfolio updated');
  }}
/>
```

#### **Volunteer T-shirt Management** 👕 ✅
**Use Case**: Inventory quantity management
```typescript
<UnifiedInlineEditor
  value={tshirt.quantity}
  fieldType="number"
  validation={{
    min: 0,
    max: 1000,
    step: 1
  }}
  formatting={{
    suffix: ' in stock'
  }}
  onSave={async (newQuantity) => {
    await updateInventory(tshirt.id, newQuantity);
    triggerStockLevelCheck(tshirt.id);
  }}
/>
```

#### **Gita Study Dashboard** 📿 ✅
**Use Case**: Study notes and annotations
```typescript
<UnifiedInlineEditor
  value={note.content}
  fieldType="text"
  validation={{
    maxLength: 1000
  }}
  placeholder="Add your study notes..."
  onSave={async (newContent) => {
    await saveStudyNote(verse.id, newContent);
    updateStudyProgress(verse.chapter);
  }}
/>
```

#### **Product Catalog** 🛍️ ✅
**Use Case**: Price management
```typescript
<UnifiedInlineEditor
  value={product.price}
  fieldType="currency"
  validation={{
    min: 0.01,
    max: 9999.99
  }}
  formatting={{
    currency: 'USD'
  }}
  onSave={async (newPrice) => {
    await updateProductPrice(product.id, newPrice);
    recalculateDiscounts(product.category);
  }}
/>
```

### **Advanced Features**

#### **Validation System**
```typescript
interface ValidationRule<T> {
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean | string;
  maxLength?: number;
  minLength?: number;
}

// Custom validation example
const emailValidation: ValidationRule<string> = {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  custom: (email) => 
    email.includes('@company.com') || 'Must use company email'
};
```

#### **Error Handling & Recovery**
```typescript
const handleSave = async (newValue: T) => {
  try {
    setLoading(true);
    await onSave(newValue);
    setEditMode(false);
    showSuccessFeedback();
  } catch (error) {
    if (error.type === 'validation') {
      setValidationError(error.message);
    } else if (error.type === 'conflict') {
      handleConflictResolution(error.conflicts);
    } else {
      setEditMode(false);
      showErrorDialog('Save failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

#### **Optimistic Updates**
```typescript
const optimisticUpdate = (newValue: T) => {
  // Update UI immediately
  setValue(newValue);
  
  // Save to server
  onSave(newValue).catch((error) => {
    // Revert on failure
    setValue(originalValue);
    showErrorMessage('Failed to save changes');
  });
};
```

---

## 📊 **InventoryBadge Component**

### **Core Implementation**
**File**: `src/components/indicators/InventoryBadge.tsx`

**Purpose**: Provides real-time visual indicators for inventory levels, stock status, and other quantitative metrics with configurable thresholds and color coding.

#### **Configuration System**
```typescript
interface InventoryBadgeProps {
  value: number;
  thresholds: {
    critical: number;
    low: number;
    medium: number;
    high: number;
  };
  displayMode: 'number' | 'percentage' | 'text' | 'icon';
  size: 'sm' | 'md' | 'lg';
  animated?: boolean;
  onClick?: () => void;
  showTooltip?: boolean;
}
```

#### **Visual Variants**
```typescript
const getVariantStyle = (value: number, thresholds: Thresholds) => {
  if (value <= thresholds.critical) return 'critical'; // Red
  if (value <= thresholds.low) return 'low';           // Orange
  if (value <= thresholds.medium) return 'medium';     // Yellow
  return 'high';                                       // Green
};
```

### **Domain Integration Examples**

#### **Volunteer T-shirt Management** 👕 ✅
**Use Case**: T-shirt inventory levels
```typescript
<InventoryBadge
  value={tshirt.quantity}
  thresholds={{
    critical: 5,
    low: 15,
    medium: 30,
    high: 50
  }}
  displayMode="number"
  size="md"
  animated={true}
  showTooltip={true}
  onClick={() => openInventoryDetails(tshirt.id)}
/>

// Tooltip content: "15 XL shirts in stock - Low level"
```

#### **Product Catalog** 🛍️ ✅
**Use Case**: Product availability status
```typescript
<InventoryBadge
  value={product.stock}
  thresholds={{
    critical: 0,
    low: 10,
    medium: 25,
    high: 50
  }}
  displayMode="text"
  size="sm"
  onClick={() => viewStockHistory(product.id)}
/>

// Displays: "In Stock", "Low Stock", "Out of Stock"
```

#### **Stock Market Dashboard** 📈 ✅
**Use Case**: Portfolio performance indicators
```typescript
<InventoryBadge
  value={portfolio.performance}
  thresholds={{
    critical: -10,
    low: -5,
    medium: 5,
    high: 15
  }}
  displayMode="percentage"
  size="lg"
  animated={true}
/>

// Shows: "+12.5%" in green, "-8.2%" in red
```

### **Advanced Features**

#### **Real-Time Updates**
```typescript
const useRealTimeInventory = (itemId: string) => {
  const [inventory, setInventory] = useState<InventoryData>();
  
  useEffect(() => {
    const subscription = subscribeToInventoryUpdates(itemId, (update) => {
      setInventory(update);
      
      // Trigger animations for significant changes
      if (update.levelChanged) {
        triggerLevelChangeAnimation();
      }
      
      // Show notifications for critical levels
      if (update.level === 'critical') {
        showCriticalStockAlert(itemId);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [itemId]);
  
  return inventory;
};
```

#### **Batch Updates**
```typescript
const BatchInventoryDisplay: React.FC<{ items: Item[] }> = ({ items }) => {
  const groupedByLevel = useMemo(() => {
    return items.reduce((groups, item) => {
      const level = getStockLevel(item.quantity, item.thresholds);
      groups[level] = (groups[level] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }, [items]);
  
  return (
    <div className="flex gap-2">
      <InventoryBadge 
        value={groupedByLevel.critical || 0} 
        variant="critical"
        displayMode="text"
        label="Critical Items"
      />
      <InventoryBadge 
        value={groupedByLevel.low || 0} 
        variant="low"
        displayMode="text"
        label="Low Stock"
      />
      <InventoryBadge 
        value={groupedByLevel.high || 0} 
        variant="high"
        displayMode="text"
        label="Well Stocked"
      />
    </div>
  );
};
```

---

## 🎯 **AdvancedFiltering Component**

### **Core Implementation**
**File**: `src/components/behaviors/AdvancedFiltering.tsx`

**Purpose**: Provides sophisticated filtering capabilities that adapt to different data types and business requirements across all domains.

#### **Filter Configuration**
```typescript
interface FilterConfig {
  globalSearch: boolean;
  filters: FilterDefinition[];
  presets?: FilterPreset[];
  saveCustom?: boolean;
}

interface FilterDefinition {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'range' | 'date' | 'boolean';
  options?: SelectOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}
```

#### **Domain-Specific Filter Examples**

**Stock Market Filtering** 📈:
```typescript
const stockFilters: FilterDefinition[] = [
  {
    key: 'sector',
    label: 'Sector',
    type: 'multiselect',
    options: [
      { value: 'technology', label: 'Technology' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'finance', label: 'Finance' }
    ]
  },
  {
    key: 'marketCap',
    label: 'Market Cap',
    type: 'range',
    min: 1000000,
    max: 1000000000000,
    step: 1000000
  },
  {
    key: 'priceChange',
    label: 'Price Change %',
    type: 'range',
    min: -50,
    max: 50,
    step: 0.1
  }
];
```

**Product Catalog Filtering** 🛍️:
```typescript
const productFilters: FilterDefinition[] = [
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: dynamicCategoryOptions
  },
  {
    key: 'price',
    label: 'Price Range',
    type: 'range',
    min: 0,
    max: 1000,
    step: 10
  },
  {
    key: 'rating',
    label: 'Minimum Rating',
    type: 'range',
    min: 1,
    max: 5,
    step: 0.5
  },
  {
    key: 'inStock',
    label: 'In Stock Only',
    type: 'boolean'
  }
];
```

### **Smart Filter Features**

#### **Filter Presets**
```typescript
const filterPresets: FilterPreset[] = [
  {
    id: 'high-performers',
    label: 'High Performers',
    description: 'Stocks with >10% growth',
    filters: {
      priceChange: { min: 10 },
      volume: { min: 1000000 }
    }
  },
  {
    id: 'value-stocks',
    label: 'Value Stocks',
    description: 'Undervalued opportunities',
    filters: {
      peRatio: { max: 15 },
      dividendYield: { min: 3 }
    }
  }
];
```

#### **Saved Custom Filters**
```typescript
const useSavedFilters = (userId: string, domain: string) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  
  const saveFilter = async (name: string, filters: FilterState) => {
    const savedFilter = {
      id: generateId(),
      name,
      filters,
      domain,
      userId,
      createdAt: new Date()
    };
    
    await api.saveFilter(savedFilter);
    setSavedFilters(prev => [...prev, savedFilter]);
  };
  
  const loadFilter = (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      applyFilters(filter.filters);
    }
  };
  
  return { savedFilters, saveFilter, loadFilter };
};
```

---

## 🔄 **OfflineDataLoader Component**

### **Core Implementation**
**File**: `src/components/behaviors/OfflineDataLoader.tsx`

**Purpose**: Handles data loading with offline capability, caching strategies, and graceful degradation for PWA functionality.

#### **Caching Strategy Configuration**
```typescript
interface OfflineLoaderProps<T> {
  dataKey: string;
  fetchFunction: () => Promise<T>;
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  cacheTTL: number;
  fallbackData?: T;
  onError?: (error: Error) => void;
  onCacheHit?: () => void;
  children: (data: T, loading: boolean, error?: Error) => React.ReactNode;
}
```

#### **Smart Caching Logic**
```typescript
const useOfflineData = <T>(
  dataKey: string, 
  fetchFn: () => Promise<T>,
  strategy: CacheStrategy
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useOffline();
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (strategy === 'cache-first') {
        const cached = await getCachedData<T>(dataKey);
        if (cached && !isCacheExpired(cached)) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }
      
      if (isOnline) {
        const freshData = await fetchFn();
        setData(freshData);
        await setCachedData(dataKey, freshData);
      } else {
        const cached = await getCachedData<T>(dataKey);
        if (cached) {
          setData(cached.data);
        } else {
          throw new Error('No offline data available');
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [dataKey, fetchFn, strategy, isOnline]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  return { data, loading, error, refresh: loadData };
};
```

---

## 📊 **Component Reusability Analysis**

### **UnifiedInlineEditor Usage**
| Domain | Use Cases | Customization | Adoption Rate |
|--------|-----------|---------------|---------------|
| **Stock Market** | Portfolio quantities, target prices | Number/currency validation | 100% |
| **Volunteer T-shirts** | Inventory quantities, descriptions | Integer validation, text fields | 100% |
| **Gita Study** | Study notes, annotations | Text validation, character limits | 100% |
| **Product Catalog** | Prices, descriptions | Currency/text validation | 100% |
| **News** | N/A (read-only content) | N/A | 0% |
| **User Directory** | Contact info, notes | Text/email validation | 75% |

**Overall Reuse Rate**: 83% (5/6 domains)

### **InventoryBadge Usage**
| Domain | Use Cases | Threshold Configuration | Adoption Rate |
|--------|-----------|------------------------|---------------|
| **Volunteer T-shirts** | Stock levels, distribution status | Inventory thresholds | 100% |
| **Product Catalog** | Availability, popularity | Stock/rating thresholds | 100% |
| **Stock Market** | Performance indicators | Percentage thresholds | 100% |
| **News** | N/A | N/A | 0% |
| **Gita Study** | Progress indicators | Chapter completion | 50% |
| **User Directory** | Activity status | Login frequency | 25% |

**Overall Reuse Rate**: 63% (applicable where quantitative metrics exist)

---

## 🚀 **Performance Optimization**

### **Component-Level Optimization**
```typescript
// Memoized inline editor to prevent unnecessary re-renders
const OptimizedInlineEditor = React.memo(<T,>(props: InlineEditorProps<T>) => {
  const { value, onSave, validation } = props;
  
  const debouncedValidation = useMemo(
    () => debounce(validation?.custom || (() => true), 300),
    [validation?.custom]
  );
  
  const memoizedSave = useCallback(
    (newValue: T) => onSave(newValue),
    [onSave]
  );
  
  return <InlineEditorImpl {...props} onSave={memoizedSave} />;
});
```

### **Batch Operations**
```typescript
// Efficient batch updates for inventory badges
const BatchInventoryUpdater = () => {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, number>>();
  
  const queueUpdate = useCallback((itemId: string, quantity: number) => {
    setPendingUpdates(prev => new Map(prev).set(itemId, quantity));
  }, []);
  
  // Batch process updates every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingUpdates.size > 0) {
        processBatchUpdates(Array.from(pendingUpdates.entries()));
        setPendingUpdates(new Map());
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [pendingUpdates]);
};
```

---

*Last Updated: August 3, 2025*  
*Behavior components providing intelligent interactions and complex state management across platform domains*