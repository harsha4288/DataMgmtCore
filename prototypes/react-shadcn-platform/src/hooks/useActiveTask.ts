import { useState, useEffect, useCallback } from 'react'
import { BrowserClaudeContextManager, type ActiveContext, type EntityDetails } from '@/lib/context/claude-context-manager'
import { toast } from 'sonner'

interface UseActiveTaskReturn {
  activeContext: ActiveContext | null
  isLoading: boolean
  setActiveEntity: (_entityDetails: EntityDetails, _relatedEntities?: any[]) => Promise<void>
  clearActiveEntity: () => Promise<void>
  refreshContext: () => Promise<void>
}

export function useActiveTask(): UseActiveTaskReturn {
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const contextManager = BrowserClaudeContextManager.getInstance()

  const loadActiveContext = useCallback(async () => {
    try {
      setIsLoading(true)
      const context = await contextManager.getActiveContext()
      setActiveContext(context)
    } catch (error) {
      console.error('Failed to load active context:', error)
      toast.error('Failed to load active task context')
    } finally {
      setIsLoading(false)
    }
  }, [contextManager])

  const setActiveEntity = useCallback(async (entityDetails: EntityDetails, relatedEntities: any[] = []) => {
    try {
      await contextManager.setActiveEntity(entityDetails, relatedEntities)
      const updatedContext = await contextManager.getActiveContext()
      setActiveContext(updatedContext)
      toast.success(`Set "${entityDetails.title}" as active task`)
    } catch (error) {
      console.error('Failed to set active entity:', error)
      toast.error('Failed to set active task')
    }
  }, [contextManager])

  const clearActiveEntity = useCallback(async () => {
    try {
      await contextManager.clearActiveEntity()
      const updatedContext = await contextManager.getActiveContext()
      setActiveContext(updatedContext)
      toast.success('Cleared active task')
    } catch (error) {
      console.error('Failed to clear active entity:', error)
      toast.error('Failed to clear active task')
    }
  }, [contextManager])

  const refreshContext = useCallback(async () => {
    await loadActiveContext()
  }, [loadActiveContext])

  useEffect(() => {
    loadActiveContext()
  }, [loadActiveContext])

  return {
    activeContext,
    isLoading,
    setActiveEntity,
    clearActiveEntity,
    refreshContext
  }
}

export default useActiveTask