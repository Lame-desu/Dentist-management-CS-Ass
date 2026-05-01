'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { appointmentApi, dentistApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dentist = Record<string, any>;

export default function PendingRequestsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [actioning, setActioning] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Modal states
  const [forwardAppt, setForwardAppt] = useState<Appointment | null>(null);
  const [rejectAppt, setRejectAppt] = useState<Appointment | null>(null);
  const [reassignAppt, setReassignAppt] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedNewDentist, setSelectedNewDentist] = useState<number | null>(null);
  const [loadingDentists, setLoadingDentists] = useState(false);

  const loadPending = useCallback(async () => {
    try {
      const res = await appointmentApi.getPending();
      const data = res.data?.data?.appointments || res.data?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      // silent on poll errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPending();
    // Poll every 30 seconds
    pollRef.current = setInterval(loadPending, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadPending]);

  // Load dentists for reassignment
  const loadDentists = useCallback(async () => {
    try {
      setLoadingDentists(true);
      const res = await dentistApi.getAll({ limit: 100 });
      const data = res.data?.data || [];
      setDentists(Array.isArray(data) ? data : (data.dentists || []));
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load dentists' });
    } finally {
      setLoadingDentists(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Forward
  const handleForward = async () => {
    if (!forwardAppt) return;
    try {
      setActioning(forwardAppt.id);
      await appointmentApi.review(forwardAppt.id, { action: 'forward' });
      addToast({ type: 'success', title: 'Forwarded', message: 'Appointment forwarded to dentist for approval.' });
      setForwardAppt(null);
      loadPending();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to forward';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!rejectAppt) return;
    try {
      setActioning(rejectAppt.id);
      await appointmentApi.review(rejectAppt.id, {
        action: 'reject',
        rejectionReason: rejectionReason || 'Rejected by reception',
      });
      addToast({ type: 'success', title: 'Rejected', message: 'Appointment request has been rejected.' });
      setRejectAppt(null);
      setRejectionReason('');
      loadPending();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reject';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
    }
  };

  // Reassign
  const handleReassign = async () => {
    if (!reassignAppt || !selectedNewDentist) return;
    try {
      setActioning(reassignAppt.id);
      await appointmentApi.review(reassignAppt.id, {
        action: 'reassign',
        newDentistId: selectedNewDentist,
      });
      addToast({ type: 'success', title: 'Reassigned', message: 'Appointment reassigned to another dentist.' });
      setReassignAppt(null);
      setSelectedNewDentist(null);
      loadPending();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reassign';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setActioning(null);
    }
  };

  const openReassign = (appt: Appointment) => {
    setReassignAppt(appt);
    setSelectedNewDentist(null);
    if (dentists.length === 0) loadDentists();
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
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Pending Requests</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Review and process appointment requests • Auto-refreshes every 30s
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setLoading(true); loadPending(); }}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </Button>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          title="No pending requests"
          description="All appointment requests have been processed. New requests will appear here."
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
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                        {appt.patient_name || appt.patient_full_name || 'Patient'}
                      </h3>
                      {appt.is_emergency && (
                        <Badge variant="danger" dot>Emergency</Badge>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-surface-500 dark:text-surface-400 block">Phone</span>
                        <span className="text-surface-700 dark:text-surface-300">{appt.patient_phone || appt.patient_phone_number || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-surface-500 dark:text-surface-400 block">Dentist</span>
                        <span className="text-surface-700 dark:text-surface-300">Dr. {appt.dentist_name || appt.dentist_full_name || 'N/A'}</span>
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
                    </div>

                    {appt.reason && (
                      <div className="mt-2">
                        <span className="text-xs text-surface-500 dark:text-surface-400">Reason: </span>
                        <span className="text-sm text-surface-700 dark:text-surface-300">{appt.reason}</span>
                      </div>
                    )}

                    <p className="text-xs text-surface-400 mt-2">
                      Submitted {new Date(appt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                    <Button
                      size="sm"
                      onClick={() => setForwardAppt(appt)}
                      disabled={actioning === appt.id}
                      icon={<span>✅</span>}
                    >
                      Forward to Dentist
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
                      onClick={() => openReassign(appt)}
                      disabled={actioning === appt.id}
                      icon={<span>🔄</span>}
                    >
                      Another Dentist
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Forward Modal */}
      <Modal
        isOpen={!!forwardAppt}
        onClose={() => setForwardAppt(null)}
        title="Forward to Dentist"
        description={`Forward ${forwardAppt?.patient_name || forwardAppt?.patient_full_name || 'this'} appointment to Dr. ${forwardAppt?.dentist_name || forwardAppt?.dentist_full_name || 'N/A'} for approval?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForwardAppt(null)}>Cancel</Button>
            <Button onClick={handleForward} loading={actioning === forwardAppt?.id}>Forward</Button>
          </>
        }
      >
        <div className="rounded-lg bg-surface-50 p-4 dark:bg-surface-700/50 text-sm">
          <p><strong>Patient:</strong> {forwardAppt?.patient_name || forwardAppt?.patient_full_name}</p>
          <p><strong>Date:</strong> {forwardAppt && new Date(forwardAppt.appointment_date).toLocaleDateString()} at {forwardAppt?.appointment_time?.slice(0, 5)}</p>
          <p><strong>Reason:</strong> {forwardAppt?.reason || 'No reason provided'}</p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectAppt}
        onClose={() => { setRejectAppt(null); setRejectionReason(''); }}
        title="Reject Appointment"
        description="Please provide a reason for rejecting this appointment request."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectAppt(null); setRejectionReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={actioning === rejectAppt?.id}>
              Reject Request
            </Button>
          </>
        }
      >
        <Textarea
          label="Rejection Reason"
          placeholder="Enter reason for rejection..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      </Modal>

      {/* Reassign Modal */}
      <Modal
        isOpen={!!reassignAppt}
        onClose={() => { setReassignAppt(null); setSelectedNewDentist(null); }}
        title="Suggest Another Dentist"
        description="Select a different dentist for this appointment."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setReassignAppt(null); setSelectedNewDentist(null); }}>Cancel</Button>
            <Button onClick={handleReassign} loading={actioning === reassignAppt?.id} disabled={!selectedNewDentist}>
              Reassign
            </Button>
          </>
        }
      >
        {loadingDentists ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {dentists
              .filter(d => (d.dentist_id || d.id) !== (reassignAppt?.dentist_id))
              .map((d) => {
                const dId = d.dentist_id || d.id;
                const isSelected = selectedNewDentist === dId;
                return (
                  <button
                    key={dId}
                    onClick={() => setSelectedNewDentist(dId)}
                    className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 dark:border-primary-400 dark:bg-primary-900/20'
                        : 'border-surface-200 hover:border-surface-300 dark:border-surface-700'
                    }`}
                  >
                    <Avatar name={d.full_name} size="sm" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-surface-900 dark:text-white">Dr. {d.full_name}</p>
                      {d.specialization && (
                        <p className="text-xs text-surface-500 dark:text-surface-400">{d.specialization}</p>
                      )}
                    </div>
                    {isSelected && (
                      <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
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
