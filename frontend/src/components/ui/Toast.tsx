'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/* ─── Toast Container & Item ─────────────────────────────────── */

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

const typeConfig: Record<ToastType, { bg: string; icon: React.ReactNode; accent: string }> = {
  success: {
    bg: 'bg-white dark:bg-surface-800',
    accent: 'border-l-emerald-500',
    icon: (
      <div className="flex-shrink-0 rounded-full bg-emerald-100 p-1 dark:bg-emerald-900/30">
        <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
  },
  error: {
    bg: 'bg-white dark:bg-surface-800',
    accent: 'border-l-rose-500',
    icon: (
      <div className="flex-shrink-0 rounded-full bg-rose-100 p-1 dark:bg-rose-900/30">
        <svg className="h-4 w-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
  },
  info: {
    bg: 'bg-white dark:bg-surface-800',
    accent: 'border-l-sky-500',
    icon: (
      <div className="flex-shrink-0 rounded-full bg-sky-100 p-1 dark:bg-sky-900/30">
        <svg className="h-4 w-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  },
  warning: {
    bg: 'bg-white dark:bg-surface-800',
    accent: 'border-l-amber-500',
    icon: (
      <div className="flex-shrink-0 rounded-full bg-amber-100 p-1 dark:bg-amber-900/30">
        <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
    ),
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const config = typeConfig[toast.type];

  return (
    <div
      className={`
        animate-toast-in rounded-xl border border-surface-200 ${config.bg} ${config.accent}
        border-l-4 px-4 py-3 shadow-lg dark:border-surface-700
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900 dark:text-white">{toast.title}</p>
          {toast.message && (
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-lg p-1 text-surface-400 hover:text-surface-600 transition-colors dark:hover:text-surface-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
