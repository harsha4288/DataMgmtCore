/**
 * Entity Repository
 * High-performance repository for entity management with hierarchy and relationships
 * Replaces scattered entity operations across the codebase
 */

import { BaseRepository, BaseEntity } from './base.repository';
import { connectionManager } from '../connection-manager';

export interface Entity extends BaseEntity {
  entity_type: string;
  parent_id?: string | null;
  board_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  level: number;
  hierarchy_path: string;
  assignee?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  progress: number;
  completion_date?: string | null;
  sort_order?: number;
  metadata?: string; // JSON string
  attributes?: string; // JSON string  
  labels?: string; // JSON array string
  dependencies?: string; // JSON array string
  created_by: string;
  updated_by: string;
}

export interface EntityWithRelations extends Entity {
  children?: Entity[];
  relationships?: EntityRelationship[];
  parent?: Entity | null;
}

export interface EntityRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  strength: number;
  is_auto_generated: boolean;
  impact_score: number;
  is_bidirectional: boolean;
  context?: string; // JSON string
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEntityOptions {
  entityType: string;
  title: string;
  description?: string;
  parentId?: string;
  boardPrefix?: string;
  status?: Entity['status'];
  priority?: Entity['priority'];
  assignee?: string;
  estimatedHours?: number;
  metadata?: Record<string, any>;
  attributes?: Record<string, any>;
  labels?: string[];
  dependencies?: string[];
}

export interface EntitySearchOptions {
  text?: string;
  entityType?: string;
  status?: Entity['status'];
  priority?: Entity['priority'];
  assignee?: string;
  boardId?: string;
  parentId?: string;
  level?: number;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export class EntityRepository extends BaseRepository<Entity> {
  protected tableName = 'entities';
  protected idPrefix = 'TASK'; // Default prefix, can be overridden

  // Board-based ID generation with proper prefix
  private getBoardPrefix(entityType: string): string {
    const boardMap: Record<string, string> = {
      'project': 'PROJ',
      'phase': 'PHASE',
      'task': 'TASK',
      'subtask': 'TASK',
      'issue': 'ISSUE',
      'specification': 'SPEC',
      'quality_report': 'QUAL',
      'review': 'REV',
      'approval': 'REV',
      'milestone': 'MILE',
      'deliverable': 'DELIV'
    };
    return boardMap[entityType] || 'TASK';
  }

  async createEntity(options: CreateEntityOptions): Promise<EntityWithRelations> {
    const {
      entityType,
      title,
      description = '',
      parentId = null,
      boardPrefix,
      status = 'pending',
      priority = 'medium',
      assignee = null,
      estimatedHours = null,
      metadata = {},
      attributes = {},
      labels = [],
      dependencies = []
    } = options;

    // Determine board prefix
    const finalBoardPrefix = boardPrefix || this.getBoardPrefix(entityType);
    
    // Temporarily set idPrefix for ID generation
    const originalPrefix = this.idPrefix;
    this.idPrefix = finalBoardPrefix;

    try {
      // Calculate hierarchy information
      let level = 0;
      let hierarchyPath = '';
      let parentEntity: Entity | null = null;

      if (parentId) {
        parentEntity = await this.findById(parentId);
        if (parentEntity) {
          level = parentEntity.level + 1;
          hierarchyPath = `${parentEntity.hierarchy_path}/${parentId}`;
        }
      }

      const entityId = await this.generateId();
      hierarchyPath = hierarchyPath || entityId;

      const entityData = {
        entity_type: entityType,
        parent_id: parentId,
        board_id: finalBoardPrefix,
        title,
        description,
        status,
        priority,
        level,
        hierarchy_path: hierarchyPath,
        assignee,
        estimated_hours: estimatedHours,
        actual_hours: null,
        progress: status === 'completed' ? 100 : 0,
        completion_date: status === 'completed' ? new Date().toISOString() : null,
        sort_order: 0,
        metadata: JSON.stringify(metadata),
        attributes: JSON.stringify(attributes),
        labels: JSON.stringify(labels),
        dependencies: JSON.stringify(dependencies),
        created_by: 'system',
        updated_by: 'system'
      };

      const created = await this.create(entityData);

      // Create parent-child relationship if parent exists
      if (parentId && parentEntity) {
        await this.createRelationship(parentId, created.id, 'parent_of', {
          strength: 1.0,
          isAutoGenerated: true,
          impactScore: 0.8,
          isBidirectional: false
        });
      }

      console.log(`✅ Created entity: ${created.id} - ${title} (${entityType})`);
      return await this.getEntityWithRelations(created.id);

    } finally {
      // Restore original prefix
      this.idPrefix = originalPrefix;
    }
  }

  async getEntityWithRelations(entityId: string): Promise<EntityWithRelations> {
    const entity = await this.findById(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    // Parse JSON fields
    const entityWithParsedData = this.parseJsonFields(entity);

    // Get children
    const children = await this.getEntityChildren(entityId);
    
    // Get relationships
    const relationships = await this.getEntityRelationships(entityId);

    // Get parent using relationships instead of parent_id
    let parent: Entity | null = null;
    const parentRelationships = await this.getEntityRelationships(entityId, {
      direction: 'incoming',
      relationshipType: 'parent_of'
    });
    
    if (parentRelationships.length > 0) {
      // Get the parent entity from the first parent_of relationship
      const parentId = parentRelationships[0].source_entity_id;
      parent = await this.findById(parentId);
      if (parent) {
        parent = this.parseJsonFields(parent);
      }
    }

    return {
      ...entityWithParsedData,
      children,
      relationships,
      parent
    };
  }

  async getEntityChildren(entityId: string): Promise<Entity[]> {
    // Use entity_relationships table instead of parent_id field
    const query = `
      SELECT e.* FROM ${this.tableName} e
      JOIN entity_relationships er ON e.id = er.target_entity_id
      WHERE er.source_entity_id = ? AND er.relationship_type = 'parent_of' AND er.is_active = 1
      ORDER BY e.sort_order, e.created_at
    `;
    
    const children = this.getDb().prepare(query).all(entityId) as Entity[];
    return children.map(child => this.parseJsonFields(child));
  }

  async getEntityHierarchy(entityId: string): Promise<Entity[]> {
    // Use recursive CTE with entity_relationships instead of hierarchy_path
    const query = `
      WITH RECURSIVE entity_tree AS (
        -- Base case: start with the given entity
        SELECT e.*, 0 as depth
        FROM ${this.tableName} e
        WHERE e.id = ?
        
        UNION ALL
        
        -- Recursive case: find children through relationships
        SELECT e.*, et.depth + 1
        FROM ${this.tableName} e
        JOIN entity_relationships er ON e.id = er.target_entity_id
        JOIN entity_tree et ON er.source_entity_id = et.id
        WHERE er.relationship_type = 'parent_of' AND er.is_active = 1
      )
      SELECT * FROM entity_tree
      WHERE id != ?
      ORDER BY depth, sort_order, created_at
    `;
    
    const descendants = this.getDb().prepare(query).all(entityId, entityId) as Entity[];
    return descendants.map(entity => this.parseJsonFields(entity));
  }

  /**
   * Get entity level by counting ancestors (relationship-based)
   */
  async getEntityLevel(entityId: string): Promise<number> {
    const query = `
      WITH RECURSIVE ancestor_tree AS (
        -- Base case: start with the entity
        SELECT e.id, 0 as level
        FROM ${this.tableName} e
        WHERE e.id = ?
        
        UNION ALL
        
        -- Recursive case: find parent through relationships
        SELECT parent.id, at.level + 1
        FROM ${this.tableName} parent
        JOIN entity_relationships er ON parent.id = er.source_entity_id
        JOIN ancestor_tree at ON er.target_entity_id = at.id
        WHERE er.relationship_type = 'parent_of' AND er.is_active = 1
      )
      SELECT MAX(level) as max_level FROM ancestor_tree
    `;
    
    const result = this.getDb().prepare(query).get(entityId) as { max_level: number };
    return result.max_level || 0;
  }

  /**
   * Get all ancestors of an entity (relationship-based)
   */
  async getEntityAncestors(entityId: string): Promise<Entity[]> {
    const query = `
      WITH RECURSIVE ancestor_tree AS (
        -- Base case: start with the entity
        SELECT e.*, 0 as level
        FROM ${this.tableName} e
        WHERE e.id = ?
        
        UNION ALL
        
        -- Recursive case: find parent through relationships
        SELECT parent.*, at.level + 1
        FROM ${this.tableName} parent
        JOIN entity_relationships er ON parent.id = er.source_entity_id
        JOIN ancestor_tree at ON er.target_entity_id = at.id
        WHERE er.relationship_type = 'parent_of' AND er.is_active = 1
      )
      SELECT * FROM ancestor_tree
      WHERE id != ?
      ORDER BY level DESC
    `;
    
    const ancestors = this.getDb().prepare(query).all(entityId, entityId) as Entity[];
    return ancestors.map(entity => this.parseJsonFields(entity));
  }

  /**
   * Get all descendants of an entity (relationship-based)
   */
  async getEntityDescendants(entityId: string): Promise<Entity[]> {
    // This is the same as getEntityHierarchy, but with a clearer name
    return this.getEntityHierarchy(entityId);
  }

  async createRelationship(
    sourceEntityId: string, 
    targetEntityId: string, 
    relationshipType: string, 
    options: {
      strength?: number;
      isAutoGenerated?: boolean;
      impactScore?: number;
      isBidirectional?: boolean;
      context?: Record<string, any>;
      notes?: string;
      createdBy?: string;
    } = {}
  ): Promise<string> {
    // Validate entities exist
    const sourceEntity = await this.findById(sourceEntityId);
    const targetEntity = await this.findById(targetEntityId);

    if (!sourceEntity || !targetEntity) {
      throw new Error('Source or target entity not found');
    }

    // Generate relationship ID
    const originalPrefix = this.idPrefix;
    this.idPrefix = 'REL';
    const relationshipId = await this.generateId();
    this.idPrefix = originalPrefix;

    const now = new Date().toISOString();
    const relationshipData = {
      id: relationshipId,
      source_entity_id: sourceEntityId,
      target_entity_id: targetEntityId,
      relationship_type: relationshipType,
      strength: options.strength || 0.5,
      is_auto_generated: options.isAutoGenerated ? 1 : 0,
      impact_score: options.impactScore || 0.5,
      is_bidirectional: options.isBidirectional ? 1 : 0,
      context: JSON.stringify(options.context || {}),
      notes: options.notes || null,
      is_active: 1,
      created_by: options.createdBy || 'system',
      created_at: now,
      updated_at: now
    };

    const query = `
      INSERT INTO entity_relationships (${Object.keys(relationshipData).join(', ')})
      VALUES (${Object.keys(relationshipData).map(() => '?').join(', ')})
    `;

    const result = this.getDb().prepare(query).run(...Object.values(relationshipData));

    if (result.changes > 0) {
      connectionManager.invalidateCache('entity_relationships');
      console.log(`✅ Created relationship: ${sourceEntityId} -[${relationshipType}]-> ${targetEntityId}`);
      return relationshipId;
    } else {
      throw new Error('Failed to create relationship');
    }
  }

  async getEntityRelationships(
    entityId: string, 
    options: {
      direction?: 'incoming' | 'outgoing' | 'both';
      relationshipType?: string;
      isActive?: boolean;
    } = {}
  ): Promise<EntityRelationship[]> {
    const { direction = 'both', relationshipType, isActive = true } = options;

    let query = `
      SELECT r.*, 
        se.title as source_title, se.entity_type as source_entity_type,
        te.title as target_title, te.entity_type as target_entity_type
      FROM entity_relationships r
      JOIN entities se ON r.source_entity_id = se.id
      JOIN entities te ON r.target_entity_id = te.id
      WHERE r.is_active = ?
    `;

    const params: any[] = [isActive ? 1 : 0];

    // Add direction filter
    if (direction === 'outgoing') {
      query += ` AND r.source_entity_id = ?`;
      params.push(entityId);
    } else if (direction === 'incoming') {
      query += ` AND r.target_entity_id = ?`;
      params.push(entityId);
    } else if (direction === 'both') {
      query += ` AND (r.source_entity_id = ? OR r.target_entity_id = ?)`;
      params.push(entityId, entityId);
    }

    // Add relationship type filter
    if (relationshipType) {
      query += ` AND r.relationship_type = ?`;
      params.push(relationshipType);
    }

    query += ` ORDER BY r.created_at DESC`;

    const relationships = connectionManager.cachedQueryAll<EntityRelationship>(
      query, 
      params, 
      300000 // 5 minute cache
    );

    return relationships.map(rel => ({
      ...rel,
      context: rel.context ? JSON.parse(rel.context) : {}
    }));
  }

  async updateEntityStatus(
    entityId: string, 
    status: Entity['status'],
    options: {
      progress?: number;
      assignee?: string;
      actualHours?: number;
    } = {}
  ): Promise<Entity | null> {
    const updateData: Partial<Entity> = {
      status,
      updated_by: 'system'
    };

    // Handle completion
    if (status === 'completed') {
      updateData.completion_date = new Date().toISOString();
      updateData.progress = 100;
    }

    // Add optional fields
    if (options.progress !== undefined) {
      updateData.progress = options.progress;
    }
    if (options.assignee !== undefined) {
      updateData.assignee = options.assignee;
    }
    if (options.actualHours !== undefined) {
      updateData.actual_hours = options.actualHours;
    }

    const updated = await this.update(entityId, updateData);
    
    if (updated) {
      // Recalculate parent progress if entity has parent
      if (updated.parent_id) {
        await this.calculateEntityProgress(updated.parent_id);
      }
    }

    return updated;
  }

  async calculateEntityProgress(entityId: string): Promise<number> {
    const entity = await this.findById(entityId);
    if (!entity) return 0;

    // Get direct children
    const children = await this.getEntityChildren(entityId);
    
    if (children.length === 0) {
      // No children, return current progress
      return entity.progress;
    }

    // Calculate weighted progress from children
    let totalProgress = 0;
    let totalWeight = 0;

    for (const child of children) {
      const childProgress = await this.calculateEntityProgress(child.id);
      const weight = child.estimated_hours || 1; // Use estimated hours as weight
      
      totalProgress += childProgress * weight;
      totalWeight += weight;
    }

    const calculatedProgress = totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;

    // Update entity progress
    await this.update(entityId, { progress: calculatedProgress });

    return calculatedProgress;
  }

  async searchEntities(searchOptions: EntitySearchOptions): Promise<Entity[]> {
    const {
      text,
      entityType,
      status,
      priority,
      assignee,
      boardId,
      parentId,
      level,
      orderBy = 'updated_at DESC',
      limit = 50,
      offset = 0
    } = searchOptions;

    let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];

    // Text search
    if (text) {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      const searchText = `%${text}%`;
      params.push(searchText, searchText);
    }

    // Entity type filter
    if (entityType) {
      query += ` AND entity_type = ?`;
      params.push(entityType);
    }

    // Status filter
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    // Priority filter
    if (priority) {
      query += ` AND priority = ?`;
      params.push(priority);
    }

    // Assignee filter
    if (assignee) {
      query += ` AND assignee = ?`;
      params.push(assignee);
    }

    // Board filter
    if (boardId) {
      query += ` AND board_id = ?`;
      params.push(boardId);
    }

    // Parent filter
    if (parentId) {
      query += ` AND parent_id = ?`;
      params.push(parentId);
    }

    // Level filter
    if (level !== undefined) {
      query += ` AND level = ?`;
      params.push(level);
    }

    // Order and pagination
    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const entities = this.getDb().prepare(query).all(...params) as Entity[];
    return entities.map(entity => this.parseJsonFields(entity));
  }

  async getBoardStats(boardPrefix: string): Promise<{
    board: any;
    total_entities: number;
    completed: number;
    in_progress: number;
    pending: number;
    blocked: number;
    avg_progress: number;
    total_estimated_hours: number;
    total_actual_hours: number;
    completion_rate: string;
  }> {
    const stats = this.getDb().prepare(`
      SELECT 
        COUNT(*) as total_entities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked,
        AVG(progress) as avg_progress,
        COALESCE(SUM(estimated_hours), 0) as total_estimated_hours,
        COALESCE(SUM(actual_hours), 0) as total_actual_hours
      FROM ${this.tableName}
      WHERE board_id = ?
    `).get(boardPrefix) as any;

    const board = this.getDb().prepare('SELECT * FROM boards WHERE prefix = ?').get(boardPrefix);

    return {
      board,
      ...stats,
      completion_rate: stats.total_entities > 0 
        ? (stats.completed / stats.total_entities * 100).toFixed(1) 
        : '0'
    };
  }

  // Helper method to parse JSON fields
  private parseJsonFields(entity: Entity): Entity {
    return {
      ...entity,
      metadata: entity.metadata ? JSON.parse(entity.metadata) : {},
      attributes: entity.attributes ? JSON.parse(entity.attributes) : {},
      labels: entity.labels ? JSON.parse(entity.labels) : [],
      dependencies: entity.dependencies ? JSON.parse(entity.dependencies) : []
    };
  }

  // Debug method for CLI access
  async debug(entityId: string): Promise<{
    entity: EntityWithRelations;
    stats: any;
    hierarchy: Entity[];
  }> {
    const entity = await this.getEntityWithRelations(entityId);
    const stats = await this.getBoardStats(entity.board_id);
    const hierarchy = await this.getEntityHierarchy(entityId);

    return {
      entity,
      stats,
      hierarchy
    };
  }
}