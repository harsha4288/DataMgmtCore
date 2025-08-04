import * as React from "react"

// Utility function for className merging (simplified version)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Badge variants definition (following SGS production pattern with inspiration-based grade system)
const badgeVariants = {
  base: "inline-flex items-center justify-center border transition-colors focus:outline-none shadow-sm badge-radius badge-weight",
  variants: {
    default: "bg-badge-default text-badge-default-foreground border-badge-default hover:bg-badge-default/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border-muted/40",
    // Legacy badge system for compatibility
    success: "bg-badge-success text-badge-success-foreground border-badge-success hover:bg-badge-success/80",
    warning: "bg-badge-warning text-badge-warning-foreground border-badge-warning hover:bg-badge-warning/80",
    error: "bg-badge-error text-badge-error-foreground border-badge-error hover:bg-badge-error/80",
    info: "bg-badge-info text-badge-info-foreground border-badge-info hover:bg-badge-info/80",
    // New colorful grade system based on Inspiration1.jpg
    "grade-a": "bg-badge-grade-a text-badge-grade-a-foreground border-transparent hover:bg-badge-grade-a/90 badge-grade",
    "grade-b": "bg-badge-grade-b text-badge-grade-b-foreground border-transparent hover:bg-badge-grade-b/90 badge-grade", 
    "grade-c": "bg-badge-grade-c text-badge-grade-c-foreground border-transparent hover:bg-badge-grade-c/90 badge-grade",
    "grade-d": "bg-badge-grade-d text-badge-grade-d-foreground border-transparent hover:bg-badge-grade-d/90 badge-grade",
    "grade-f": "bg-badge-grade-f text-badge-grade-f-foreground border-transparent hover:bg-badge-grade-f/90 badge-grade"
  },
  sizes: {
    xs: "h-4 px-1.5 text-xs min-w-[24px]",
    sm: "h-5 px-2 text-xs min-w-[32px]",
    md: "h-6 px-3 text-sm min-w-[40px]", 
    lg: "h-8 px-4 text-base min-w-[48px]"
  }
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants.variants
  size?: keyof typeof badgeVariants.sizes
}

function Badge({ className, variant = "default", size = "sm", ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants.base, 
        badgeVariants.variants[variant],
        badgeVariants.sizes[size],
        className
      )} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants }