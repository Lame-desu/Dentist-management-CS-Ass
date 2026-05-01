'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DashboardData = Record<string, any>;

// ─── Simple SVG Donut Chart ─────────────────────────────────────

function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="140" height="140" viewBox="0 0 140 140" className="flex-shrink-0">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="20" className="text-surface-100 dark:text-surface-700" />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashLen = pct * circumference;
          const el = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
              className="transition-all duration-700"
            />
          );
          offset += dashLen;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" className="text-2xl font-bold fill-surface-900 dark:fill-white" fontSize="24">{total}</text>
        <text x="70" y="84" textAnchor="middle" className="text-xs fill-surface-400" fontSize="11">total</text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-surface-600 dark:text-surface-400">{seg.label}</span>
            <span className="text-xs font-bold text-surface-900 dark:text-white ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Simple CSS Bar Chart ────────────────────────────────────────

function BarChart({ bars }: { bars: { label: string; value: number }[] }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-40 px-2">
      {bars.map((bar, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-bold text-surface-600 dark:text-surface-400">{bar.value}</span>
          <div className="w-full relative" style={{ height: '100px' }}>
            <div
              className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300 transition-all duration-700"
              style={{ height: `${(bar.value / max) * 100}%`, minHeight: bar.value > 0 ? '4px' : '0' }}
            />
          </div>
          <span className="text-[10px] text-surface-500 dark:text-surface-400">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Status Chart Colors ─────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  reviewed: '#3b82f6',
  forwarded: '#6366f1',
  approved: '#10b981',
  completed: '#6b7280',
  rejected: '#ef4444',
  cancelled: '#9ca3af',
  rescheduled: '#8b5cf6',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDashboard();
      setData(res.data?.data || {});
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

  const stats = data || {};

  // API returns user counts nested under `users`
  const users = stats.users || {};
  const totalPatients = users.totalPatients ?? stats.totalPatients ?? 0;
  const totalDentists = users.totalDentists ?? stats.totalDentists ?? 0;
  const totalReceptionists = users.totalReceptionists ?? stats.totalReceptionists ?? 0;

  // todayAppointments comes as {approved: N, total: N, ...} — extract the total
  const todayApptObj = stats.todayAppointments || {};
  const todayAppointmentCount = typeof todayApptObj === 'number' ? todayApptObj : (todayApptObj.total ?? 0);

  // statusDistribution comes as array [{status, count}, ...] — convert to segments
  const rawStatusDist = stats.statusDistribution || [];
  const topDentists = stats.topDentists || [];
  const recentAppointments = stats.recentAppointments || [];

  // Prepare chart data from array format
  const statusSegments = (Array.isArray(rawStatusDist) ? rawStatusDist : Object.entries(rawStatusDist).map(([k, v]) => ({ status: k, count: v as number })))
    .filter((s: { status: string; count: number }) => s.count > 0)
    .map((s: { status: string; count: number }) => ({
      label: s.status.charAt(0).toUpperCase() + s.status.slice(1),
      value: s.count,
      color: STATUS_COLORS[s.status] || '#9ca3af',
    }));
  const statusTotal = statusSegments.reduce((sum, s) => sum + s.value, 0);

  // Weekly bar chart - use daily counts from this week
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyBars = dayLabels.map((label, i) => ({
    label,
    value: stats.dailyCounts?.[i] || 0,
  }));
  // If no daily data, create from thisWeekAppointments
  if (!stats.dailyCounts && stats.thisWeekAppointments) {
    const perDay = Math.round(stats.thisWeekAppointments / 5);
    weeklyBars.forEach((b, i) => { b.value = i < 5 ? perDay : 0; });
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Admin Dashboard ⚙️
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Welcome, {user?.full_name?.split(' ')[0] || 'Admin'}. System overview and management.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          label="Total Patients"
          value={totalPatients}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          label="Total Dentists"
          value={totalDentists}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
          label="Receptionists"
          value={totalReceptionists}
        />
        <StatCard
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          label="Today's Appointments"
          value={todayAppointmentCount}
        />
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Chart */}
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">This Week&apos;s Appointments</h2>
          <BarChart bars={weeklyBars} />
          <p className="text-center text-xs text-surface-400 mt-3">
            Total: <span className="font-bold">{stats.thisWeekAppointments ?? 0}</span> appointments this week
          </p>
        </Card>

        {/* Status Distribution */}
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Status Distribution</h2>
          {statusSegments.length > 0 ? (
            <DonutChart segments={statusSegments} total={statusTotal} />
          ) : (
            <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-8">No appointment data yet</p>
          )}
        </Card>
      </div>

      {/* Quick Actions + Top Dentists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/admin/staff" className="group">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-200 p-5 transition-all hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-transform group-hover:scale-110 dark:bg-primary-900/40 dark:text-primary-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Add Staff</span>
              </div>
            </Link>
            <Link href="/dashboard/admin/config" className="group">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-200 p-5 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Clinic Settings</span>
              </div>
            </Link>
            <Link href="/dashboard/admin/reports" className="group">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-200 p-5 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-violet-700 dark:hover:bg-violet-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform group-hover:scale-110 dark:bg-violet-900/40 dark:text-violet-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">View Reports</span>
              </div>
            </Link>
            <Link href="/dashboard/admin/notifications" className="group">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-surface-200 p-5 transition-all hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-md dark:border-surface-700 dark:hover:border-amber-700 dark:hover:bg-amber-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-900/40 dark:text-amber-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Notifications</span>
              </div>
            </Link>
          </div>
        </Card>

        {/* Top Dentists */}
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Top Dentists</h2>
          {topDentists.length === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topDentists.slice(0, 5).map((dentist: { full_name?: string; dentist_name?: string; dentistName?: string; appointment_count?: number; appointmentCount?: number; completed_count?: number }, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {dentist.full_name || dentist.dentist_name || dentist.dentistName || 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="primary">{dentist.appointment_count || dentist.appointmentCount || dentist.completed_count || 0} appts</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      {recentAppointments.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentAppointments.slice(0, 5).map((appt: { id: number; patient_name?: string; patient_full_name?: string; dentist_name?: string; dentist_full_name?: string; status?: string; created_at?: string }) => (
              <div key={appt.id} className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {appt.patient_name || appt.patient_full_name || 'Patient'} → Dr. {appt.dentist_name || appt.dentist_full_name || 'N/A'}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {appt.created_at && new Date(appt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge
                  variant={
                    appt.status === 'completed' ? 'success' :
                    appt.status === 'approved' ? 'primary' :
                    appt.status === 'rejected' || appt.status === 'cancelled' ? 'danger' : 'warning'
                  }
                >
                  {appt.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
