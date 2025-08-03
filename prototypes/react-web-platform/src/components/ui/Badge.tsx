import * as React from "react"

// Utility function for className merging (simplified version)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Badge variants definition (following SGS production pattern)
const badgeVariants = {
  base: "inline-flex items-center justify-center rounded-md border font-semibold transition-colors focus:outline-none shadow-sm",
  variants: {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border-muted/40",
    success: "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-600",
    warning: "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100/80 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-600",
    error: "border-red-300 bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/40 dark:text-red-200 dark:border-red-600",
    info: "border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-600"
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