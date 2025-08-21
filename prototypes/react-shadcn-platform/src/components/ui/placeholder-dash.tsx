import { cn } from '@/lib/index'

interface PlaceholderDashProps {
  className?: string
  variant?: 'default' | 'thick' | 'thin' | 'dot'
}

export function PlaceholderDash({ className, variant = 'default' }: PlaceholderDashProps) {
  const variants = {
    default: 'w-4 h-0.5',
    thick: 'w-5 h-1',
    thin: 'w-3 h-px',
    dot: 'w-1 h-1 rounded-full'
  }

  return (
    <div 
      className={cn(
        'bg-muted-foreground/30 inline-block',
        variants[variant],
        className
      )}
      aria-hidden="true"
    />
  )
}

export function ToggleIndicator({ checked }: { checked: boolean }) {
  return (
    <div className="flex items-center space-x-1">
      <div 
        className={cn(
          'w-4 h-0.5 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
        aria-hidden="true"
      />
      <div 
        className={cn(
          'w-4 h-0.5 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
        aria-hidden="true"
      />
      <div 
        className={cn(
          'w-4 h-0.5 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
        aria-hidden="true"
      />
    </div>
  )
}