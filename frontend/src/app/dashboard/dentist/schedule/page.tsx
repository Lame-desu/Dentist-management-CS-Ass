'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { appointmentApi, availabilityApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AvailabilityEntry = Record<string, any>;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysOfWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-l-amber-400',
  reviewed: 'border-l-blue-400',
  forwarded: 'border-l-indigo-400',
  approved: 'border-l-emerald-400',
  completed: 'border-l-surface-400',
  rejected: 'border-l-rose-400',
  cancelled: 'border-l-surface-300',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  pending: 'bg-amber-400',
  reviewed: 'bg-blue-400',
  forwarded: 'bg-indigo-400',
  approved: 'bg-emerald-400',
  completed: 'bg-surface-400',
  rejected: 'bg-rose-400',
  cancelled: 'bg-surface-300',
};

export default function DentistSchedulePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [availLoaded, setAvailLoaded] = useState(false);

  // Batch mode state
  const [batchStartTime, setBatchStartTime] = useState('08:00');
  const [batchEndTime, setBatchEndTime] = useState('17:00');

  // Load appointments for the week + availability
  const loadWeekData = useCallback(async () => {
    try {
      setLoading(true);
      const days = getDaysOfWeek(weekStart);
      const results = await Promise.allSettled(
        days.map(d => appointmentApi.getDentistSchedule({ date: formatDate(d) }))
      );

      const apptMap: Record<string, Appointment[]> = {};
      days.forEach((d, i) => {
        const dateStr = formatDate(d);
        if (results[i].status === 'fulfilled') {
          const res = results[i] as PromiseFulfilledResult<{ data: { data: { appointments?: Appointment[] } | Appointment[] } }>;
          const data = res.value.data?.data;
          const arr = Array.isArray(data) ? data : ((data as Record<string, unknown>)?.appointments as Appointment[] || []);
          apptMap[dateStr] = Array.isArray(arr) ? arr : [];
        } else {
          apptMap[dateStr] = [];
        }
      });
      setAppointments(apptMap);

      // Load availability using the /me endpoint (no profile_id dependency)
      if (!availLoaded) {
        try {
          const avRes = await availabilityApi.getMyAvailability();
          const avData = avRes.data?.data?.availability || avRes.data?.data || [];
          setAvailability(Array.isArray(avData) ? avData : []);
          setAvailLoaded(true);
        } catch {
          // silent
        }
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load schedule' });
    } finally {
      setLoading(false);
    }
  }, [weekStart, availLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  const navigateWeek = (dir: number) => {
    const ws = new Date(weekStart);
    ws.setDate(ws.getDate() + dir * 7);
    setWeekStart(ws);
  };

  const goToToday = () => {
    const now = new Date();
    setWeekStart(getWeekStart(now));
    setCurrentDate(now);
  };

  const selectDay = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  const isToday = (date: Date) => formatDate(date) === formatDate(new Date());

  // ─── Availability Management ──────────────────────────────────

  const getAvailForDay = (dayOfWeek: number): AvailabilityEntry | undefined => {
    return availability.find(a => a.day_of_week === dayOfWeek);
  };

  const isDayAvailable = (dayOfWeek: number): boolean => {
    const avail = getAvailForDay(dayOfWeek);
    return !!(avail && avail.is_available !== false && avail.start_time);
  };

  const updateAvailDay = (dayOfWeek: number, field: string, value: string | boolean) => {
    setAvailability(prev => {
      const existing = prev.find(a => a.day_of_week === dayOfWeek);
      if (existing) {
        return prev.map(a =>
          a.day_of_week === dayOfWeek ? { ...a, [field]: value } : a
        );
      }
      return [...prev, { day_of_week: dayOfWeek, start_time: '08:00', end_time: '17:00', is_available: true, [field]: value }];
    });
  };

  const handleBatchSetWeekdays = () => {
    setAvailability(prev => {
      const updated = [...prev];
      for (let d = 1; d <= 5; d++) {
        const idx = updated.findIndex(a => a.day_of_week === d);
        const entry = {
          day_of_week: d,
          start_time: batchStartTime,
          end_time: batchEndTime,
          is_available: true,
        };
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], ...entry };
        } else {
          updated.push(entry);
        }
      }
      return updated;
    });
    addToast({ type: 'info', title: 'Applied', message: 'Weekday hours set. Click Save to confirm.' });
  };

  const handleClearAll = () => {
    setAvailability(prev => prev.map(a => ({ ...a, is_available: false })));
  };

  const handleSaveAvailability = async () => {
    try {
      setSavingAvail(true);
      const schedule = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
        const avail = getAvailForDay(dayOfWeek);
        const isAvailable = isDayAvailable(dayOfWeek);
        return {
          dayOfWeek,
          startTime: avail?.start_time || '08:00',
          endTime: avail?.end_time || '17:00',
          isAvailable,
        };
      });
      await availabilityApi.setAvailability(schedule);
      addToast({ type: 'success', title: 'Saved', message: 'Availability updated successfully.' });
      setAvailLoaded(false); // reload on next fetch
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSavingAvail(false);
    }
  };

  // ─── Computed values ──────────────────────────────────────────

  const days = getDaysOfWeek(weekStart);
  const dayAppts = appointments[formatDate(currentDate)] || [];

  const totalAvailableDays = [0, 1, 2, 3, 4, 5, 6].filter(isDayAvailable).length;
  const totalWeeklyHours = [0, 1, 2, 3, 4, 5, 6].reduce((sum, d) => {
    const avail = getAvailForDay(d);
    if (!isDayAvailable(d) || !avail) return sum;
    const start = avail.start_time?.split(':').map(Number) || [8, 0];
    const end = avail.end_time?.split(':').map(Number) || [17, 0];
    return sum + ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1])) / 60;
  }, 0);

  const totalWeekAppointments = Object.values(appointments).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Schedule</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {view === 'week'
              ? `Week of ${days[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${days[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
              : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={goToToday}>Today</Button>
          <div className="flex items-center rounded-lg border border-surface-200 dark:border-surface-700">
            <button
              onClick={() => navigateWeek(-1)}
              className="px-2 py-1.5 text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="px-2 py-1.5 text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
          <div className="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'week' ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'day' ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-surface-200 bg-gradient-to-br from-primary-50 to-white p-4 dark:border-surface-700 dark:from-primary-900/20 dark:to-surface-800">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">This Week</p>
          <p className="mt-1 text-2xl font-bold text-primary-700 dark:text-primary-300">{totalWeekAppointments}</p>
          <p className="text-xs text-surface-400">appointments</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-surface-700 dark:from-emerald-900/20 dark:to-surface-800">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Available Days</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalAvailableDays}</p>
          <p className="text-xs text-surface-400">of 7 days</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-gradient-to-br from-sky-50 to-white p-4 dark:border-surface-700 dark:from-sky-900/20 dark:to-surface-800">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Weekly Hours</p>
          <p className="mt-1 text-2xl font-bold text-sky-700 dark:text-sky-300">{totalWeeklyHours.toFixed(0)}</p>
          <p className="text-xs text-surface-400">total hours</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-surface-700 dark:from-amber-900/20 dark:to-surface-800">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Today</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
            {appointments[formatDate(new Date())]?.length || 0}
          </p>
          <p className="text-xs text-surface-400">appointments</p>
        </div>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateStr = formatDate(day);
            const dayApptsList = appointments[dateStr] || [];
            const today = isToday(day);
            const dayAvail = isDayAvailable(day.getDay());
            return (
              <button
                key={dateStr}
                onClick={() => selectDay(day)}
                className={`rounded-xl border p-3 text-left transition-all hover:shadow-md min-h-[140px] relative ${
                  today
                    ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-800'
                    : dayAvail
                    ? 'border-surface-200 hover:border-primary-200 dark:border-surface-700 dark:hover:border-primary-700'
                    : 'border-surface-200 bg-surface-50/50 dark:border-surface-700 dark:bg-surface-800/50 opacity-75'
                }`}
              >
                {/* Availability indicator dot */}
                <div className={`absolute top-2 right-2 h-2 w-2 rounded-full ${
                  dayAvail ? 'bg-emerald-400' : 'bg-surface-300 dark:bg-surface-600'
                }`} />
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${today ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'}`}>
                    {DAY_NAMES[day.getDay()]}
                  </span>
                  <span className={`text-lg font-bold ${today ? 'text-primary-700 dark:text-primary-300' : 'text-surface-900 dark:text-white'}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayApptsList.slice(0, 3).map((appt) => (
                    <div
                      key={appt.id}
                      className={`rounded px-2 py-1 text-xs border-l-2 bg-surface-50 dark:bg-surface-700/50 ${STATUS_COLORS[appt.status] || 'border-l-surface-300'}`}
                    >
                      <span className="font-medium text-surface-900 dark:text-white">{appt.appointment_time?.slice(0, 5)}</span>
                      {appt.is_emergency && <span className="ml-1 text-rose-500">⚠</span>}
                      <p className="text-surface-600 dark:text-surface-400 truncate">
                        {appt.patient_name || appt.patient_full_name || 'Patient'}
                      </p>
                    </div>
                  ))}
                  {dayApptsList.length > 3 && (
                    <p className="text-[10px] text-surface-400 text-center">+{dayApptsList.length - 3} more</p>
                  )}
                  {dayApptsList.length === 0 && dayAvail && (
                    <p className="text-[10px] text-emerald-400 text-center py-2">Available</p>
                  )}
                  {dayApptsList.length === 0 && !dayAvail && (
                    <p className="text-[10px] text-surface-400 text-center py-2">Day Off</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const prev = new Date(currentDate);
                  prev.setDate(prev.getDate() - 1);
                  setCurrentDate(prev);
                  if (prev < weekStart) {
                    setWeekStart(getWeekStart(prev));
                  }
                }}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <button
                onClick={() => {
                  const next = new Date(currentDate);
                  next.setDate(next.getDate() + 1);
                  setCurrentDate(next);
                  const ws = getWeekStart(next);
                  if (ws.getTime() !== weekStart.getTime()) {
                    setWeekStart(ws);
                  }
                }}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isDayAvailable(currentDate.getDay()) ? (
                <Badge variant="success" dot>Available</Badge>
              ) : (
                <Badge variant="default">Day Off</Badge>
              )}
              <span className="text-sm text-surface-500 dark:text-surface-400">
                {dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Slot Legend */}
          <div className="flex flex-wrap gap-3 mb-4 py-2 px-3 rounded-lg bg-surface-50 dark:bg-surface-700/30 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400"></span> Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span> Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400"></span> Emergency
            </span>
          </div>

          {dayAppts.length === 0 && !isDayAvailable(currentDate.getDay()) ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-3">
                <svg className="h-8 w-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-300">Day Off</p>
              <p className="text-xs text-surface-400 mt-1">You&apos;re not available on this day. Update your availability settings below.</p>
            </div>
          ) : dayAppts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-300">No appointments</p>
              <p className="text-xs text-surface-400 mt-1">Your schedule is clear for this day.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayAppts
                .sort((a: Appointment, b: Appointment) => (a.appointment_time || '').localeCompare(b.appointment_time || ''))
                .map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className={`w-full flex items-center gap-4 rounded-xl border-l-4 border p-4 text-left transition-all hover:shadow-md group ${
                    STATUS_COLORS[appt.status] || 'border-l-surface-300'
                  } ${
                    appt.is_emergency
                      ? 'border-rose-200 bg-rose-50/30 dark:border-rose-800 dark:bg-rose-900/10'
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  }`}
                >
                  {/* Time block */}
                  <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-700 group-hover:bg-surface-200 dark:group-hover:bg-surface-600 transition-colors">
                    <span className="text-sm font-bold text-surface-900 dark:text-white">{appt.appointment_time?.slice(0, 5)}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-surface-900 dark:text-white">
                        {appt.patient_name || appt.patient_full_name || 'Patient'}
                      </p>
                      {appt.is_emergency && <Badge variant="danger" dot>Emergency</Badge>}
                    </div>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                      {appt.reason || 'General consultation'}
                    </p>
                  </div>
                  {/* Status + Action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[appt.status] || 'bg-surface-400'}`}></span>
                      <StatusBadge status={appt.status} />
                    </div>
                    {appt.status === 'approved' && (
                      <Link href={`/dashboard/dentist/consultation/${appt.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm">Start</Button>
                      </Link>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Availability Settings ────────────────────────────────── */}
      <Card>
        <button
          onClick={() => setShowAvailability(!showAvailability)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Availability Settings</h2>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {totalAvailableDays} days · {totalWeeklyHours.toFixed(0)} hrs/week
              </p>
            </div>
          </div>
          <svg className={`h-5 w-5 text-surface-400 transition-transform duration-200 ${showAvailability ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showAvailability && (
          <div className="mt-6 space-y-5">
            {/* Batch Actions */}
            <div className="rounded-xl border border-dashed border-primary-300 bg-primary-50/30 p-4 dark:border-primary-700 dark:bg-primary-900/10">
              <h3 className="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Quick Set — All Weekdays (Mon–Fri)
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-surface-500 dark:text-surface-400 block mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={batchStartTime}
                    onChange={(e) => setBatchStartTime(e.target.value)}
                    className="!w-32"
                  />
                </div>
                <div>
                  <label className="text-xs text-surface-500 dark:text-surface-400 block mb-1">End Time</label>
                  <Input
                    type="time"
                    value={batchEndTime}
                    onChange={(e) => setBatchEndTime(e.target.value)}
                    className="!w-32"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={handleBatchSetWeekdays}>
                  Apply to Mon–Fri
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            {/* Individual Day Cards */}
            <div className="grid gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                const avail = getAvailForDay(dayOfWeek);
                const isAvail = isDayAvailable(dayOfWeek);
                const startTime = avail?.start_time || '08:00';
                const endTime = avail?.end_time || '17:00';
                const startParts = startTime.split(':').map(Number);
                const endParts = endTime.split(':').map(Number);
                const hoursForDay = isAvail ? ((endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1])) / 60 : 0;

                return (
                  <div
                    key={dayOfWeek}
                    className={`flex items-center gap-4 rounded-xl border p-3.5 transition-all duration-200 ${
                      isAvail
                        ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/50 dark:bg-emerald-900/10'
                        : 'border-surface-200 bg-surface-50/30 dark:border-surface-700 dark:bg-surface-800/30'
                    }`}
                  >
                    {/* Toggle */}
                    <label className="relative inline-flex cursor-pointer items-center flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isAvail}
                        onChange={(e) => updateAvailDay(dayOfWeek, 'is_available', e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-surface-300 peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-emerald-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-full dark:bg-surface-600 dark:peer-checked:bg-emerald-500"></div>
                    </label>

                    {/* Day name */}
                    <span className={`text-sm font-semibold w-24 flex-shrink-0 ${
                      isAvail ? 'text-surface-900 dark:text-white' : 'text-surface-400 dark:text-surface-500'
                    }`}>
                      {DAY_NAMES_FULL[dayOfWeek]}
                    </span>

                    {/* Time pickers or unavailable label */}
                    {isAvail ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => updateAvailDay(dayOfWeek, 'start_time', e.target.value)}
                          className="!w-28"
                        />
                        <span className="text-surface-400 text-sm">→</span>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => updateAvailDay(dayOfWeek, 'end_time', e.target.value)}
                          className="!w-28"
                        />
                        <span className="text-xs text-surface-400 ml-2 hidden sm:inline">
                          {hoursForDay.toFixed(1)} hrs
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-surface-400 italic flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Not available
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary + Save */}
            <div className="flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-700/30 px-4 py-3">
              <div className="text-xs text-surface-500 dark:text-surface-400">
                <strong className="text-surface-700 dark:text-surface-300">{totalAvailableDays}</strong> days available
                · <strong className="text-surface-700 dark:text-surface-300">{totalWeeklyHours.toFixed(0)}</strong> total hours/week
              </div>
              <Button onClick={handleSaveAvailability} loading={savingAvail}>
                Save Availability
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── Appointment Detail Modal ─────────────────────────────── */}
      <Modal
        isOpen={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        title="Appointment Details"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedAppt(null)}>Close</Button>
            {selectedAppt?.status === 'approved' && (
              <Link href={`/dashboard/dentist/consultation/${selectedAppt?.id}`}>
                <Button>Start Consultation</Button>
              </Link>
            )}
          </>
        }
      >
        {selectedAppt && (
          <div className="space-y-5">
            {/* Patient header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-700/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {(selectedAppt.patient_name || selectedAppt.patient_full_name || 'P')[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-white">
                  {selectedAppt.patient_name || selectedAppt.patient_full_name}
                </p>
                {selectedAppt.is_emergency && <Badge variant="danger" dot>Emergency</Badge>}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-surface-500 dark:text-surface-400 block mb-0.5">Status</span>
                <StatusBadge status={selectedAppt.status} />
              </div>
              <div>
                <span className="text-xs text-surface-500 dark:text-surface-400 block mb-0.5">Time</span>
                <span className="font-medium text-surface-900 dark:text-white">{selectedAppt.appointment_time?.slice(0, 5)}</span>
              </div>
              <div>
                <span className="text-xs text-surface-500 dark:text-surface-400 block mb-0.5">Date</span>
                <span className="text-surface-700 dark:text-surface-300">
                  {new Date(selectedAppt.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-surface-500 dark:text-surface-400 block mb-0.5">Reason for Visit</span>
                <span className="text-surface-700 dark:text-surface-300">{selectedAppt.reason || 'No reason provided'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
