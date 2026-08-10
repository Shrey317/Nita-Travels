import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-teal text-white hover:bg-teal-dark hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm",
        destructive: "bg-status-red text-white hover:bg-status-red/95 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm",
        outline: "border border-border bg-card hover:bg-surface text-ink hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
        secondary: "bg-navy text-white hover:bg-navy-light hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm",
        ghost: "hover:bg-surface text-ink",
        link: "text-teal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
