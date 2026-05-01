'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { queueApi, appointmentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueueEntry = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;

export default function QueuePage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState({ waiting: 0, inProgress: 0, completed: 0 });
  const [actioning, setActioning] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Add to queue modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [approvedAppts, setApprovedAppts] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const loadQueue = useCallback(async () => {
    try {
      const [qRes, sRes] = await Promise.allSettled([
        queueApi.getTodayQueue(),
        queueApi.getStats(),
      ]);

      if (qRes.status === 'fulfilled') {
        const data = qRes.value.data?.data?.queue || qRes.value.data?.data || [];
        setQueue(Array.isArray(data) ? data : []);
      }

      if (sRes.status === 'fulfilled') {
        const data = sRes.value.data?.data || {};
        setStats({
          waiting: data.waiting || 0,
          inProgress: data.inProgress || data.in_progress || 0,
          completed: data.completed || 0,
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadQueue();
    pollRef.current = setInterval(loadQueue, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadQueue]);

  // Actions
  const handleCall = async (id: number) => {
    try {
      setActioning(id);
      await queueApi.callPatient(id);
      addToast({ type: 'success', title: 'Patient Called' });
      loadQueue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      setActioning(id);
      await queueApi.completeQueue(id);
      addToast({ type: 'success', title: 'Visit Completed' });
      loadQueue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      setActioning(id);
      await queueApi.cancelQueue(id);
      addToast({ type: 'success', title: 'Queue Entry Cancelled' });
      loadQueue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
    }
  };

  // Add to queue
  const openAddModal = async () => {
    setShowAddModal(true);
    setSelectedApptId(null);
    try {
      setLoadingAppts(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await appointmentApi.getAll({ status: 'approved', appointmentDate: todayStr, limit: 50 });
      const data = res.data?.data?.appointments || res.data?.data || [];
      setApprovedAppts(Array.isArray(data) ? data : []);
    } catch {
      setApprovedAppts([]);
    } finally {
      setLoadingAppts(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!selectedApptId) return;
    try {
      setAdding(true);
      await queueApi.addToQueue(selectedApptId);
      addToast({ type: 'success', title: 'Added to Queue' });
      setShowAddModal(false);
      loadQueue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setAdding(false);
    }
  };

  // Wait time calc
  const getWaitTime = (entry: QueueEntry) => {
    if (!entry.check_in_time) return '—';
    const checkin = new Date(entry.check_in_time);
    const now = entry.start_time ? new Date(entry.start_time) : new Date();
    const mins = Math.round((now.getTime() - checkin.getTime()) / 60000);
    return mins < 1 ? '<1 min' : `${mins} min`;
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case 'waiting': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default' as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Patient Queue</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {today} • Auto-refreshes every 15s
          </p>
        </div>
        <Button onClick={openAddModal}>
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add to Queue
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Waiting"
          value={stats.waiting}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>}
          label="In Progress"
          value={stats.inProgress}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Completed"
          value={stats.completed}
        />
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <EmptyState
          title="Queue is empty"
          description="Add approved appointments to today's queue to get started."
          action={<Button onClick={openAddModal}>Add to Queue</Button>}
        />
      ) : (
        <div className="space-y-3">
          {queue.map((entry) => (
            <Card
              key={entry.id}
              noPadding
              className={
                entry.status === 'in_progress'
                  ? 'ring-2 ring-primary-500/30 border-primary-300 dark:border-primary-700'
                  : ''
              }
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${
                    entry.status === 'in_progress'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : entry.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'
                  }`}>
                    #{entry.queue_number}
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900 dark:text-white">
                      {entry.patient_name || entry.patient_full_name || 'Patient'}
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      Dr. {entry.dentist_name || entry.dentist_full_name || 'N/A'}
                      {entry.check_in_time && ` • Check-in: ${new Date(entry.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    {entry.status === 'waiting' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Waiting: {getWaitTime(entry)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Badge variant={statusVariant(entry.status) as 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'}>
                    {entry.status === 'in_progress' ? 'In Progress' : entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1)}
                  </Badge>
                  {entry.status === 'waiting' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleCall(entry.id)}
                        loading={actioning === entry.id}
                        icon={<span>📢</span>}
                      >
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleCancel(entry.id)}
                        loading={actioning === entry.id}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {entry.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(entry.id)}
                      loading={actioning === entry.id}
                      icon={<span>✅</span>}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add to Queue Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add to Queue"
        description="Select an approved appointment to add to today's queue."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddToQueue} loading={adding} disabled={!selectedApptId}>
              Add to Queue
            </Button>
          </>
        }
      >
        {loadingAppts ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : approvedAppts.length === 0 ? (
          <p className="text-center py-8 text-surface-500 dark:text-surface-400">No approved appointments for today.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {approvedAppts.map((appt) => {
              const isSelected = selectedApptId === appt.id;
              return (
                <button
                  key={appt.id}
                  onClick={() => setSelectedApptId(appt.id)}
                  className={`w-full flex items-center justify-between rounded-lg border-2 p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/50 dark:border-primary-400 dark:bg-primary-900/20'
                      : 'border-surface-200 hover:border-surface-300 dark:border-surface-700'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm text-surface-900 dark:text-white">
                      {appt.patient_name || appt.patient_full_name || 'Patient'}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {appt.appointment_time?.slice(0, 5)} • Dr. {appt.dentist_name || appt.dentist_full_name || 'N/A'}
                    </p>
                  </div>
                  {isSelected && (
                    <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
