import { cn } from "@/lib/utils";
import React from "react";

/* ─── Card Container ─── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  highlighted?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, highlighted, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white border border-neutral-200 rounded-[var(--radius-lg)] shadow-xs",
        interactive &&
          "hover:shadow-md hover:border-primary-200 cursor-pointer transition-all duration-200",
        highlighted && "border-primary-300 bg-primary-50/30",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/* ─── Card Header ─── */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between px-5 py-4 border-b border-neutral-100",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/* ─── Card Title ─── */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base font-semibold text-neutral-900", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/* ─── Card Description ─── */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* ─── Card Body ─── */
const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-5 py-4", className)}
    {...props}
  />
));
CardBody.displayName = "CardBody";

/* ─── Card Footer ─── */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-3 px-5 py-4 border-t border-neutral-100",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle };

