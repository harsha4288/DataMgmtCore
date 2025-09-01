import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Square } from 'lucide-react'
import { useActiveTask } from '@/hooks/useActiveTask'
import { type EntityDetails } from '@/lib/context/claude-context-manager'

interface SetActiveButtonProps {
  entity: {
    id: string
    type: string
    title: string
    description?: string
    status: string
    priority: string
    assignedTo?: string
    boardId?: string
    metadata?: Record<string, any>
    createdAt: string
    updatedAt: string
  }
  relatedEntities?: any[]
  variant?: 'default' | 'outline' | 'ghost' | 'badge'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function SetActiveButton({ 
  entity, 
  relatedEntities = [], 
  variant = 'outline',
  size = 'sm',
  className = '' 
}: SetActiveButtonProps) {
  const { activeContext, setActiveEntity, clearActiveEntity } = useActiveTask()

  const isActive = activeContext?.entityId === entity.id
  
  const handleClick = async () => {
    if (isActive) {
      await clearActiveEntity()
    } else {
      const entityDetails: EntityDetails = {
        id: entity.id,
        type: entity.type,
        title: entity.title,
        description: entity.description,
        status: entity.status,
        priority: entity.priority,
        assignedTo: entity.assignedTo,
        boardId: entity.boardId,
        metadata: entity.metadata || {},
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
      }

      await setActiveEntity(entityDetails, relatedEntities)
    }
  }

  if (variant === 'badge') {
    return (
      <Badge
        variant={isActive ? 'default' : 'secondary'}
        className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onClick={handleClick}
      >
        {isActive ? (
          <>
            <Square className="h-2.5 w-2.5 mr-1" />
            Active
          </>
        ) : (
          <>
            <Play className="h-2.5 w-2.5 mr-1" />
            Set Active
          </>
        )}
      </Badge>
    )
  }

  return (
    <Button
      variant={isActive ? 'default' : variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {isActive ? (
        <>
          <Square className="h-3 w-3 mr-1" />
          Clear Active
        </>
      ) : (
        <>
          <Play className="h-3 w-3 mr-1" />
          Set Active
        </>
      )}
    </Button>
  )
}

export default SetActiveButton