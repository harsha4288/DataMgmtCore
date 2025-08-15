import * as React from "react"

// Utility function for className merging (simplified version)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Badge variants definition using design token system
const badgeVariants = {
  base: "inline-flex items-center justify-center border transition-colors focus:outline-none",
  variants: {
    default: "border-[hsl(var(--colors-badge-default-border))]",
    secondary: "border-transparent",
    destructive: "border-transparent",
    outline: "border-[hsl(var(--colors-border-default))]",
    // Status badge system using design tokens
    success: "border-[hsl(var(--colors-badge-success-border))]",
    warning: "border-[hsl(var(--colors-badge-warning-border))]",
    error: "border-[hsl(var(--colors-badge-error-border))]",
    info: "border-[hsl(var(--colors-badge-info-border))]",
    // Grade system using design tokens (A-F colorful system)
    "grade-a": "border-[hsl(var(--colors-badge-gradeA-border))]",
    "grade-b": "border-[hsl(var(--colors-badge-gradeB-border))]", 
    "grade-c": "border-[hsl(var(--colors-badge-gradeC-border))]",
    "grade-d": "border-[hsl(var(--colors-badge-gradeD-border))]",
    "grade-f": "border-[hsl(var(--colors-badge-gradeF-border))]",
    // Neutral variant using design tokens
    "neutral": "border-[hsl(var(--colors-badge-neutral-border))]"
  },
  sizes: {
    xs: "h-4 px-1.5 min-w-[24px]",
    sm: "h-5 px-2 min-w-[32px]",
    md: "h-6 px-3 min-w-[40px]", 
    lg: "h-8 px-4 min-w-[48px]"
  }
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants.variants
  size?: keyof typeof badgeVariants.sizes
}

function Badge({ className, variant = "default", size = "sm", style, ...props }: BadgeProps) {
  // Get background and text colors from design tokens based on variant
  const getTokenStyles = (variant: keyof typeof badgeVariants.variants) => {
    const styles: React.CSSProperties = {}
    
    switch (variant) {
      case 'default':
        styles.backgroundColor = 'hsl(var(--colors-badge-default-background))'
        styles.color = 'hsl(var(--colors-badge-default-text))'
        break
      case 'success':
        styles.backgroundColor = 'hsl(var(--colors-badge-success-background))'
        styles.color = 'hsl(var(--colors-badge-success-text))'
        break
      case 'warning':
        styles.backgroundColor = 'hsl(var(--colors-badge-warning-background))'
        styles.color = 'hsl(var(--colors-badge-warning-text))'
        break
      case 'error':
        styles.backgroundColor = 'hsl(var(--colors-badge-error-background))'
        styles.color = 'hsl(var(--colors-badge-error-text))'
        break
      case 'info':
        styles.backgroundColor = 'hsl(var(--colors-badge-info-background))'
        styles.color = 'hsl(var(--colors-badge-info-text))'
        break
      case 'grade-a':
        styles.backgroundColor = 'hsl(var(--colors-badge-gradeA-background))'
        styles.color = 'hsl(var(--colors-badge-gradeA-text))'
        break
      case 'grade-b':
        styles.backgroundColor = 'hsl(var(--colors-badge-gradeB-background))'
        styles.color = 'hsl(var(--colors-badge-gradeB-text))'
        break
      case 'grade-c':
        styles.backgroundColor = 'hsl(var(--colors-badge-gradeC-background))'
        styles.color = 'hsl(var(--colors-badge-gradeC-text))'
        break
      case 'grade-d':
        styles.backgroundColor = 'hsl(var(--colors-badge-gradeD-background))'
        styles.color = 'hsl(var(--colors-badge-gradeD-text))'
        break
      case 'grade-f':
        styles.backgroundColor = 'hsl(var(--colors-badge-gradeF-background))'
        styles.color = 'hsl(var(--colors-badge-gradeF-text))'
        break
      case 'neutral':
        styles.backgroundColor = 'hsl(var(--colors-badge-neutral-background))'
        styles.color = 'hsl(var(--colors-badge-neutral-text))'
        break
      default:
        // Use design token default colors
        styles.backgroundColor = 'hsl(var(--colors-badge-default-background))'
        styles.color = 'hsl(var(--colors-badge-default-text))'
        break
    }
    
    // Add design token typography
    styles.fontSize = 'var(--typography-fontSize-badge)'
    styles.fontWeight = 'var(--typography-fontWeight-badge)'
    styles.textTransform = 'var(--typography-textTransform-badge)' as any
    styles.borderRadius = 'var(--layout-badge-borderRadius)'
    
    return styles
  }

  return (
    <div 
      className={cn(
        badgeVariants.base, 
        badgeVariants.variants[variant],
        badgeVariants.sizes[size],
        className
      )}
      style={{
        ...getTokenStyles(variant),
        ...style
      }}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }