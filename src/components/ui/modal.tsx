"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import React, { useCallback, useEffect } from "react";

/* ─── Modal Overlay ─── */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg bg-white dark:bg-neutral-800 rounded-[var(--radius-xl)] shadow-xl dark:shadow-2xl dark:shadow-black/30 animate-scale-in border border-transparent dark:border-neutral-700",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Modal Header ─── */
interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function ModalHeader({ children, onClose, className }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-700",
        className
      )}
    >
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{children}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-[var(--radius-md)] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/* ─── Modal Body ─── */
export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

/* ─── Modal Footer ─── */
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-700",
        className
      )}
    >
      {children}
    </div>
  );
}
