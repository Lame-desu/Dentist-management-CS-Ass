'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { appointmentApi, queueApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueueEntry = Record<string, any>;

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, queueCount: 0, todayAppts: 0, completedToday: 0 });
  const [pendingAppts, setPendingAppts] = useState<Appointment[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [pendingRes, queueRes, allRes, statsRes] = await Promise.allSettled([
        appointmentApi.getPending(),
        queueApi.getTodayQueue(),
        appointmentApi.getAll({ appointmentDate: today, limit: 50 }),
        queueApi.getStats(),
      ]);

      // Pending
      if (pendingRes.status === 'fulfilled') {
        const data = pendingRes.value.data?.data?.appointments || pendingRes.value.data?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setPendingAppts(arr);
        setStats(prev => ({ ...prev, pending: arr.length }));
      }

      // Queue
      if (queueRes.status === 'fulfilled') {
        const data = queueRes.value.data?.data?.queue || queueRes.value.data?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setQueueEntries(arr.slice(0, 5));
        setStats(prev => ({ ...prev, queueCount: arr.filter((q: QueueEntry) => q.status === 'waiting').length }));
      }

      // Today's appts
      if (allRes.status === 'fulfilled') {
        const data = allRes.value.data?.data?.appointments || allRes.value.data?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setTodayAppts(arr);
        setStats(prev => ({ ...prev, todayAppts: arr.length }));
      }

      // Queue stats
      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value.data?.data || {};
        setStats(prev => ({ ...prev, completedToday: data.completed || data.completedToday || 0 }));
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
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Welcome, {user?.full_name?.split(' ')[0] || 'Receptionist'} 📋
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Manage appointments, patients, and the daily queue
        </p>
      </div>

      {/* Pending Alert */}
      {stats.pending > 0 && (
        <Alert variant="warning" title="Pending Appointment Requests">
          <div className="flex items-center justify-between">
            <span>You have <strong>{stats.pending}</strong> appointment request{stats.pending !== 1 ? 's' : ''} waiting for review.</span>
            <Link href="/dashboard/receptionist/pending">
              <Button size="sm" className="ml-4">Review Now</Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Pending Requests"
          value={stats.pending}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>}
          label="Patients in Queue"
          value={stats.queueCount}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
          label="Today's Appointments"
          value={stats.todayAppts}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Completed Today"
          value={stats.completedToday}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Queue */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Today&apos;s Queue</h2>
            <Link href="/dashboard/receptionist/queue">
              <Button variant="ghost" size="sm">Manage Queue</Button>
            </Link>
          </div>
          {queueEntries.length === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">No patients in queue</p>
          ) : (
            <div className="space-y-2">
              {queueEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {entry.queue_number}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {entry.patient_name || entry.patient_full_name || 'Patient'}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        Dr. {entry.dentist_name || entry.dentist_full_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      entry.status === 'waiting' ? 'warning' :
                      entry.status === 'in_progress' ? 'primary' :
                      entry.status === 'completed' ? 'success' : 'default'
                    }
                  >
                    {entry.status === 'in_progress' ? 'In Progress' : entry.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Schedule */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Today&apos;s Schedule</h2>
            <Link href="/dashboard/receptionist/appointments">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">No appointments scheduled today</p>
          ) : (
            <div className="space-y-2">
              {todayAppts.slice(0, 5).map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {appt.patient_name || appt.patient_full_name || 'Patient'}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {appt.appointment_time?.slice(0, 5)} • Dr. {appt.dentist_name || appt.dentist_full_name || 'N/A'}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
              {todayAppts.length > 5 && (
                <p className="text-xs text-center text-surface-400 pt-1">
                  +{todayAppts.length - 5} more
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/receptionist/pending" className="group">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-amber-700 dark:hover:bg-amber-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-900/40 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Review Requests</span>
          </div>
        </Link>
        <Link href="/dashboard/receptionist/walk-in" className="group">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-transform group-hover:scale-110 dark:bg-primary-900/40 dark:text-primary-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Walk-in Registration</span>
          </div>
        </Link>
        <Link href="/dashboard/receptionist/queue" className="group">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-900/40 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Manage Queue</span>
          </div>
        </Link>
        <Link href="/dashboard/receptionist/patients" className="group">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-violet-700 dark:hover:bg-violet-900/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition-transform group-hover:scale-110 dark:bg-violet-900/40 dark:text-violet-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Search Patients</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
