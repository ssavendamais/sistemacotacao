import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";

/* ─── Table Root ─── */
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto">
    <table
      ref={ref}
      className={cn("w-full text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

/* ─── Table Header ─── */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-neutral-50 border-b border-neutral-200", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

/* ─── Table Body ─── */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("divide-y divide-neutral-100", className)} {...props} />
));
TableBody.displayName = "TableBody";

/* ─── Table Row ─── */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }
>(({ className, selected, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "hover:bg-neutral-50/50 transition-colors",
      selected && "bg-primary-50/30",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

/* ─── Table Head Cell ─── */
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider",
        sortable && "cursor-pointer select-none hover:text-neutral-700",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="text-neutral-300">
            {sortDirection === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5 text-primary-500" />
            ) : sortDirection === "desc" ? (
              <ArrowDown className="h-3.5 w-3.5 text-primary-500" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </span>
    </th>
  )
);
TableHead.displayName = "TableHead";

/* ─── Table Cell ─── */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3 text-neutral-700", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };

