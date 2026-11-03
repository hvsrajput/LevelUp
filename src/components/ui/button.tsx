import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/92 font-semibold border border-transparent",
        destructive:
          "bg-btn-destructive-bg text-btn-destructive-text hover:bg-btn-destructive-bg/80 border border-transparent font-semibold",
        outline:
          "border border-border/80 bg-card hover:bg-tint text-foreground font-medium",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-tint-muted/80 border border-transparent font-medium",
        dark:
          "bg-accent-dark text-white hover:bg-accent-dark/90 font-semibold border border-transparent",
        ghost:
          "hover:bg-tint hover:text-foreground text-foreground/80 font-medium border border-transparent",
        link:
          "underline-offset-4 hover:underline text-primary p-0 h-auto font-medium",
      },
      size: {
        default: "h-9 px-3.5 py-1.5 text-xs font-semibold",
        xs: "h-7 px-2 text-[11px] font-medium rounded-md",
        sm: "h-8 px-2.5 text-xs font-medium rounded-md",
        lg: "h-10 px-5 text-sm font-semibold rounded-lg",
        icon: "h-9 w-9 rounded-lg",
        "icon-xs": "h-7 w-7 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-10 w-10 rounded-lg",
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
