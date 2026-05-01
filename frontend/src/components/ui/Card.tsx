'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  noHover?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', noPadding = false, noHover = false }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-surface-200 bg-white shadow-sm transition-shadow
        dark:border-surface-700 dark:bg-surface-800
        ${!noHover ? 'hover:shadow-md' : ''}
        ${!noPadding ? 'p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={`mt-4 flex items-center justify-end gap-3 border-t border-surface-200 pt-4 dark:border-surface-700 ${className}`}
    >
      {children}
    </div>
  );
}
