'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth, getDashboardPath } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { notificationApi } from '@/lib/api';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await notificationApi.getUnreadCount();
        setUnreadCount(res.data.data?.unreadCount || 0);
      } catch {
        // Silent fail
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notificationsPath = user ? `${getDashboardPath(user.role)}/notifications` : '#';
  const profilePath = user ? `${getDashboardPath(user.role)}/profile` : '#';

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 dark:border-surface-700 dark:bg-surface-900 sm:px-6">
      {/* Left: Menu button + Page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 lg:hidden dark:hover:bg-surface-800 dark:hover:text-surface-300"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        {title && (
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h2>
        )}
      </div>

      {/* Right: Notification bell + User dropdown */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Link
          href={notificationsPath}
          className="relative rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <Avatar name={user?.full_name || ''} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-surface-900 dark:text-white">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[11px] capitalize text-surface-500">{user?.role}</p>
            </div>
            <svg
              className={`hidden h-4 w-4 text-surface-400 transition-transform sm:block ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 animate-slide-down rounded-xl border border-surface-200 bg-white py-1 shadow-lg dark:border-surface-700 dark:bg-surface-800">
              <div className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
                <p className="text-sm font-medium text-surface-900 dark:text-white">
                  {user?.full_name}
                </p>
                <p className="text-xs text-surface-500">{user?.email}</p>
              </div>

              <Link
                href={profilePath}
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Profile
              </Link>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
