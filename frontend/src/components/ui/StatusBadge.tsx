'use client';

import React from 'react';
import { AppointmentStatus } from '@/lib/constants';

interface StatusBadgeProps {
  status: AppointmentStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: {
    label: 'Pending',
    classes: 'status-pending',
  },
  reviewed: {
    label: 'Reviewed',
    classes: 'status-reviewed',
  },
  forwarded: {
    label: 'Forwarded',
    classes: 'status-forwarded',
  },
  approved: {
    label: 'Approved',
    classes: 'status-approved',
  },
  completed: {
    label: 'Completed',
    classes: 'status-completed',
  },
  rejected: {
    label: 'Rejected',
    classes: 'status-rejected',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'status-cancelled',
  },
  rescheduled: {
    label: 'Rescheduled',
    classes: 'status-rescheduled',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    classes: 'bg-surface-100 text-surface-600 border border-surface-200',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
        ${config.classes}
        ${className}
      `}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: 'currentColor' }}
      />
      {config.label}
    </span>
  );
}
