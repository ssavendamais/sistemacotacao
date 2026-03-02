"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

const toastConfig: Record<
  ToastType,
  { icon: typeof CheckCircle; bg: string; border: string; text: string }
> = {
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-950/80",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-50 dark:bg-red-950/80",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-800 dark:text-red-200",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/80",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-200",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/80",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-200",
  },
};

// Global toast state
let toastListeners: ((toast: ToastData) => void)[] = [];

export function showToast(message: string, type: ToastType = "success") {
  const toast: ToastData = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: ToastData) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, [addToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border shadow-lg animate-slide-in",
              config.bg,
              config.border
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", config.text)} />
            <p className={cn("text-sm font-medium flex-1", config.text)}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className={cn(
                "shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer",
                config.text
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
