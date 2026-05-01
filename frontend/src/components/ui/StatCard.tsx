'use client';

import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ icon, label, value, trend, className = '' }: StatCardProps) {
  return (
    <div
      className={`
        rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all
        hover:shadow-md dark:border-surface-700 dark:bg-surface-800
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-surface-900 dark:text-white">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                </svg>
              )}
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-surface-400">vs last week</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {icon}
        </div>
      </div>
    </div>
  );
}
