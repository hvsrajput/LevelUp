import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/12 text-primary font-semibold [a]:hover:bg-primary/20",
        secondary:
          "border-border/60 bg-tint text-foreground [a]:hover:bg-tint-muted",
        destructive:
          "border-transparent bg-btn-destructive-bg text-btn-destructive-text [a]:hover:bg-btn-destructive-bg/80",
        outline:
          "border-border/80 text-foreground bg-card/60 [a]:hover:bg-tint",
        ghost:
          "border-transparent hover:bg-tint hover:text-foreground",
        link:
          "border-transparent text-primary underline-offset-4 hover:underline",
        easy:
          "border-transparent bg-badge-easy-bg text-badge-easy-text font-semibold text-xs",
        medium:
          "border-transparent bg-badge-medium-bg text-badge-medium-text font-semibold text-xs",
        hard:
          "border-transparent bg-badge-hard-bg text-badge-hard-text font-semibold text-xs",
        solved:
          "border-transparent bg-badge-solved-bg text-badge-solved-text font-semibold text-xs",
        streak:
          "border-transparent bg-pill-streak-bg text-pill-streak-text font-semibold text-xs",
        sync:
          "border-transparent bg-pill-sync-bg text-pill-sync-text font-semibold text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
