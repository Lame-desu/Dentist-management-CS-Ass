'use client';

import React from 'react';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
  secondary:
    'bg-white text-surface-700 border border-surface-300 hover:bg-surface-50 focus:ring-primary-500 dark:bg-surface-800 dark:text-surface-200 dark:border-surface-600 dark:hover:bg-surface-700',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm hover:shadow-md',
  ghost:
    'text-surface-600 hover:bg-surface-100 hover:text-surface-900 focus:ring-primary-500 dark:text-surface-300 dark:hover:bg-surface-700 dark:hover:text-surface-100',
  outline:
    'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-950',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg font-semibold
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'} />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
