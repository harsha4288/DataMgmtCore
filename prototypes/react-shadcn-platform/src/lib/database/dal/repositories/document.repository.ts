/**
 * Document Repository
 * High-performance repository for document management with content indexing
 * Handles project documents, progress tracking, and markdown rendering
 */

import { BaseRepository, BaseEntity } from './base.repository';
import { connectionManager } from '../connection-manager';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface DocumentEntity extends BaseEntity {
  entity_id?: string | null; // Foreign key to entities table
  title: string;
  content: string;
  content_type: 'markdown' | 'text' | 'json' | 'html';
  file_path?: string | null;
  category: string;
  tags?: string; // JSON array string
  metadata?: string; // JSON string
  is_active: boolean;
  version: number;
  parent_document_id?: string | null;
  content_hash: string;
  word_count: number;
  index_content?: string; // Searchable content
  created_by: string;
  updated_by: string;
}

export interface DocumentWithContent extends DocumentEntity {
  tags_parsed: string[];
  metadata_parsed: Record<string, any>;
  rendered_content?: string;
  related_documents?: DocumentEntity[];
}

export interface CreateDocumentOptions {
  entityId?: string;
  title: string;
  content: string;
  contentType?: Document['content_type'];
  filePath?: string;
  category: string;
  tags?: string[];
  metadata?: Record<string, any>;
  parentDocumentId?: string;
}

export interface DocumentSearchOptions {
  text?: string;
  category?: string;
  entityId?: string;
  contentType?: DocumentEntity['content_type'];
  tags?: string[];
  isActive?: boolean;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export class DocumentRepository extends BaseRepository<DocumentEntity> {
  protected tableName = 'documents';
  protected idPrefix = 'DOC';

  async createDocument(options: CreateDocumentOptions): Promise<DocumentWithContent> {
    const {
      entityId = null,
      title,
      content,
      contentType = 'markdown',
      filePath = null,
      category,
      tags = [],
      metadata = {},
      parentDocumentId = null
    } = options;

    // Generate content hash for deduplication
    const contentHash = this.generateContentHash(content);
    
    // Calculate word count
    const wordCount = this.calculateWordCount(content);
    
    // Generate searchable index content
    const indexContent = this.generateIndexContent(title, content, tags);

    const documentData = {
      entity_id: entityId,
      title,
      content,
      content_type: contentType,
      file_path: filePath,
      category,
      tags: JSON.stringify(tags),
      metadata: JSON.stringify(metadata),
      is_active: true,
      version: 1,
      parent_document_id: parentDocumentId,
      content_hash: contentHash,
      word_count: wordCount,
      index_content: indexContent,
      created_by: 'system',
      updated_by: 'system'
    };

    const created = await this.create(documentData);
    
    // Save to file if path is specified
    if (filePath) {
      await this.saveToFile(filePath, content);
    }

    console.log(`✅ Created document: ${created.id} - ${title} (${category})`);
    return this.parseJsonFields(created);
  }

  async getDocumentWithContent(documentId: string): Promise<DocumentWithContent | null> {
    const document = await this.findById(documentId);
    if (!document) return null;

    const documentWithContent = this.parseJsonFields(document);
    
    // Get related documents
    documentWithContent.related_documents = await this.getRelatedDocuments(documentId);

    // Render content if needed
    if (document.content_type === 'markdown') {
      documentWithContent.rendered_content = await this.renderMarkdown(document.content);
    }

    return documentWithContent;
  }

  async updateDocumentContent(
    documentId: string, 
    content: string,
    options: {
      title?: string;
      tags?: string[];
      metadata?: Record<string, any>;
      createVersion?: boolean;
    } = {}
  ): Promise<DocumentWithContent | null> {
    const { title, tags, metadata, createVersion = false } = options;
    
    const existingDoc = await this.findById(documentId);
    if (!existingDoc) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Create version if requested
    if (createVersion) {
      await this.createDocumentVersion(existingDoc);
    }

    // Calculate new content metrics
    const contentHash = this.generateContentHash(content);
    const wordCount = this.calculateWordCount(content);
    const indexContent = this.generateIndexContent(
      title || existingDoc.title, 
      content, 
      tags || (existingDoc.tags ? JSON.parse(existingDoc.tags) : [])
    );

    const updateData: Partial<DocumentEntity> = {
      content,
      content_hash: contentHash,
      word_count: wordCount,
      index_content: indexContent,
      version: existingDoc.version + 1,
      updated_by: 'system'
    };

    if (title) updateData.title = title;
    if (tags) updateData.tags = JSON.stringify(tags);
    if (metadata) updateData.metadata = JSON.stringify(metadata);

    const updated = await this.update(documentId, updateData);
    
    // Update file if path exists
    if (updated && updated.file_path) {
      await this.saveToFile(updated.file_path, content);
    }

    return updated ? this.parseJsonFields(updated) : null;
  }

  async searchDocuments(searchOptions: DocumentSearchOptions): Promise<DocumentEntity[]> {
    const {
      text,
      category,
      entityId,
      contentType,
      tags = [],
      isActive = true,
      orderBy = 'updated_at DESC',
      limit = 50,
      offset = 0
    } = searchOptions;

    let query = `SELECT * FROM ${this.tableName} WHERE is_active = ?`;
    const params: any[] = [isActive];

    // Full-text search
    if (text) {
      query += ` AND (title LIKE ? OR index_content LIKE ?)`;
      const searchText = `%${text}%`;
      params.push(searchText, searchText);
    }

    // Category filter
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    // Entity association filter
    if (entityId) {
      query += ` AND entity_id = ?`;
      params.push(entityId);
    }

    // Content type filter
    if (contentType) {
      query += ` AND content_type = ?`;
      params.push(contentType);
    }

    // Tags filter
    if (tags.length > 0) {
      const tagConditions = tags.map(() => `tags LIKE ?`).join(' AND ');
      query += ` AND (${tagConditions})`;
      tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const documents = this.getDb().prepare(query).all(...params) as DocumentEntity[];
    return documents.map(doc => this.parseJsonFields(doc));
  }

  async getDocumentsByEntity(entityId: string): Promise<DocumentEntity[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE entity_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `;
    
    const documents = connectionManager.cachedQueryAll<DocumentEntity>(
      query, 
      [entityId], 
      300000 // 5 minutes
    );
    
    return documents.map(doc => this.parseJsonFields(doc));
  }

  async getDocumentsByCategory(category: string, limit = 50): Promise<DocumentEntity[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE category = ? AND is_active = 1
      ORDER BY updated_at DESC
      LIMIT ?
    `;
    
    const documents = connectionManager.cachedQueryAll<DocumentEntity>(
      query, 
      [category, limit], 
      300000
    );
    
    return documents.map(doc => this.parseJsonFields(doc));
  }

  async createDocumentVersion(document: DocumentEntity): Promise<string> {
    const versionData = {
      ...document,
      parent_document_id: document.id,
      version: document.version,
      title: `${document.title} (v${document.version})`,
      is_active: false, // Versions are archived
    };

    // Remove the original ID so a new one is generated
    delete (versionData as any).id;
    delete (versionData as any).created_at;
    delete (versionData as any).updated_at;

    const version = await this.create(versionData);
    console.log(`📦 Created version: ${version.id} for document ${document.id}`);
    
    return version.id;
  }

  async getDocumentVersions(documentId: string): Promise<DocumentEntity[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE parent_document_id = ?
      ORDER BY version DESC
    `;
    
    const versions = this.getDb().prepare(query).all(documentId) as DocumentEntity[];
    return versions.map(doc => this.parseJsonFields(doc));
  }

  async getRelatedDocuments(documentId: string, limit = 10): Promise<DocumentEntity[]> {
    const document = await this.findById(documentId);
    if (!document) return [];

    const query = `
      SELECT d.*, 
        CASE 
          WHEN d.entity_id = ? THEN 3
          WHEN d.category = ? THEN 2
          WHEN d.tags LIKE ? THEN 1
          ELSE 0
        END as relevance_score
      FROM ${this.tableName} d
      WHERE d.id != ? AND d.is_active = 1
      ORDER BY relevance_score DESC, updated_at DESC
      LIMIT ?
    `;
    
    const tags = document.tags ? JSON.parse(document.tags) : [];
    const tagPattern = tags.length > 0 ? `%${tags[0]}%` : '';
    
    const related = this.getDb().prepare(query).all(
      document.entity_id,
      document.category,
      tagPattern,
      documentId,
      limit
    ) as DocumentEntity[];
    
    return related.map(doc => this.parseJsonFields(doc));
  }

  async generateMarkdown(
    entityId: string, 
    template: 'task' | 'phase' | 'project' = 'task'
  ): Promise<string> {
    // This could be enhanced to generate markdown from entity data
    const entity = await this.getEntityData(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    switch (template) {
      case 'task':
        return this.generateTaskMarkdown(entity);
      case 'phase':
        return this.generatePhaseMarkdown(entity);
      case 'project':
        return this.generateProjectMarkdown(entity);
      default:
        return this.generateTaskMarkdown(entity);
    }
  }

  // Helper methods
  private generateContentHash(content: string): string {
    // Simple hash function - in production, use a proper crypto hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).length;
  }

  private generateIndexContent(title: string, content: string, tags: string[]): string {
    // Create searchable index content
    const cleanContent = content
      .replace(/[#*`_~]/g, '') // Remove markdown syntax
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    return `${title} ${cleanContent} ${tags.join(' ')}`.toLowerCase();
  }

  private async saveToFile(filePath: string, content: string): Promise<void> {
    try {
      const fullPath = join(process.cwd(), filePath);
      const dir = dirname(fullPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, content, 'utf8');
      console.log(`💾 Saved document to: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error saving document to ${filePath}:`, error);
    }
  }

  private async renderMarkdown(content: string): Promise<string> {
    // Placeholder for markdown rendering
    // In production, use a library like marked or remark
    return content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }

  private async getEntityData(entityId: string): Promise<any | null> {
    // This would normally query the entities table
    const query = 'SELECT * FROM entities WHERE id = ?';
    return this.getDb().prepare(query).get(entityId);
  }

  private generateTaskMarkdown(entity: any): string {
    return `# ${entity.title}

**ID:** \`${entity.id}\`  
**Status:** ${entity.status}  
**Priority:** ${entity.priority}  
**Assignee:** ${entity.assignee || 'Unassigned'}  

## Description

${entity.description || 'No description provided'}

## Progress

- **Current Progress:** ${entity.progress}%
- **Estimated Hours:** ${entity.estimated_hours || 'Not specified'}
- **Actual Hours:** ${entity.actual_hours || 'Not specified'}

## Dependencies

${entity.dependencies ? JSON.parse(entity.dependencies).map((dep: string) => `- ${dep}`).join('\n') : 'None'}

---
*Generated on: ${new Date().toISOString()}*
`;
  }

  private generatePhaseMarkdown(entity: any): string {
    return `# Phase: ${entity.title}

**ID:** \`${entity.id}\`  
**Status:** ${entity.status}  
**Progress:** ${entity.progress}%

## Overview

${entity.description || 'No description provided'}

## Tasks

_Task list would be populated from child entities_

---
*Generated on: ${new Date().toISOString()}*
`;
  }

  private generateProjectMarkdown(entity: any): string {
    return `# Project: ${entity.title}

**ID:** \`${entity.id}\`  
**Status:** ${entity.status}  
**Overall Progress:** ${entity.progress}%

## Project Overview

${entity.description || 'No description provided'}

## Key Metrics

- **Total Estimated Hours:** ${entity.estimated_hours || 'Not specified'}
- **Total Actual Hours:** ${entity.actual_hours || 'Not specified'}
- **Start Date:** ${entity.created_at}
- **Last Updated:** ${entity.updated_at}

---
*Generated on: ${new Date().toISOString()}*
`;
  }

  private parseJsonFields(document: DocumentEntity): DocumentWithContent {
    return {
      ...document,
      tags_parsed: document.tags ? JSON.parse(document.tags) : [],
      metadata_parsed: document.metadata ? JSON.parse(document.metadata) : {}
    };
  }

  // Statistics and analytics
  async getDocumentStats(): Promise<{
    total_documents: number;
    by_category: Record<string, number>;
    by_content_type: Record<string, number>;
    total_word_count: number;
    avg_word_count: number;
  }> {
    const totalDocs = await this.count({ is_active: true });
    
    const categoryStats = this.getDb().prepare(`
      SELECT category, COUNT(*) as count
      FROM ${this.tableName}
      WHERE is_active = 1
      GROUP BY category
    `).all() as Array<{ category: string; count: number }>;

    const typeStats = this.getDb().prepare(`
      SELECT content_type, COUNT(*) as count
      FROM ${this.tableName}
      WHERE is_active = 1
      GROUP BY content_type
    `).all() as Array<{ content_type: string; count: number }>;

    const wordStats = this.getDb().prepare(`
      SELECT SUM(word_count) as total, AVG(word_count) as average
      FROM ${this.tableName}
      WHERE is_active = 1
    `).get() as { total: number; average: number } | null;

    return {
      total_documents: totalDocs,
      by_category: Object.fromEntries(categoryStats.map(s => [s.category, s.count])),
      by_content_type: Object.fromEntries(typeStats.map(s => [s.content_type, s.count])),
      total_word_count: wordStats?.total || 0,
      avg_word_count: Math.round(wordStats?.average || 0)
    };
  }
}