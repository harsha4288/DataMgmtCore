/**
 * GraphQL Resolvers
 * Extracted from monolithic graphql-server.cjs for better maintainability
 * Contains core resolvers for the documentation system
 */

// Error handling wrapper to prevent crashes
const withErrorHandler = (resolverFn, operationName) => {
  return async (...args) => {
    try {
      return await resolverFn(...args);
    } catch (error) {
      console.error(`GraphQL ${operationName} error:`, error);
      // Return appropriate error response instead of crashing
      if (operationName.includes('create') || operationName.includes('update') || operationName.includes('delete')) {
        return {
          success: false,
          error: `${operationName} failed: ${error.message}`,
          data: null
        };
      }
      return null; // For queries, return null instead of crashing
    }
  };
};

// Factory function to create resolvers with dependencies
function createResolvers(dataSources, entityManager, db) {
  return {
    // JSON scalar resolver
    JSON: {
      serialize: (value) => value,
      parseValue: (value) => value,
      parseLiteral: (ast) => {
        if (ast.kind === 'StringValue') {
          try {
            return JSON.parse(ast.value);
          } catch {
            return ast.value;
          }
        }
        return null;
      }
    },

    Query: {
      getAllPhases: withErrorHandler(async () => {
        return await dataSources.getAllPhases();
      }, 'getAllPhases'),

      getAllTasks: withErrorHandler(async () => {
        return await dataSources.getAllTasks();
      }, 'getAllTasks'),

      getAllIssues: withErrorHandler(async () => {
        return await dataSources.getAllIssues();
      }, 'getAllIssues'),

      getPhase: withErrorHandler(async (_, { id }) => {
        return await dataSources.getPhase(id);
      }, 'getPhase'),

      getTask: withErrorHandler(async (_, { id }) => {
        return await dataSources.getTask(id);
      }, 'getTask'),

      getIssue: withErrorHandler(async (_, { id }) => {
        return await dataSources.getIssue(id);
      }, 'getIssue'),

      // Document resolvers
      getDocumentsByEntity: withErrorHandler(async (_, { entityId, entityType }) => {
        return await dataSources.getDocumentsByEntity(entityId, entityType);
      }, 'getDocumentsByEntity'),

      getDocument: withErrorHandler(async (_, { id }) => {
        return await dataSources.getDocument(id);
      }, 'getDocument'),

      getDocumentContent: withErrorHandler(async (_, { entityId, entityType }) => {
        return await dataSources.getDocumentContent(entityId, entityType);
      }, 'getDocumentContent'),

      // Filtering queries
      getTasksByStatus: withErrorHandler(async (_, { status }) => {
        const tasks = await dataSources.getAllTasks();
        return tasks.filter(task => task.metadata.status === status);
      }, 'getTasksByStatus'),

      getPhasesByStatus: withErrorHandler(async (_, { status }) => {
        const phases = await dataSources.getAllPhases();
        return phases.filter(phase => phase.status === status);
      }, 'getPhasesByStatus'),

      getIssuesByStatus: withErrorHandler(async (_, { status }) => {
        const issues = await dataSources.getAllIssues();
        return issues.filter(issue => issue.status === status);
      }, 'getIssuesByStatus'),

      // Search queries
      searchTasks: withErrorHandler(async (_, { query }) => {
        return await dataSources.searchTasks(query);
      }, 'searchTasks'),

      getTasksByPhase: withErrorHandler(async (_, { phase_id }) => {
        const phase = await dataSources.getPhase(phase_id);
        return phase ? phase.tasks : [];
      }, 'getTasksByPhase'),

      getRelatedTasks: withErrorHandler(async (_, { task_id }) => {
        const task = await dataSources.getTask(task_id);
        if (!task || !task.metadata.dependencies.length) return [];
        
        const allTasks = await dataSources.getAllTasks();
        return allTasks.filter(t => 
          task.metadata.dependencies.includes(t.id) || 
          t.metadata.dependencies.includes(task_id)
        );
      }, 'getRelatedTasks'),

      // Markdown generation
      generateTaskMarkdown: withErrorHandler(async (_, { id, consumer }) => {
        const task = await dataSources.getTask(id);
        if (!task) return null;
        
        return dataSources.generateMarkdownOutput(task, 'task', consumer);
      }, 'generateTaskMarkdown'),

      generatePhaseMarkdown: withErrorHandler(async (_, { id, consumer }) => {
        const phase = await dataSources.getPhase(id);
        if (!phase) return null;
        
        return dataSources.generateMarkdownOutput(phase, 'phase', consumer);
      }, 'generatePhaseMarkdown'),

      generateIssueMarkdown: withErrorHandler(async (_, { id, consumer }) => {
        const issue = await dataSources.getIssue(id);
        if (!issue) return null;
        
        return dataSources.generateMarkdownOutput(issue, 'issue', consumer);
      }, 'generateIssueMarkdown'),

      // Statistics
      getProjectStats: withErrorHandler(async () => {
        return await dataSources.getProjectStats();
      }, 'getProjectStats'),

      // Entity System Queries (simplified subset)
      getEntity: withErrorHandler(async (_, { id }) => {
        return await entityManager.getEntity(id);
      }, 'getEntity'),

      getEntities: withErrorHandler(async (_, { input }) => {
        return await entityManager.searchEntities(input || {});
      }, 'getEntities'),

      getEntityChildren: withErrorHandler(async (_, { id }) => {
        return await entityManager.getEntityChildren(id);
      }, 'getEntityChildren'),

      // Active Claude Context
      getActiveClaudeContext: withErrorHandler(async () => {
        try {
          const fs = require('fs');
          const path = require('path');
          const contextPath = path.join(process.cwd(), '.claude', 'active-context.json');
          
          if (!fs.existsSync(contextPath)) {
            return null;
          }

          const contextData = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
          
          // Transform to GraphQL format
          return {
            activeEntity: contextData.activeEntity || null,
            entityId: contextData.entityId || null,
            entityType: contextData.entityType || null,
            title: contextData.title || null,
            description: contextData.description || null,
            status: contextData.status || null,
            priority: contextData.priority || null,
            assignedTo: contextData.assignedTo || null,
            relatedEntities: contextData.relatedEntities || [],
            documents: contextData.documents || [],
            lastUpdated: contextData.lastUpdated || null,
            workingContext: {
              breadcrumb: contextData.workingContext?.breadcrumb || [],
              currentBoard: contextData.workingContext?.currentBoard || null,
              recentActivity: contextData.workingContext?.recentActivity || []
            }
          };
        } catch (error) {
          console.error('Error reading active Claude context:', error);
          return null;
        }
      }, 'getActiveClaudeContext')
    },

    Mutation: {
      // Entity operations (simplified)
      updateEntityStatus: withErrorHandler(async (_, { id, status, progress, actualHours }) => {
        return await entityManager.updateEntityStatus(id, status, progress, actualHours);
      }, 'updateEntityStatus'),

      createEntity: withErrorHandler(async (_, { input }) => {
        return await entityManager.createEntity(input);
      }, 'createEntity'),

      updateEntity: withErrorHandler(async (_, { id, input }) => {
        return await entityManager.updateEntity(id, input);
      }, 'updateEntity'),

      // Claude Context operations
      setActiveClaudeContext: withErrorHandler(async (_, { entityId, relatedEntityIds }) => {
        try {
          const entity = await entityManager.getEntity(entityId);
          if (!entity) {
            return {
              success: false,
              error: 'Entity not found',
              context: null
            };
          }

          // Create context data
          const contextData = {
            activeEntity: entity.title,
            entityId: entity.id,
            entityType: entity.entityType,
            title: entity.title,
            description: entity.description,
            status: entity.status,
            priority: entity.priority,
            assignedTo: entity.assignee,
            relatedEntities: relatedEntityIds || [],
            documents: [],
            lastUpdated: new Date().toISOString(),
            workingContext: {
              breadcrumb: [{ id: entity.id, title: entity.title, type: entity.entityType }],
              currentBoard: entity.boardId,
              recentActivity: [{
                action: 'set_active_context',
                entityId: entity.id,
                timestamp: new Date().toISOString(),
                details: 'Set as active working context'
              }]
            }
          };

          // Save to file system
          const fs = require('fs');
          const path = require('path');
          const contextPath = path.join(process.cwd(), '.claude', 'active-context.json');
          
          // Ensure directory exists
          const contextDir = path.dirname(contextPath);
          if (!fs.existsSync(contextDir)) {
            fs.mkdirSync(contextDir, { recursive: true });
          }

          fs.writeFileSync(contextPath, JSON.stringify(contextData, null, 2));

          return {
            success: true,
            error: null,
            context: contextData
          };
        } catch (error) {
          console.error('Error setting active Claude context:', error);
          return {
            success: false,
            error: error.message,
            context: null
          };
        }
      }, 'setActiveClaudeContext'),

      clearActiveClaudeContext: withErrorHandler(async () => {
        try {
          const fs = require('fs');
          const path = require('path');
          const contextPath = path.join(process.cwd(), '.claude', 'active-context.json');
          
          if (fs.existsSync(contextPath)) {
            fs.unlinkSync(contextPath);
          }

          return {
            success: true,
            error: null,
            context: null
          };
        } catch (error) {
          console.error('Error clearing active Claude context:', error);
          return {
            success: false,
            error: error.message,
            context: null
          };
        }
      }, 'clearActiveClaudeContext')
    },

    // Type resolvers for computed fields
    Entity: {
      children: async (parent) => {
        return await entityManager.getEntityChildren(parent.id);
      },
      
      relationships: async (parent) => {
        return await entityManager.getEntityRelationships(parent.id);
      },
      
      parent: async (parent) => {
        return parent.parentId ? await entityManager.getEntity(parent.parentId) : null;
      }
    },

    Task: {
      documents: async (parent) => {
        return await dataSources.getDocumentsByEntity(parent.id, 'task');
      },
      
      relationships: async (parent) => {
        return await entityManager.getEntityRelationships(parent.id);
      }
    }
  };
}

module.exports = createResolvers;