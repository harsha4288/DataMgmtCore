import { useMemo } from 'react'
import { Badge } from '../ui/Badge'

interface InventoryBadgeProps {
  available: number
  total: number
  className?: string
  showPercentage?: boolean
  format?: 'available' | 'issued' // Control display format
}

export function InventoryBadge({ 
  available, 
  total, 
  className = '',
  showPercentage = false,
  format = 'available'
}: InventoryBadgeProps) {
  const { percentage, variant, isEmpty } = useMemo(() => {
    if (total === 0) {
      return {
        percentage: 0,
        variant: 'default' as const,
        isEmpty: true
      }
    }

    const pct = Math.round((available / total) * 100)
    
    let variant: 'default' | 'success' | 'warning' | 'error'
    
    if (pct >= 70) {
      variant = 'success'
    } else if (pct >= 40) {
      variant = 'warning'
    } else if (pct >= 15) {
      variant = 'warning'
    } else if (pct > 0) {
      variant = 'error'
    } else {
      variant = 'error'
    }

    return { percentage: pct, variant, isEmpty: false }
  }, [available, total])

  const displayText = useMemo(() => {
    if (showPercentage) {
      return `${percentage}%`
    }
    if (format === 'issued') {
      const issued = total - available
      return `${issued}/${total}`
    }
    return `${available}/${total}`
  }, [available, total, percentage, showPercentage, format])

  const tooltipText = useMemo(() => {
    const issued = total - available
    return `Available: ${available}, Issued: ${issued}, Total: ${total} (${percentage}% available)`
  }, [available, total, percentage])

  // Use consistent empty state styling for zero inventory
  if (isEmpty) {
    return (
      <span 
        className={`inline-flex items-center justify-center bg-empty-badge text-empty-badge border-empty-badge badge-radius badge-weight h-5 px-2 text-xs min-w-[32px] border shadow-sm ${className}`}
        title={tooltipText}
      >
        <span className="placeholder-symbol" />
      </span>
    )
  }

  return (
    <Badge
      variant={variant}
      size="sm"
      className={`font-mono ${className}`}
      title={tooltipText}
    >
      {displayText}
    </Badge>
  )
}

// Utility function to get color classes programmatically using CSS variables
export function getInventoryColorClasses(available: number, total: number): string {
  if (total === 0) {
    return 'bg-muted text-muted-foreground border-border'
  }

  const percentage = (available / total) * 100
  
  if (percentage >= 70) {
    return 'bg-badge-success text-badge-success-foreground border-badge-success'
  } else if (percentage >= 40) {
    return 'bg-badge-warning text-badge-warning-foreground border-badge-warning'
  } else if (percentage >= 15) {
    return 'bg-badge-warning text-badge-warning-foreground border-badge-warning'
  } else if (percentage > 0) {
    return 'bg-badge-error text-badge-error-foreground border-badge-error'
  } else {
    return 'bg-badge-error text-badge-error-foreground border-badge-error'
  }
}