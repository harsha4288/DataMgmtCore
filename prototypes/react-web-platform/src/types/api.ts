// API and Data Adapter Types

import type { EntityRecord, EntityDefinition, QueryParams, PaginatedResponse, CacheConfig, FilterConfig } from './entity';

// Base Data Adapter Interface
export interface DataAdapter<T = any> {
  // Metadata
  name: string;
  version: string;
  description: string;
  
  // Data operations
  list(params?: QueryParams): Promise<PaginatedResponse<T>>;
  get(id: string): Promise<T>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  
  // Search and filtering
  search(query: string, filters?: FilterConfig[]): Promise<T[]>;
  filter(filters: FilterConfig[]): Promise<T[]>;
  
  // Real-time capabilities (optional)
  subscribe?(callback: (data: T[]) => void): () => void;
  
  // Data transformation
  transformToEntity(apiData: any): EntityRecord;
  transformFromEntity(entityData: EntityRecord): any;
  
  // Schema definition
  getEntityDefinition(): EntityDefinition;
  
  // Caching configuration
  getCacheConfig(): CacheConfig;
  
  // Health check
  healthCheck?(): Promise<AdapterHealthStatus>;
}

export interface AdapterHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
  lastChecked: Date;
}

// API Client Configuration
export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  rateLimit?: RateLimitConfig;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  burstLimit: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
  requestId?: string;
  executionTime: number;
  cacheHit: boolean;
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: number;
  };
}

// Error Types
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  code?: string;
  details?: any;
  retryable?: boolean;
}

// Stock Data Types (Alpha Vantage)
export interface AlphaVantageResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

export interface StockData {
  id: string;
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
  marketCap?: number;
  pe?: number;
  dividendYield?: number;
}

// News Data Types (NewsAPI)
export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

export interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

export interface NewsData {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  source: string;
  sourceId: string;
  url: string;
  imageUrl: string;
  publishedAt: Date;
  category: string;
  tags: string[];
  readTime?: number;
  wordCount?: number;
}

// User Data Types (JSONPlaceholder)
export interface JsonPlaceholderUser {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

export interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  company: {
    name: string;
    catchPhrase: string;
    description: string;
  };
  avatar?: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
}

// Product Data Types (Fake Store API)
export interface FakeStoreProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export interface ProductData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  image: string;
  images: string[];
  rating: {
    average: number;
    count: number;
    reviews?: ProductReview[];
  };
  inventory: {
    inStock: boolean;
    quantity: number;
    lowStockThreshold: number;
  };
  attributes: ProductAttribute[];
  tags: string[];
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  verified: boolean;
  createdAt: Date;
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  displayName: string;
  unit?: string;
}

// Webhook Types
export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  retries?: number;
  timeout?: number;
}

export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: any;
  signature?: string;
}

// Export all types
export * from './api';