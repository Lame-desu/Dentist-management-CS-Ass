'use client';

import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
  primary:
    'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300',
  success:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  danger:
    'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  info:
    'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-500',
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
};

export function Badge({ variant = 'default', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[variant]}`} />
      )}
      {children}
    </span>
  );
}
