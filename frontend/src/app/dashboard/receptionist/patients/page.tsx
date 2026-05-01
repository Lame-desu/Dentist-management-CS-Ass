'use client';

import React, { useState, useCallback } from 'react';
import { appointmentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Patient = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;

export default function SearchPatientsPage() {
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Detail modal
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppts, setPatientAppts] = useState<Appointment[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    try {
      setSearching(true);
      setSearched(true);
      // Search via the appointments endpoint to find patients
      const res = await appointmentApi.getAll({ search: query, limit: 50 });
      const data = res.data?.data?.appointments || res.data?.data || [];
      const arr = Array.isArray(data) ? data : [];

      // Extract unique patients
      const patientsMap = new Map<number, Patient>();
      arr.forEach((a: Appointment) => {
        if (a.patient_id && !patientsMap.has(a.patient_id)) {
          patientsMap.set(a.patient_id, {
            id: a.patient_id,
            full_name: a.patient_name || a.patient_full_name || 'Unknown',
            phone_number: a.patient_phone || a.patient_phone_number || '',
            email: a.patient_email || '',
            gender: a.patient_gender || '',
          });
        }
      });
      setPatients(Array.from(patientsMap.values()));
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Search failed' });
      setPatients([]);
    } finally {
      setSearching(false);
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const viewPatient = async (patient: Patient) => {
    try {
      setSelectedPatient(patient);
      setLoadingDetail(true);
      const res = await appointmentApi.getAll({ search: patient.full_name, limit: 50 });
      const data = res.data?.data?.appointments || res.data?.data || [];
      const arr = Array.isArray(data) ? data : [];
      // Filter only this patient's appointments
      setPatientAppts(arr.filter((a: Appointment) => a.patient_id === patient.id));
    } catch {
      setPatientAppts([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Search Patients</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Find patients by name, phone number, or email
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, phone, or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          />
        </div>
        <Button onClick={handleSearch} loading={searching}>Search</Button>
      </div>

      {/* Results */}
      {!searched ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-surface-300 dark:text-surface-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-surface-500 dark:text-surface-400">Enter a search term to find patients</p>
        </div>
      ) : searching ? (
        <div className="flex justify-center py-16"><Spinner size="xl" /></div>
      ) : patients.length === 0 ? (
        <EmptyState
          title="No patients found"
          description="Try a different search term or register a new patient."
          action={
            <a href="/dashboard/receptionist/walk-in">
              <Button>Register Walk-in Patient</Button>
            </a>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Patient</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Gender</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {patients.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer bg-white transition-colors hover:bg-surface-50 dark:bg-surface-800 dark:hover:bg-surface-700/50"
                  onClick={() => viewPatient(p)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.full_name} size="sm" />
                      <span className="font-medium text-surface-900 dark:text-white">{p.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{p.phone_number || '—'}</td>
                  <td className="px-4 py-3 text-surface-500 dark:text-surface-400">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-surface-500 dark:text-surface-400 capitalize">{p.gender || '—'}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); viewPatient(p); }}>
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Patient Detail Modal */}
      <Modal
        isOpen={!!selectedPatient}
        onClose={() => { setSelectedPatient(null); setPatientAppts([]); }}
        title="Patient Details"
        size="xl"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              <Avatar name={selectedPatient.full_name} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{selectedPatient.full_name}</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {selectedPatient.phone_number} {selectedPatient.email ? ` • ${selectedPatient.email}` : ''}
                </p>
                {selectedPatient.gender && (
                  <p className="text-xs text-surface-400 capitalize mt-0.5">{selectedPatient.gender}</p>
                )}
              </div>
            </div>

            {/* Appointment History */}
            <div>
              <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Appointment History</h4>
              {loadingDetail ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : patientAppts.length === 0 ? (
                <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">No appointment history found</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {patientAppts.map((appt) => (
                    <div key={appt.id} className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                      <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-white">
                          {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' at '}{appt.appointment_time?.slice(0, 5)}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          Dr. {appt.dentist_name || appt.dentist_full_name || 'N/A'}
                          {appt.reason ? ` • ${appt.reason}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
