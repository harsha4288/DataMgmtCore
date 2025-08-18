import { Badge } from './badge'

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const variant = role === 'Team Lead' ? 'grade-a' : 
                role === 'Coordinator' ? 'grade-b' : 
                role === 'Specialist' ? 'grade-c' : 'neutral'
  return <Badge variant={variant as any}>{role}</Badge>
}