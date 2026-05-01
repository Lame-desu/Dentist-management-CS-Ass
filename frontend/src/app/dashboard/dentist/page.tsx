'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { appointmentApi, dentalRecordApi, notificationApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DentalRecord = Record<string, any>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DentistDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppts: 0,
    forwarded: 0,
    weekPatients: 0,
    totalRecords: 0,
    unread: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState<Appointment[]>([]);
  const [recentRecords, setRecentRecords] = useState<DentalRecord[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [scheduleRes, allApptsRes, recordsRes, unreadRes] = await Promise.allSettled([
        appointmentApi.getDentistSchedule({ date: today }),
        appointmentApi.getDentistAppointments({ limit: 100 }),
        dentalRecordApi.getDentistRecords({ limit: 5 }),
        notificationApi.getUnreadCount(),
      ]);

      // Today's schedule
      if (scheduleRes.status === 'fulfilled') {
        const data = scheduleRes.value.data?.data?.appointments || scheduleRes.value.data?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setTodaySchedule(arr);
        setStats(prev => ({ ...prev, todayAppts: arr.length }));
      }

      // All appointments — calculate forwarded + weekly patients
      if (allApptsRes.status === 'fulfilled') {
        const data = allApptsRes.value.data?.data?.appointments || allApptsRes.value.data?.data || [];
        const arr = Array.isArray(data) ? data : [];

        const forwarded = arr.filter((a: Appointment) => a.status === 'forwarded');
        setStats(prev => ({ ...prev, forwarded: forwarded.length }));

        // Patients this week
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekPatients = new Set(
          arr
            .filter(
              (a: Appointment) =>
                a.status === 'completed' &&
                new Date(a.appointment_date) >= weekStart
            )
            .map((a: Appointment) => a.patient_id)
        );
        setStats(prev => ({ ...prev, weekPatients: weekPatients.size }));
      }

      // Recent records
      if (recordsRes.status === 'fulfilled') {
        const data = recordsRes.value.data?.data?.records || recordsRes.value.data?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setRecentRecords(arr.slice(0, 5));
        setStats(prev => ({ ...prev, totalRecords: recordsRes.value.data?.data?.pagination?.total || arr.length }));
      }

      // Unread
      if (unreadRes.status === 'fulfilled') {
        setStats(prev => ({ ...prev, unread: unreadRes.value.data?.data?.unreadCount ?? 0 }));
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

  const lastName = user?.full_name?.split(' ').pop() || 'Doctor';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {getGreeting()}, Dr.&nbsp;{lastName} 🩺
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Here&apos;s your schedule overview for today
        </p>
      </div>

      {/* Forwarded Alert */}
      {stats.forwarded > 0 && (
        <Alert variant="warning" title="Appointment Requests">
          <div className="flex items-center justify-between">
            <span>
              You have <strong>{stats.forwarded}</strong> appointment request{stats.forwarded !== 1 ? 's' : ''} to review.
            </span>
            <Link href="/dashboard/dentist/requests">
              <Button size="sm" className="ml-4">Review Now</Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          label="Today's Appointments"
          value={stats.todayAppts}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
            </svg>
          }
          label="Pending Requests"
          value={stats.forwarded}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          label="Patients This Week"
          value={stats.weekPatients}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
            </svg>
          }
          label="Total Records"
          value={stats.totalRecords}
        />
      </div>

      {/* Today's Schedule + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule — spans 2 cols */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Today&apos;s Schedule</h2>
            <Link href="/dashboard/dentist/schedule">
              <Button variant="ghost" size="sm">View Full Schedule</Button>
            </Link>
          </div>
          {todaySchedule.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-surface-300 dark:text-surface-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-sm text-surface-500 dark:text-surface-400">No appointments scheduled today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((appt) => (
                <div
                  key={appt.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50 ${
                    appt.is_emergency
                      ? 'border-rose-300 bg-rose-50/30 dark:border-rose-800 dark:bg-rose-900/10'
                      : 'border-surface-200 dark:border-surface-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                      <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                        {appt.appointment_time?.slice(0, 5)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-surface-900 dark:text-white">
                          {appt.patient_name || appt.patient_full_name || 'Patient'}
                        </p>
                        {appt.is_emergency && <Badge variant="danger" dot>Emergency</Badge>}
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {appt.reason || 'General consultation'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={appt.status} />
                    {appt.status === 'approved' && (
                      <Link href={`/dashboard/dentist/consultation/${appt.id}`}>
                        <Button size="sm">Start</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Consultations */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Recent Consultations</h2>
            <Link href="/dashboard/dentist/records">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {recentRecords.length === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">No consultations yet</p>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg border border-surface-200 p-3 dark:border-surface-700"
                >
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {record.patient_name || record.patient_full_name || 'Patient'}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {record.diagnosis?.slice(0, 60)}{record.diagnosis?.length > 60 ? '...' : ''}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">
                    {new Date(record.visit_date || record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/dentist/requests" className="group">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-amber-700 dark:hover:bg-amber-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-900/40 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Review Requests</span>
          </div>
        </Link>
        <Link href="/dashboard/dentist/schedule" className="group">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-transform group-hover:scale-110 dark:bg-primary-900/40 dark:text-primary-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">My Schedule</span>
          </div>
        </Link>
        <Link href="/dashboard/dentist/records" className="group">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-900/40 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Patient Records</span>
          </div>
        </Link>
        <Link href="/dashboard/dentist/notifications" className="group">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-violet-700 dark:hover:bg-violet-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition-transform group-hover:scale-110 dark:bg-violet-900/40 dark:text-violet-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Notifications</span>
              {stats.unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {stats.unread}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
