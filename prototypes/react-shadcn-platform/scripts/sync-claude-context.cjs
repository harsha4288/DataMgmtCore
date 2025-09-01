#!/usr/bin/env node

/**
 * Claude Context Sync Script
 * Synchronizes active task context between dashboard and CLI
 */

const ClaudeContextManager = require('../src/lib/context/claude-context-manager.cjs');
const EntityManager = require('../src/lib/database/entity-manager.cjs');
const path = require('path');
const fs = require('fs');

class ContextSyncScript {
  constructor() {
    this.contextManager = new ClaudeContextManager();
    this.entityManager = new EntityManager();
  }

  async syncContext() {
    try {
      console.log('🔄 Syncing Claude context...');
      
      const context = await this.contextManager.getActiveContext();
      
      if (!context.activeEntity) {
        console.log('ℹ️  No active task set');
        return;
      }

      console.log(`📋 Active Task: ${context.title} (${context.entityId})`);
      console.log(`📊 Status: ${context.status} | Priority: ${context.priority}`);
      
      if (context.relatedEntities.length > 0) {
        console.log(`🔗 Related Entities: ${context.relatedEntities.length}`);
        context.relatedEntities.forEach(entity => {
          console.log(`   - ${entity.title} (${entity.id})`);
        });
      }

      // Generate fresh context documentation
      await this.contextManager.generateContextDocs(context);
      console.log('📝 Context documentation updated');

      // Display CLI reference commands
      console.log('\n🚀 CLI References:');
      console.log(`   @active`);
      console.log(`   @entity:${context.entityId}`);
      
      if (context.relatedEntities.length > 0) {
        context.relatedEntities.forEach(entity => {
          console.log(`   @entity:${entity.id}`);
        });
      }

      console.log(`\n⏰ Last Updated: ${new Date(context.lastUpdated).toLocaleString()}`);
      
    } catch (error) {
      console.error('❌ Error syncing context:', error);
      process.exit(1);
    }
  }

  async setActiveFromCLI(entityId, relatedIds = []) {
    try {
      console.log(`🎯 Setting active task: ${entityId}`);
      
      // Get entity from database
      const entity = await this.entityManager.getEntity(entityId);
      if (!entity) {
        console.error(`❌ Entity ${entityId} not found`);
        process.exit(1);
      }

      // Get related entities
      const relatedEntities = [];
      for (const relatedId of relatedIds) {
        const relatedEntity = await this.entityManager.getEntity(relatedId);
        if (relatedEntity) {
          relatedEntities.push({
            ...relatedEntity,
            relationship: 'related'
          });
        }
      }

      await this.contextManager.setActiveEntity(entity, relatedEntities);
      console.log(`✅ Active task set: ${entity.title}`);
      
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
      console.log('📋 Available Entities:');
      
      const entities = await this.entityManager.searchEntities({
        entityType: type,
        limit: limit
      });

      if (!entities || entities.length === 0) {
        console.log('   No entities found');
        return;
      }

      entities.forEach(entity => {
        console.log(`   ${entity.id} - ${entity.title} (${entity.entity_type}) [${entity.status}]`);
      });

    } catch (error) {
      console.error('❌ Error listing entities:', error);
      process.exit(1);
    }
  }

  printHelp() {
    console.log(`
🤖 Claude Context Sync Tool

Usage:
  node sync-claude-context.cjs [command] [options]

Commands:
  sync                          Sync and display current context
  set <entity-id> [related-ids] Set active task with optional related entities
  clear                        Clear active task
  export                       Export context summary
  list [type] [limit]          List available entities
  help                         Show this help

Examples:
  node sync-claude-context.cjs sync
  node sync-claude-context.cjs set TASK-123
  node sync-claude-context.cjs set TASK-123 TASK-124,ISSUE-5
  node sync-claude-context.cjs list task 20
  node sync-claude-context.cjs clear

Environment:
  Active context: ${this.contextManager.contextPath}
  Documents:      ${this.contextManager.docsPath}
`);
  }
}

// CLI entry point
async function main() {
  const script = new ContextSyncScript();
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
        console.log('Usage: node sync-claude-context.cjs set <entity-id> [related-ids]');
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

module.exports = ContextSyncScript;