'use client';

import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth = true, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-surface-900
            placeholder-surface-400 transition-all duration-200 min-h-[100px] resize-y
            focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
            dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500
            dark:focus:border-primary-400 dark:focus:ring-primary-400/20
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-surface-300'}
            ${props.disabled ? 'cursor-not-allowed opacity-60 bg-surface-50 dark:bg-surface-900' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-surface-500">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
