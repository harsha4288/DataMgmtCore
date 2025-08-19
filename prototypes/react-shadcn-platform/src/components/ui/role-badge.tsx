import { Badge } from './badge'

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  // Match exact behavior from reference DarkTheme.html
  const variant = (role === 'Team Lead' || role === 'Coordinator') ? 'grade-b' :  // Blue
                  'neutral'  // All others (Volunteer, Specialist) use neutral
  return <Badge variant={variant as any}>{role.toUpperCase()}</Badge>
}