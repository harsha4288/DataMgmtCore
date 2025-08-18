import { Badge } from './badge'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = status === 'active' ? 'grade-a' : 
                status === 'pending' ? 'grade-c' : 'grade-f'
  return <Badge variant={variant as any} size="sm">{status.toUpperCase()}</Badge>
}