// NewsAPI Data Adapter

import { BaseDataAdapter } from './base-adapter';
import type { 
  NewsData,
  NewsApiResponse,
  NewsApiArticle
} from '../../types/api';
import type { 
  EntityRecord, 
  EntityDefinition, 
  QueryParams, 
  PaginatedResponse, 
  FilterConfig, 
  CacheConfig 
} from '../../types/entity';

export class NewsApiAdapter extends BaseDataAdapter<NewsData> {
  name = 'NewsAPI';
  version = '1.0.0';
  description = 'Breaking news headlines and articles from NewsAPI.org';

  // News categories for filtering
  private readonly CATEGORIES = [
    'business', 'entertainment', 'general', 'health', 
    'science', 'sports', 'technology'
  ];

  // Popular news sources for demo (for future use)
  // private readonly SOURCES = [
  //   'bbc-news', 'cnn', 'reuters', 'associated-press',
  //   'the-wall-street-journal', 'bloomberg', 'techcrunch',
  //   'ars-technica', 'the-verge', 'engadget'
  // ];

  constructor(apiKey: string) {
    super({
      baseUrl: 'https://newsapi.org/v2',
      apiKey,
      timeout: 10000,
      retries: 2,
      retryDelay: 1000,
    });
  }

  async list(params: QueryParams = {}): Promise<PaginatedResponse<NewsData>> {
    const cacheKey = this.getCacheKey('list', params);
    const cached = this.getFromCache<PaginatedResponse<NewsData>>(cacheKey);
    
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
    const limit = Math.min(params.limit || 20, 100); // NewsAPI limit is 100
    
    try {
      // Use everything endpoint for general news
      const url = new URL('/everything', this.config.baseUrl);
      url.searchParams.set('apiKey', this.config.apiKey!);
      url.searchParams.set('pageSize', limit.toString());
      url.searchParams.set('page', page.toString());
      url.searchParams.set('sortBy', 'publishedAt');
      url.searchParams.set('language', 'en');
      
      // Add search query if provided
      if (params.search) {
        url.searchParams.set('q', params.search);
      } else {
        // Default to tech news for demo
        url.searchParams.set('q', 'technology OR programming OR software');
      }
      
      // Add category filter if provided
      const categoryFilter = params.filters?.find(f => f.field === 'category');
      if (categoryFilter) {
        url.searchParams.set('category', categoryFilter.value as string);
      }

      const rawResponse = await fetch(url.toString());
      const data = await rawResponse.json() as NewsApiResponse;

      if (data.status !== 'ok' || !data.articles) {
        console.warn('NewsAPI returned error, using mock data');
        return this.getMockNewsResponse(params);
      }

      const newsArticles = data.articles.map(article => this.transformApiToNews(article));

      // Apply additional filtering
      let filteredArticles = newsArticles;
      if (params.filters && params.filters.length > 0) {
        filteredArticles = this.applyFilters(filteredArticles, params.filters);
      }

      // Apply sorting
      if (params.sort && params.sort.length > 0) {
        filteredArticles = this.applySort(filteredArticles, params.sort);
      }

      const result: PaginatedResponse<NewsData> = {
        data: filteredArticles,
        pagination: {
          page,
          limit,
          total: data.totalResults,
          totalPages: Math.ceil(data.totalResults / limit),
          hasNext: page * limit < data.totalResults,
          hasPrev: page > 1,
        },
        metadata: {
          executionTime: Date.now(),
          cacheHit: false,
          source: 'newsapi',
        },
      };

      // Cache the result
      this.setCache(cacheKey, result, 300); // 5 minute cache
      return result;
    } catch (error) {
      console.error('Error fetching news:', error);
      
      // Return mock data for demo purposes when API fails
      return this.getMockNewsResponse(params);
    }
  }

  async get(id: string): Promise<NewsData> {
    const cacheKey = this.getCacheKey('get', { id });
    const cached = this.getFromCache<NewsData>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // NewsAPI doesn't support getting by ID, so we'll search in our cached data
    // or return mock data
    return this.getMockNewsData(id);
  }

  async create(): Promise<NewsData> {
    throw new Error('Creating news articles is not supported');
  }

  async update(): Promise<NewsData> {
    throw new Error('Updating news articles is not supported');
  }

  async delete(): Promise<void> {
    throw new Error('Deleting news articles is not supported');
  }

  async search(query: string, filters: FilterConfig[] = []): Promise<NewsData[]> {
    const searchParams: QueryParams = { 
      search: query, 
      filters, 
      limit: 50 
    };
    
    const results = await this.list(searchParams);
    return results.data;
  }

  async filter(filters: FilterConfig[]): Promise<NewsData[]> {
    const filterParams: QueryParams = { 
      filters, 
      limit: 100 
    };
    
    const results = await this.list(filterParams);
    return results.data;
  }

  transformToEntity(newsData: NewsData): EntityRecord {
    return {
      id: newsData.id,
      entity: 'news',
      data: {
        title: newsData.title,
        description: newsData.description,
        content: newsData.content,
        author: newsData.author,
        source: newsData.source,
        sourceId: newsData.sourceId,
        url: newsData.url,
        imageUrl: newsData.imageUrl,
        publishedAt: newsData.publishedAt,
        category: newsData.category,
        tags: newsData.tags,
        readTime: newsData.readTime,
        wordCount: newsData.wordCount,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  transformFromEntity(entityData: EntityRecord): NewsData {
    return entityData.data as NewsData;
  }

  getEntityDefinition(): EntityDefinition {
    return {
      name: 'news',
      displayName: 'News Articles',
      description: 'Breaking news and articles from various sources',
      fields: [
        {
          name: 'title',
          type: 'text',
          displayName: 'Title',
          description: 'Article headline',
          required: true,
          validation: [
            { type: 'required', message: 'Title is required' },
            { type: 'max', value: 200, message: 'Title too long' }
          ],
          defaultValue: '',
          displayOptions: { 
            width: 300, 
            sortable: true, 
            searchable: true,
            filterable: true 
          },
        },
        {
          name: 'author',
          type: 'text',
          displayName: 'Author',
          description: 'Article author',
          required: false,
          validation: [],
          defaultValue: '',
          displayOptions: { 
            width: 150, 
            sortable: true, 
            searchable: true,
            filterable: true 
          },
        },
        {
          name: 'source',
          type: 'text',
          displayName: 'Source',
          description: 'News source',
          required: true,
          validation: [{ type: 'required', message: 'Source is required' }],
          defaultValue: '',
          displayOptions: { 
            width: 120, 
            sortable: true, 
            searchable: true,
            filterable: true 
          },
        },
        {
          name: 'category',
          type: 'select',
          displayName: 'Category',
          description: 'News category',
          required: false,
          validation: [],
          defaultValue: 'general',
          displayOptions: { 
            width: 100, 
            sortable: true,
            filterable: true,
            options: this.CATEGORIES.map(cat => ({ 
              value: cat, 
              label: cat.charAt(0).toUpperCase() + cat.slice(1) 
            }))
          },
        },
        {
          name: 'publishedAt',
          type: 'datetime',
          displayName: 'Published',
          description: 'Publication date',
          required: true,
          validation: [{ type: 'required', message: 'Publication date is required' }],
          defaultValue: new Date(),
          displayOptions: { 
            width: 140, 
            sortable: true,
            format: 'datetime',
            filterable: true 
          },
        },
        {
          name: 'readTime',
          type: 'number',
          displayName: 'Read Time',
          description: 'Estimated reading time in minutes',
          required: false,
          validation: [],
          defaultValue: 0,
          displayOptions: { 
            width: 80, 
            sortable: true, 
            format: 'number',
            filterable: true 
          },
        },
      ],
      relationships: [],
      permissions: [
        {
          role: 'reader',
          actions: ['read'],
        },
        {
          role: 'editor',
          actions: ['read', 'export', 'share'],
        },
        {
          role: 'admin',
          actions: ['read', 'export', 'share'],
        },
      ],
      businessRules: [
        {
          name: 'breaking_news_alert',
          displayName: 'Breaking News Alert',
          description: 'Alert for breaking news articles',
          trigger: 'on_create',
          conditions: [
            {
              field: 'title',
              operator: 'contains',
              value: 'BREAKING',
            },
          ],
          actions: [
            {
              type: 'send_notification',
              config: {
                message: 'Breaking News: {{title}}',
                channels: ['push', 'email'],
                recipients: ['editors', 'subscribers'],
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
      ttl: 300, // 5 minutes for news data
      staleWhileRevalidate: true,
      maxAge: 900, // 15 minutes max age
      tags: ['news', 'articles'],
      invalidateOn: ['news_update', 'manual_refresh'],
    };
  }

  // Private helper methods

  private transformApiToNews(article: NewsApiArticle): NewsData {
    const publishedAt = new Date(article.publishedAt);
    const wordCount = article.content ? article.content.split(' ').length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute

    return {
      id: this.generateId(article.url),
      title: article.title,
      description: article.description || '',
      content: article.content || '',
      author: article.author || 'Unknown',
      source: article.source.name,
      sourceId: article.source.id || 'unknown',
      url: article.url,
      imageUrl: article.urlToImage || '',
      publishedAt,
      category: this.inferCategory(article.title + ' ' + article.description),
      tags: this.extractTags(article.title + ' ' + article.description),
      readTime,
      wordCount,
    };
  }

  private generateId(url: string): string {
    // Simple hash function to generate consistent IDs from URLs
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  private inferCategory(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('business') || lowerText.includes('finance') || lowerText.includes('market')) {
      return 'business';
    }
    if (lowerText.includes('tech') || lowerText.includes('software') || lowerText.includes('ai')) {
      return 'technology';
    }
    if (lowerText.includes('health') || lowerText.includes('medical')) {
      return 'health';
    }
    if (lowerText.includes('sport')) {
      return 'sports';
    }
    if (lowerText.includes('science')) {
      return 'science';
    }
    if (lowerText.includes('entertainment') || lowerText.includes('movie') || lowerText.includes('music')) {
      return 'entertainment';
    }
    
    return 'general';
  }

  private extractTags(text: string): string[] {
    const commonTags = ['technology', 'business', 'ai', 'software', 'startup', 'innovation', 'research'];
    const lowerText = text.toLowerCase();
    
    return commonTags.filter(tag => lowerText.includes(tag));
  }

  private applyFilters(articles: NewsData[], filters: FilterConfig[]): NewsData[] {
    return articles.filter(article => {
      return filters.every(filter => {
        const value = (article as any)[filter.field];
        return this.evaluateFilter(value, filter);
      });
    });
  }

  private applySort(articles: NewsData[], sortConfigs: any[]): NewsData[] {
    return articles.sort((a, b) => {
      for (const sortConfig of sortConfigs) {
        const aValue = (a as any)[sortConfig.field];
        const bValue = (b as any)[sortConfig.field];
        
        let comparison = 0;
        
        if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
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

  private getMockNewsResponse(params: QueryParams): PaginatedResponse<NewsData> {
    const mockArticles = this.generateMockNews();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginatedArticles = mockArticles.slice(startIndex, startIndex + limit);

    return {
      data: paginatedArticles,
      pagination: {
        page,
        limit,
        total: mockArticles.length,
        totalPages: Math.ceil(mockArticles.length / limit),
        hasNext: startIndex + limit < mockArticles.length,
        hasPrev: page > 1,
      },
      metadata: {
        executionTime: Date.now(),
        cacheHit: false,
        source: 'mock',
      },
    };
  }

  private getMockNewsData(id: string): NewsData {
    const mockArticles = this.generateMockNews();
    return mockArticles.find(article => article.id === id) || mockArticles[0];
  }

  private generateMockNews(): NewsData[] {
    const baseTime = new Date();
    
    return [
      {
        id: '1',
        title: 'Revolutionary AI Model Breaks Performance Records',
        description: 'New machine learning architecture achieves unprecedented accuracy in natural language processing tasks.',
        content: 'Researchers have developed a groundbreaking AI model that surpasses previous benchmarks...',
        author: 'Sarah Chen',
        source: 'TechCrunch',
        sourceId: 'techcrunch',
        url: 'https://techcrunch.com/ai-breakthrough',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300',
        publishedAt: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000),
        category: 'technology',
        tags: ['ai', 'machine-learning', 'breakthrough'],
        readTime: 4,
        wordCount: 800,
      },
      {
        id: '2',
        title: 'Global Markets Rally on Economic Data',
        description: 'Stock markets worldwide see significant gains following positive employment and inflation reports.',
        content: 'Major stock indices posted strong gains today as investors responded favorably...',
        author: 'Michael Rodriguez',
        source: 'Bloomberg',
        sourceId: 'bloomberg',
        url: 'https://bloomberg.com/markets-rally',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300',
        publishedAt: new Date(baseTime.getTime() - 4 * 60 * 60 * 1000),
        category: 'business',
        tags: ['markets', 'economy', 'stocks'],
        readTime: 3,
        wordCount: 600,
      },
      {
        id: '3',
        title: 'Breakthrough in Quantum Computing Achieved',
        description: 'Scientists demonstrate quantum advantage in practical computational problems for the first time.',
        content: 'A team of quantum physicists has achieved a major milestone...',
        author: 'Dr. Emily Watson',
        source: 'Nature',
        sourceId: 'nature',
        url: 'https://nature.com/quantum-breakthrough',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
        publishedAt: new Date(baseTime.getTime() - 6 * 60 * 60 * 1000),
        category: 'science',
        tags: ['quantum', 'computing', 'research'],
        readTime: 5,
        wordCount: 1000,
      },
      {
        id: '4',
        title: 'New Streaming Platform Challenges Netflix',
        description: 'Entertainment giant launches competitor service with exclusive content and competitive pricing.',
        content: 'The entertainment industry sees a new player entering the streaming wars...',
        author: 'Jennifer Park',
        source: 'The Verge',
        sourceId: 'the-verge',
        url: 'https://theverge.com/streaming-wars',
        imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=300',
        publishedAt: new Date(baseTime.getTime() - 8 * 60 * 60 * 1000),
        category: 'entertainment',
        tags: ['streaming', 'entertainment', 'netflix'],
        readTime: 3,
        wordCount: 650,
      },
      {
        id: '5',
        title: 'Climate Tech Startup Raises $100M Series B',
        description: 'Carbon capture technology company secures major funding round led by prominent VCs.',
        content: 'A promising climate technology startup has secured significant funding...',
        author: 'Alex Thompson',
        source: 'TechCrunch',
        sourceId: 'techcrunch',
        url: 'https://techcrunch.com/climate-funding',
        imageUrl: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=300',
        publishedAt: new Date(baseTime.getTime() - 12 * 60 * 60 * 1000),
        category: 'business',
        tags: ['climate', 'startup', 'funding'],
        readTime: 4,
        wordCount: 750,
      },
    ];
  }
}