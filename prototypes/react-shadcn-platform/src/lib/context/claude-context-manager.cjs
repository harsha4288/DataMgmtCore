const fs = require('fs')
const path = require('path')

class ClaudeContextManager {
  constructor() {
    this.contextPath = path.join(__dirname, '..', '..', '..', '.claude', 'active-context.json')
    this.docsPath = path.join(__dirname, '..', '..', '..', 'docs', 'active')
    this.ensureDirectories()
  }

  ensureDirectories() {
    const claudeDir = path.dirname(this.contextPath)
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true })
    }
    if (!fs.existsSync(this.docsPath)) {
      fs.mkdirSync(this.docsPath, { recursive: true })
    }
  }

  async getActiveContext() {
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

  async setActiveEntity(entityDetails, relatedEntities = []) {
    const context = {
      activeEntity: entityDetails.id,
      entityId: entityDetails.id,
      entityType: entityDetails.entity_type,
      title: entityDetails.title,
      description: entityDetails.description || null,
      status: entityDetails.status,
      priority: entityDetails.priority,
      assignedTo: entityDetails.assignee || null,
      relatedEntities: relatedEntities.map(entity => ({
        id: entity.id,
        type: entity.entity_type,
        title: entity.title,
        relationship: entity.relationship || 'related'
      })),
      documents: [], // Will be populated by document manager
      lastUpdated: new Date().toISOString(),
      workingContext: {
        breadcrumb: this.buildBreadcrumb(entityDetails),
        currentBoard: entityDetails.board_id || null,
        recentActivity: []
      }
    }

    // Save context file
    fs.writeFileSync(this.contextPath, JSON.stringify(context, null, 2))

    // Generate context documentation
    await this.generateContextDocs(context)
  }

  async clearActiveEntity() {
    const emptyContext = {
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

  async addActivity(action, entityId, details) {
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

  buildBreadcrumb(entity) {
    // Build breadcrumb based on entity hierarchy
    const breadcrumb = []
    
    // Add board if exists
    if (entity.board_id) {
      breadcrumb.push({
        id: entity.board_id,
        title: `Board ${entity.board_id}`,
        type: 'board'
      })
    }

    // Add current entity
    breadcrumb.push({
      id: entity.id,
      title: entity.title,
      type: entity.entity_type
    })

    return breadcrumb
  }

  async generateContextDocs(context) {
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

  generateTaskMarkdown(context) {
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

  generateRelatedEntitiesMarkdown(context) {
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

  generateContextHistoryMarkdown(context) {
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

  async clearContextDocs() {
    const files = ['current-task.md', 'related-entities.md', 'context-history.md']
    
    files.forEach(file => {
      const filePath = path.join(this.docsPath, file)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })
  }

  // Export context for CLI consumption
  async exportForCLI() {
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

module.exports = ClaudeContextManager