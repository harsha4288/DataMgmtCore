import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap flex-shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Grade variants using CSS variables from theme system
        "grade-a": "border-transparent bg-[var(--badge-grade-a)] text-[var(--badge-grade-a-foreground)] hover:bg-[var(--badge-grade-a)]/80",
        "grade-b": "border-transparent bg-[var(--badge-grade-b)] text-[var(--badge-grade-b-foreground)] hover:bg-[var(--badge-grade-b)]/80",
        "grade-c": "border-transparent bg-[var(--badge-grade-c)] text-[var(--badge-grade-c-foreground)] hover:bg-[var(--badge-grade-c)]/80",
        "grade-d": "border-transparent bg-[var(--badge-grade-d)] text-[var(--badge-grade-d-foreground)] hover:bg-[var(--badge-grade-d)]/80",
        "grade-f": "border-transparent bg-[var(--badge-grade-f)] text-[var(--badge-grade-f-foreground)] hover:bg-[var(--badge-grade-f)]/80",
        neutral: "border-transparent bg-[var(--badge-neutral)] text-[var(--badge-neutral-foreground)] hover:bg-[var(--badge-neutral)]/80",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
