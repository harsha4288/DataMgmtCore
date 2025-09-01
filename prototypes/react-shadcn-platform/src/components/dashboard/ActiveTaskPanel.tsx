import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BrowserClaudeContextManager, type ActiveContext } from '@/lib/context/claude-context-manager'
import { 
  Play, 
  Square, 
  Copy, 
  ExternalLink, 
  ChevronRight,
  Clock,
  User,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ActiveTaskPanelProps {
  className?: string
}

export function ActiveTaskPanel({ className = '' }: ActiveTaskPanelProps) {
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null)
  const [loading, setLoading] = useState(true)

  const contextManager = BrowserClaudeContextManager.getInstance()

  useEffect(() => {
    loadActiveContext()
  }, [loadActiveContext])

  const loadActiveContext = async () => {
    try {
      const context = await contextManager.getActiveContext()
      setActiveContext(context)
    } catch (error) {
      console.error('Failed to load active context:', error)
      toast.error('Failed to load active task context')
    } finally {
      setLoading(false)
    }
  }

  const handleClearActive = async () => {
    try {
      await contextManager.clearActiveEntity()
      setActiveContext(await contextManager.getActiveContext())
      toast.success('Active task cleared')
    } catch (error) {
      console.error('Failed to clear active task:', error)
      toast.error('Failed to clear active task')
    }
  }

  const handleCopyReference = (reference: string) => {
    navigator.clipboard.writeText(reference)
    toast.success(`Copied: ${reference}`)
  }

  const handleExportContext = async () => {
    if (!activeContext?.activeEntity) {
      toast.error('No active task to export')
      return
    }

    try {
      // Generate context summary
      const contextSummary = `Active Task Context:

ID: ${activeContext.entityId}
Title: ${activeContext.title}
Type: ${activeContext.entityType}
Status: ${activeContext.status}
Priority: ${activeContext.priority}
${activeContext.assignedTo ? `Assigned: ${activeContext.assignedTo}` : ''}

Description: ${activeContext.description || 'No description'}

Breadcrumb: ${activeContext.workingContext.breadcrumb.map(b => `${b.type}:${b.id}`).join(' > ')}

Related Entities:
${activeContext.relatedEntities.map(e => `- ${e.title} (${e.id}) - ${e.relationship}`).join('\n') || 'None'}

CLI References:
- @active
- @entity:${activeContext.entityId}

Last Updated: ${activeContext.lastUpdated ? new Date(activeContext.lastUpdated).toLocaleString() : 'Never'}
`

      navigator.clipboard.writeText(contextSummary)
      toast.success('Context exported to clipboard')
    } catch (error) {
      console.error('Failed to export context:', error)
      toast.error('Failed to export context')
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Active Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activeContext?.activeEntity) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Square className="h-4 w-4 text-muted-foreground" />
            No Active Task
          </CardTitle>
          <CardDescription>
            Select a task from the dashboard to start working with Claude
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Click "Set as Active" on any task to begin</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'blocked': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(activeContext.status)}`}></div>
          <Play className="h-4 w-4 text-green-500" />
          Active Task
        </CardTitle>
        <CardDescription>
          Currently working on this task with Claude
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Task Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {activeContext.entityId}
            </Badge>
            <Badge variant={getPriorityColor(activeContext.priority)}>
              {activeContext.priority}
            </Badge>
          </div>
          <h3 className="font-semibold line-clamp-2">{activeContext.title}</h3>
          {activeContext.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {activeContext.description}
            </p>
          )}
        </div>

        <Separator />

        {/* Metadata */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>{activeContext.assignedTo || 'Unassigned'}</span>
          </div>
          {activeContext.lastUpdated && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{new Date(activeContext.lastUpdated).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Breadcrumb */}
        {activeContext.workingContext.breadcrumb.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Context</p>
              <div className="flex items-center gap-1 text-xs">
                {activeContext.workingContext.breadcrumb.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <Badge variant="outline" className="text-xs">
                      {item.type}:{item.id}
                    </Badge>
                    {index < activeContext.workingContext.breadcrumb.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Related Entities */}
        {activeContext.relatedEntities.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Related</p>
              <div className="flex flex-wrap gap-1">
                {activeContext.relatedEntities.slice(0, 3).map((entity) => (
                  <Badge key={entity.id} variant="secondary" className="text-xs">
                    {entity.id}
                  </Badge>
                ))}
                {activeContext.relatedEntities.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{activeContext.relatedEntities.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Claude CLI References</p>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start text-xs h-8"
              onClick={() => handleCopyReference('@active')}
            >
              <Copy className="h-3 w-3 mr-1" />
              @active
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="justify-start text-xs h-8"
              onClick={() => handleCopyReference(`@entity:${activeContext.entityId}`)}
            >
              <Copy className="h-3 w-3 mr-1" />
              @entity:{activeContext.entityId}
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleExportContext}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Export Context
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearActive}
            >
              <Square className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ActiveTaskPanel