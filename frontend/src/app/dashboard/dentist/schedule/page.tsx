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
type Availability = Record<string, any>;

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

export default function DentistSchedulePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  // Load appointments for the week
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

      // Load availability
      if (user?.profile_id) {
        try {
          const avRes = await availabilityApi.getAvailability(user.profile_id);
          const avData = avRes.data?.data?.availability || avRes.data?.data || [];
          setAvailability(Array.isArray(avData) ? avData : []);
        } catch {
          // silent
        }
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load schedule' });
    } finally {
      setLoading(false);
    }
  }, [weekStart, user?.profile_id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Save availability
  const handleSaveAvailability = async () => {
    try {
      setSavingAvail(true);
      await availabilityApi.setAvailability(
        availability.filter(a => a.is_available !== false).map(a => ({
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time,
        }))
      );
      addToast({ type: 'success', title: 'Saved', message: 'Availability updated successfully.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSavingAvail(false);
    }
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

  const days = getDaysOfWeek(weekStart);
  const dayAppts = appointments[formatDate(currentDate)] || [];

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
              className="px-2 py-1.5 text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="px-2 py-1.5 text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white"
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

      {/* Week View */}
      {view === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateStr = formatDate(day);
            const dayApptsList = appointments[dateStr] || [];
            const today = isToday(day);
            return (
              <button
                key={dateStr}
                onClick={() => selectDay(day)}
                className={`rounded-xl border p-3 text-left transition-all hover:shadow-md min-h-[140px] ${
                  today
                    ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/20'
                    : 'border-surface-200 hover:border-surface-300 dark:border-surface-700 dark:hover:border-surface-600'
                }`}
              >
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
                  {dayApptsList.length === 0 && (
                    <p className="text-[10px] text-surface-400 text-center py-2">No appointments</p>
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
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <span className="text-sm text-surface-500 dark:text-surface-400">
              {dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}
            </span>
          </div>
          {dayAppts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-surface-300 dark:text-surface-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p className="text-sm text-surface-500 dark:text-surface-400">No appointments on this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAppts
                .sort((a: Appointment, b: Appointment) => (a.appointment_time || '').localeCompare(b.appointment_time || ''))
                .map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className={`w-full flex items-center gap-4 rounded-lg border-l-4 border p-4 text-left transition-all hover:shadow-md ${
                    STATUS_COLORS[appt.status] || 'border-l-surface-300'
                  } ${
                    appt.is_emergency
                      ? 'border-rose-200 bg-rose-50/30 dark:border-rose-800 dark:bg-rose-900/10'
                      : 'border-surface-200 dark:border-surface-700'
                  }`}
                >
                  <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-700">
                    <span className="text-sm font-bold text-surface-900 dark:text-white">{appt.appointment_time?.slice(0, 5)}</span>
                  </div>
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
                  <div className="flex items-center gap-3">
                    <StatusBadge status={appt.status} />
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

      {/* Availability Management */}
      <Card>
        <button
          onClick={() => setShowAvailability(!showAvailability)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Availability Settings</h2>
          <svg className={`h-5 w-5 text-surface-400 transition-transform ${showAvailability ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showAvailability && (
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
              const avail = availability.find(a => a.day_of_week === dayOfWeek);
              const isAvailable = avail?.is_available !== false && avail?.start_time;
              return (
                <div key={dayOfWeek} className="flex items-center gap-4 rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                  <label className="flex items-center gap-2 w-24 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={!!isAvailable}
                      onChange={(e) => updateAvailDay(dayOfWeek, 'is_available', e.target.checked)}
                      className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{DAY_NAMES_FULL[dayOfWeek]}</span>
                  </label>
                  {isAvailable && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={avail?.start_time || '08:00'}
                        onChange={(e) => updateAvailDay(dayOfWeek, 'start_time', e.target.value)}
                        className="!w-28"
                      />
                      <span className="text-surface-400">to</span>
                      <Input
                        type="time"
                        value={avail?.end_time || '17:00'}
                        onChange={(e) => updateAvailDay(dayOfWeek, 'end_time', e.target.value)}
                        className="!w-28"
                      />
                    </div>
                  )}
                  {!isAvailable && (
                    <span className="text-sm text-surface-400 italic">Unavailable</span>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveAvailability} loading={savingAvail}>Save Availability</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Appointment Detail Modal */}
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-surface-500 dark:text-surface-400 block">Patient</span>
                <span className="font-medium text-surface-900 dark:text-white">
                  {selectedAppt.patient_name || selectedAppt.patient_full_name}
                </span>
              </div>
              <div>
                <span className="text-xs text-surface-500 dark:text-surface-400 block">Status</span>
                <StatusBadge status={selectedAppt.status} />
              </div>
              <div>
                <span className="text-xs text-surface-500 dark:text-surface-400 block">Date</span>
                <span className="text-surface-700 dark:text-surface-300">
                  {new Date(selectedAppt.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-xs text-surface-500 dark:text-surface-400 block">Time</span>
                <span className="text-surface-700 dark:text-surface-300">{selectedAppt.appointment_time?.slice(0, 5)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-surface-500 dark:text-surface-400 block">Reason</span>
                <span className="text-surface-700 dark:text-surface-300">{selectedAppt.reason || 'No reason provided'}</span>
              </div>
              {selectedAppt.is_emergency && (
                <div className="col-span-2">
                  <Badge variant="danger" dot>Emergency Appointment</Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
