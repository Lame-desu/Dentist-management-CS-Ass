'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { appointmentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Textarea } from '@/components/ui/Textarea';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const CANCELLABLE = ['pending', 'reviewed', 'forwarded', 'approved'];

export default function MyAppointmentsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await appointmentApi.getMyAppointments({ limit: 100 });
      const data = res.data?.data?.appointments || res.data?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCancel = async () => {
    if (!cancelAppt) return;
    try {
      setCancelling(true);
      await appointmentApi.cancel(cancelAppt.id, cancelReason || undefined);
      addToast({ type: 'success', title: 'Appointment Cancelled' });
      setCancelAppt(null);
      setCancelReason('');
      loadAppointments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cancel';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setCancelling(false);
    }
  };

  // Filter
  const filtered = appointments.filter((a) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') {
      return ['pending', 'reviewed', 'forwarded', 'approved'].includes(a.status) &&
        new Date(a.appointment_date) >= new Date(new Date().toISOString().split('T')[0]);
    }
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'completed') return a.status === 'completed';
    if (activeTab === 'cancelled') return ['cancelled', 'rejected'].includes(a.status);
    return true;
  });

  // Sort newest first
  const sorted = [...filtered].sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Appointments</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          View and manage your dental appointments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-white'
                : 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description={activeTab === 'all' ? "You haven't booked any appointments yet." : `No ${activeTab} appointments.`}
          action={
            <a href="/dashboard/patient/book">
              <Button>Book Appointment</Button>
            </a>
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Time</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Dentist</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Reason</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                  {sorted.map((appt) => (
                    <tr
                      key={appt.id}
                      className="bg-white transition-colors hover:bg-surface-50 dark:bg-surface-800 dark:hover:bg-surface-700/50 cursor-pointer"
                      onClick={() => setDetailAppt(appt)}
                    >
                      <td className="px-4 py-3 text-surface-900 dark:text-surface-200 font-medium">
                        {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                        {appt.appointment_time?.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                        Dr. {appt.dentist_name || appt.dentist_full_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-surface-500 dark:text-surface-400 max-w-[200px] truncate">
                        {appt.reason || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {CANCELLABLE.includes(appt.status) && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setCancelAppt(appt)}
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {sorted.map((appt) => (
              <Card key={appt.id} className="cursor-pointer" noPadding>
                <div className="p-4" onClick={() => setDetailAppt(appt)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">
                      {new Date(appt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' • '}{appt.appointment_time?.slice(0, 5)}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-sm text-surface-700 dark:text-surface-300">
                    Dr. {appt.dentist_name || appt.dentist_full_name || 'N/A'}
                  </p>
                  {appt.reason && (
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 truncate">{appt.reason}</p>
                  )}
                  {CANCELLABLE.includes(appt.status) && (
                    <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700" onClick={(e) => e.stopPropagation()}>
                      <Button variant="danger" size="sm" fullWidth onClick={() => setCancelAppt(appt)}>
                        Cancel Appointment
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailAppt}
        onClose={() => setDetailAppt(null)}
        title="Appointment Details"
        size="lg"
      >
        {detailAppt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-surface-500 dark:text-surface-400">Date</p>
                <p className="mt-1 font-medium text-surface-900 dark:text-white">
                  {new Date(detailAppt.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-surface-500 dark:text-surface-400">Time</p>
                <p className="mt-1 font-medium text-surface-900 dark:text-white">{detailAppt.appointment_time?.slice(0, 5)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-surface-500 dark:text-surface-400">Dentist</p>
                <p className="mt-1 font-medium text-surface-900 dark:text-white">Dr. {detailAppt.dentist_name || detailAppt.dentist_full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-surface-500 dark:text-surface-400">Status</p>
                <div className="mt-1"><StatusBadge status={detailAppt.status} /></div>
              </div>
            </div>
            {detailAppt.reason && (
              <div>
                <p className="text-xs font-medium uppercase text-surface-500 dark:text-surface-400">Reason</p>
                <p className="mt-1 text-sm text-surface-700 dark:text-surface-300">{detailAppt.reason}</p>
              </div>
            )}
            {detailAppt.rejection_reason && (
              <div>
                <p className="text-xs font-medium uppercase text-surface-500 dark:text-surface-400">Rejection Reason</p>
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{detailAppt.rejection_reason}</p>
              </div>
            )}
            {detailAppt.notes && (
              <div>
                <p className="text-xs font-medium uppercase text-surface-500 dark:text-surface-400">Notes</p>
                <p className="mt-1 text-sm text-surface-700 dark:text-surface-300">{detailAppt.notes}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase text-surface-500 dark:text-surface-400">Created</p>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                {new Date(detailAppt.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelAppt}
        onClose={() => { setCancelAppt(null); setCancelReason(''); }}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment?"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCancelAppt(null); setCancelReason(''); }}>
              Keep Appointment
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelling}>
              Yes, Cancel
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason for cancellation (optional)"
          placeholder="Let us know why you're cancelling..."
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
