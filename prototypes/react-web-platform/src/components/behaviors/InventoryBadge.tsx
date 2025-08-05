import { useMemo } from 'react'
import { Badge } from '../ui/Badge'

interface InventoryBadgeProps {
  available: number
  total: number
  className?: string
  showPercentage?: boolean
  format?: 'available' | 'issued' // Control display format
  customThresholds?: {
    excellent?: number  // Default 90% → grade-a
    good?: number       // Default 75% → grade-b  
    fair?: number       // Default 50% → grade-c
    poor?: number       // Default 25% → grade-d
    // Below poor → grade-f
  }
}

export function InventoryBadge({ 
  available, 
  total, 
  className = '',
  showPercentage = false,
  format = 'available',
  customThresholds = {}
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
    
    // Dynamic grade-based system with custom thresholds
    const thresholds = {
      excellent: customThresholds.excellent ?? 90,  // A grade
      good: customThresholds.good ?? 75,            // B grade
      fair: customThresholds.fair ?? 50,            // C grade
      poor: customThresholds.poor ?? 25             // D grade
    }
    
    let variant: 'grade-a' | 'grade-b' | 'grade-c' | 'grade-d' | 'grade-f' | 'default'
    
    if (pct >= thresholds.excellent) {
      variant = 'grade-a'       // Green - Excellent (90%+)
    } else if (pct >= thresholds.good) {
      variant = 'grade-b'       // Blue - Good (75-89%)
    } else if (pct >= thresholds.fair) {
      variant = 'grade-c'       // Yellow - Fair (50-74%)
    } else if (pct >= thresholds.poor) {
      variant = 'grade-d'       // Orange - Poor (25-49%)
    } else {
      variant = 'grade-f'       // Red - Critical (0-24%)
    }

    return { percentage: pct, variant, isEmpty: false }
  }, [available, total, customThresholds])

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
export function getInventoryColorClasses(
  available: number, 
  total: number,
  customThresholds?: {
    excellent?: number
    good?: number
    fair?: number
    poor?: number
  }
): string {
  if (total === 0) {
    return 'bg-muted text-muted-foreground border-border'
  }

  const percentage = (available / total) * 100
  
  // Dynamic grade-based system with custom thresholds
  const thresholds = {
    excellent: customThresholds?.excellent ?? 90,  // A grade
    good: customThresholds?.good ?? 75,            // B grade
    fair: customThresholds?.fair ?? 50,            // C grade
    poor: customThresholds?.poor ?? 25             // D grade
  }
  
  if (percentage >= thresholds.excellent) {
    return 'bg-badge-grade-a text-badge-grade-a-foreground border-badge-grade-a'
  } else if (percentage >= thresholds.good) {
    return 'bg-badge-grade-b text-badge-grade-b-foreground border-badge-grade-b'
  } else if (percentage >= thresholds.fair) {
    return 'bg-badge-grade-c text-badge-grade-c-foreground border-badge-grade-c'
  } else if (percentage >= thresholds.poor) {
    return 'bg-badge-grade-d text-badge-grade-d-foreground border-badge-grade-d'
  } else {
    return 'bg-badge-grade-f text-badge-grade-f-foreground border-badge-grade-f'
  }
}