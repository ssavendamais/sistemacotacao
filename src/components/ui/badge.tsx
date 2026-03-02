import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium rounded-full px-2.5 py-0.5 text-xs whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300",
        rascunho: "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300",
        enviada: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
        "em-analise": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
        aceita: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300",
        recusada: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300",
        expirada: "bg-neutral-50 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500",
        primary: "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300",
        success: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300",
        warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
        danger: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300",
        info: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, dot, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      )}
      {children}
    </span>
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
