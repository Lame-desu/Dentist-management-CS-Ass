'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';
import { Spinner } from '@/components/ui/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated — redirect to login
    if (!isAuthenticated || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to the correct dashboard for the user's role
      router.replace(getDashboardPath(user.role));
      return;
    }

    // Also check if user is accessing their correct role's dashboard
    const expectedDashboardPrefix = `/dashboard/${user.role}`;
    if (pathname.startsWith('/dashboard/') && !pathname.startsWith(expectedDashboardPrefix)) {
      router.replace(getDashboardPath(user.role));
    }
  }, [isLoading, isAuthenticated, user, pathname, router, allowedRoles]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-sm text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or wrong role
  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
