'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { dentalRecordApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DentalRecord = Record<string, any>;

interface PatientGroup {
  patientId: number;
  patientName: string;
  recordCount: number;
  lastVisit: string;
}

export default function DentistRecordsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<DentalRecord[]>([]);
  const [search, setSearch] = useState('');
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);
  const [patientRecords, setPatientRecords] = useState<DentalRecord[]>([]);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dentalRecordApi.getDentistRecords({ limit: 200 });
      const data = res.data?.data?.records || res.data?.data || [];
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load records' });
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Group records by patient
  const patientGroups: PatientGroup[] = [];
  const seen = new Set<number>();
  records.forEach((r) => {
    const pid = r.patient_id;
    if (!pid || seen.has(pid)) {
      if (pid && seen.has(pid)) {
        const g = patientGroups.find(p => p.patientId === pid);
        if (g) g.recordCount++;
      }
      return;
    }
    seen.add(pid);
    patientGroups.push({
      patientId: pid,
      patientName: r.patient_name || r.patient_full_name || 'Patient',
      recordCount: 1,
      lastVisit: r.visit_date || r.created_at,
    });
  });

  // Sort by last visit
  patientGroups.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

  // Filter by search
  const filtered = search.trim()
    ? patientGroups.filter(p => p.patientName.toLowerCase().includes(search.toLowerCase()))
    : patientGroups;

  // Load full patient records
  const handleExpandPatient = async (patientId: number) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
      return;
    }
    setExpandedPatient(patientId);
    setPatientRecords([]);
    setExpandedRecordId(null);
    try {
      setLoadingPatient(true);
      const res = await dentalRecordApi.getByPatient(patientId);
      const data = res.data?.data?.records || res.data?.data || [];
      setPatientRecords(Array.isArray(data) ? data : []);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load patient records' });
    } finally {
      setLoadingPatient(false);
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
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Patient Records</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Search and view dental records of patients you&apos;ve treated
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by patient name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No patients found' : 'No records yet'}
          description={search ? 'Try a different search term.' : "Records will appear here after you complete consultations."}
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => (
            <Card key={patient.patientId} noPadding>
              <button
                onClick={() => handleExpandPatient(patient.patientId)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
                    <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">{patient.patientName}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {patient.recordCount} record{patient.recordCount !== 1 ? 's' : ''} • Last visit: {new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <svg className={`h-5 w-5 text-surface-400 transition-transform ${expandedPatient === patient.patientId ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {expandedPatient === patient.patientId && (
                <div className="border-t border-surface-200 dark:border-surface-700 p-4">
                  {loadingPatient ? (
                    <div className="flex justify-center py-6"><Spinner /></div>
                  ) : patientRecords.length === 0 ? (
                    <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">No records found</p>
                  ) : (
                    <div className="space-y-3">
                      {patientRecords.map((record) => (
                        <div key={record.id} className="rounded-lg border border-surface-200 dark:border-surface-700">
                          <button
                            onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                            className="w-full flex items-center justify-between p-3 text-left"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-surface-900 dark:text-white">
                                  {record.diagnosis?.slice(0, 60)}{record.diagnosis?.length > 60 ? '...' : ''}
                                </p>
                                <Badge variant="info">
                                  {record.dentist_name ? `Dr. ${record.dentist_name}` : (record.dentist_full_name ? `Dr. ${record.dentist_full_name}` : '')}
                                </Badge>
                              </div>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                {new Date(record.visit_date || record.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <svg className={`h-4 w-4 text-surface-400 transition-transform ${expandedRecordId === record.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                          {expandedRecordId === record.id && (
                            <div className="border-t border-surface-200 dark:border-surface-700 p-3 space-y-3 text-sm">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Diagnosis</p>
                                <p className="text-surface-700 dark:text-surface-300">{record.diagnosis}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Treatment</p>
                                <p className="text-surface-700 dark:text-surface-300">{record.treatment}</p>
                              </div>
                              {record.notes && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Notes</p>
                                  <p className="text-surface-700 dark:text-surface-300">{record.notes}</p>
                                </div>
                              )}
                              {record.prescriptions?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">Prescriptions</p>
                                  <div className="space-y-2">
                                    {record.prescriptions.map((rx: { id: number; medication_name: string; dosage: string; frequency: string; duration: string; instructions?: string }) => (
                                      <div key={rx.id} className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700/50">
                                        <p className="font-medium text-surface-900 dark:text-white">{rx.medication_name}</p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                          {rx.dosage} • {rx.frequency} • {rx.duration}
                                        </p>
                                        {rx.instructions && (
                                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{rx.instructions}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
