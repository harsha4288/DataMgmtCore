// Core Entity Management Engine

import type { 
  EntityDefinition, 
  EntityRecord, 
  EntityData, 
  QueryParams, 
  PaginatedResponse,
  EntityEvent,
  FilterConfig,
  SortConfig
} from '../../types/entity';
import { ValidationEngine } from './validation';
import { EventEmitter } from './events';

export class EntityEngine {
  private entities: Map<string, EntityData> = new Map();
  private definitions: Map<string, EntityDefinition> = new Map();
  private validationEngine: ValidationEngine;
  private eventEmitter: EventEmitter;

  constructor() {
    this.validationEngine = new ValidationEngine();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Register an entity definition
   */
  registerEntity(definition: EntityDefinition): void {
    this.definitions.set(definition.name, definition);
    
    // Initialize empty entity data if not exists
    if (!this.entities.has(definition.name)) {
      this.entities.set(definition.name, {
        entity: definition.name,
        definition,
        records: [],
        metadata: {
          totalRecords: 0,
          lastUpdated: new Date(),
          source: 'local',
          version: '1.0.0',
          schema: definition
        }
      });
    }

    this.eventEmitter.emit('entity:registered', {
      type: 'entity:created',
      entity: definition.name,
      data: definition,
      timestamp: new Date()
    });
  }

  /**
   * Get entity definition
   */
  getEntityDefinition(entityName: string): EntityDefinition | undefined {
    return this.definitions.get(entityName);
  }

  /**
   * Get all registered entities
   */
  getEntities(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Create a new record
   */
  async create(entityName: string, data: Record<string, any>): Promise<EntityRecord> {
    const definition = this.definitions.get(entityName);
    if (!definition) {
      throw new Error(`Entity "${entityName}" not found`);
    }

    // Validate the data
    const validationResult = await this.validationEngine.validate(data, definition);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Create the record
    const record: EntityRecord = {
      id: this.generateId(),
      entity: entityName,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    // Add to entity data
    const entityData = this.entities.get(entityName)!;
    entityData.records.push(record);
    entityData.metadata.totalRecords++;
    entityData.metadata.lastUpdated = new Date();

    // Emit event
    this.eventEmitter.emit('record:created', {
      type: 'record:created',
      entity: entityName,
      recordId: record.id,
      data: record,
      timestamp: new Date()
    });

    return record;
  }

  /**
   * Get a record by ID
   */
  get(entityName: string, id: string): EntityRecord | undefined {
    const entityData = this.entities.get(entityName);
    if (!entityData) return undefined;

    return entityData.records.find(record => record.id === id);
  }

  /**
   * Update a record
   */
  async update(entityName: string, id: string, updates: Partial<Record<string, any>>): Promise<EntityRecord> {
    const definition = this.definitions.get(entityName);
    if (!definition) {
      throw new Error(`Entity "${entityName}" not found`);
    }

    const entityData = this.entities.get(entityName)!;
    const recordIndex = entityData.records.findIndex(record => record.id === id);
    
    if (recordIndex === -1) {
      throw new Error(`Record with ID "${id}" not found`);
    }

    const currentRecord = entityData.records[recordIndex];
    const updatedData = { ...currentRecord.data, ...updates };

    // Validate the updated data
    const validationResult = await this.validationEngine.validate(updatedData, definition);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Update the record
    const updatedRecord: EntityRecord = {
      ...currentRecord,
      data: updatedData,
      updatedAt: new Date(),
      version: (currentRecord.version || 1) + 1
    };

    entityData.records[recordIndex] = updatedRecord;
    entityData.metadata.lastUpdated = new Date();

    // Emit event
    this.eventEmitter.emit('record:updated', {
      type: 'record:updated',
      entity: entityName,
      recordId: id,
      data: { previous: currentRecord, current: updatedRecord },
      timestamp: new Date()
    });

    return updatedRecord;
  }

  /**
   * Delete a record
   */
  async delete(entityName: string, id: string): Promise<void> {
    const entityData = this.entities.get(entityName);
    if (!entityData) {
      throw new Error(`Entity "${entityName}" not found`);
    }

    const recordIndex = entityData.records.findIndex(record => record.id === id);
    if (recordIndex === -1) {
      throw new Error(`Record with ID "${id}" not found`);
    }

    const deletedRecord = entityData.records[recordIndex];
    entityData.records.splice(recordIndex, 1);
    entityData.metadata.totalRecords--;
    entityData.metadata.lastUpdated = new Date();

    // Emit event
    this.eventEmitter.emit('record:deleted', {
      type: 'record:deleted',
      entity: entityName,
      recordId: id,
      data: deletedRecord,
      timestamp: new Date()
    });
  }

  /**
   * List records with pagination, filtering, and sorting
   */
  async list(entityName: string, params: QueryParams = {}): Promise<PaginatedResponse<EntityRecord>> {
    const entityData = this.entities.get(entityName);
    if (!entityData) {
      throw new Error(`Entity "${entityName}" not found`);
    }

    let records = [...entityData.records];

    // Apply search
    if (params.search) {
      records = this.applySearch(records, params.search, entityData.definition);
    }

    // Apply filters
    if (params.filters && params.filters.length > 0) {
      records = this.applyFilters(records, params.filters);
    }

    // Apply sorting
    if (params.sort && params.sort.length > 0) {
      records = this.applySort(records, params.sort);
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    const paginatedRecords = records.slice(offset, offset + limit);

    return {
      data: paginatedRecords,
      pagination: {
        page,
        limit,
        total: records.length,
        totalPages: Math.ceil(records.length / limit),
        hasNext: page * limit < records.length,
        hasPrev: page > 1
      },
      metadata: {
        executionTime: 0, // TODO: measure actual execution time
        cacheHit: false,
        source: 'memory'
      }
    };
  }

  /**
   * Search records
   */
  search(entityName: string, query: string): EntityRecord[] {
    const entityData = this.entities.get(entityName);
    if (!entityData) return [];

    return this.applySearch(entityData.records, query, entityData.definition);
  }

  /**
   * Bulk operations
   */
  async bulkCreate(entityName: string, records: Record<string, any>[]): Promise<EntityRecord[]> {
    const results: EntityRecord[] = [];
    
    for (const recordData of records) {
      try {
        const record = await this.create(entityName, recordData);
        results.push(record);
      } catch (error) {
        // Log error but continue with other records
        console.error(`Failed to create record:`, error);
      }
    }

    return results;
  }

  async bulkUpdate(entityName: string, updates: Array<{ id: string; data: Partial<Record<string, any>> }>): Promise<EntityRecord[]> {
    const results: EntityRecord[] = [];
    
    for (const update of updates) {
      try {
        const record = await this.update(entityName, update.id, update.data);
        results.push(record);
      } catch (error) {
        console.error(`Failed to update record ${update.id}:`, error);
      }
    }

    return results;
  }

  async bulkDelete(entityName: string, ids: string[]): Promise<void> {
    for (const id of ids) {
      try {
        await this.delete(entityName, id);
      } catch (error) {
        console.error(`Failed to delete record ${id}:`, error);
      }
    }
  }

  /**
   * Event handling
   */
  on(event: string, handler: (event: EntityEvent) => void): void {
    this.eventEmitter.on(event, handler);
  }

  off(event: string, handler: (event: EntityEvent) => void): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Data import/export
   */
  exportEntity(entityName: string, format: 'json' | 'csv' = 'json'): string {
    const entityData = this.entities.get(entityName);
    if (!entityData) {
      throw new Error(`Entity "${entityName}" not found`);
    }

    if (format === 'json') {
      return JSON.stringify(entityData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(entityData.records, entityData.definition);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  async importEntity(entityName: string, data: string, format: 'json' | 'csv' = 'json'): Promise<void> {
    let records: any[] = [];

    if (format === 'json') {
      const parsedData = JSON.parse(data);
      records = parsedData.records || parsedData;
    } else if (format === 'csv') {
      records = this.parseCSV(data);
    }

    await this.bulkCreate(entityName, records);
  }

  // Private helper methods

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private applySearch(records: EntityRecord[], query: string, definition: EntityDefinition): EntityRecord[] {
    const searchableFields = definition.fields
      .filter(field => field.displayOptions.searchable !== false)
      .map(field => field.name);

    const lowercaseQuery = query.toLowerCase();
    
    return records.filter(record => {
      return searchableFields.some(fieldName => {
        const value = record.data[fieldName];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowercaseQuery);
      });
    });
  }

  private applyFilters(records: EntityRecord[], filters: FilterConfig[]): EntityRecord[] {
    return records.filter(record => {
      return filters.every((filter, index) => {
        const value = record.data[filter.field];
        const matches = this.evaluateFilterCondition(value, filter);
        
        // Handle logical operators between filters
        if (index > 0 && filter.logicalOperator === 'or') {
          // OR logic with previous filter
          const prevFilter = filters[index - 1];
          const prevValue = record.data[prevFilter.field];
          const prevMatches = this.evaluateFilterCondition(prevValue, prevFilter);
          return matches || prevMatches;
        }
        
        return matches;
      });
    });
  }

  private evaluateFilterCondition(value: any, filter: FilterConfig): boolean {
    switch (filter.operator) {
      case 'eq': return value === filter.value;
      case 'ne': return value !== filter.value;
      case 'gt': return value > filter.value;
      case 'gte': return value >= filter.value;
      case 'lt': return value < filter.value;
      case 'lte': return value <= filter.value;
      case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
      case 'not_in': return Array.isArray(filter.value) && !filter.value.includes(value);
      case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      case 'starts_with': return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
      case 'ends_with': return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
      case 'is_null': return value == null;
      case 'is_not_null': return value != null;
      case 'between': 
        return Array.isArray(filter.value) && 
               filter.value.length === 2 && 
               value >= filter.value[0] && 
               value <= filter.value[1];
      default: return true;
    }
  }

  private applySort(records: EntityRecord[], sortConfigs: SortConfig[]): EntityRecord[] {
    return records.sort((a, b) => {
      for (const sortConfig of sortConfigs) {
        const aValue = a.data[sortConfig.field];
        const bValue = b.data[sortConfig.field];
        
        let comparison = 0;
        
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        if (comparison !== 0) {
          return sortConfig.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  private convertToCSV(records: EntityRecord[], definition: EntityDefinition): string {
    if (records.length === 0) return '';

    const headers = definition.fields.map(field => field.displayName);
    const rows = records.map(record => 
      definition.fields.map(field => {
        const value = record.data[field.name];
        return this.csvEscape(String(value || ''));
      })
    );

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private parseCSV(csv: string): any[] {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const record: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      
      return record;
    });
  }
}

// Singleton instance
export const entityEngine = new EntityEngine();