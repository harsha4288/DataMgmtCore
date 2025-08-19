import { Badge } from './badge'

// T-Shirt inventory badge component
interface InventoryBadgeProps {
  issued: number
  total: number
  className?: string
}

export function InventoryBadge({ issued, total, className }: InventoryBadgeProps) {
  const percentage = total > 0 ? (issued / total) * 100 : 0
  
  // Correct color mapping: A=Green, B=Blue, C=Yellow, D=Orange, F=Red
  // Based on usage percentage (lower is better)
  const getRatioVariant = () => {
    if (percentage >= 90) return 'grade-f'  // F = Red (critical 90%+)
    if (percentage >= 70) return 'grade-d'  // D = Orange (high 70-89%)
    if (percentage >= 50) return 'grade-c'  // C = Yellow (medium 50-69%)
    if (percentage >= 30) return 'grade-b'  // B = Blue (low 30-49%)
    return 'grade-a'  // A = Green (very low <30%)
  }

  // Grade letters match the color system
  const getGrade = () => {
    if (percentage >= 90) return 'F'  // Red
    if (percentage >= 70) return 'D'  // Orange
    if (percentage >= 50) return 'C'  // Yellow
    if (percentage >= 30) return 'B'  // Blue
    return 'A'  // Green
  }

  const getGradeVariant = () => {
    const grade = getGrade()
    return `grade-${grade.toLowerCase()}` as const
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-0.5 h-full ${className || ''}`}>
      <Badge variant={getRatioVariant() as any} size="sm" className="font-mono text-[10px] px-1 py-0 min-w-[42px] text-center leading-tight">
        {issued}/{total}
      </Badge>
      <Badge variant={getGradeVariant() as any} size="sm" className="text-[10px] px-1.5 py-0 min-w-[24px] text-center font-bold leading-tight">
        {getGrade()}
      </Badge>
    </div>
  )
}