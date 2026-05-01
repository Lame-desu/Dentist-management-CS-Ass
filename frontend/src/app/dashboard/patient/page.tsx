'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { appointmentApi, notificationApi, clinicalApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = Record<string, any>;

export default function PatientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ upcoming: 0, totalVisits: 0, pending: 0, unread: 0 });
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [apptRes, notifRes, unreadRes] = await Promise.allSettled([
        appointmentApi.getMyAppointments({ limit: 50 }),
        notificationApi.getAll({ limit: 5 }),
        notificationApi.getUnreadCount(),
      ]);

      // Process appointments
      if (apptRes.status === 'fulfilled') {
        const appointments: Appointment[] = apptRes.value.data?.data?.appointments || apptRes.value.data?.data || [];
        const now = new Date();
        const upcoming = appointments.filter(
          (a: Appointment) => ['pending', 'reviewed', 'forwarded', 'approved'].includes(a.status) &&
            new Date(a.appointment_date) >= new Date(now.toISOString().split('T')[0])
        );
        const completed = appointments.filter((a: Appointment) => a.status === 'completed');
        const pending = appointments.filter((a: Appointment) => a.status === 'pending');

        setStats(prev => ({
          ...prev,
          upcoming: upcoming.length,
          totalVisits: completed.length,
          pending: pending.length,
        }));

        // Sort upcoming by date, take first 3
        const sorted = [...upcoming].sort(
          (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
        );
        setUpcomingAppts(sorted.slice(0, 3));
      }

      // Process notifications
      if (notifRes.status === 'fulfilled') {
        const notifs = notifRes.value.data?.data?.notifications || notifRes.value.data?.data || [];
        setRecentNotifications(notifs);
      }

      // Process unread count
      if (unreadRes.status === 'fulfilled') {
        const count = unreadRes.value.data?.data?.unreadCount ?? 0;
        setStats(prev => ({ ...prev, unread: count }));
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Patient'} 👋
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Here&apos;s an overview of your dental care
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          label="Upcoming Appointments"
          value={stats.upcoming}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Total Visits"
          value={stats.totalVisits}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Pending Requests"
          value={stats.pending}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          }
          label="Unread Notifications"
          value={stats.unread}
        />
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Upcoming Appointments</h2>
          <Link href="/dashboard/patient/appointments">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        {upcomingAppts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-surface-300 dark:text-surface-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">No upcoming appointments</p>
            <Link href="/dashboard/patient/book">
              <Button size="sm">Book Appointment</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppts.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between rounded-lg border border-surface-200 p-4 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:hover:bg-surface-700/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">
                      {appt.dentist_name || `Dr. ${appt.dentist_full_name || 'Unknown'}`}
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {new Date(appt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' • '}
                      {appt.appointment_time?.slice(0, 5)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={appt.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions + Recent Notifications */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href="/dashboard/patient/book" className="group">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-200 p-5 transition-all hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-transform group-hover:scale-110 dark:bg-primary-900/40 dark:text-primary-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6v3m0 0v3m0-3h3m-3 0H9" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Book Appointment</span>
              </div>
            </Link>
            <Link href="/dashboard/patient/records" className="group">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-200 p-5 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">View Records</span>
              </div>
            </Link>
            <Link href="/dashboard/patient/prescriptions" className="group">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-200 p-5 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-violet-700 dark:hover:bg-violet-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform group-hover:scale-110 dark:bg-violet-900/40 dark:text-violet-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 1.232 3.229 0 4.461l-.354.354c-1.232 1.232-3.229 1.232-4.461 0L5 10.125" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Prescriptions</span>
              </div>
            </Link>
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Recent Notifications</h2>
            <Link href="/dashboard/patient/notifications">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">No notifications yet</p>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                    !n.is_read
                      ? 'bg-primary-50/50 dark:bg-primary-900/10'
                      : 'hover:bg-surface-50 dark:hover:bg-surface-700/30'
                  }`}
                >
                  <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${!n.is_read ? 'bg-primary-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">{n.message}</p>
                    <p className="text-xs text-surface-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
