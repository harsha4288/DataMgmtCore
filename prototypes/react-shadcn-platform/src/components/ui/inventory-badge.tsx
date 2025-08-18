import { Badge } from './badge'

// T-Shirt inventory badge component
interface InventoryBadgeProps {
  issued: number
  total: number
  className?: string
}

export function InventoryBadge({ issued, total, className }: InventoryBadgeProps) {
  const percentage = total > 0 ? (issued / total) * 100 : 0
  
  // Determine ratio badge variant based on usage percentage
  const getRatioVariant = () => {
    if (percentage >= 90) return 'grade-f'  // Red for high usage (critical)
    if (percentage >= 70) return 'grade-d'  // Orange for medium-high usage
    if (percentage >= 50) return 'grade-c'  // Yellow for medium usage
    if (percentage >= 30) return 'grade-b'  // Blue for low usage
    return 'grade-a'  // Green for very low usage
  }

  // Determine grade based on different thresholds for grading
  const getGrade = () => {
    if (percentage >= 90) return 'F'  // Failing - very high usage
    if (percentage >= 80) return 'D'  // Poor
    if (percentage >= 70) return 'C'  // Average
    if (percentage >= 60) return 'B'  // Good
    return 'A'  // Excellent - low usage
  }

  const getGradeVariant = () => {
    const grade = getGrade()
    return `grade-${grade.toLowerCase()}` as const
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-0.5 h-full w-full ${className}`}>
      <Badge variant={getRatioVariant() as any} size="sm" className="font-mono text-xs px-1 py-0.5 min-w-[36px] text-center leading-none">
        {issued}/{total}
      </Badge>
      <Badge variant={getGradeVariant() as any} size="sm" className="text-xs px-1.5 py-0.5 min-w-[20px] text-center font-bold leading-none">
        {getGrade()}
      </Badge>
    </div>
  )
}