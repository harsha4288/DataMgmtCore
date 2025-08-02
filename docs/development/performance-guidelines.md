# Performance Guidelines

## Overview

This document outlines performance optimization strategies and guidelines for building high-performance, native-like experiences across all prototypes of the Generic Data Management Platform.

## Performance Targets

### Core Web Vitals
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3 seconds

### Platform-Specific Targets
- **Bundle Size**: < 500KB gzipped (initial load)
- **Memory Usage**: < 50MB typical usage
- **Frame Rate**: 60fps for animations and interactions
- **Cache Hit Rate**: > 90% for frequently accessed data

## React Performance Optimization

### 1. Component Memoization Strategy

#### Strategic Component Memoization
```typescript
// ✅ Good: Memoize expensive components
const DataTableRow = memo(({ record, columns, onUpdate }: DataTableRowProps) => {
  const handleUpdate = useCallback((field: string, value: any) => {
    onUpdate(record.id, { [field]: value });
  }, [record.id, onUpdate]);
  
  return (
    <tr>
      {columns.map(column => (
        <TableCell 
          key={column.id}
          value={record.data[column.field]}
          onChange={handleUpdate}
        />
      ))}
    </tr>
  );
});

// ✅ Good: Custom comparison for complex props
const ChartComponent = memo(({ data, config }: ChartProps) => {
  // Expensive chart rendering logic
  return <Chart data={data} config={config} />;
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.config.chartType === nextProps.config.chartType &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

// ❌ Bad: Over-memoization of simple components
const SimpleButton = memo(({ children, onClick }: ButtonProps) => (
  <button onClick={onClick}>{children}</button>
));
```

#### Hook Optimization
```typescript
// ✅ Good: Stable callback references
function DataTable({ data, onSort }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });
  
  const handleSort = useCallback((field: string) => {
    const direction = sortConfig.field === field && sortConfig.direction === 'asc' 
      ? 'desc' 
      : 'asc';
    
    setSortConfig({ field, direction });
    onSort?.(field, direction);
  }, [sortConfig.field, sortConfig.direction, onSort]);
  
  const sortedData = useMemo(() => {
    if (!sortConfig.field) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a.data[sortConfig.field];
      const bValue = b.data[sortConfig.field];
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [data, sortConfig]);
  
  return (
    <table>
      {/* Table implementation */}
    </table>
  );
}

// ❌ Bad: Unstable references causing re-renders
function BadDataTable({ data }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });
  
  // New function on every render
  const handleSort = (field: string) => {
    setSortConfig({ field, direction: 'asc' });
  };
  
  // Expensive computation on every render
  const sortedData = data.sort((a, b) => {
    return a.data[sortConfig.field] > b.data[sortConfig.field] ? 1 : -1;
  });
  
  return <table>{/* Implementation */}</table>;
}
```

### 2. React 18 Concurrent Features

#### Transitions for Non-Critical Updates
```typescript
import { startTransition, useDeferredValue } from 'react';

function SearchInterface() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery); // Urgent - update input immediately
    
    startTransition(() => {
      // Non-urgent - can be interrupted by more important updates
      const searchResults = performExpensiveSearch(newQuery);
      setResults(searchResults);
    });
  };
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {isPending && <SearchSpinner />}
      <SearchResults results={results} />
    </div>
  );
}

// Deferred values for expensive computations
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => 
    expensiveSearch(deferredQuery), [deferredQuery]
  );
  
  return (
    <div>
      {query !== deferredQuery && <div>Searching...</div>}
      <ResultsList results={results} />
    </div>
  );
}
```

#### Suspense for Code Splitting
```typescript
// Lazy load heavy components
const StockChart = lazy(() => 
  import('./StockChart').then(module => ({
    default: module.StockChart
  }))
);

const NewsEditor = lazy(() => import('./NewsEditor'));

function DomainRouter() {
  return (
    <Routes>
      <Route path="/stocks/*" element={
        <Suspense fallback={<ChartSkeleton />}>
          <StockChart />
        </Suspense>
      } />
      <Route path="/news/editor" element={
        <Suspense fallback={<EditorSkeleton />}>
          <NewsEditor />
        </Suspense>
      } />
    </Routes>
  );
}
```

## Virtual Scrolling Implementation

### 1. @tanstack/react-virtual Integration
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedDataTable({ data, columns }: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 15, // Render extra items for smooth scrolling
    
    // Dynamic sizing for variable content
    measureElement: (element) => {
      return element?.getBoundingClientRect().height ?? 50;
    }
  });
  
  return (
    <div
      ref={parentRef}
      className="h-96 overflow-auto"
      style={{ contain: 'strict' }} // Optimize for performance
    >
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
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
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

### 2. Windowed Lists for Large Datasets
```typescript
import { FixedSizeList as List } from 'react-window';

interface WindowedListProps {
  items: any[];
  itemHeight: number;
  height: number;
  renderItem: (props: any) => JSX.Element;
}

function WindowedList({ items, itemHeight, height, renderItem }: WindowedListProps) {
  const ItemRenderer = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      {renderItem({ item: items[index], index })}
    </div>
  );
  
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={10}
    >
      {ItemRenderer}
    </List>
  );
}

// Usage with infinite loading
function InfiniteScrollList({ loadMore, hasNextPage, isLoading }: InfiniteListProps) {
  const [items, setItems] = useState([]);
  
  const loadMoreItems = useCallback(async () => {
    if (isLoading || !hasNextPage) return;
    
    const newItems = await loadMore();
    setItems(prev => [...prev, ...newItems]);
  }, [loadMore, hasNextPage, isLoading]);
  
  // Intersection observer for infinite scroll
  const { ref: loadMoreRef } = useIntersectionObserver({
    onChange: (isIntersecting) => {
      if (isIntersecting) {
        loadMoreItems();
      }
    }
  });
  
  return (
    <div>
      <WindowedList
        items={items}
        itemHeight={80}
        height={600}
        renderItem={({ item }) => <ItemCard item={item} />}
      />
      <div ref={loadMoreRef}>
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
}
```

## Bundle Optimization

### 1. Code Splitting Strategies
```typescript
// Route-based code splitting
const StockDashboard = lazy(() => 
  import('@/domains/stocks/StockDashboard')
);

const NewsManager = lazy(() =>
  import('@/domains/news/NewsManager')  
);

// Component-based code splitting
const ChartLibrary = lazy(() => 
  import('@/components/charts/ChartLibrary')
);

// Feature-based code splitting
const AdvancedFilters = lazy(() =>
  import('@/features/advanced-filters/AdvancedFilters')
);

// Library code splitting
const loadChartJS = () => import('chart.js');
const loadDateFns = () => import('date-fns');

// Dynamic imports in event handlers
async function handleExportData() {
  const { exportToExcel } = await import('@/utils/export');
  await exportToExcel(data);
}
```

### 2. Tree Shaking Optimization
```typescript
// ✅ Good: Named imports for tree shaking
import { format, parseISO, isValid } from 'date-fns';
import { debounce, throttle } from 'lodash-es';
import { Chart, LineElement, PointElement } from 'chart.js';

// ✅ Good: Side-effect free imports
import { calculateTotal } from '@/utils/calculations';
import { formatCurrency } from '@/utils/formatters';

// ❌ Bad: Default imports prevent tree shaking
import _ from 'lodash';
import * as dateFns from 'date-fns';
import moment from 'moment';

// ✅ Good: Conditional polyfill loading
async function loadPolyfills() {
  if (!window.ResizeObserver) {
    await import('resize-observer-polyfill');
  }
  
  if (!window.IntersectionObserver) {
    await import('intersection-observer');
  }
}
```

### 3. Bundle Analysis
```typescript
// webpack-bundle-analyzer configuration
// vite.config.ts
import { defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    analyzer({
      analyzerMode: 'server',
      openAnalyzer: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['date-fns', 'lodash-es']
        }
      }
    }
  }
});

// Bundle size monitoring
export function analyzeBundleSize() {
  const stats = {
    mainBundle: 0,
    vendorBundle: 0,
    asyncChunks: 0
  };
  
  // Implementation for analyzing build output
  return stats;
}

// Performance budget in CI
const PERFORMANCE_BUDGET = {
  maxBundleSize: 500 * 1024, // 500KB
  maxVendorSize: 200 * 1024, // 200KB
  maxAsyncChunk: 100 * 1024  // 100KB
};
```

## Caching Strategies

### 1. TanStack Query Optimization
```typescript
// Optimized query configuration
export const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      }
    }
  }
};

// Prefetching strategies
function useEntityPrefetch() {
  const queryClient = useQueryClient();
  
  const prefetchRelatedEntities = useCallback(async (entityType: string, recordId: string) => {
    const entityDef = getEntityDefinition(entityType);
    
    // Prefetch related entities
    const prefetchPromises = entityDef.relationships.map(rel => {
      return queryClient.prefetchQuery({
        queryKey: ['entity', rel.targetEntity, { relatedTo: recordId }],
        queryFn: () => fetchRelatedEntities(rel.targetEntity, recordId)
      });
    });
    
    await Promise.all(prefetchPromises);
  }, [queryClient]);
  
  return { prefetchRelatedEntities };
}

// Background data synchronization
function useBackgroundSync() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const syncInterval = setInterval(() => {
      // Invalidate stale queries in background
      queryClient.invalidateQueries({
        predicate: (query) => {
          const lastFetch = query.state.dataUpdatedAt;
          const now = Date.now();
          return now - lastFetch > 10 * 60 * 1000; // 10 minutes
        }
      });
    }, 60 * 1000); // Check every minute
    
    return () => clearInterval(syncInterval);
  }, [queryClient]);
}
```

### 2. Service Worker Caching
```typescript
// service-worker.ts
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        // Custom cache key generation
        return `${request.url}?v=${Date.now()}`;
      }
    }]
  })
);

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [{
      cacheExpiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      }
    }]
  })
);

// Cache navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [{
      cacheExpiration: {
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 1 day
      }
    }]
  })
);
```

## Image and Asset Optimization

### 1. Responsive Image Loading
```typescript
import { LazyLoadImage } from 'react-lazy-load-image-component';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
}

function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  sizes = '100vw',
  priority = false 
}: OptimizedImageProps) {
  // Generate responsive image sources
  const srcSet = [
    `${src}?w=400 400w`,
    `${src}?w=800 800w`,
    `${src}?w=1200 1200w`,
    `${src}?w=1600 1600w`
  ].join(', ');
  
  if (priority) {
    // Load immediately for above-the-fold images
    return (
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading="eager"
        decoding="sync"
      />
    );
  }
  
  return (
    <LazyLoadImage
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      effect="blur"
      placeholderSrc={`${src}?w=10&blur=10`}
    />
  );
}

// Image preloading hook
function useImagePreloader(imageSources: string[]) {
  useEffect(() => {
    const preloadedImages: HTMLImageElement[] = [];
    
    imageSources.forEach(src => {
      const img = new Image();
      img.src = src;
      preloadedImages.push(img);
    });
    
    return () => {
      preloadedImages.forEach(img => {
        img.src = '';
      });
    };
  }, [imageSources]);
}
```

### 2. Font Optimization
```css
/* Optimized font loading */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap; /* Prevent invisible text */
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-var.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}

/* Preload critical fonts */
/* <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin> */
```

## Animation Performance

### 1. CSS Transform Optimization
```css
/* ✅ Good: GPU-accelerated transforms */
.smooth-animation {
  transform: translateX(0);
  transition: transform 0.3s ease-out;
  will-change: transform; /* Hint for GPU optimization */
}

.smooth-animation.active {
  transform: translateX(100px);
}

/* ✅ Good: Composite layer optimization */
.gpu-optimized {
  transform: translateZ(0); /* Force GPU layer */
  backface-visibility: hidden;
  perspective: 1000;
}

/* ❌ Bad: Layout-triggering animations */
.expensive-animation {
  transition: width 0.3s ease-out; /* Triggers layout */
}

/* ❌ Bad: Paint-triggering animations */
.paint-heavy {
  transition: background-color 0.3s ease-out; /* Triggers paint */
}
```

### 2. Framer Motion Optimization
```typescript
import { motion, useReducedMotion } from 'framer-motion';

// Respect user's motion preferences
function AnimatedComponent({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  
  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      // Optimize for performance
      style={{ willChange: shouldReduceMotion ? 'auto' : 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

// Optimized list animations
function AnimatedList({ items }: { items: any[] }) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.ul layout={!shouldReduceMotion}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
            transition={{ 
              duration: shouldReduceMotion ? 0 : 0.2,
              delay: shouldReduceMotion ? 0 : index * 0.05 
            }}
            layout={!shouldReduceMotion}
          >
            {item.content}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
```

## Memory Management

### 1. Memory Leak Prevention
```typescript
// Cleanup subscriptions and timers
function useDataSubscription(entityType: string) {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const subscription = dataService.subscribe(entityType, setData);
    
    return () => {
      subscription.unsubscribe(); // Prevent memory leaks
    };
  }, [entityType]);
  
  return data;
}

// Abort controllers for cancelled requests
function useAbortableEffect(
  effect: (signal: AbortSignal) => Promise<void>,
  deps: any[]
) {
  useEffect(() => {
    const abortController = new AbortController();
    
    effect(abortController.signal).catch(err => {
      if (err.name !== 'AbortError') {
        console.error('Effect error:', err);
      }
    });
    
    return () => {
      abortController.abort();
    };
  }, deps);
}

// WeakMap for object associations
const componentDataCache = new WeakMap();

function useComponentCache<T>(component: object, factory: () => T): T {
  if (!componentDataCache.has(component)) {
    componentDataCache.set(component, factory());
  }
  return componentDataCache.get(component);
}
```

### 2. Large Dataset Handling
```typescript
// Pagination for large datasets
function usePaginatedData(entityType: string, pageSize = 50) {
  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState<any[]>([]);
  
  const { data, isLoading, hasNextPage } = useInfiniteQuery({
    queryKey: ['entity', entityType, 'paginated'],
    queryFn: ({ pageParam = 1 }) => 
      entityEngine.list(entityType, { 
        page: pageParam, 
        limit: pageSize 
      }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.pagination.hasNextPage 
        ? pages.length + 1 
        : undefined;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Flatten all data for easy consumption
      flatData: data.pages.flatMap(page => page.data)
    })
  });
  
  return {
    data: data?.flatData || [],
    isLoading,
    hasNextPage,
    fetchNextPage,
    currentPage,
    setCurrentPage
  };
}

// Memory-efficient search
function useSearchWithIndexing(data: any[], searchFields: string[]) {
  const searchIndex = useMemo(() => {
    // Create search index for better performance
    const index = new Map();
    
    data.forEach((item, idx) => {
      searchFields.forEach(field => {
        const value = item[field]?.toLowerCase() || '';
        const words = value.split(' ');
        
        words.forEach(word => {
          if (!index.has(word)) {
            index.set(word, new Set());
          }
          index.get(word).add(idx);
        });
      });
    });
    
    return index;
  }, [data, searchFields]);
  
  const search = useCallback((query: string) => {
    if (!query.trim()) return data;
    
    const queryWords = query.toLowerCase().split(' ');
    const matchingIndices = new Set<number>();
    
    queryWords.forEach(word => {
      const indices = searchIndex.get(word);
      if (indices) {
        indices.forEach(idx => matchingIndices.add(idx));
      }
    });
    
    return Array.from(matchingIndices).map(idx => data[idx]);
  }, [data, searchIndex]);
  
  return search;
}
```

## Performance Monitoring

### 1. Runtime Performance Monitoring
```typescript
// Performance monitoring hook
function usePerformanceMonitor() {
  const measurePerformance = useCallback((name: string, fn: () => void) => {
    const startTime = performance.now();
    
    fn();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log slow operations
    if (duration > 16.67) { // > 1 frame at 60fps
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_timing', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(duration)
      });
    }
  }, []);
  
  return { measurePerformance };
}

// Component render time tracking
function withPerformanceTracking<P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const renderStartTime = useRef<number>();
    
    renderStartTime.current = performance.now();
    
    useEffect(() => {
      const renderTime = performance.now() - renderStartTime.current!;
      
      if (renderTime > 16) {
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    });
    
    return <WrappedComponent {...props} />;
  };
}
```

### 2. Bundle Performance Tracking
```typescript
// Bundle loading performance
function trackBundlePerformance() {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        const timing = entry as PerformanceNavigationTiming;
        
        // Track key metrics
        const metrics = {
          fcp: timing.responseStart - timing.fetchStart,
          lcp: timing.loadEventEnd - timing.fetchStart,
          domInteractive: timing.domInteractive - timing.fetchStart,
          domComplete: timing.domComplete - timing.fetchStart
        };
        
        // Send to analytics
        Object.entries(metrics).forEach(([key, value]) => {
          if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
              name: key,
              value: Math.round(value)
            });
          }
        });
      }
    });
  });
  
  observer.observe({ entryTypes: ['navigation'] });
  
  return () => observer.disconnect();
}

// Real User Monitoring (RUM)
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only recent values
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      mean: values.reduce((sum, v) => sum + v, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }
}
```

## Performance Testing

### 1. Lighthouse CI Integration
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### 2. Performance Budget Testing
```typescript
// performance-budget.test.ts
import { chromium } from 'playwright';

describe('Performance Budget', () => {
  it('meets bundle size requirements', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Monitor network requests
    const responses: any[] = [];
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        size: response.request().postData()?.length || 0,
        contentType: response.headers()['content-type']
      });
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Calculate bundle sizes
    const jsResponses = responses.filter(r => 
      r.contentType?.includes('javascript')
    );
    
    const totalJSSize = jsResponses.reduce((sum, r) => sum + r.size, 0);
    
    expect(totalJSSize).toBeLessThan(500 * 1024); // 500KB limit
    
    await browser.close();
  });
  
  it('meets Core Web Vitals thresholds', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000');
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      });
    });
    
    expect(metrics.fcp).toBeLessThan(1500); // 1.5s
    expect(metrics.lcp).toBeLessThan(2500); // 2.5s
    
    await browser.close();
  });
});
```

---

*These performance guidelines ensure that the Generic Data Management Platform delivers native-like experiences across all devices and network conditions while maintaining developer productivity and code maintainability.*