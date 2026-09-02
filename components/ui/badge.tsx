import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-teal text-white",
        secondary: "border-transparent bg-navy text-white",
        outline: "border-border text-ink",
        success: "border-transparent bg-status-green/10 text-status-green",
        warning: "border-transparent bg-status-yellow/10 text-status-yellow",
        destructive: "border-transparent bg-status-red/10 text-status-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
