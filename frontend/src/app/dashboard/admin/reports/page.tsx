'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = Record<string, any>;

// ─── Status Colors ───────────────────────────────────────────────
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

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  reviewed: 'info',
  forwarded: 'info',
  approved: 'success',
  completed: 'default',
  rejected: 'danger',
  cancelled: 'danger',
  rescheduled: 'primary',
};

// ─── Donut Chart Component ───────────────────────────────────────
function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
        <defs>
          <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.1" />
          </filter>
        </defs>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="18" className="text-surface-100 dark:text-surface-700" />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashLen = pct * circumference;
          const el = (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
              className="transition-all duration-700 ease-out"
              style={{ filter: 'url(#donutShadow)' }}
            />
          );
          offset += dashLen;
          return el;
        })}
        <text x="80" y="74" textAnchor="middle" className="text-2xl font-bold fill-surface-900 dark:fill-white" fontSize="26">{total}</text>
        <text x="80" y="94" textAnchor="middle" className="text-xs fill-surface-400" fontSize="11">total</text>
      </svg>
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 w-full sm:w-auto">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2.5 group">
            <div className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-surface-800 transition-transform group-hover:scale-125" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-surface-600 dark:text-surface-400 whitespace-nowrap">{seg.label}</span>
            <span className="text-xs font-bold text-surface-900 dark:text-white ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Bar Chart Component ────────────────────────────────
function DailyBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-[3px] h-40 px-1">
        {data.map((day, i) => {
          const heightPct = (day.count / max) * 100;
          const dateObj = new Date(day.date + 'T00:00:00');
          const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative" title={`${dayLabel}: ${day.count} appointments`}>
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {dayLabel}: {day.count}
              </div>
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300 transition-all duration-700 ease-out group-hover:from-primary-500 group-hover:to-primary-300 dark:group-hover:from-primary-400 dark:group-hover:to-primary-200"
                style={{
                  height: mounted ? `${heightPct}%` : '0%',
                  minHeight: day.count > 0 ? '3px' : '0',
                  transitionDelay: `${i * 15}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels for first, middle, and last */}
      {data.length > 0 && (
        <div className="flex justify-between px-1">
          <span className="text-[10px] text-surface-400">
            {new Date(data[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          {data.length > 2 && (
            <span className="text-[10px] text-surface-400">
              {new Date(data[Math.floor(data.length / 2)].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className="text-[10px] text-surface-400">
            {new Date(data[data.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Registration Trend Mini Chart ───────────────────────────────
function RegistrationTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-surface-400 dark:text-surface-500">
        No registration data for this period
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-32 px-1">
        {data.map((day, i) => {
          const heightPct = (day.count / max) * 100;
          const dateObj = new Date(day.date + 'T00:00:00');
          const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative" title={`${dayLabel}: ${day.count} registrations`}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {dayLabel}: {day.count}
              </div>
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300 transition-all duration-700 ease-out group-hover:from-emerald-500 group-hover:to-emerald-300"
                style={{
                  height: mounted ? `${heightPct}%` : '0%',
                  minHeight: day.count > 0 ? '3px' : '0',
                  transitionDelay: `${i * 20}ms`,
                }}
              />
            </div>
          );
        })}
      </div>
      {data.length > 0 && (
        <div className="flex justify-between px-1">
          <span className="text-[10px] text-surface-400">
            {new Date(data[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="text-[10px] text-surface-400">
            {new Date(data[data.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Animated Stat Number ────────────────────────────────────────
function AnimatedStat({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  return (
    <span className="tabular-nums">
      {value}{suffix}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════

export default function AdminReportsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Date range
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);

  // Data
  const [apptReport, setApptReport] = useState<ReportData | null>(null);
  const [patientReport, setPatientReport] = useState<ReportData | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const [apptRes, patRes] = await Promise.allSettled([
        adminApi.getAppointmentReport({ from: fromDate, to: toDate }),
        adminApi.getPatientReport({ from: fromDate, to: toDate }),
      ]);

      if (apptRes.status === 'fulfilled') {
        setApptReport(apptRes.value.data?.data || {});
      }
      if (patRes.status === 'fulfilled') {
        setPatientReport(patRes.value.data?.data || {});
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load reports' });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived appointment data ────────────────────────────────
  const statusSegments = useMemo(() => {
    if (!apptReport) return [];
    // Backend returns statusDistribution as array [{status, count}]
    // but it could also come as statusBreakdown (object) from other sources
    const raw = apptReport.statusDistribution || apptReport.statusBreakdown;
    if (!raw) return [];

    const entries: { status: string; count: number }[] = Array.isArray(raw)
      ? raw.map((s: { status: string; count: number }) => ({ status: s.status, count: Number(s.count) }))
      : Object.entries(raw).map(([status, count]) => ({ status, count: Number(count) }));

    return entries
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(s => ({
        label: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count,
        color: STATUS_COLORS[s.status] || '#9ca3af',
        status: s.status,
      }));
  }, [apptReport]);

  const statusTotal = useMemo(() => statusSegments.reduce((sum, s) => sum + s.value, 0), [statusSegments]);

  const completedCount = useMemo(() => {
    if (!apptReport) return 0;
    if (apptReport.completedCount != null) return apptReport.completedCount;
    // Derive from statusDistribution
    const seg = statusSegments.find(s => s.status === 'completed');
    return seg?.value || 0;
  }, [apptReport, statusSegments]);

  // ─── Derived patient data ────────────────────────────────────
  const registrations = useMemo(() => {
    if (!patientReport) return [];
    const raw = patientReport.newRegistrations;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'number') return [];
    return [];
  }, [patientReport]);

  const newRegistrationCount = useMemo(() => {
    if (!patientReport) return 0;
    const raw = patientReport.newRegistrations;
    if (typeof raw === 'number') return raw;
    if (Array.isArray(raw)) return raw.reduce((sum: number, r: { count: number }) => sum + (Number(r.count) || 0), 0);
    return 0;
  }, [patientReport]);

  const topPatients = useMemo(() => {
    if (!patientReport?.topPatientsByVisits) return [];
    return patientReport.topPatientsByVisits.map((p: Record<string, unknown>) => ({
      name: p.patientName || p.patient_name || p.full_name || 'Unknown',
      visits: Number(p.visitCount || p.visit_count || p.appointment_count || 0),
    }));
  }, [patientReport]);

  // Daily counts
  const dailyCounts = useMemo(() => {
    if (!apptReport?.dailyCounts) return [];
    return (apptReport.dailyCounts as { date: string; count: number }[]).slice(0, 31);
  }, [apptReport]);

  // Period label
  const periodLabel = useMemo(() => {
    const from = new Date(fromDate + 'T00:00:00');
    const to = new Date(toDate + 'T00:00:00');
    return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [fromDate, toDate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <svg className="h-7 w-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Comprehensive appointment and patient analytics
          </p>
        </div>
      </div>

      {/* Date Range Filter Card */}
      <Card className="!bg-gradient-to-r !from-primary-50/50 !to-violet-50/50 dark:!from-primary-900/10 dark:!to-violet-900/10 !border-primary-200/50 dark:!border-primary-800/30">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-700 dark:text-primary-300 sm:pb-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Date Range
          </div>
          <Input
            label="From"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="sm:max-w-[200px]"
          />
          <Input
            label="To"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="sm:max-w-[200px]"
          />
          <Button onClick={loadReports} loading={loading}>
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="xl" />
          <p className="text-sm text-surface-400 dark:text-surface-500 animate-pulse">Generating reports...</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* APPOINTMENT REPORT                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {!loading && apptReport && (
        <>
          {/* Section Header */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary-500 to-primary-600" />
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Appointment Analytics</h2>
            <span className="text-xs text-surface-400 dark:text-surface-500">{periodLabel}</span>
          </div>

          {/* Stat Cards Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Appointments */}
            <div className="relative overflow-hidden rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary-100/40 dark:bg-primary-900/20 rounded-bl-[40px] transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  <AnimatedStat value={apptReport.totalAppointments ?? 0} />
                </p>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">Total Appointments</p>
              </div>
            </div>

            {/* Completed */}
            <div className="relative overflow-hidden rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/40 dark:bg-emerald-900/20 rounded-bl-[40px] transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  <AnimatedStat value={completedCount} />
                </p>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">Completed</p>
              </div>
            </div>

            {/* Cancellation Rate */}
            <div className="relative overflow-hidden rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-100/40 dark:bg-rose-900/20 rounded-bl-[40px] transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                  {typeof apptReport.cancellationRate === 'number'
                    ? <AnimatedStat value={apptReport.cancellationRate.toFixed(1)} suffix="%" />
                    : '--'}
                </p>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">Cancellation Rate</p>
              </div>
            </div>

            {/* Emergencies */}
            <div className="relative overflow-hidden rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100/40 dark:bg-amber-900/20 rounded-bl-[40px] transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  <AnimatedStat value={apptReport.emergencyCount ?? 0} />
                </p>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">Emergencies</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Distribution Bar Chart */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  Daily Distribution
                </h3>
                {apptReport.avgAppointmentsPerDentist != null && (
                  <Badge variant="info">
                    Avg/Dentist: {typeof apptReport.avgAppointmentsPerDentist === 'number'
                      ? apptReport.avgAppointmentsPerDentist.toFixed(1)
                      : apptReport.avgAppointmentsPerDentist}
                  </Badge>
                )}
              </div>
              {dailyCounts.length > 0 ? (
                <DailyBarChart data={dailyCounts} />
              ) : (
                <div className="flex items-center justify-center h-40 text-sm text-surface-400 dark:text-surface-500">
                  No appointment data for this period
                </div>
              )}
            </Card>

            {/* Status Distribution Donut */}
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                </svg>
                Status Distribution
              </h3>
              {statusSegments.length > 0 ? (
                <DonutChart segments={statusSegments} total={statusTotal} />
              ) : (
                <div className="flex items-center justify-center h-40 text-sm text-surface-400 dark:text-surface-500">
                  No status data for this period
                </div>
              )}
            </Card>
          </div>

          {/* Status Breakdown Table */}
          {statusSegments.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
                Detailed Status Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="px-4 py-3 text-left font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider">Count</th>
                      <th className="px-4 py-3 text-right font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider">Percentage</th>
                      <th className="px-4 py-3 text-left font-semibold text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wider w-1/3">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700/50">
                    {statusSegments.map((seg) => {
                      const pct = statusTotal > 0 ? (seg.value / statusTotal) * 100 : 0;
                      return (
                        <tr key={seg.status} className="hover:bg-surface-50/50 dark:hover:bg-surface-700/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                              <Badge variant={STATUS_BADGE_VARIANT[seg.status] || 'default'} dot>
                                {seg.label}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-surface-900 dark:text-white tabular-nums">{seg.value}</td>
                          <td className="px-4 py-3 text-right text-surface-600 dark:text-surface-400 tabular-nums">{pct.toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out"
                                  style={{ width: `${pct}%`, backgroundColor: seg.color }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PATIENT REPORT                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {!loading && patientReport && (
        <>
          {/* Section Header */}
          <div className="flex items-center gap-3 pt-4">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600" />
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Patient Analytics</h2>
            <span className="text-xs text-surface-400 dark:text-surface-500">{periodLabel}</span>
          </div>

          {/* Patient Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Active Patients */}
            <div className="relative overflow-hidden rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary-100/40 dark:bg-primary-900/20 rounded-bl-[40px] transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  <AnimatedStat value={patientReport.totalActivePatients ?? 0} />
                </p>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">Active Patients</p>
              </div>
            </div>

            {/* New Registrations */}
            <div className="relative overflow-hidden rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/40 dark:bg-emerald-900/20 rounded-bl-[40px] transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  <AnimatedStat value={newRegistrationCount} />
                </p>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">New Registrations</p>
              </div>
            </div>

            {/* Total Patients */}
            <div className="relative overflow-hidden rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-100/40 dark:bg-violet-900/20 rounded-bl-[40px] transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                  <AnimatedStat value={patientReport.totalPatients ?? patientReport.totalActivePatients ?? 0} />
                </p>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">Total Patients</p>
              </div>
            </div>
          </div>

          {/* Registration Trend + Top Patients */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Registration Trend */}
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                Registration Trend
              </h3>
              <RegistrationTrendChart data={registrations} />
            </Card>

            {/* Top Patients by Visits */}
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.45 0m5.45 0a6.021 6.021 0 01-5.45 0" />
                </svg>
                Top Patients by Visits
              </h3>
              {topPatients.length > 0 ? (
                <div className="space-y-2">
                  {topPatients.map((patient: { name: string; visits: number }, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-surface-200 p-3 transition-all hover:border-surface-300 hover:shadow-sm dark:border-surface-700 dark:hover:border-surface-600 group">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-transform group-hover:scale-110 ${
                        i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        i === 1 ? 'bg-surface-200 text-surface-600 dark:bg-surface-600 dark:text-surface-300' :
                        i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                      }`}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                      </div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white flex-1 truncate">
                        {patient.name}
                      </p>
                      <Badge variant="primary">{patient.visits} visits</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-surface-400 dark:text-surface-500">
                  No visit data available
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !apptReport && !patientReport && (
        <Card className="!py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-400 dark:bg-surface-700 dark:text-surface-500 mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">No Reports Available</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm">
              Select a date range and click &quot;Generate Report&quot; to view appointment and patient analytics.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
