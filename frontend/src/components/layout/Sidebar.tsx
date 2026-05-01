'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/constants';

// ─── Navigation Item Config ─────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navConfig: Record<UserRole, NavItem[]> = {
  [UserRole.PATIENT]: [
    {
      label: 'Dashboard',
      href: '/dashboard/patient',
      icon: <HomeIcon />,
    },
    {
      label: 'Book Appointment',
      href: '/dashboard/patient/book',
      icon: <CalendarPlusIcon />,
    },
    {
      label: 'My Appointments',
      href: '/dashboard/patient/appointments',
      icon: <CalendarIcon />,
    },
    {
      label: 'Dental Records',
      href: '/dashboard/patient/records',
      icon: <ClipboardIcon />,
    },
    {
      label: 'Prescriptions',
      href: '/dashboard/patient/prescriptions',
      icon: <PillIcon />,
    },
    {
      label: 'Notifications',
      href: '/dashboard/patient/notifications',
      icon: <BellIcon />,
    },
    {
      label: 'Profile',
      href: '/dashboard/patient/profile',
      icon: <UserIcon />,
    },
  ],
  [UserRole.RECEPTIONIST]: [
    {
      label: 'Dashboard',
      href: '/dashboard/receptionist',
      icon: <HomeIcon />,
    },
    {
      label: 'Pending Requests',
      href: '/dashboard/receptionist/pending',
      icon: <ClockIcon />,
    },
    {
      label: 'All Appointments',
      href: '/dashboard/receptionist/appointments',
      icon: <CalendarIcon />,
    },
    {
      label: 'Walk-in Registration',
      href: '/dashboard/receptionist/walk-in',
      icon: <UserPlusIcon />,
    },
    {
      label: 'Patient Queue',
      href: '/dashboard/receptionist/queue',
      icon: <QueueIcon />,
    },
    {
      label: 'Search Patients',
      href: '/dashboard/receptionist/patients',
      icon: <SearchIcon />,
    },
    {
      label: 'Notifications',
      href: '/dashboard/receptionist/notifications',
      icon: <BellIcon />,
    },
    {
      label: 'Profile',
      href: '/dashboard/receptionist/profile',
      icon: <UserIcon />,
    },
  ],
  [UserRole.DENTIST]: [
    {
      label: 'Dashboard',
      href: '/dashboard/dentist',
      icon: <HomeIcon />,
    },
    {
      label: 'My Schedule',
      href: '/dashboard/dentist/schedule',
      icon: <CalendarIcon />,
    },
    {
      label: 'Appointment Requests',
      href: '/dashboard/dentist/requests',
      icon: <InboxIcon />,
    },
    {
      label: 'Patient Records',
      href: '/dashboard/dentist/records',
      icon: <ClipboardIcon />,
    },
    {
      label: 'Notifications',
      href: '/dashboard/dentist/notifications',
      icon: <BellIcon />,
    },
    {
      label: 'Profile',
      href: '/dashboard/dentist/profile',
      icon: <UserIcon />,
    },
  ],
  [UserRole.ADMIN]: [
    {
      label: 'Dashboard',
      href: '/dashboard/admin',
      icon: <HomeIcon />,
    },
    {
      label: 'Staff Management',
      href: '/dashboard/admin/staff',
      icon: <UsersIcon />,
    },
    {
      label: 'Clinic Configuration',
      href: '/dashboard/admin/config',
      icon: <SettingsIcon />,
    },
    {
      label: 'Reports',
      href: '/dashboard/admin/reports',
      icon: <ChartIcon />,
    },
    {
      label: 'Notifications',
      href: '/dashboard/admin/notifications',
      icon: <BellIcon />,
    },
    {
      label: 'Profile',
      href: '/dashboard/admin/profile',
      icon: <UserIcon />,
    },
  ],
};

// ─── Sidebar Component ──────────────────────────────────────────

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items = navConfig[role] || [];

  // Close on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col
          border-r border-surface-200 bg-white transition-transform duration-300 ease-in-out
          dark:border-surface-700 dark:bg-surface-900
          lg:relative lg:z-auto lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-surface-200 px-6 dark:border-surface-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <span className="text-lg">🦷</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900 dark:text-white">DAMS</h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-surface-400">
              {role} Portal
            </p>
          </div>
          {/* Mobile Close */}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1 text-surface-400 hover:bg-surface-100 lg:hidden dark:hover:bg-surface-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200'
                      }
                    `}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-surface-200 px-4 py-3 dark:border-surface-700">
          <p className="text-center text-[10px] text-surface-400">
            © {new Date().getFullYear()} DAMS v1.0
          </p>
        </div>
      </aside>
    </>
  );
}

// ─── Icon Components (inline SVG for tree-shaking) ──────────────

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function CalendarPlusIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6v3m0 0v3m0-3h3m-3 0H9" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
    </svg>
  );
}

function PillIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 1.232 3.229 0 4.461l-.354.354c-1.232 1.232-3.229 1.232-4.461 0L5 10.125" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-17.5 0a1.5 1.5 0 00-1.5 1.5v2.25a1.5 1.5 0 001.5 1.5h17.5a1.5 1.5 0 001.5-1.5V15a1.5 1.5 0 00-1.5-1.5m-17.5 0V4.125C3.75 3.504 4.254 3 4.875 3h14.25c.621 0 1.125.504 1.125 1.125v9.375" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
