import * as React from "react"

// Utility function for className merging (simplified version)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Badge variants definition (following SGS production pattern)
const badgeVariants = {
  base: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  variants: {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    success: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400",
    warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "border-transparent bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400",
    info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400"
  },
  sizes: {
    sm: "h-5 px-2 text-xs",
    md: "h-6 px-3 text-sm", 
    lg: "h-8 px-4 text-base"
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