'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { appointmentApi, dentalRecordApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DentalRecord = Record<string, any>;

interface PrescriptionEntry {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const EMPTY_RX: PrescriptionEntry = { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' };

const DRAFT_KEY_PREFIX = 'dams_consultation_draft_';

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const appointmentId = params.appointmentId as string;
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [pastRecords, setPastRecords] = useState<DentalRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);

  // Form state
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load appointment + patient history
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const apptRes = await appointmentApi.getById(appointmentId);
      const apptData = apptRes.data?.data?.appointment || apptRes.data?.data;
      setAppointment(apptData);

      // Load patient history
      const patientId = apptData?.patient_id || apptData?.patient_record_id;
      if (patientId) {
        try {
          const recRes = await dentalRecordApi.getByPatient(patientId);
          const records = recRes.data?.data?.records || recRes.data?.data || [];
          setPastRecords(Array.isArray(records) ? records : []);
        } catch {
          // Patient may have no records
        }
      }

      // Restore draft
      const draftKey = DRAFT_KEY_PREFIX + appointmentId;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.diagnosis) setDiagnosis(draft.diagnosis);
          if (draft.treatment) setTreatment(draft.treatment);
          if (draft.notes) setNotes(draft.notes);
          if (draft.prescriptions?.length) setPrescriptions(draft.prescriptions);
        } catch {
          // corrupt draft
        }
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load appointment details' });
    } finally {
      setLoading(false);
    }
  }, [appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save draft (debounced 2s)
  useEffect(() => {
    if (submitted) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      if (diagnosis || treatment || notes || prescriptions.length > 0) {
        const draftKey = DRAFT_KEY_PREFIX + appointmentId;
        localStorage.setItem(draftKey, JSON.stringify({ diagnosis, treatment, notes, prescriptions }));
      }
    }, 2000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [diagnosis, treatment, notes, prescriptions, appointmentId, submitted]);

  const addPrescription = () => {
    setPrescriptions(prev => [...prev, { ...EMPTY_RX }]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: keyof PrescriptionEntry, value: string) => {
    setPrescriptions(prev =>
      prev.map((rx, i) => (i === index ? { ...rx, [field]: value } : rx))
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!diagnosis.trim()) errs.diagnosis = 'Diagnosis is required';
    if (!treatment.trim()) errs.treatment = 'Treatment is required';

    prescriptions.forEach((rx, i) => {
      if (!rx.medicationName.trim()) errs[`rx_${i}_name`] = 'Medication name required';
      if (!rx.dosage.trim()) errs[`rx_${i}_dosage`] = 'Dosage required';
      if (!rx.frequency.trim()) errs[`rx_${i}_freq`] = 'Frequency required';
      if (!rx.duration.trim()) errs[`rx_${i}_dur`] = 'Duration required';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields.' });
      return;
    }
    setConfirmModal(true);
  };

  const confirmSubmit = async () => {
    try {
      setSubmitting(true);
      setConfirmModal(false);

      // Build payload
      const payload: Record<string, unknown> = {
        appointmentId: Number(appointmentId),
        diagnosis,
        treatment,
        notes: notes || undefined,
      };

      // Add prescriptions inline if supported, otherwise submit separately
      if (prescriptions.length > 0) {
        payload.prescriptions = prescriptions.map(rx => ({
          medicationName: rx.medicationName,
          dosage: rx.dosage,
          frequency: rx.frequency,
          duration: rx.duration,
          instructions: rx.instructions || undefined,
        }));
      }

      // Create dental record (which auto-includes prescriptions)
      await dentalRecordApi.create(payload);

      // Mark appointment as completed
      try {
        await appointmentApi.complete(Number(appointmentId));
      } catch {
        // Record was created, completion is secondary
      }

      // Clear draft
      localStorage.removeItem(DRAFT_KEY_PREFIX + appointmentId);

      setSubmitted(true);
      addToast({ type: 'success', title: 'Consultation Complete', message: 'Dental record and prescriptions saved successfully.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save consultation';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-24">
        <p className="text-surface-500 dark:text-surface-400">Appointment not found</p>
        <Link href="/dashboard/dentist/schedule">
          <Button variant="secondary" className="mt-4">Back to Schedule</Button>
        </Link>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-6">
          <svg className="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Consultation Complete</h1>
        <p className="text-surface-500 dark:text-surface-400 mb-6">
          Dental record and prescriptions have been saved successfully.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard/dentist/schedule">
            <Button>Back to Schedule</Button>
          </Link>
          <Link href="/dashboard/dentist/records">
            <Button variant="secondary">View Records</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Consultation</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Appointment #{appointmentId} • {new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/dashboard/dentist/schedule">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
      </div>

      {/* Auto-save indicator */}
      <Alert variant="info" title="Auto-save enabled">
        Your consultation form is automatically saved as a draft every 2 seconds in case of interruption.
      </Alert>

      {/* Patient Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
            <svg className="h-7 w-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
              {appointment.patient_name || appointment.patient_full_name || 'Patient'}
            </h2>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-surface-500 dark:text-surface-400">
              {appointment.patient_age && <span>Age: {appointment.patient_age}</span>}
              {appointment.patient_gender && <span>Gender: {appointment.patient_gender}</span>}
              {appointment.patient_phone_number && <span>Phone: {appointment.patient_phone_number}</span>}
              {appointment.patient_emergency_contact && <span>Emergency: {appointment.patient_emergency_contact}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {appointment.is_emergency && <Badge variant="danger" dot>Emergency</Badge>}
              <Badge variant="info">{appointment.appointment_time?.slice(0, 5)}</Badge>
              {appointment.reason && <Badge variant="default">{appointment.reason}</Badge>}
            </div>
          </div>
        </div>
      </Card>

      {/* Past Dental Records */}
      <Card>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Past Dental Records</h2>
            <Badge variant="default">{pastRecords.length}</Badge>
          </div>
          <svg className={`h-5 w-5 text-surface-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showHistory && (
          <div className="mt-4 space-y-3">
            {pastRecords.length === 0 ? (
              <p className="text-sm text-surface-500 dark:text-surface-400 py-4 text-center">No previous dental records</p>
            ) : (
              pastRecords.map((record) => (
                <div key={record.id} className="rounded-lg border border-surface-200 dark:border-surface-700">
                  <button
                    onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {record.diagnosis?.slice(0, 60)}{record.diagnosis?.length > 60 ? '...' : ''}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {new Date(record.visit_date || record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {record.dentist_name ? ` • Dr. ${record.dentist_name}` : (record.dentist_full_name ? ` • Dr. ${record.dentist_full_name}` : '')}
                      </p>
                    </div>
                    <svg className={`h-4 w-4 text-surface-400 transition-transform ${expandedRecordId === record.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {expandedRecordId === record.id && (
                    <div className="border-t border-surface-200 dark:border-surface-700 p-3 space-y-2 text-sm">
                      <div><span className="text-xs font-semibold text-surface-500 uppercase">Diagnosis:</span> <span className="text-surface-700 dark:text-surface-300">{record.diagnosis}</span></div>
                      <div><span className="text-xs font-semibold text-surface-500 uppercase">Treatment:</span> <span className="text-surface-700 dark:text-surface-300">{record.treatment}</span></div>
                      {record.notes && <div><span className="text-xs font-semibold text-surface-500 uppercase">Notes:</span> <span className="text-surface-700 dark:text-surface-300">{record.notes}</span></div>}
                      {record.prescriptions?.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-surface-500 uppercase">Prescriptions:</span>
                          {record.prescriptions.map((rx: { id: number; medication_name: string; dosage: string; frequency: string; duration: string }) => (
                            <div key={rx.id} className="ml-2 mt-1 rounded bg-surface-50 p-2 dark:bg-surface-700/50">
                              <span className="font-medium">{rx.medication_name}</span> — {rx.dosage} • {rx.frequency} • {rx.duration}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Consultation Form */}
      <Card>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Current Consultation</h2>
        <div className="space-y-4">
          <Textarea
            label="Diagnosis *"
            placeholder="Enter the diagnosis..."
            value={diagnosis}
            onChange={(e) => { setDiagnosis(e.target.value); setErrors(prev => ({ ...prev, diagnosis: '' })); }}
            error={errors.diagnosis}
          />
          <Textarea
            label="Treatment Performed *"
            placeholder="Describe the treatment performed..."
            value={treatment}
            onChange={(e) => { setTreatment(e.target.value); setErrors(prev => ({ ...prev, treatment: '' })); }}
            error={errors.treatment}
          />
          <Textarea
            label="Clinical Notes (optional)"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>

      {/* Prescriptions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Prescriptions</h2>
          <Button variant="secondary" size="sm" onClick={addPrescription}>
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Prescription
          </Button>
        </div>

        {prescriptions.length === 0 ? (
          <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">
            No prescriptions added. Click &quot;Add Prescription&quot; to add.
          </p>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx, index) => (
              <div key={index} className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                    Prescription #{index + 1}
                  </span>
                  <button
                    onClick={() => removePrescription(index)}
                    className="text-rose-500 hover:text-rose-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Medication Name *"
                    placeholder="e.g., Amoxicillin"
                    value={rx.medicationName}
                    onChange={(e) => updatePrescription(index, 'medicationName', e.target.value)}
                    error={errors[`rx_${index}_name`]}
                  />
                  <Input
                    label="Dosage *"
                    placeholder="e.g., 500mg"
                    value={rx.dosage}
                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                    error={errors[`rx_${index}_dosage`]}
                  />
                  <Input
                    label="Frequency *"
                    placeholder="e.g., 3 times daily"
                    value={rx.frequency}
                    onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                    error={errors[`rx_${index}_freq`]}
                  />
                  <Input
                    label="Duration *"
                    placeholder="e.g., 7 days"
                    value={rx.duration}
                    onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                    error={errors[`rx_${index}_dur`]}
                  />
                </div>
                <div className="mt-3">
                  <Input
                    label="Special Instructions (optional)"
                    placeholder="e.g., Take after meals"
                    value={rx.instructions}
                    onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Link href="/dashboard/dentist/schedule">
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} loading={submitting} className="min-w-[200px]">
          Complete Consultation
        </Button>
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="Complete Consultation"
        description="This will create a dental record, save prescriptions, and mark the appointment as completed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal(false)}>Cancel</Button>
            <Button onClick={confirmSubmit} loading={submitting}>
              Confirm &amp; Complete
            </Button>
          </>
        }
      >
        <div className="space-y-3 rounded-lg bg-surface-50 p-4 dark:bg-surface-700/50 text-sm">
          <p><strong>Patient:</strong> {appointment.patient_name || appointment.patient_full_name}</p>
          <p><strong>Diagnosis:</strong> {diagnosis.slice(0, 100)}{diagnosis.length > 100 ? '...' : ''}</p>
          <p><strong>Treatment:</strong> {treatment.slice(0, 100)}{treatment.length > 100 ? '...' : ''}</p>
          {prescriptions.length > 0 && (
            <p><strong>Prescriptions:</strong> {prescriptions.length} item{prescriptions.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
