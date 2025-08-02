# Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Generic Data Management Platform, covering unit tests, integration tests, end-to-end tests, and performance testing across all prototypes and platforms.

## Testing Pyramid

```
                    E2E Tests
                  (Cross-browser)
                ├─────────────────┤
              Integration Tests
             (Component + API)
           ├───────────────────────┤
         Unit Tests
      (Functions, Hooks, Utils)
    └─────────────────────────────┘
```

### Test Distribution
- **70% Unit Tests**: Fast, isolated, covering business logic
- **20% Integration Tests**: Component interactions, API integration
- **10% E2E Tests**: Critical user workflows, cross-browser compatibility

## Unit Testing

### 1. Testing Framework Setup
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/*.stories.*',
    '!src/**/*.test.*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ]
};

// src/test/setup.ts
import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));
```

### 2. Business Logic Testing
```typescript
// core/entity/__tests__/engine.test.ts
import { EntityEngine } from '../engine';
import { MockDataAdapter } from '@/test/mocks';

describe('EntityEngine', () => {
  let entityEngine: EntityEngine;
  let mockAdapter: MockDataAdapter;
  
  beforeEach(() => {
    mockAdapter = new MockDataAdapter();
    entityEngine = new EntityEngine();
    entityEngine.registerAdapter('test', mockAdapter);
  });
  
  describe('create', () => {
    it('validates data before creation', async () => {
      const entityDef = {
        name: 'test',
        fields: [
          { name: 'email', type: 'email', required: true, validation: [
            { type: 'required', message: 'Email is required' }
          ]}
        ]
      };
      
      entityEngine.registerEntity(entityDef);
      
      await expect(
        entityEngine.create('test', { name: 'John' })
      ).rejects.toThrow('Email is required');
    });
    
    it('applies business rules before creation', async () => {
      const entityDef = {
        name: 'test',
        fields: [{ name: 'name', type: 'text', required: true }],
        businessRules: [{
          name: 'auto_timestamp',
          trigger: 'before_create',
          conditions: [],
          actions: [{ type: 'setValue', field: 'createdAt', value: '{{now}}' }]
        }]
      };
      
      entityEngine.registerEntity(entityDef);
      mockAdapter.create.mockResolvedValue({ id: '1', data: { name: 'John' }});
      
      await entityEngine.create('test', { name: 'John' });
      
      expect(mockAdapter.create).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          name: 'John',
          createdAt: expect.any(Date)
        })
      );
    });
  });
  
  describe('list', () => {
    it('applies permission filters', async () => {
      const entityDef = {
        name: 'test',
        fields: [{ name: 'name', type: 'text' }],
        permissions: [{
          role: 'user',
          actions: ['read'],
          conditions: [{ field: 'userId', operator: 'eq', value: '{{currentUser.id}}' }]
        }]
      };
      
      entityEngine.registerEntity(entityDef);
      entityEngine.setCurrentUser({ id: 'user123', role: 'user' });
      
      await entityEngine.list('test');
      
      expect(mockAdapter.list).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          filters: expect.arrayContaining([
            { field: 'userId', operator: 'eq', value: 'user123' }
          ])
        })
      );
    });
  });
});
```

### 3. Data Adapter Testing
```typescript
// core/data-adapters/__tests__/alpha-vantage.test.ts
import { AlphaVantageAdapter } from '../alpha-vantage';

describe('AlphaVantageAdapter', () => {
  let adapter: AlphaVantageAdapter;
  
  beforeEach(() => {
    adapter = new AlphaVantageAdapter();
    // Mock fetch
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('get', () => {
    it('fetches stock data successfully', async () => {
      const mockResponse = {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '05. price': '150.00',
          '09. change': '2.50',
          '10. change percent': '1.69%'
        }
      };
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await adapter.get('AAPL');
      
      expect(result).toEqual(
        expect.objectContaining({
          id: 'AAPL',
          entity: 'stocks',
          data: expect.objectContaining({
            symbol: 'AAPL',
            price: 150.00,
            change: 2.50,
            changePercent: '1.69'
          })
        })
      );
    });
    
    it('handles API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(adapter.get('INVALID')).rejects.toThrow(
        'Alpha Vantage API: HTTP 404'
      );
    });
    
    it('respects rate limiting', async () => {
      // Mock multiple calls
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 'Global Quote': {} })
      });
      
      const startTime = Date.now();
      
      // Make 6 calls (exceeds 5 per minute limit)
      const promises = Array.from({ length: 6 }, () => adapter.get('AAPL'));
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // Should have been delayed due to rate limiting
      expect(duration).toBeGreaterThan(1000);
    });
  });
  
  describe('caching', () => {
    it('caches responses', async () => {
      const mockResponse = {
        'Global Quote': { '01. symbol': 'AAPL', '05. price': '150.00' }
      };
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      // First call
      await adapter.get('AAPL');
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      await adapter.get('AAPL');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    it('respects cache TTL', async () => {
      jest.useFakeTimers();
      
      const mockResponse = {
        'Global Quote': { '01. symbol': 'AAPL', '05. price': '150.00' }
      };
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      // First call
      await adapter.get('AAPL');
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Fast forward past TTL
      jest.advanceTimersByTime(70000); // 70 seconds
      
      // Should make new request
      await adapter.get('AAPL');
      expect(fetch).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });
});
```

## Component Testing

### 1. Testing Library Setup
```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/lib/theme';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 2. Component Unit Tests
```typescript
// components/behaviors/__tests__/DataTable.test.tsx
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';

const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
];

const mockColumns = [
  { id: 'name', field: 'name', displayName: 'Name', sortable: true },
  { id: 'email', field: 'email', displayName: 'Email', sortable: true },
  { id: 'role', field: 'role', displayName: 'Role', sortable: false }
];

describe('DataTable', () => {
  it('renders data correctly', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        loading={true}
      />
    );
    
    expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
  
  it('shows empty state when no data', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        loading={false}
      />
    );
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
  
  it('handles column sorting', async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        onSort={onSort}
      />
    );
    
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
    
    // Click again for descending
    await user.click(nameHeader);
    expect(onSort).toHaveBeenCalledWith('name', 'desc');
  });
  
  it('handles row selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        selectable
        onSelectionChange={onSelectionChange}
      />
    );
    
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
    await user.click(firstRowCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });
  
  it('filters data based on search', async () => {
    const user = userEvent.setup();
    
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        searchable
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'jane');
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });
});
```

### 3. Custom Hook Testing
```typescript
// lib/hooks/__tests__/useEntityData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEntityData } from '../useEntityData';
import { entityEngine } from '@/core/entity';

jest.mock('@/core/entity');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useEntityData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('fetches data successfully', async () => {
    const mockData = [
      { id: '1', name: 'Test User', email: 'test@example.com' }
    ];
    
    (entityEngine.list as jest.Mock).mockResolvedValue({
      data: mockData,
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    });
    
    const { result } = renderHook(
      () => useEntityData('users'),
      { wrapper: createWrapper() }
    );
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });
  
  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to fetch data';
    (entityEngine.list as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(
      () => useEntityData('users'),
      { wrapper: createWrapper() }
    );
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toEqual([]);
  });
  
  it('refetches data when options change', async () => {
    const mockData = [{ id: '1', name: 'Test User' }];
    (entityEngine.list as jest.Mock).mockResolvedValue({
      data: mockData,
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    });
    
    const { result, rerender } = renderHook(
      ({ filters }) => useEntityData('users', { filters }),
      {
        initialProps: { filters: [] },
        wrapper: createWrapper()
      }
    );
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(entityEngine.list).toHaveBeenCalledTimes(1);
    
    // Change filters
    rerender({ filters: [{ field: 'name', operator: 'contains', value: 'test' }] });
    
    await waitFor(() => {
      expect(entityEngine.list).toHaveBeenCalledTimes(2);
    });
  });
});
```

## Integration Testing

### 1. Component Integration Tests
```typescript
// domains/stocks/__tests__/StockDashboard.integration.test.tsx
import { render, screen, waitFor } from '@/test/utils';
import { StockDashboard } from '../StockDashboard';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

describe('StockDashboard Integration', () => {
  it('loads and displays stock data', async () => {
    // Mock API response
    server.use(
      rest.get('https://www.alphavantage.co/query', (req, res, ctx) => {
        return res(
          ctx.json({
            'Global Quote': {
              '01. symbol': 'AAPL',
              '05. price': '150.00',
              '09. change': '2.50',
              '10. change percent': '1.69%',
              '06. volume': '1000000'
            }
          })
        );
      })
    );
    
    render(<StockDashboard />);
    
    // Should show loading initially
    expect(screen.getByTestId('stock-dashboard-loading')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('+2.50 (1.69%)')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
  });
  
  it('handles API errors gracefully', async () => {
    // Mock API error
    server.use(
      rest.get('https://www.alphavantage.co/query', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );
    
    render(<StockDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading stock data/i)).toBeInTheDocument();
    });
    
    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
  
  it('updates data in real-time', async () => {
    let callCount = 0;
    
    server.use(
      rest.get('https://www.alphavantage.co/query', (req, res, ctx) => {
        callCount++;
        const price = callCount === 1 ? '150.00' : '152.50';
        
        return res(
          ctx.json({
            'Global Quote': {
              '01. symbol': 'AAPL',
              '05. price': price,
              '09. change': '2.50',
              '10. change percent': '1.69%'
            }
          })
        );
      })
    );
    
    render(<StockDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });
    
    // Simulate real-time update (would normally come from WebSocket)
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    userEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(screen.getByText('$152.50')).toBeInTheDocument();
    });
  });
});
```

### 2. API Integration Tests
```typescript
// core/data-adapters/__tests__/integration.test.ts
import { AlphaVantageAdapter } from '../alpha-vantage';
import { AdapterRegistry } from '../registry';
import { EntityEngine } from '@/core/entity';

describe('Data Adapter Integration', () => {
  let registry: AdapterRegistry;
  let entityEngine: EntityEngine;
  
  beforeEach(() => {
    registry = new AdapterRegistry();
    entityEngine = new EntityEngine();
    
    // Register real adapters
    const alphaVantageAdapter = new AlphaVantageAdapter();
    registry.register('stocks', alphaVantageAdapter);
    
    entityEngine.setAdapterRegistry(registry);
  });
  
  it('integrates adapter with entity engine', async () => {
    // Register entity definition
    entityEngine.registerEntity({
      name: 'stocks',
      displayName: 'Stocks',
      fields: [
        { name: 'symbol', type: 'text', required: true },
        { name: 'price', type: 'number', required: true }
      ]
    });
    
    // Mock successful API response
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        'Global Quote': {
          '01. symbol': 'AAPL',
          '05. price': '150.00'
        }
      })
    });
    
    global.fetch = mockFetch;
    
    // Use entity engine to fetch data
    const result = await entityEngine.get('stocks', 'AAPL');
    
    expect(result).toEqual(
      expect.objectContaining({
        id: 'AAPL',
        entity: 'stocks',
        data: expect.objectContaining({
          symbol: 'AAPL',
          price: 150.00
        })
      })
    );
  });
});
```

## End-to-End Testing

### 1. Playwright Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

### 2. E2E Test Examples
```typescript
// e2e/stock-dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Stock Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stocks');
  });
  
  test('displays stock data correctly', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="stock-table"]');
    
    // Check if stock symbols are displayed
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=GOOGL')).toBeVisible();
    
    // Verify price format
    const priceCell = page.locator('[data-testid="price-AAPL"]');
    await expect(priceCell).toHaveText(/\$\d+\.\d{2}/);
  });
  
  test('sorting functionality works', async ({ page }) => {
    await page.waitForSelector('[data-testid="stock-table"]');
    
    // Click on price column header to sort
    await page.click('[data-testid="header-price"]');
    
    // Wait for sorting to complete
    await page.waitForTimeout(500);
    
    // Check if sort indicator is visible
    await expect(page.locator('[data-testid="sort-indicator-price"]')).toBeVisible();
    
    // Verify data is sorted (first row should have lowest price)
    const firstPrice = await page.locator('[data-testid^="price-"]:first-child').textContent();
    const secondPrice = await page.locator('[data-testid^="price-"]:nth-child(2)').textContent();
    
    const firstValue = parseFloat(firstPrice?.replace('$', '') || '0');
    const secondValue = parseFloat(secondPrice?.replace('$', '') || '0');
    
    expect(firstValue).toBeLessThanOrEqual(secondValue);
  });
  
  test('search functionality works', async ({ page }) => {
    await page.waitForSelector('[data-testid="stock-table"]');
    
    // Type in search box
    await page.fill('[data-testid="search-input"]', 'AAPL');
    
    // Wait for search to filter results
    await page.waitForTimeout(500);
    
    // Should only show AAPL
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=GOOGL')).not.toBeVisible();
  });
  
  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.waitForSelector('[data-testid="stock-table"]');
    
    // Check if mobile-specific elements are visible
    await expect(page.locator('[data-testid="mobile-card-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-table-view"]')).not.toBeVisible();
    
    // Test mobile interactions
    await page.tap('[data-testid="stock-card-AAPL"]');
    await expect(page.locator('[data-testid="stock-details-modal"]')).toBeVisible();
  });
});

// e2e/theme-switching.spec.ts
test.describe('Theme System', () => {
  test('theme switching works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check default theme
    const body = page.locator('body');
    
    // Switch to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(body).toHaveClass(/dark/);
    
    // Switch to light theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(body).toHaveClass(/light/);
    
    // Verify theme persistence after reload
    await page.reload();
    await expect(body).toHaveClass(/light/);
  });
  
  test('respects system theme preference', async ({ page, context }) => {
    // Set dark mode preference
    await context.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('/');
    
    // Should automatically use dark theme
    await expect(page.locator('body')).toHaveClass(/dark/);
  });
});
```

## Performance Testing

### 1. Bundle Size Testing
```typescript
// scripts/bundle-analysis.ts
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';

interface BundleStats {
  size: number;
  gzipSize: number;
  files: string[];
}

function analyzeBundleSize(): BundleStats {
  // Build the project
  execSync('npm run build', { stdio: 'inherit' });
  
  // Get build stats
  const statsJson = JSON.parse(
    readFileSync('dist/stats.json', 'utf-8')
  );
  
  const assets = statsJson.assets.filter((asset: any) => 
    asset.name.endsWith('.js') && !asset.name.includes('chunk')
  );
  
  const totalSize = assets.reduce((sum: number, asset: any) => sum + asset.size, 0);
  const gzipSize = assets.reduce((sum: number, asset: any) => {
    const content = readFileSync(`dist/${asset.name}`);
    return sum + gzipSync(content).length;
  }, 0);
  
  return {
    size: totalSize,
    gzipSize,
    files: assets.map((asset: any) => asset.name)
  };
}

// Test bundle size limits
describe('Bundle Size', () => {
  it('should not exceed size limits', () => {
    const stats = analyzeBundleSize();
    
    expect(stats.gzipSize).toBeLessThan(500 * 1024); // 500KB gzipped
    expect(stats.size).toBeLessThan(1.5 * 1024 * 1024); // 1.5MB uncompressed
  });
});
```

### 2. Performance Metrics Testing
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('meets Core Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              metrics.fcp = navEntry.loadEventStart - navEntry.fetchStart;
              metrics.lcp = navEntry.loadEventEnd - navEntry.fetchStart;
            }
            
            if (entry.entryType === 'layout-shift') {
              metrics.cls = (metrics.cls || 0) + (entry as any).value;
            }
          });
          
          resolve(metrics);
        }).observe({ entryTypes: ['navigation', 'layout-shift'] });
      });
    });
    
    // Assert Core Web Vitals
    expect(metrics.fcp).toBeLessThan(1500); // First Contentful Paint < 1.5s
    expect(metrics.lcp).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
    expect(metrics.cls).toBeLessThan(0.1);  // Cumulative Layout Shift < 0.1
  });
  
  test('handles large datasets efficiently', async ({ page }) => {
    // Navigate to page with large dataset
    await page.goto('/users?limit=1000');
    
    const startTime = Date.now();
    
    // Wait for virtual scrolling to render
    await page.waitForSelector('[data-testid="virtual-list"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check memory usage
    const metrics = await page.evaluate(() => {
      return (performance as any).memory;
    });
    
    // Should not exceed 50MB
    expect(metrics.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Visual Regression Testing

### 1. Storybook Visual Testing
```typescript
// .storybook/test-runner.ts
import { injectAxe, checkA11y } from 'axe-playwright';

module.exports = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  },
};

// stories/DataTable.stories.ts
export default {
  title: 'Components/DataTable',
  component: DataTable,
  parameters: {
    chromatic: {
      viewports: [320, 768, 1200],
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' }
      }
    }
  }
};

export const Default = {
  args: {
    data: mockData,
    columns: mockColumns,
    loading: false
  }
};

export const Loading = {
  args: {
    data: [],
    columns: mockColumns,
    loading: true
  }
};

export const Empty = {
  args: {
    data: [],
    columns: mockColumns,
    loading: false
  }
};
```

## Accessibility Testing

### 1. Automated Accessibility Testing
```typescript
// __tests__/accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DataTable } from '@/components';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('DataTable should not have accessibility violations', async () => {
    const { container } = render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('supports keyboard navigation', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        loading={false}
        selectable
      />
    );
    
    const table = screen.getByRole('table');
    const firstRow = screen.getAllByRole('row')[1]; // Skip header
    
    // Should be focusable
    expect(firstRow).toHaveAttribute('tabIndex', '0');
    
    // Should have proper ARIA labels
    expect(table).toHaveAttribute('aria-label');
    expect(firstRow).toHaveAttribute('aria-selected', 'false');
  });
});
```

## Continuous Integration

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run chromatic
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## Test Data Management

### 1. Mock Data Factory
```typescript
// test/factories/index.ts
import { faker } from '@faker-js/faker';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(['admin', 'editor', 'viewer']),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides
});

export const createMockStockData = (overrides?: Partial<StockData>): StockData => ({
  symbol: faker.finance.currencyCode(),
  name: faker.company.name(),
  price: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
  change: faker.number.float({ min: -10, max: 10, fractionDigits: 2 }),
  changePercent: faker.number.float({ min: -5, max: 5, fractionDigits: 2 }).toFixed(2) + '%',
  volume: faker.number.int({ min: 100000, max: 10000000 }),
  ...overrides
});

export const createMockEntityRecord = (entityType: string, data?: any): EntityRecord => ({
  id: faker.string.uuid(),
  entity: entityType,
  data: data || {},
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent()
});
```

---

*This comprehensive testing strategy ensures high code quality, reliability, and user experience across all platforms and devices.*