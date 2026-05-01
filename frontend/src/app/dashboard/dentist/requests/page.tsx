'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { appointmentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;

export default function DentistRequestsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [actioning, setActioning] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Modal states
  const [approveAppt, setApproveAppt] = useState<Appointment | null>(null);
  const [rejectAppt, setRejectAppt] = useState<Appointment | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      const res = await appointmentApi.getDentistAppointments({ status: 'forwarded', limit: 100 });
      const data = res.data?.data?.appointments || res.data?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      // silent on poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadRequests();
    pollRef.current = setInterval(loadRequests, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadRequests]);

  // Approve
  const handleApprove = async () => {
    if (!approveAppt) return;
    try {
      setActioning(approveAppt.id);
      await appointmentApi.respond(approveAppt.id, {
        action: 'approve',
        note: approveNote || undefined,
      });
      addToast({ type: 'success', title: 'Approved', message: 'Appointment has been approved.' });
      setApproveAppt(null);
      setApproveNote('');
      loadRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to approve';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!rejectAppt) return;
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required');
      return;
    }
    try {
      setActioning(rejectAppt.id);
      await appointmentApi.respond(rejectAppt.id, {
        action: 'reject',
        rejectionReason,
      });
      addToast({ type: 'success', title: 'Rejected', message: 'Appointment has been rejected. Reason sent back to receptionist.' });
      setRejectAppt(null);
      setRejectionReason('');
      setRejectionError('');
      loadRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reject';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
    }
  };

  // Reschedule
  const handleReschedule = async () => {
    if (!rescheduleAppt || !suggestedDate || !suggestedTime) return;
    try {
      setActioning(rescheduleAppt.id);
      await appointmentApi.respond(rescheduleAppt.id, {
        action: 'reschedule',
        suggestedDate,
        suggestedTime,
      });
      addToast({ type: 'success', title: 'Rescheduled', message: 'Alternative date/time suggested.' });
      setRescheduleAppt(null);
      setSuggestedDate('');
      setSuggestedTime('');
      loadRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reschedule';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Appointment Requests</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Forwarded appointments awaiting your decision • Auto-refreshes every 30s
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setLoading(true); loadRequests(); }}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </Button>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          title="No pending requests"
          description="All forwarded appointments have been reviewed. New requests from the receptionist will appear here."
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <Card
              key={appt.id}
              noPadding
              className={appt.is_emergency ? 'ring-2 ring-rose-500/50 border-rose-300 dark:border-rose-700' : ''}
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                        {appt.patient_name || appt.patient_full_name || 'Patient'}
                      </h3>
                      {appt.is_emergency && <Badge variant="danger" dot>Emergency</Badge>}
                    </div>

                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-surface-500 dark:text-surface-400 block">Age/Gender</span>
                        <span className="text-surface-700 dark:text-surface-300">
                          {appt.patient_age ? `${appt.patient_age}y` : '—'}
                          {appt.patient_gender ? ` / ${appt.patient_gender}` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-surface-500 dark:text-surface-400 block">Date</span>
                        <span className="text-surface-700 dark:text-surface-300">
                          {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-surface-500 dark:text-surface-400 block">Time</span>
                        <span className="text-surface-700 dark:text-surface-300">{appt.appointment_time?.slice(0, 5)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-surface-500 dark:text-surface-400 block">Phone</span>
                        <span className="text-surface-700 dark:text-surface-300">{appt.patient_phone || appt.patient_phone_number || '—'}</span>
                      </div>
                    </div>

                    {appt.reason && (
                      <div className="mt-2">
                        <span className="text-xs text-surface-500 dark:text-surface-400">Reason: </span>
                        <span className="text-sm text-surface-700 dark:text-surface-300">{appt.reason}</span>
                      </div>
                    )}

                    <p className="text-xs text-surface-400 mt-2">
                      Forwarded {new Date(appt.reviewed_at || appt.updated_at || appt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                    <Button
                      size="sm"
                      onClick={() => setApproveAppt(appt)}
                      disabled={actioning === appt.id}
                      icon={<span>✅</span>}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRejectAppt(appt)}
                      disabled={actioning === appt.id}
                      icon={<span>❌</span>}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRescheduleAppt(appt);
                        setSuggestedDate('');
                        setSuggestedTime('');
                      }}
                      disabled={actioning === appt.id}
                      icon={<span>📅</span>}
                    >
                      Suggest Reschedule
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={!!approveAppt}
        onClose={() => { setApproveAppt(null); setApproveNote(''); }}
        title="Approve Appointment"
        description={`Confirm appointment for ${approveAppt?.patient_name || approveAppt?.patient_full_name || 'patient'}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setApproveAppt(null); setApproveNote(''); }}>Cancel</Button>
            <Button onClick={handleApprove} loading={actioning === approveAppt?.id}>Approve</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-50 p-4 dark:bg-surface-700/50 text-sm">
            <p><strong>Patient:</strong> {approveAppt?.patient_name || approveAppt?.patient_full_name}</p>
            <p><strong>Date:</strong> {approveAppt && new Date(approveAppt.appointment_date).toLocaleDateString()} at {approveAppt?.appointment_time?.slice(0, 5)}</p>
            <p><strong>Reason:</strong> {approveAppt?.reason || 'No reason provided'}</p>
          </div>
          <Textarea
            label="Note (optional)"
            placeholder="Add a note for the patient..."
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
          />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectAppt}
        onClose={() => { setRejectAppt(null); setRejectionReason(''); setRejectionError(''); }}
        title="Reject Appointment"
        description="Please provide a reason for rejecting this appointment. This will be sent back to the receptionist."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectAppt(null); setRejectionReason(''); setRejectionError(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={actioning === rejectAppt?.id}>
              Reject Request
            </Button>
          </>
        }
      >
        <Textarea
          label="Rejection Reason *"
          placeholder="Enter reason for rejection..."
          value={rejectionReason}
          onChange={(e) => { setRejectionReason(e.target.value); setRejectionError(''); }}
          error={rejectionError}
        />
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleAppt}
        onClose={() => { setRescheduleAppt(null); setSuggestedDate(''); setSuggestedTime(''); }}
        title="Suggest Reschedule"
        description="Suggest an alternative date and time for this appointment."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRescheduleAppt(null); setSuggestedDate(''); setSuggestedTime(''); }}>Cancel</Button>
            <Button onClick={handleReschedule} loading={actioning === rescheduleAppt?.id} disabled={!suggestedDate || !suggestedTime}>
              Suggest Alternative
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-50 p-4 dark:bg-surface-700/50 text-sm">
            <p><strong>Current:</strong> {rescheduleAppt && new Date(rescheduleAppt.appointment_date).toLocaleDateString()} at {rescheduleAppt?.appointment_time?.slice(0, 5)}</p>
          </div>
          <Input
            label="Suggested Date"
            type="date"
            value={suggestedDate}
            onChange={(e) => setSuggestedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <Input
            label="Suggested Time"
            type="time"
            value={suggestedTime}
            onChange={(e) => setSuggestedTime(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
