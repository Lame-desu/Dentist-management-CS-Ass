'use client';

import React from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses: Record<string, { container: string; text: string }> = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-12 w-12', text: 'text-base' },
  xl: { container: 'h-16 w-16', text: 'text-lg' },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColor(name: string): string {
  const colors = [
    'bg-primary-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-sky-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name = '', src, size = 'md', className = '' }: AvatarProps) {
  const { container, text } = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        className={`${container} rounded-full object-cover ring-2 ring-white dark:ring-surface-700 ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${container} ${getColor(name)}
        inline-flex items-center justify-center rounded-full
        font-semibold text-white ring-2 ring-white dark:ring-surface-700
        ${className}
      `}
      title={name}
    >
      <span className={text}>{name ? getInitials(name) : '?'}</span>
    </div>
  );
}
