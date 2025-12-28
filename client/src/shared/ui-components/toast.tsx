"use client";

import { useEffect, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/shared/utils/utils";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 200); // Match animation duration
  }, [toast.id, onClose]);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss after duration
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle,
  };

  const styles = {
    success: "bg-green-500/20 border-green-500/50 text-green-400",
    error: "bg-red-500/20 border-red-500/50 text-red-400",
    info: "bg-blue-500/20 border-blue-500/50 text-blue-400",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg min-w-[200px] max-w-[400px] transition-all duration-200",
        styles[toast.type],
        isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
    >
      <Icon size={16} className="flex-shrink-0" />
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  className?: string;
}

export function ToastContainer({
  toasts,
  onClose,
  className,
}: ToastContainerProps) {
  return (
    <div
      className={`flex flex-col gap-2 pointer-events-none ${
        className || "fixed top-4 right-4 z-50"
      }`}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

// Toast hook for easy usage
let toastIdCounter = 0;
const toastListeners: Array<(toast: Toast) => void> = [];

export function useToast() {
  const showToast = (
    message: string,
    type: ToastType = "info",
    duration = 3000
  ) => {
    const toast: Toast = {
      id: `toast-${toastIdCounter++}`,
      message,
      type,
      duration,
    };
    toastListeners.forEach((listener) => listener(toast));
  };

  return {
    toast: {
      success: (message: string, duration?: number) =>
        showToast(message, "success", duration),
      error: (message: string, duration?: number) =>
        showToast(message, "error", duration),
      info: (message: string, duration?: number) =>
        showToast(message, "info", duration),
    },
  };
}

// Global toast manager
class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Array<(toasts: Toast[]) => void> = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  add(toast: Toast) {
    this.toasts = [...this.toasts, toast];
    this.notify();
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.toasts));
  }

  getToasts() {
    return this.toasts;
  }
}

const toastManager = new ToastManager();

// Subscribe toast hook to manager
toastListeners.push((toast) => {
  toastManager.add(toast);
});

// React component that uses the manager
export function ToastProvider({ className }: { className?: string } = {}) {
  const [toasts, setToasts] = useState<Toast[]>(() => toastManager.getToasts());

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  return (
    <ToastContainer
      toasts={toasts}
      onClose={(id) => toastManager.remove(id)}
      className={className}
    />
  );
}

// Local toast container for use within specific components (like dialogs)
// Shows toasts positioned absolutely within its parent container
export function LocalToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>(() => toastManager.getToasts());

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-2 pointer-events-none w-full max-w-[calc(100%-1rem)]">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto flex justify-center">
          <ToastItem toast={toast} onClose={(id) => toastManager.remove(id)} />
        </div>
      ))}
    </div>
  );
}
