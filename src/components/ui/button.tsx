import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[14px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/92 shadow-glow-orange font-semibold",
        destructive:
          "bg-btn-destructive-bg text-btn-destructive-text hover:bg-btn-destructive-bg/80 border-0 font-semibold",
        outline:
          "border border-border/80 bg-card hover:bg-tint text-foreground font-medium shadow-2xs",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-tint-muted/80 border-0 font-medium",
        dark:
          "bg-accent-dark text-white hover:bg-accent-dark/90 font-semibold shadow-soft-sm",
        ghost:
          "hover:bg-tint hover:text-foreground text-foreground/80 font-medium",
        link:
          "underline-offset-4 hover:underline text-primary p-0 h-auto font-medium",
      },
      size: {
        default: "h-9.5 px-4 py-2",
        xs: "h-6.5 px-2.5 text-xs rounded-[10px]",
        sm: "h-8 rounded-[12px] px-3 text-xs",
        lg: "h-11 rounded-[14px] px-8 text-base",
        icon: "h-9.5 w-9.5 rounded-[14px]",
        "icon-xs": "h-6.5 w-6.5 rounded-[10px]",
        "icon-sm": "h-8 w-8 rounded-[12px]",
        "icon-lg": "h-11 w-11 rounded-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
