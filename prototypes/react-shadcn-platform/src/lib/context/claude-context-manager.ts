import fs from 'fs'
import path from 'path'

// Browser compatibility check
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node

interface ActiveContext {
  activeEntity: string | null
  entityId: string | null
  entityType: string | null
  title: string | null
  description: string | null
  status: string | null
  priority: string | null
  assignedTo: string | null
  relatedEntities: Array<{
    id: string
    type: string
    title: string
    relationship: string
  }>
  documents: Array<{
    id: string
    title: string
    type: string
    path: string
  }>
  lastUpdated: string | null
  workingContext: {
    breadcrumb: Array<{ id: string; title: string; type: string }>
    currentBoard: string | null
    recentActivity: Array<{
      action: string
      entityId: string
      timestamp: string
      details: string
    }>
  }
}

interface EntityDetails {
  id: string
  type: string
  title: string
  description?: string
  status: string
  priority: string
  assignedTo?: string
  boardId?: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

class ClaudeContextManager {
  private contextPath = isNode ? path.join(process.cwd(), '.claude', 'active-context.json') : ''
  private docsPath = isNode ? path.join(process.cwd(), 'docs', 'active') : ''

  constructor() {
    this.ensureDirectories()
  }

  private ensureDirectories() {
    if (!isNode) return // Skip in browser environment
    
    const claudeDir = path.dirname(this.contextPath)
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true })
    }
    if (!fs.existsSync(this.docsPath)) {
      fs.mkdirSync(this.docsPath, { recursive: true })
    }
  }

  async getActiveContext(): Promise<ActiveContext> {
    try {
      if (fs.existsSync(this.contextPath)) {
        const content = fs.readFileSync(this.contextPath, 'utf8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.error('Error reading active context:', error)
    }

    // Return default context
    return {
      activeEntity: null,
      entityId: null,
      entityType: null,
      title: null,
      description: null,
      status: null,
      priority: null,
      assignedTo: null,
      relatedEntities: [],
      documents: [],
      lastUpdated: null,
      workingContext: {
        breadcrumb: [],
        currentBoard: null,
        recentActivity: []
      }
    }
  }

  async setActiveEntity(entityDetails: EntityDetails, relatedEntities: any[] = []): Promise<void> {
    const context: ActiveContext = {
      activeEntity: entityDetails.id,
      entityId: entityDetails.id,
      entityType: entityDetails.type,
      title: entityDetails.title,
      description: entityDetails.description || null,
      status: entityDetails.status,
      priority: entityDetails.priority,
      assignedTo: entityDetails.assignedTo || null,
      relatedEntities: relatedEntities.map(entity => ({
        id: entity.id,
        type: entity.type,
        title: entity.title,
        relationship: entity.relationship || 'related'
      })),
      documents: [], // Will be populated by document manager
      lastUpdated: new Date().toISOString(),
      workingContext: {
        breadcrumb: this.buildBreadcrumb(entityDetails),
        currentBoard: entityDetails.boardId || null,
        recentActivity: []
      }
    }

    // Save context file
    fs.writeFileSync(this.contextPath, JSON.stringify(context, null, 2))

    // Generate context documentation
    await this.generateContextDocs(context)
  }

  async clearActiveEntity(): Promise<void> {
    const emptyContext: ActiveContext = {
      activeEntity: null,
      entityId: null,
      entityType: null,
      title: null,
      description: null,
      status: null,
      priority: null,
      assignedTo: null,
      relatedEntities: [],
      documents: [],
      lastUpdated: new Date().toISOString(),
      workingContext: {
        breadcrumb: [],
        currentBoard: null,
        recentActivity: []
      }
    }

    fs.writeFileSync(this.contextPath, JSON.stringify(emptyContext, null, 2))

    // Clear context docs
    await this.clearContextDocs()
  }

  async addActivity(action: string, entityId: string, details: string): Promise<void> {
    const context = await this.getActiveContext()
    
    const activity = {
      action,
      entityId,
      timestamp: new Date().toISOString(),
      details
    }

    context.workingContext.recentActivity.unshift(activity)
    // Keep only last 10 activities
    context.workingContext.recentActivity = context.workingContext.recentActivity.slice(0, 10)
    context.lastUpdated = new Date().toISOString()

    fs.writeFileSync(this.contextPath, JSON.stringify(context, null, 2))
  }

  private buildBreadcrumb(entity: EntityDetails): Array<{ id: string; title: string; type: string }> {
    // Build breadcrumb based on entity hierarchy
    const breadcrumb = []
    
    // Add board if exists
    if (entity.boardId) {
      breadcrumb.push({
        id: entity.boardId,
        title: `Board ${entity.boardId}`,
        type: 'board'
      })
    }

    // Add current entity
    breadcrumb.push({
      id: entity.id,
      title: entity.title,
      type: entity.type
    })

    return breadcrumb
  }

  private async generateContextDocs(context: ActiveContext): Promise<void> {
    // Generate current-task.md
    const taskDoc = this.generateTaskMarkdown(context)
    fs.writeFileSync(path.join(this.docsPath, 'current-task.md'), taskDoc)

    // Generate related-entities.md
    const relatedDoc = this.generateRelatedEntitiesMarkdown(context)
    fs.writeFileSync(path.join(this.docsPath, 'related-entities.md'), relatedDoc)

    // Generate context-history.md
    const historyDoc = this.generateContextHistoryMarkdown(context)
    fs.writeFileSync(path.join(this.docsPath, 'context-history.md'), historyDoc)
  }

  private generateTaskMarkdown(context: ActiveContext): string {
    if (!context.activeEntity) {
      return '# No Active Task\n\nNo task is currently active. Use the dashboard to set an active task.'
    }

    return `# Active Task: ${context.title}

**Entity ID:** \`${context.entityId}\`  
**Type:** ${context.entityType}  
**Status:** ${context.status}  
**Priority:** ${context.priority}  
${context.assignedTo ? `**Assigned To:** ${context.assignedTo}  ` : ''}

## Description

${context.description || 'No description available'}

## Breadcrumb

${context.workingContext.breadcrumb.map(item => `\`${item.type}:${item.id}\``).join(' > ')}

## Quick Actions

- \`@active\` - Reference this active task in Claude
- \`@entity:${context.entityId}\` - Direct reference to this entity

**Last Updated:** ${context.lastUpdated ? new Date(context.lastUpdated).toLocaleString() : 'Never'}
`
  }

  private generateRelatedEntitiesMarkdown(context: ActiveContext): string {
    if (!context.relatedEntities.length) {
      return '# Related Entities\n\nNo related entities found for the current task.'
    }

    let markdown = '# Related Entities\n\n'
    
    context.relatedEntities.forEach(entity => {
      markdown += `## ${entity.title}\n\n`
      markdown += `- **ID:** \`${entity.id}\`\n`
      markdown += `- **Type:** ${entity.type}\n`
      markdown += `- **Relationship:** ${entity.relationship}\n`
      markdown += `- **Reference:** \`@entity:${entity.id}\`\n\n`
    })

    return markdown
  }

  private generateContextHistoryMarkdown(context: ActiveContext): string {
    if (!context.workingContext.recentActivity.length) {
      return '# Context History\n\nNo recent activity recorded.'
    }

    let markdown = '# Context History\n\n'
    
    context.workingContext.recentActivity.forEach(activity => {
      const timestamp = new Date(activity.timestamp).toLocaleString()
      markdown += `## ${activity.action}\n\n`
      markdown += `- **Entity:** \`${activity.entityId}\`\n`
      markdown += `- **Time:** ${timestamp}\n`
      markdown += `- **Details:** ${activity.details}\n\n`
    })

    return markdown
  }

  private async clearContextDocs(): Promise<void> {
    const files = ['current-task.md', 'related-entities.md', 'context-history.md']
    
    files.forEach(file => {
      const filePath = path.join(this.docsPath, file)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })
  }

  // Export context for CLI consumption
  async exportForCLI(): Promise<string> {
    const context = await this.getActiveContext()
    
    if (!context.activeEntity) {
      return 'No active task set. Use the dashboard to activate a task.'
    }

    return `Active Task: ${context.title} (${context.entityId})
Status: ${context.status} | Priority: ${context.priority}
${context.description ? `Description: ${context.description}` : ''}

Related: ${context.relatedEntities.map(e => e.id).join(', ') || 'None'}

Use @active or @entity:${context.entityId} to reference this task.`
  }
}

// Browser-compatible version for frontend
export class BrowserClaudeContextManager {
  private static instance: BrowserClaudeContextManager
  private contextKey = 'claude-active-context'

  static getInstance(): BrowserClaudeContextManager {
    if (!BrowserClaudeContextManager.instance) {
      BrowserClaudeContextManager.instance = new BrowserClaudeContextManager()
    }
    return BrowserClaudeContextManager.instance
  }

  async getActiveContext(): Promise<ActiveContext> {
    try {
      const stored = localStorage.getItem(this.contextKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error reading active context from localStorage:', error)
    }

    return {
      activeEntity: null,
      entityId: null,
      entityType: null,
      title: null,
      description: null,
      status: null,
      priority: null,
      assignedTo: null,
      relatedEntities: [],
      documents: [],
      lastUpdated: null,
      workingContext: {
        breadcrumb: [],
        currentBoard: null,
        recentActivity: []
      }
    }
  }

  async setActiveEntity(entityDetails: EntityDetails, relatedEntities: any[] = []): Promise<void> {
    const context: ActiveContext = {
      activeEntity: entityDetails.id,
      entityId: entityDetails.id,
      entityType: entityDetails.type,
      title: entityDetails.title,
      description: entityDetails.description || null,
      status: entityDetails.status,
      priority: entityDetails.priority,
      assignedTo: entityDetails.assignedTo || null,
      relatedEntities: relatedEntities.map(entity => ({
        id: entity.id,
        type: entity.type,
        title: entity.title,
        relationship: entity.relationship || 'related'
      })),
      documents: [],
      lastUpdated: new Date().toISOString(),
      workingContext: {
        breadcrumb: this.buildBreadcrumb(entityDetails),
        currentBoard: entityDetails.boardId || null,
        recentActivity: []
      }
    }

    localStorage.setItem(this.contextKey, JSON.stringify(context))

    // Notify backend about context change
    try {
      const mutation = `
        mutation SetActiveClaudeContext($entityId: ID!, $relatedEntityIds: [ID!]) {
          setActiveClaudeContext(entityId: $entityId, relatedEntityIds: $relatedEntityIds) {
            success
            error
            context {
              activeEntity
              entityId
              title
              status
              priority
            }
          }
        }
      `
      
      const relatedIds = relatedEntities.map(e => e.id)
      
      await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mutation,
          variables: {
            entityId: entityDetails.id,
            relatedEntityIds: relatedIds
          }
        })
      })
    } catch (error) {
      console.warn('Failed to sync context with backend:', error)
    }
  }

  async clearActiveEntity(): Promise<void> {
    const emptyContext: ActiveContext = {
      activeEntity: null,
      entityId: null,
      entityType: null,
      title: null,
      description: null,
      status: null,
      priority: null,
      assignedTo: null,
      relatedEntities: [],
      documents: [],
      lastUpdated: new Date().toISOString(),
      workingContext: {
        breadcrumb: [],
        currentBoard: null,
        recentActivity: []
      }
    }

    localStorage.setItem(this.contextKey, JSON.stringify(emptyContext))

    // Notify backend
    try {
      const mutation = `
        mutation ClearActiveClaudeContext {
          clearActiveClaudeContext {
            success
            error
          }
        }
      `
      
      await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation })
      })
    } catch (error) {
      console.warn('Failed to clear context on backend:', error)
    }
  }

  private buildBreadcrumb(entity: EntityDetails): Array<{ id: string; title: string; type: string }> {
    const breadcrumb = []
    
    if (entity.boardId) {
      breadcrumb.push({
        id: entity.boardId,
        title: `Board ${entity.boardId}`,
        type: 'board'
      })
    }

    breadcrumb.push({
      id: entity.id,
      title: entity.title,
      type: entity.type
    })

    return breadcrumb
  }
}

export default ClaudeContextManager
export type { ActiveContext, EntityDetails }