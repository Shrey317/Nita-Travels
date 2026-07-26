import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink placeholder:text-muted transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:border-teal",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-status-red aria-[invalid=true]:focus-visible:ring-status-red",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
