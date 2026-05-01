'use client';

import React from 'react';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <DashboardLayout role={user?.role || UserRole.PATIENT}>
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
