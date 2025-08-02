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
  const { percentage, colorClasses, variant } = useMemo(() => {
    if (total === 0) {
      return {
        percentage: 0,
        colorClasses: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
        variant: 'default' as const
      }
    }

    const pct = Math.round((available / total) * 100)
    
    let colorClasses: string
    let variant: 'default' | 'success' | 'warning' | 'error'
    
    if (pct >= 70) {
      // Green - plenty available (more vibrant)
      colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-600'
      variant = 'success'
    } else if (pct >= 40) {
      // Yellow - moderate availability (warmer tone)
      colorClasses = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-600'
      variant = 'warning'
    } else if (pct >= 15) {
      // Orange - low availability (more vibrant)
      colorClasses = 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-600'
      variant = 'warning'
    } else if (pct > 0) {
      // Red - very low availability (more vibrant)
      colorClasses = 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-600'
      variant = 'error'
    } else {
      // Deep red - none available (stronger signal)
      colorClasses = 'bg-red-200 text-red-900 border-red-400 dark:bg-red-900/60 dark:text-red-100 dark:border-red-500'
      variant = 'error'
    }

    return { percentage: pct, colorClasses, variant }
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

  return (
    <div className="flex items-center justify-center w-full">
      <Badge
        variant={variant}
        size="sm"
        className={`font-mono font-bold text-xs px-2 py-1 rounded-md border shadow-sm min-w-[50px] text-center ${colorClasses} ${className}`}
        title={tooltipText}
      >
        {displayText}
      </Badge>
    </div>
  )
}

// Utility function to get color classes programmatically
export function getInventoryColorClasses(available: number, total: number): string {
  if (total === 0) {
    return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
  }

  const percentage = (available / total) * 100
  
  if (percentage >= 70) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-600'
  } else if (percentage >= 40) {
    return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-600'
  } else if (percentage >= 15) {
    return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-600'
  } else if (percentage > 0) {
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-600'
  } else {
    return 'bg-red-200 text-red-900 border-red-400 dark:bg-red-900/60 dark:text-red-100 dark:border-red-500'
  }
}