'use client';

import React, { forwardRef, useState } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightIcon, fullWidth = true, className = '', id, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`
              w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-surface-900
              placeholder-surface-400 transition-all duration-200
              focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
              dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500
              dark:focus:border-primary-400 dark:focus:ring-primary-400/20
              ${icon ? 'pl-10' : ''}
              ${rightIcon || isPassword ? 'pr-10' : ''}
              ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-surface-300'}
              ${props.disabled ? 'cursor-not-allowed opacity-60 bg-surface-50 dark:bg-surface-900' : ''}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          )}
          {rightIcon && !isPassword && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
              {rightIcon}
            </span>
          )}
        </div>
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

Input.displayName = 'Input';
