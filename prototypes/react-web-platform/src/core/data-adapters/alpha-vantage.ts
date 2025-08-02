// Alpha Vantage Stock Data Adapter

import { BaseDataAdapter } from './base-adapter';
import type { 
  StockData
} from '../../types/api';
import type { 
  EntityRecord, 
  EntityDefinition, 
  QueryParams, 
  PaginatedResponse, 
  FilterConfig, 
  CacheConfig 
} from '../../types/entity';

export class AlphaVantageAdapter extends BaseDataAdapter<StockData> {
  name = 'Alpha Vantage Stock Data';
  version = '1.0.0';
  description = 'Real-time and historical stock market data from Alpha Vantage';

  // Popular stock symbols for demo
  private readonly DEMO_SYMBOLS = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 
    'META', 'NVDA', 'NFLX', 'CRM', 'UBER',
    'SPOT', 'ZM', 'SQ', 'PYPL', 'ROKU'
  ];

  constructor(apiKey: string) {
    super({
      baseUrl: 'https://www.alphavantage.co/query',
      apiKey,
      timeout: 15000,
      retries: 2,
      retryDelay: 2000,
    });
  }

  async list(params: QueryParams = {}): Promise<PaginatedResponse<StockData>> {
    const cacheKey = this.getCacheKey('list', params);
    const cached = this.getFromCache<PaginatedResponse<StockData>>(cacheKey);
    
    if (cached) {
      return {
        ...cached,
        metadata: { 
          executionTime: cached.metadata?.executionTime || 0,
          cacheHit: true,
          source: cached.metadata?.source || 'cache'
        }
      };
    }

    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 20); // API rate limits
    const offset = (page - 1) * limit;
    
    // Get symbols for this page
    const symbols = this.DEMO_SYMBOLS.slice(offset, offset + limit);
    
    // Fetch stock data for each symbol
    const stockPromises = symbols.map(symbol => 
      this.get(symbol).catch(error => {
        console.warn(`Failed to fetch data for ${symbol}:`, error);
        return null;
      })
    );

    const stocks = (await Promise.all(stockPromises))
      .filter((stock): stock is StockData => stock !== null);

    // Apply search filter if provided
    let filteredStocks = stocks;
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredStocks = stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply additional filters
    if (params.filters && params.filters.length > 0) {
      filteredStocks = this.applyFilters(filteredStocks, params.filters);
    }

    // Apply sorting
    if (params.sort && params.sort.length > 0) {
      filteredStocks = this.applySort(filteredStocks, params.sort);
    }

    const result: PaginatedResponse<StockData> = {
      data: filteredStocks,
      pagination: {
        page,
        limit,
        total: this.DEMO_SYMBOLS.length,
        totalPages: Math.ceil(this.DEMO_SYMBOLS.length / limit),
        hasNext: offset + limit < this.DEMO_SYMBOLS.length,
        hasPrev: page > 1,
      },
      metadata: {
        executionTime: Date.now(),
        cacheHit: false,
        source: 'alpha_vantage',
      },
    };

    // Cache the result
    this.setCache(cacheKey, result, 60); // 1 minute cache
    return result;
  }

  async get(symbol: string): Promise<StockData> {
    const cacheKey = this.getCacheKey('get', { symbol });
    const cached = this.getFromCache<StockData>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {

      // Add symbol to the URL parameters
      const url = new URL('', this.config.baseUrl);
      url.searchParams.set('function', 'GLOBAL_QUOTE');
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('apikey', this.config.apiKey!);

      const rawResponse = await fetch(url.toString());
      const data = await rawResponse.json() as any; // API can return various shapes

      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      const quote = data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No data available for symbol: ${symbol}`);
      }

      const stockData: StockData = {
        id: symbol,
        symbol: quote['01. symbol'] || symbol,
        name: this.getCompanyName(symbol), // We'll use a lookup for demo
        price: parseFloat(quote['05. price'] || '0'),
        change: parseFloat(quote['09. change'] || '0'),
        changePercent: quote['10. change percent']?.replace(/[%]/g, '') || '0',
        volume: parseInt(quote['06. volume'] || '0'),
        high: parseFloat(quote['03. high'] || '0'),
        low: parseFloat(quote['04. low'] || '0'),
        open: parseFloat(quote['02. open'] || '0'),
        previousClose: parseFloat(quote['08. previous close'] || '0'),
        lastUpdated: new Date(quote['07. latest trading day'] || new Date()),
      };

      // Cache the result
      this.setCache(cacheKey, stockData, 60); // 1 minute cache for real-time data
      return stockData;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      
      // Return mock data for demo purposes when API fails
      return this.getMockStockData(symbol);
    }
  }

  async create(): Promise<StockData> {
    throw new Error('Creating stock data is not supported');
  }

  async update(): Promise<StockData> {
    throw new Error('Updating stock data is not supported');
  }

  async delete(): Promise<void> {
    throw new Error('Deleting stock data is not supported');
  }

  async search(query: string, filters: FilterConfig[] = []): Promise<StockData[]> {
    // For demo, search within our symbol list
    const matchingSymbols = this.DEMO_SYMBOLS.filter(symbol =>
      symbol.toLowerCase().includes(query.toLowerCase()) ||
      this.getCompanyName(symbol).toLowerCase().includes(query.toLowerCase())
    );

    const results = await Promise.all(
      matchingSymbols.slice(0, 10).map(symbol => 
        this.get(symbol).catch(() => null)
      )
    );

    let filteredResults = results.filter((stock): stock is StockData => stock !== null);

    if (filters.length > 0) {
      filteredResults = this.applyFilters(filteredResults, filters);
    }

    return filteredResults;
  }

  async filter(filters: FilterConfig[]): Promise<StockData[]> {
    // Get all available data first
    const allData = await this.list({ limit: 50 });
    return this.applyFilters(allData.data, filters);
  }

  transformToEntity(apiData: StockData): EntityRecord {
    return {
      id: apiData.symbol,
      entity: 'stocks',
      data: {
        symbol: apiData.symbol,
        name: apiData.name,
        price: apiData.price,
        change: apiData.change,
        changePercent: apiData.changePercent,
        volume: apiData.volume,
        high: apiData.high,
        low: apiData.low,
        open: apiData.open,
        previousClose: apiData.previousClose,
        lastUpdated: apiData.lastUpdated,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  transformFromEntity(entityData: EntityRecord): StockData {
    return entityData.data as StockData;
  }

  getEntityDefinition(): EntityDefinition {
    return {
      name: 'stocks',
      displayName: 'Stock Data',
      description: 'Real-time stock market data from Alpha Vantage',
      fields: [
        {
          name: 'symbol',
          type: 'text',
          displayName: 'Symbol',
          description: 'Stock ticker symbol',
          required: true,
          validation: [
            { type: 'required', message: 'Symbol is required' },
            { type: 'pattern', value: '^[A-Z]{1,5}$', message: 'Invalid symbol format' }
          ],
          defaultValue: '',
          displayOptions: { 
            width: 80, 
            sortable: true, 
            searchable: true,
            filterable: true 
          },
        },
        {
          name: 'name',
          type: 'text',
          displayName: 'Company Name',
          description: 'Full company name',
          required: true,
          validation: [{ type: 'required', message: 'Company name is required' }],
          defaultValue: '',
          displayOptions: { 
            width: 200, 
            sortable: true, 
            searchable: true,
            filterable: true 
          },
        },
        {
          name: 'price',
          type: 'currency',
          displayName: 'Price',
          description: 'Current stock price',
          required: true,
          validation: [
            { type: 'required', message: 'Price is required' },
            { type: 'min', value: 0, message: 'Price must be positive' }
          ],
          defaultValue: 0,
          displayOptions: { 
            width: 100, 
            sortable: true, 
            format: 'currency',
            precision: 2,
            filterable: true 
          },
        },
        {
          name: 'change',
          type: 'currency',
          displayName: 'Change',
          description: 'Price change from previous close',
          required: false,
          validation: [],
          defaultValue: 0,
          displayOptions: { 
            width: 80, 
            sortable: true, 
            format: 'currency',
            precision: 2,
            colorCode: true, // Green for positive, red for negative
            filterable: true 
          },
        },
        {
          name: 'changePercent',
          type: 'percentage',
          displayName: 'Change %',
          description: 'Percentage change from previous close',
          required: false,
          validation: [],
          defaultValue: '0',
          displayOptions: { 
            width: 90, 
            sortable: true,
            colorCode: true,
            filterable: true 
          },
        },
        {
          name: 'volume',
          type: 'number',
          displayName: 'Volume',
          description: 'Trading volume',
          required: false,
          validation: [],
          defaultValue: 0,
          displayOptions: { 
            width: 120, 
            sortable: true, 
            format: 'number',
            filterable: true 
          },
        },
        {
          name: 'high',
          type: 'currency',
          displayName: 'High',
          description: 'Daily high price',
          required: false,
          validation: [],
          defaultValue: 0,
          displayOptions: { 
            width: 80, 
            sortable: true, 
            format: 'currency',
            precision: 2,
            filterable: true 
          },
        },
        {
          name: 'low',
          type: 'currency',
          displayName: 'Low',
          description: 'Daily low price',
          required: false,
          validation: [],
          defaultValue: 0,
          displayOptions: { 
            width: 80, 
            sortable: true, 
            format: 'currency',
            precision: 2,
            filterable: true 
          },
        },
      ],
      relationships: [],
      permissions: [
        {
          role: 'viewer',
          actions: ['read'],
        },
        {
          role: 'analyst',
          actions: ['read', 'export'],
        },
        {
          role: 'admin',
          actions: ['read', 'export', 'share'],
        },
      ],
      businessRules: [
        {
          name: 'price_alert_high',
          displayName: 'High Price Change Alert',
          description: 'Alert when stock price increases significantly',
          trigger: 'on_change',
          conditions: [
            {
              field: 'changePercent',
              operator: 'gt',
              value: 5,
            },
          ],
          actions: [
            {
              type: 'send_notification',
              config: {
                message: 'Stock {{symbol}} is up {{changePercent}}%',
                channels: ['push', 'email'],
                recipients: ['analysts', 'traders'],
              },
            },
          ],
          priority: 1,
          active: true,
        },
        {
          name: 'price_alert_low',
          displayName: 'Low Price Change Alert',
          description: 'Alert when stock price decreases significantly',
          trigger: 'on_change',
          conditions: [
            {
              field: 'changePercent',
              operator: 'lt',
              value: -5,
            },
          ],
          actions: [
            {
              type: 'send_notification',
              config: {
                message: 'Stock {{symbol}} is down {{changePercent}}%',
                channels: ['push', 'email'],
                recipients: ['analysts', 'risk_managers'],
              },
            },
          ],
          priority: 1,
          active: true,
        },
      ],
    };
  }

  getCacheConfig(): CacheConfig {
    return {
      ttl: 60, // 1 minute for real-time data
      staleWhileRevalidate: true,
      maxAge: 300, // 5 minutes max age
      tags: ['stocks', 'real-time'],
      invalidateOn: ['market_close', 'data_refresh'],
    };
  }

  // Private helper methods

  private applyFilters(stocks: StockData[], filters: FilterConfig[]): StockData[] {
    return stocks.filter(stock => {
      return filters.every(filter => {
        const value = (stock as any)[filter.field];
        return this.evaluateFilter(value, filter);
      });
    });
  }

  private applySort(stocks: StockData[], sortConfigs: any[]): StockData[] {
    return stocks.sort((a, b) => {
      for (const sortConfig of sortConfigs) {
        const aValue = (a as any)[sortConfig.field];
        const bValue = (b as any)[sortConfig.field];
        
        let comparison = 0;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        if (comparison !== 0) {
          return sortConfig.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  private evaluateFilter(value: any, filter: FilterConfig): boolean {
    switch (filter.operator) {
      case 'eq': return value === filter.value;
      case 'ne': return value !== filter.value;
      case 'gt': return Number(value) > Number(filter.value);
      case 'gte': return Number(value) >= Number(filter.value);
      case 'lt': return Number(value) < Number(filter.value);
      case 'lte': return Number(value) <= Number(filter.value);
      case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
      case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      default: return true;
    }
  }

  private getCompanyName(symbol: string): string {
    // Simple lookup for demo purposes
    const companyNames: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc. Class A',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.',
      'CRM': 'Salesforce Inc.',
      'UBER': 'Uber Technologies Inc.',
      'SPOT': 'Spotify Technology S.A.',
      'ZM': 'Zoom Video Communications Inc.',
      'SQ': 'Block Inc.',
      'PYPL': 'PayPal Holdings Inc.',
      'ROKU': 'Roku Inc.',
    };
    
    return companyNames[symbol] || `${symbol} Company`;
  }

  private getMockStockData(symbol: string): StockData {
    // Generate realistic mock data for demo
    const basePrice = Math.random() * 300 + 50; // Price between $50-$350
    const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
    const change = basePrice * (changePercent / 100);
    
    return {
      id: symbol,
      symbol,
      name: this.getCompanyName(symbol),
      price: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: changePercent.toFixed(2),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      high: Math.round((basePrice * 1.05) * 100) / 100,
      low: Math.round((basePrice * 0.95) * 100) / 100,
      open: Math.round((basePrice * 0.98) * 100) / 100,
      previousClose: Math.round((basePrice - change) * 100) / 100,
      lastUpdated: new Date(),
    };
  }
}