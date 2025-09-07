#!/usr/bin/env node

/**
 * Claude Context Sync Script (DAL Version)
 * High-performance version using centralized Database Access Layer
 * Replaces direct database access with repository pattern
 */

const path = require('path');

// Import DAL (converted to CommonJS compatible)
async function importDAL() {
  const module = await import('../src/lib/database/dal/index.js');
  return module.DAL;
}

const ClaudeContextManager = require('../src/lib/context/claude-context-manager.cjs');

class ContextSyncScriptDAL {
  constructor() {
    this.contextManager = new ClaudeContextManager();
    this.DAL = null;
  }

  async initialize() {
    if (!this.DAL) {
      this.DAL = await importDAL();
      await this.DAL.initialize();
      console.log('🚀 DAL initialized for context sync');
    }
  }

  async syncContext() {
    try {
      await this.initialize();
      console.log('🔄 Syncing Claude context with DAL...');
      
      const context = await this.contextManager.getActiveContext();
      
      if (!context.activeEntity) {
        console.log('ℹ️  No active task set');
        return;
      }

      // Get fresh entity data from DAL
      const entity = await this.DAL.entities.findById(context.entityId);
      if (!entity) {
        console.log(`⚠️  Entity ${context.entityId} not found in database`);
        return;
      }

      // Get entity with full relationships
      const entityWithRelations = await this.DAL.entities.getEntityWithRelations(context.entityId);

      console.log(`📋 Active Task: ${entityWithRelations.title} (${entityWithRelations.id})`);
      console.log(`📊 Status: ${entityWithRelations.status} | Priority: ${entityWithRelations.priority}`);
      console.log(`📈 Progress: ${entityWithRelations.progress}%`);
      
      if (entityWithRelations.relationships && entityWithRelations.relationships.length > 0) {
        console.log(`🔗 Related Entities: ${entityWithRelations.relationships.length}`);
        entityWithRelations.relationships.forEach(rel => {
          const targetTitle = rel.target_entity_id === entityWithRelations.id ? 
            rel.source_title : rel.target_title;
          const targetId = rel.target_entity_id === entityWithRelations.id ? 
            rel.source_entity_id : rel.target_entity_id;
          console.log(`   - ${targetTitle} (${targetId}) [${rel.relationship_type}]`);
        });
      }

      // Update context if entity has changed
      if (context.title !== entityWithRelations.title || 
          context.status !== entityWithRelations.status ||
          context.progress !== entityWithRelations.progress) {
        
        console.log('🔄 Entity data changed, updating context...');
        
        // Get related entities for context
        const relatedEntities = [];
        if (entityWithRelations.relationships) {
          for (const rel of entityWithRelations.relationships) {
            const relatedId = rel.target_entity_id === entityWithRelations.id ? 
              rel.source_entity_id : rel.target_entity_id;
            const relatedEntity = await this.DAL.entities.findById(relatedId);
            if (relatedEntity) {
              relatedEntities.push({
                ...relatedEntity,
                relationship: rel.relationship_type
              });
            }
          }
        }

        await this.contextManager.setActiveEntity(entityWithRelations, relatedEntities);
      }

      // Generate fresh context documentation
      await this.contextManager.generateContextDocs(context);
      console.log('📝 Context documentation updated');

      // Display CLI reference commands
      console.log('\n🚀 CLI References:');
      console.log(`   @active`);
      console.log(`   @entity:${context.entityId}`);
      
      if (entityWithRelations.relationships && entityWithRelations.relationships.length > 0) {
        entityWithRelations.relationships.forEach(rel => {
          const relatedId = rel.target_entity_id === entityWithRelations.id ? 
            rel.source_entity_id : rel.target_entity_id;
          console.log(`   @entity:${relatedId}`);
        });
      }

      console.log(`\n⏰ Last Updated: ${new Date(context.lastUpdated).toLocaleString()}`);
      
      // Show performance stats
      const dalStats = await this.DAL.debug.overview();
      console.log(`\n📊 DAL Performance: ${dalStats.cacheSize} cached, ${dalStats.uptime}`);
      
    } catch (error) {
      console.error('❌ Error syncing context with DAL:', error);
      process.exit(1);
    }
  }

  async setActiveFromCLI(entityId, relatedIds = []) {
    try {
      await this.initialize();
      console.log(`🎯 Setting active task: ${entityId}`);
      
      // Get entity from DAL
      const entity = await this.DAL.entities.getEntityWithRelations(entityId);
      if (!entity) {
        console.error(`❌ Entity ${entityId} not found`);
        process.exit(1);
      }

      // Get additional related entities if specified
      const additionalRelatedEntities = [];
      for (const relatedId of relatedIds) {
        const relatedEntity = await this.DAL.entities.findById(relatedId);
        if (relatedEntity) {
          additionalRelatedEntities.push({
            ...relatedEntity,
            relationship: 'manual_relation'
          });
        } else {
          console.warn(`⚠️  Related entity ${relatedId} not found`);
        }
      }

      // Combine existing relationships with manually specified ones
      const allRelatedEntities = [
        ...additionalRelatedEntities,
        ...(entity.relationships || []).map(rel => {
          const relatedId = rel.target_entity_id === entityId ? 
            rel.source_entity_id : rel.target_entity_id;
          return {
            id: relatedId,
            title: rel.target_entity_id === entityId ? rel.source_title : rel.target_title,
            entity_type: rel.target_entity_id === entityId ? rel.source_entity_type : rel.target_entity_type,
            relationship: rel.relationship_type
          };
        })
      ];

      await this.contextManager.setActiveEntity(entity, allRelatedEntities);
      console.log(`✅ Active task set: ${entity.title}`);
      
      // Record activity in DAL if needed
      await this.contextManager.addActivity('set_active', entityId, `Set as active task via CLI`);
      
      // Sync and display context
      await this.syncContext();
      
    } catch (error) {
      console.error('❌ Error setting active task:', error);
      process.exit(1);
    }
  }

  async clearActive() {
    try {
      console.log('🧹 Clearing active task...');
      await this.contextManager.clearActiveEntity();
      console.log('✅ Active task cleared');
    } catch (error) {
      console.error('❌ Error clearing active task:', error);
      process.exit(1);
    }
  }

  async exportContext() {
    try {
      const export_text = await this.contextManager.exportForCLI();
      console.log(export_text);
    } catch (error) {
      console.error('❌ Error exporting context:', error);
      process.exit(1);
    }
  }

  async listEntities(type = null, limit = 10) {
    try {
      await this.initialize();
      console.log('📋 Available Entities (via DAL):');
      
      const entities = await this.DAL.entities.searchEntities({
        entityType: type,
        orderBy: 'updated_at DESC',
        limit: limit
      });

      if (!entities || entities.length === 0) {
        console.log('   No entities found');
        return;
      }

      entities.forEach(entity => {
        const statusIcon = entity.status === 'completed' ? '✅' : 
                          entity.status === 'in_progress' ? '🔄' :
                          entity.status === 'blocked' ? '🚫' : '⏳';
        console.log(`   ${statusIcon} ${entity.id} - ${entity.title} (${entity.entity_type}) [${entity.status}] ${entity.progress}%`);
      });

    } catch (error) {
      console.error('❌ Error listing entities:', error);
      process.exit(1);
    }
  }

  async searchEntities(query, limit = 10) {
    try {
      await this.initialize();
      console.log(`🔍 Searching entities for: "${query}"`);
      
      const entities = await this.DAL.entities.searchEntities({
        text: query,
        orderBy: 'updated_at DESC',
        limit: limit
      });

      if (!entities || entities.length === 0) {
        console.log('   No matching entities found');
        return;
      }

      entities.forEach(entity => {
        const statusIcon = entity.status === 'completed' ? '✅' : 
                          entity.status === 'in_progress' ? '🔄' :
                          entity.status === 'blocked' ? '🚫' : '⏳';
        console.log(`   ${statusIcon} ${entity.id} - ${entity.title} (${entity.entity_type}) [${entity.status}] ${entity.progress}%`);
        if (entity.description) {
          console.log(`      ${entity.description.substring(0, 80)}${entity.description.length > 80 ? '...' : ''}`);
        }
      });

    } catch (error) {
      console.error('❌ Error searching entities:', error);
      process.exit(1);
    }
  }

  async showEntityDetails(entityId) {
    try {
      await this.initialize();
      console.log(`🔍 Entity Details: ${entityId}`);
      
      const entity = await this.DAL.entities.getEntityWithRelations(entityId);
      if (!entity) {
        console.error(`❌ Entity ${entityId} not found`);
        return;
      }

      console.log(`\n📋 ${entity.title}`);
      console.log(`   ID: ${entity.id}`);
      console.log(`   Type: ${entity.entity_type}`);
      console.log(`   Status: ${entity.status} (${entity.progress}%)`);
      console.log(`   Priority: ${entity.priority}`);
      console.log(`   Assignee: ${entity.assignee || 'Unassigned'}`);
      console.log(`   Board: ${entity.board_id}`);
      console.log(`   Level: ${entity.level}`);
      console.log(`   Hierarchy: ${entity.hierarchy_path}`);
      
      if (entity.description) {
        console.log(`   Description: ${entity.description}`);
      }

      if (entity.estimated_hours) {
        console.log(`   Estimated Hours: ${entity.estimated_hours}`);
      }
      
      if (entity.actual_hours) {
        console.log(`   Actual Hours: ${entity.actual_hours}`);
      }

      if (entity.labels && entity.labels.length > 0) {
        console.log(`   Labels: ${entity.labels.join(', ')}`);
      }

      if (entity.dependencies && entity.dependencies.length > 0) {
        console.log(`   Dependencies: ${entity.dependencies.join(', ')}`);
      }

      if (entity.children && entity.children.length > 0) {
        console.log(`\n📦 Child Entities (${entity.children.length}):`);
        entity.children.forEach(child => {
          console.log(`   - ${child.id}: ${child.title} [${child.status}] ${child.progress}%`);
        });
      }

      if (entity.relationships && entity.relationships.length > 0) {
        console.log(`\n🔗 Relationships (${entity.relationships.length}):`);
        entity.relationships.forEach(rel => {
          const targetTitle = rel.target_entity_id === entityId ? rel.source_title : rel.target_title;
          const targetId = rel.target_entity_id === entityId ? rel.source_entity_id : rel.target_entity_id;
          console.log(`   - ${targetTitle} (${targetId}) [${rel.relationship_type}] (strength: ${rel.strength})`);
        });
      }

      console.log(`\n⏰ Created: ${entity.created_at}`);
      console.log(`   Updated: ${entity.updated_at}`);

    } catch (error) {
      console.error('❌ Error getting entity details:', error);
      process.exit(1);
    }
  }

  async showStats() {
    try {
      await this.initialize();
      console.log('📊 Database Statistics (via DAL):');
      
      const dalStats = await this.DAL.getStats();
      
      console.log(`\n🔌 Connection:`);
      console.log(`   Status: ${dalStats.connection.connected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   Mode: ${dalStats.connection.mode}`);
      console.log(`   Cache Size: ${dalStats.connection.cacheSize} entries`);
      
      console.log(`\n📋 Entities:`);
      console.log(`   Total: ${dalStats.repositories.entities.totalRecords}`);
      
      console.log(`\n📄 Documents:`);
      console.log(`   Total: ${dalStats.repositories.documents.totalRecords}`);
      
      if (dalStats.repositories.documents.stats) {
        const docStats = dalStats.repositories.documents.stats;
        console.log(`   Total Words: ${docStats.total_word_count}`);
        console.log(`   Avg Words: ${docStats.avg_word_count}`);
        console.log(`   Categories:`, Object.entries(docStats.by_category)
          .map(([cat, count]) => `${cat}(${count})`).join(', '));
      }
      
      console.log(`\n⚠️  Errors:`);
      console.log(`   Recent: ${dalStats.errors.recentErrors}`);
      console.log(`   Total: ${dalStats.errors.total}`);
      
      console.log(`\n⏱️  Performance:`);
      console.log(`   Uptime: ${Math.round(dalStats.performance.uptime / 60)} minutes`);
      
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      process.exit(1);
    }
  }

  printHelp() {
    console.log(`
🤖 Claude Context Sync Tool (DAL Version)

Usage:
  node sync-claude-context-dal.cjs [command] [options]

Commands:
  sync                            Sync and display current context
  set <entity-id> [related-ids]   Set active task with optional related entities  
  clear                          Clear active task
  export                         Export context summary
  list [type] [limit]            List available entities
  search <query> [limit]         Search entities by text
  show <entity-id>               Show detailed entity information
  stats                          Show database statistics
  help                           Show this help

Examples:
  node sync-claude-context-dal.cjs sync
  node sync-claude-context-dal.cjs set TASK-123
  node sync-claude-context-dal.cjs set TASK-123 TASK-124,ISSUE-5
  node sync-claude-context-dal.cjs list task 20
  node sync-claude-context-dal.cjs search "database performance"
  node sync-claude-context-dal.cjs show TASK-123
  node sync-claude-context-dal.cjs stats
  node sync-claude-context-dal.cjs clear

Environment:
  Active context: ${this.contextManager.contextPath}
  Documents:      ${this.contextManager.docsPath}
  DAL Version:    High-Performance Repository Pattern
`);
  }
}

// CLI entry point
async function main() {
  const script = new ContextSyncScriptDAL();
  const args = process.argv.slice(2);
  const command = args[0] || 'sync';

  switch (command) {
    case 'sync':
      await script.syncContext();
      break;
      
    case 'set':
      const entityId = args[1];
      if (!entityId) {
        console.error('❌ Entity ID required');
        console.log('Usage: node sync-claude-context-dal.cjs set <entity-id> [related-ids]');
        process.exit(1);
      }
      const relatedIds = args[2] ? args[2].split(',').map(id => id.trim()) : [];
      await script.setActiveFromCLI(entityId, relatedIds);
      break;
      
    case 'clear':
      await script.clearActive();
      break;
      
    case 'export':
      await script.exportContext();
      break;
      
    case 'list':
      const type = args[1] || null;
      const limit = parseInt(args[2]) || 10;
      await script.listEntities(type, limit);
      break;
      
    case 'search':
      const query = args[1];
      if (!query) {
        console.error('❌ Search query required');
        console.log('Usage: node sync-claude-context-dal.cjs search <query> [limit]');
        process.exit(1);
      }
      const searchLimit = parseInt(args[2]) || 10;
      await script.searchEntities(query, searchLimit);
      break;
      
    case 'show':
      const showEntityId = args[1];
      if (!showEntityId) {
        console.error('❌ Entity ID required');
        console.log('Usage: node sync-claude-context-dal.cjs show <entity-id>');
        process.exit(1);
      }
      await script.showEntityDetails(showEntityId);
      break;
      
    case 'stats':
      await script.showStats();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      script.printHelp();
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      script.printHelp();
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = ContextSyncScriptDAL;