"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-sm",
        secondary:
          "bg-white border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700 shadow-xs",
        ghost:
          "hover:bg-neutral-100 active:bg-neutral-200 text-neutral-600",
        danger:
          "bg-danger hover:bg-red-600 active:bg-red-700 text-white shadow-sm",
        success:
          "bg-success hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm",
        link:
          "text-primary-500 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "text-sm px-3 py-1.5 rounded-[var(--radius-sm)]",
        md: "text-sm px-4 py-2.5 rounded-[var(--radius-md)]",
        lg: "text-base px-6 py-3 rounded-[var(--radius-md)]",
        icon: "p-2.5 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
