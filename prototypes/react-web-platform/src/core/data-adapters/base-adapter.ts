// Base Data Adapter Implementation

import type { 
  DataAdapter, 
  ApiClientConfig, 
  ApiResponse, 
  AdapterHealthStatus 
} from '../../types/api';
import type { 
  EntityRecord, 
  EntityDefinition, 
  QueryParams, 
  PaginatedResponse, 
  FilterConfig, 
  CacheConfig 
} from '../../types/entity';

export abstract class BaseDataAdapter<T = any> implements DataAdapter<T> {
  abstract name: string;
  abstract version: string;
  abstract description: string;

  protected config: ApiClientConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  // Abstract methods that must be implemented by concrete adapters
  abstract list(params?: QueryParams): Promise<PaginatedResponse<T>>;
  abstract get(id: string): Promise<T>;
  abstract create(data: Omit<T, 'id'>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract search(query: string, filters?: FilterConfig[]): Promise<T[]>;
  abstract filter(filters: FilterConfig[]): Promise<T[]>;
  abstract transformToEntity(apiData: any): EntityRecord;
  abstract transformFromEntity(entityData: EntityRecord): any;
  abstract getEntityDefinition(): EntityDefinition;
  abstract getCacheConfig(): CacheConfig;

  // Optional methods with default implementations
  subscribe?(callback: (data: T[]) => void): () => void;

  async healthCheck(): Promise<AdapterHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Basic connectivity test - override in concrete implementations
      await this.makeRequest('/health', { method: 'GET' });
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    }
  }

  // Protected utility methods for concrete implementations

  protected async makeRequest<TResponse = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<TResponse>> {
    const url = new URL(endpoint, this.config.baseUrl);
    const startTime = Date.now();

    // Add API key to URL params or headers
    if (this.config.apiKey) {
      if (endpoint.includes('?')) {
        url.searchParams.append('apikey', this.config.apiKey);
      } else {
        url.searchParams.set('apikey', this.config.apiKey);
      }
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options.headers,
    };

    // Prepare request options
    const requestOptions: RequestInit = {
      method: 'GET',
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout || 10000),
    };

    let lastError: Error | null = null;
    const maxRetries = this.config.retries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString(), requestOptions);
        const executionTime = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          throw new ApiError(
            `HTTP ${response.status}: ${response.statusText}. ${errorText}`,
            {
              status: response.status,
              statusText: response.statusText,
              retryable: response.status >= 500 || response.status === 429,
            }
          );
        }

        const data = await response.json();

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          metadata: {
            executionTime,
            cacheHit: false,
            rateLimit: this.parseRateLimitHeaders(response.headers),
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if it's not a retryable error
        if (error instanceof ApiError && !error.retryable) {
          break;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying
        const delay = this.config.retryDelay || 1000;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  protected getCacheKey(method: string, params: any = {}): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  protected getFromCache<TData = any>(key: string): TData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  protected setCache<TData = any>(key: string, data: TData, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    });
  }

  protected clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private parseRateLimitHeaders(headers: Headers) {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        resetTime: parseInt(reset, 10),
      };
    }

    return undefined;
  }
}

// Custom API Error class
class ApiError extends Error {
  public status?: number;
  public statusText?: string;
  public code?: string;
  public details?: any;
  public retryable?: boolean;

  constructor(message: string, options: Partial<ApiError> = {}) {
    super(message);
    this.name = 'ApiError';
    Object.assign(this, options);
  }
}