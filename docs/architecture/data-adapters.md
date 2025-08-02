# Data Adapter Architecture

## Overview

Data Adapters provide a unified interface for integrating with external APIs, databases, and services. They abstract away the complexities of different data sources while providing consistent CRUD operations, caching, error handling, and transformation capabilities.

## Core Architecture

### Base Adapter Interface
```typescript
interface DataAdapter<T = any> {
  // Metadata
  name: string;
  version: string;
  description: string;
  
  // Data operations
  list(params?: ListParams): Promise<PaginatedResponse<T>>;
  get(id: string): Promise<T>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  
  // Search and filtering
  search(query: string, filters?: FilterConfig): Promise<T[]>;
  filter(filters: FilterConfig): Promise<T[]>;
  
  // Real-time capabilities (optional)
  subscribe?(callback: (data: T[]) => void): () => void;
  
  // Data transformation
  transformToEntity(apiData: any): EntityRecord;
  transformFromEntity(entityData: EntityRecord): any;
  
  // Schema definition
  getEntityDefinition(): EntityDefinition;
  
  // Configuration
  getCacheConfig(): CacheConfig;
  getRetryConfig(): RetryConfig;
}
```

### Base Adapter Implementation
```typescript
abstract class BaseDataAdapter<T = any> implements DataAdapter<T> {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  
  protected cache: Map<string, CacheEntry> = new Map();
  protected retryConfig: RetryConfig = {
    maxAttempts: 3,
    backoffMultiplier: 2,
    baseDelay: 1000
  };
  
  // Cache management
  protected getCachedData<R>(key: string): R | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as R;
  }
  
  protected setCachedData<R>(key: string, data: R, ttl: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000
    });
  }
  
  // Retry mechanism
  protected async withRetry<R>(operation: () => Promise<R>): Promise<R> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retryConfig.maxAttempts) {
          throw error;
        }
        
        const delay = this.retryConfig.baseDelay * 
          Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Rate limiting
  protected rateLimiter = new Map<string, number>();
  
  protected async checkRateLimit(endpoint: string, requestsPerMinute: number): Promise<void> {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000;
    const key = `${endpoint}:${windowStart}`;
    
    const currentCount = this.rateLimiter.get(key) || 0;
    if (currentCount >= requestsPerMinute) {
      const waitTime = windowStart + 60000 - now;
      await this.sleep(waitTime);
    }
    
    this.rateLimiter.set(key, currentCount + 1);
  }
  
  // Error handling
  protected handleError(error: any, context: string): Error {
    if (error.response) {
      // HTTP error
      return new DataAdapterError(
        `${context}: ${error.response.status} ${error.response.statusText}`,
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      // Network error
      return new DataAdapterError(
        `${context}: Network error`,
        0,
        { message: 'Network request failed' }
      );
    } else {
      // Other error
      return new DataAdapterError(
        `${context}: ${error.message}`,
        -1,
        { originalError: error }
      );
    }
  }
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}

interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  baseDelay: number;
}

class DataAdapterError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message);
    this.name = 'DataAdapterError';
  }
}
```

## Adapter Types

### 1. REST API Adapter
For standard REST APIs with JSON responses.

```typescript
class RestApiAdapter<T> extends BaseDataAdapter<T> {
  constructor(
    protected baseUrl: string,
    protected apiKey?: string,
    protected headers: Record<string, string> = {}
  ) {
    super();
  }
  
  async list(params?: ListParams): Promise<PaginatedResponse<T>> {
    const cacheKey = `list:${JSON.stringify(params)}`;
    const cached = this.getCachedData<PaginatedResponse<T>>(cacheKey);
    if (cached) return cached;
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.sort) queryParams.set('sort', params.sort);
    if (params?.order) queryParams.set('order', params.order);
    
    const url = `${this.baseUrl}?${queryParams.toString()}`;
    
    return this.withRetry(async () => {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
          ...this.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const result = this.transformListResponse(data);
      
      this.setCachedData(cacheKey, result, this.getCacheConfig().ttl);
      return result;
    });
  }
  
  async get(id: string): Promise<T> {
    const cacheKey = `get:${id}`;
    const cached = this.getCachedData<T>(cacheKey);
    if (cached) return cached;
    
    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
          ...this.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const result = this.transformItemResponse(data);
      
      this.setCachedData(cacheKey, result, this.getCacheConfig().ttl);
      return result;
    });
  }
  
  async create(data: Omit<T, 'id'>): Promise<T> {
    return this.withRetry(async () => {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
          ...this.headers
        },
        body: JSON.stringify(this.transformFromEntity(data as any))
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      return this.transformItemResponse(responseData);
    });
  }
  
  async update(id: string, changes: Partial<T>): Promise<T> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
          ...this.headers
        },
        body: JSON.stringify(this.transformFromEntity(changes as any))
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Invalidate cache
      this.cache.delete(`get:${id}`);
      
      return this.transformItemResponse(data);
    });
  }
  
  async delete(id: string): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
          ...this.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Invalidate cache
      this.cache.delete(`get:${id}`);
    });
  }
  
  protected abstract transformListResponse(data: any): PaginatedResponse<T>;
  protected abstract transformItemResponse(data: any): T;
}
```

### 2. GraphQL Adapter
For GraphQL APIs with type-safe queries.

```typescript
class GraphQLAdapter<T> extends BaseDataAdapter<T> {
  constructor(
    protected endpoint: string,
    protected apiKey?: string
  ) {
    super();
  }
  
  async executeQuery<R>(query: string, variables?: any): Promise<R> {
    return this.withRetry(async () => {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
        },
        body: JSON.stringify({ query, variables })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }
      
      return result.data;
    });
  }
  
  async list(params?: ListParams): Promise<PaginatedResponse<T>> {
    const query = this.buildListQuery();
    const variables = this.buildListVariables(params);
    
    const data = await this.executeQuery(query, variables);
    return this.transformListResponse(data);
  }
  
  protected abstract buildListQuery(): string;
  protected abstract buildListVariables(params?: ListParams): any;
  protected abstract transformListResponse(data: any): PaginatedResponse<T>;
}
```

### 3. WebSocket Adapter
For real-time data sources.

```typescript
class WebSocketAdapter<T> extends BaseDataAdapter<T> {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, (data: T[]) => void> = new Map();
  
  constructor(
    protected wsUrl: string,
    protected restUrl: string,
    protected apiKey?: string
  ) {
    super();
    this.initWebSocket();
  }
  
  private initWebSocket(): void {
    this.ws = new WebSocket(this.wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Send authentication if needed
      if (this.apiKey) {
        this.ws!.send(JSON.stringify({ type: 'auth', token: this.apiKey }));
      }
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => this.initWebSocket(), 5000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private handleWebSocketMessage(message: any): void {
    const { type, entity, data } = message;
    
    if (type === 'update' && this.subscribers.has(entity)) {
      const callback = this.subscribers.get(entity)!;
      const transformedData = Array.isArray(data) 
        ? data.map(item => this.transformToEntity(item))
        : [this.transformToEntity(data)];
      callback(transformedData);
    }
  }
  
  subscribe(entityType: string, callback: (data: T[]) => void): () => void {
    this.subscribers.set(entityType, callback);
    
    // Subscribe to entity updates via WebSocket
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', entity: entityType }));
    }
    
    return () => {
      this.subscribers.delete(entityType);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'unsubscribe', entity: entityType }));
      }
    };
  }
  
  // Fallback to REST API for CRUD operations
  async list(params?: ListParams): Promise<PaginatedResponse<T>> {
    // Use REST API as fallback
    const restAdapter = new RestApiAdapter<T>(this.restUrl, this.apiKey);
    return restAdapter.list(params);
  }
}
```

## Specific Adapter Implementations

### Alpha Vantage Stock Adapter
```typescript
interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: Date;
}

class AlphaVantageAdapter extends BaseDataAdapter<StockData> {
  name = 'Alpha Vantage Stock Data';
  version = '1.0.0';
  description = 'Real-time and historical stock market data';
  
  private apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  private baseUrl = 'https://www.alphavantage.co/query';
  
  async list(params?: ListParams): Promise<PaginatedResponse<StockData>> {
    // Alpha Vantage doesn't have a list endpoint, so we use popular symbols
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    const limit = params?.limit || 10;
    const page = params?.page || 1;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pageSymbols = symbols.slice(startIndex, endIndex);
    
    const promises = pageSymbols.map(symbol => this.get(symbol));
    const data = await Promise.all(promises);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total: symbols.length,
        totalPages: Math.ceil(symbols.length / limit)
      }
    };
  }
  
  async get(symbol: string): Promise<StockData> {
    const cacheKey = `stock:${symbol}`;
    const cached = this.getCachedData<StockData>(cacheKey);
    if (cached) return cached;
    
    await this.checkRateLimit('global_quote', 5); // 5 requests per minute
    
    return this.withRetry(async () => {
      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw this.handleError(new Error(`HTTP ${response.status}`), 'Alpha Vantage API');
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new DataAdapterError('Invalid symbol or API limit exceeded', 400, data);
      }
      
      const stockData = this.transformToEntity(data) as StockData;
      this.setCachedData(cacheKey, stockData, 60); // Cache for 1 minute
      
      return stockData;
    });
  }
  
  async search(query: string): Promise<StockData[]> {
    await this.checkRateLimit('symbol_search', 5);
    
    return this.withRetry(async () => {
      const url = `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw this.handleError(new Error(`HTTP ${response.status}`), 'Alpha Vantage Search');
      }
      
      const data = await response.json();
      const matches = data.bestMatches || [];
      
      // Get detailed data for top 5 matches
      const symbols = matches.slice(0, 5).map((match: any) => match['1. symbol']);
      const promises = symbols.map((symbol: string) => this.get(symbol));
      
      return Promise.all(promises);
    });
  }
  
  transformToEntity(apiData: any): EntityRecord {
    const quote = apiData['Global Quote'] || {};
    
    return {
      id: quote['01. symbol'] || '',
      entity: 'stocks',
      data: {
        symbol: quote['01. symbol'],
        name: quote['01. symbol'], // API doesn't provide company name
        price: parseFloat(quote['05. price'] || '0'),
        change: parseFloat(quote['09. change'] || '0'),
        changePercent: quote['10. change percent']?.replace(/[%]/g, ''),
        volume: parseInt(quote['06. volume'] || '0'),
        high: parseFloat(quote['03. high'] || '0'),
        low: parseFloat(quote['04. low'] || '0'),
        open: parseFloat(quote['02. open'] || '0'),
        previousClose: parseFloat(quote['08. previous close'] || '0'),
        lastUpdated: new Date(quote['07. latest trading day'])
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  transformFromEntity(entityData: EntityRecord): any {
    // Not applicable for read-only stock data
    return entityData.data;
  }
  
  getEntityDefinition(): EntityDefinition {
    return {
      name: 'stocks',
      displayName: 'Stock Data',
      description: 'Real-time stock market data',
      fields: [
        {
          name: 'symbol',
          type: 'text',
          displayName: 'Symbol',
          required: true,
          validation: [{ type: 'required', message: 'Symbol is required' }],
          displayOptions: { width: 100, sortable: true }
        },
        // ... more field definitions
      ],
      relationships: [],
      permissions: [
        { role: 'viewer', actions: ['read'] },
        { role: 'analyst', actions: ['read', 'export'] }
      ],
      businessRules: []
    };
  }
  
  getCacheConfig(): CacheConfig {
    return {
      ttl: 60,              // 1 minute cache
      maxSize: 1000,
      strategy: 'ttl',
      invalidateOn: []
    };
  }
  
  // Read-only adapter - these operations are not supported
  async create(): Promise<StockData> {
    throw new Error('Creating stocks is not supported');
  }
  
  async update(): Promise<StockData> {
    throw new Error('Updating stocks is not supported');
  }
  
  async delete(): Promise<void> {
    throw new Error('Deleting stocks is not supported');
  }
}
```

### News API Adapter
```typescript
interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  source: string;
  publishedAt: Date;
  imageUrl?: string;
  category: string;
  tags: string[];
}

class NewsApiAdapter extends RestApiAdapter<NewsArticle> {
  name = 'News API';
  version = '1.0.0';
  description = 'Global news articles from multiple sources';
  
  constructor(apiKey: string) {
    super('https://newsapi.org/v2', apiKey, {
      'X-API-Key': apiKey
    });
  }
  
  async list(params?: ListParams): Promise<PaginatedResponse<NewsArticle>> {
    const queryParams = new URLSearchParams({
      country: 'us',
      category: 'business',
      pageSize: (params?.limit || 10).toString(),
      page: (params?.page || 1).toString()
    });
    
    const url = `${this.baseUrl}/top-headlines?${queryParams}`;
    
    return this.withRetry(async () => {
      const response = await fetch(url, { headers: this.headers });
      
      if (!response.ok) {
        throw this.handleError(new Error(`HTTP ${response.status}`), 'News API');
      }
      
      const data = await response.json();
      return this.transformListResponse(data);
    });
  }
  
  protected transformListResponse(data: any): PaginatedResponse<NewsArticle> {
    const articles = data.articles.map((article: any) => ({
      id: this.generateId(article.url),
      title: article.title,
      description: article.description,
      content: article.content,
      author: article.author || 'Unknown',
      source: article.source.name,
      publishedAt: new Date(article.publishedAt),
      imageUrl: article.urlToImage,
      category: 'business',
      tags: []
    }));
    
    return {
      data: articles,
      pagination: {
        page: 1,
        limit: articles.length,
        total: data.totalResults,
        totalPages: Math.ceil(data.totalResults / articles.length)
      }
    };
  }
  
  protected transformItemResponse(data: any): NewsArticle {
    return {
      id: this.generateId(data.url),
      title: data.title,
      description: data.description,
      content: data.content,
      author: data.author || 'Unknown',
      source: data.source.name,
      publishedAt: new Date(data.publishedAt),
      imageUrl: data.urlToImage,
      category: 'business',
      tags: []
    };
  }
  
  private generateId(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
  
  transformToEntity(apiData: any): EntityRecord {
    return {
      id: this.generateId(apiData.url),
      entity: 'news',
      data: this.transformItemResponse(apiData),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  transformFromEntity(entityData: EntityRecord): any {
    return entityData.data;
  }
  
  getEntityDefinition(): EntityDefinition {
    return {
      name: 'news',
      displayName: 'News Articles',
      description: 'News articles from various sources',
      fields: [
        {
          name: 'title',
          type: 'text',
          displayName: 'Title',
          required: true,
          displayOptions: { width: 300, sortable: true }
        },
        {
          name: 'author',
          type: 'text',
          displayName: 'Author',
          displayOptions: { width: 150, sortable: true }
        },
        {
          name: 'source',
          type: 'text',
          displayName: 'Source',
          displayOptions: { width: 120, sortable: true }
        },
        {
          name: 'publishedAt',
          type: 'datetime',
          displayName: 'Published',
          displayOptions: { width: 150, sortable: true }
        }
      ],
      relationships: [],
      permissions: [
        { role: 'viewer', actions: ['read'] },
        { role: 'editor', actions: ['read', 'update'] }
      ],
      businessRules: []
    };
  }
  
  getCacheConfig(): CacheConfig {
    return {
      ttl: 300,             // 5 minutes cache
      maxSize: 500,
      strategy: 'ttl',
      invalidateOn: []
    };
  }
}
```

## Adapter Management

### Adapter Registry
```typescript
class AdapterRegistry {
  private adapters: Map<string, DataAdapter> = new Map();
  
  register(name: string, adapter: DataAdapter): void {
    this.adapters.set(name, adapter);
  }
  
  get(name: string): DataAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Adapter '${name}' not found`);
    }
    return adapter;
  }
  
  list(): string[] {
    return Array.from(this.adapters.keys());
  }
  
  getEntityAdapters(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [name, adapter] of this.adapters) {
      const entityDef = adapter.getEntityDefinition();
      result[entityDef.name] = name;
    }
    return result;
  }
}

// Global adapter registry
export const adapterRegistry = new AdapterRegistry();

// Register adapters
adapterRegistry.register('alpha-vantage', new AlphaVantageAdapter());
adapterRegistry.register('news-api', new NewsApiAdapter(process.env.NEWS_API_KEY!));
adapterRegistry.register('jsonplaceholder', new JsonPlaceholderAdapter());
```

### Adapter Factory
```typescript
class AdapterFactory {
  static create(type: string, config: any): DataAdapter {
    switch (type) {
      case 'rest':
        return new RestApiAdapter(config.baseUrl, config.apiKey, config.headers);
      
      case 'graphql':
        return new GraphQLAdapter(config.endpoint, config.apiKey);
      
      case 'websocket':
        return new WebSocketAdapter(config.wsUrl, config.restUrl, config.apiKey);
      
      case 'alpha-vantage':
        return new AlphaVantageAdapter();
      
      case 'news-api':
        return new NewsApiAdapter(config.apiKey);
      
      default:
        throw new Error(`Unknown adapter type: ${type}`);
    }
  }
}
```

## Testing Data Adapters

### Adapter Testing Framework
```typescript
abstract class AdapterTestSuite<T> {
  constructor(protected adapter: DataAdapter<T>) {}
  
  async runAllTests(): Promise<TestResult[]> {
    const tests = [
      this.testList,
      this.testGet,
      this.testCreate,
      this.testUpdate,
      this.testDelete,
      this.testSearch,
      this.testCaching,
      this.testErrorHandling
    ];
    
    const results: TestResult[] = [];
    for (const test of tests) {
      try {
        await test.call(this);
        results.push({ name: test.name, status: 'passed' });
      } catch (error) {
        results.push({ 
          name: test.name, 
          status: 'failed', 
          error: error.message 
        });
      }
    }
    
    return results;
  }
  
  protected abstract testList(): Promise<void>;
  protected abstract testGet(): Promise<void>;
  protected abstract testCreate(): Promise<void>;
  protected abstract testUpdate(): Promise<void>;
  protected abstract testDelete(): Promise<void>;
  protected abstract testSearch(): Promise<void>;
  
  protected async testCaching(): Promise<void> {
    // Test cache hit/miss behavior
    const start1 = Date.now();
    await this.adapter.list();
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    await this.adapter.list();
    const time2 = Date.now() - start2;
    
    // Second call should be much faster (cached)
    if (time2 >= time1) {
      throw new Error('Caching not working properly');
    }
  }
  
  protected async testErrorHandling(): Promise<void> {
    try {
      await this.adapter.get('invalid-id');
      throw new Error('Expected error not thrown');
    } catch (error) {
      if (!(error instanceof DataAdapterError)) {
        throw new Error('Error not properly typed');
      }
    }
  }
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  error?: string;
}
```

## Best Practices

### 1. Error Handling
- Always wrap API calls in try-catch blocks
- Provide meaningful error messages
- Use typed error classes
- Implement retry logic for transient failures

### 2. Caching Strategy
- Cache frequently accessed data
- Use appropriate TTL values
- Implement cache invalidation
- Consider memory usage

### 3. Rate Limiting
- Respect API rate limits
- Implement exponential backoff
- Use request queuing when necessary

### 4. Data Transformation
- Keep transformations in the adapter layer
- Maintain consistent entity structure
- Handle missing or null values gracefully

### 5. Testing
- Write comprehensive test suites
- Mock external dependencies
- Test error scenarios
- Validate data transformations

---

*Data Adapters provide the foundation for integrating with any external system while maintaining a consistent interface for the rest of the application.*