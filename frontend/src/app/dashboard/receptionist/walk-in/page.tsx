'use client';

import React, { useState, useCallback } from 'react';
import { authApi, dentistApi, appointmentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Patient = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dentist = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;

export default function WalkInPage() {
  const { addToast } = useToast();

  // Step tracking
  const [step, setStep] = useState<'lookup' | 'register' | 'book' | 'success'   >('lookup');

  // Patient lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // New patient registration
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: 'Temp@12345',
    gender: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
  });
  const [registering, setRegistering] = useState(false);

  // Booking
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loadingDentists, setLoadingDentists] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [bookForm, setBookForm] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '',
    reason: '',
    isEmergency: false,
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search patients (uses the register endpoint to find existing patients via phone/name)
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setSearched(true);
      // Try fetching users API (admin/receptionist accessible)
      const res = await appointmentApi.getAll({ search: searchQuery, limit: 20 });
      // Extract unique patients from appointments
      const data = res.data?.data?.appointments || res.data?.data || [];
      const arr = Array.isArray(data) ? data : [];
      const patientsMap = new Map<number, Patient>();
      arr.forEach((a: Appointment) => {
        if (a.patient_id && !patientsMap.has(a.patient_id)) {
          patientsMap.set(a.patient_id, {
            id: a.patient_id,
            full_name: a.patient_name || a.patient_full_name || 'Unknown',
            phone_number: a.patient_phone || a.patient_phone_number || '',
            email: a.patient_email || '',
          });
        }
      });
      setSearchResults(Array.from(patientsMap.values()));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Load dentists
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

  // Load slots
  const loadSlots = useCallback(async (dentistId: number, date: string) => {
    try {
      setLoadingSlots(true);
      const res = await dentistApi.getSlots(dentistId, date);
      const data = res.data?.data?.availableSlots || res.data?.data?.slots || res.data?.data || [];
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // Select patient and go to booking
  const proceedToBook = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep('book');
    if (dentists.length === 0) loadDentists();
  };

  // Register new patient
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.phoneNumber || !regForm.email) {
      addToast({ type: 'error', title: 'Validation', message: 'Name, phone, and email are required' });
      return;
    }
    try {
      setRegistering(true);
      const res = await authApi.register({
        fullName: regForm.fullName,
        email: regForm.email,
        password: regForm.password,
        phoneNumber: regForm.phoneNumber,
        dateOfBirth: regForm.dateOfBirth || undefined,
        gender: regForm.gender || undefined,
        address: regForm.address || undefined,
        emergencyContact: regForm.emergencyContact || undefined,
      });
      const newUser = res.data?.data?.user;
      if (newUser) {
        // We need the patient record ID — for walk-in we use the profile_id or query again
        const patient = {
          id: newUser.profile_id || newUser.id,
          user_id: newUser.id,
          full_name: newUser.full_name,
          phone_number: newUser.phone_number,
          email: newUser.email,
        };
        addToast({ type: 'success', title: 'Patient Registered', message: `${newUser.full_name} has been registered.` });
        proceedToBook(patient);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setRegistering(false);
    }
  };

  // Submit walk-in appointment
  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDentist || !bookForm.appointmentTime) {
      addToast({ type: 'error', title: 'Missing fields', message: 'Please select dentist and time.' });
      return;
    }
    try {
      setSubmitting(true);
      await appointmentApi.createWalkIn({
        patientId: selectedPatient.id,
        dentistId: selectedDentist.dentist_id || selectedDentist.id,
        appointmentDate: bookForm.appointmentDate,
        appointmentTime: bookForm.appointmentTime,
        reason: bookForm.reason || 'Walk-in visit',
        isEmergency: bookForm.isEmergency,
      });
      setStep('success');
      addToast({ type: 'success', title: 'Walk-in Created', message: 'Appointment created and forwarded to dentist.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create appointment';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset
  const handleReset = () => {
    setStep('lookup');
    setSearchQuery('');
    setSearchResults([]);
    setSearched(false);
    setSelectedPatient(null);
    setSelectedDentist(null);
    setBookForm({ appointmentDate: new Date().toISOString().split('T')[0], appointmentTime: '', reason: '', isEmergency: false });
    setSlots([]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Walk-in Registration</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Register walk-in patients and book appointments
        </p>
      </div>

      {/* Step 1: Patient Lookup */}
      {step === 'lookup' && (
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Find Patient</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by phone number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {searched && (
            <div className="mt-4">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                    Found {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''}:
                  </p>
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => proceedToBook(p)}
                      className="w-full flex items-center gap-3 rounded-lg border border-surface-200 p-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50/50 dark:border-surface-700 dark:hover:border-primary-700"
                    >
                      <Avatar name={p.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-surface-900 dark:text-white">{p.full_name}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">{p.phone_number} {p.email ? `• ${p.email}` : ''}</p>
                      </div>
                      <svg className="h-5 w-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : (
                <Alert variant="info" title="Patient not found">
                  <p className="mb-3">No existing patient matches your search.</p>
                  <Button size="sm" onClick={() => setStep('register')}>Register New Patient</Button>
                </Alert>
              )}
            </div>
          )}

          {!searched && (
            <div className="mt-4 text-center">
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">Can&apos;t find the patient?</p>
              <Button variant="secondary" size="sm" onClick={() => setStep('register')}>Register New Patient</Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 1b: Register New Patient */}
      {step === 'register' && (
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Register New Patient</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                value={regForm.fullName}
                onChange={(e) => setRegForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Patient's full name"
              />
              <Input
                label="Phone Number *"
                value={regForm.phoneNumber}
                onChange={(e) => setRegForm(p => ({ ...p, phoneNumber: e.target.value }))}
                placeholder="+251..."
              />
              <Input
                label="Email *"
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm(p => ({ ...p, email: e.target.value }))}
                placeholder="patient@email.com"
              />
              <Select
                label="Gender"
                value={regForm.gender}
                onChange={(e) => setRegForm(p => ({ ...p, gender: e.target.value }))}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                placeholder="Select gender"
              />
              <Input
                label="Date of Birth"
                type="date"
                value={regForm.dateOfBirth}
                onChange={(e) => setRegForm(p => ({ ...p, dateOfBirth: e.target.value }))}
              />
              <Input
                label="Emergency Contact"
                value={regForm.emergencyContact}
                onChange={(e) => setRegForm(p => ({ ...p, emergencyContact: e.target.value }))}
                placeholder="Name and phone"
              />
            </div>
            <Input
              label="Address"
              value={regForm.address}
              onChange={(e) => setRegForm(p => ({ ...p, address: e.target.value }))}
              placeholder="Patient's address"
            />
            <Alert variant="info">
              A temporary password <code className="font-mono bg-surface-200 dark:bg-surface-600 px-1 rounded">Temp@12345</code> will be set. The patient can change it later.
            </Alert>
            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep('lookup')}>Back</Button>
              <Button type="submit" loading={registering}>Register & Continue</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 2: Book Appointment */}
      {step === 'book' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Book Appointment</h2>
            <Badge variant="primary">{selectedPatient?.full_name}</Badge>
          </div>

          {/* Select Dentist */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Select Dentist</h3>
            {loadingDentists ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {dentists.map((d) => {
                  const dId = d.dentist_id || d.id;
                  const isSelected = (selectedDentist?.dentist_id || selectedDentist?.id) === dId;
                  return (
                    <button
                      key={dId}
                      onClick={() => {
                        setSelectedDentist(d);
                        setBookForm(f => ({ ...f, appointmentTime: '' }));
                        loadSlots(dId, bookForm.appointmentDate);
                      }}
                      className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/50 dark:border-primary-400 dark:bg-primary-900/20'
                          : 'border-surface-200 hover:border-surface-300 dark:border-surface-700'
                      }`}
                    >
                      <Avatar name={d.full_name} size="sm" />
                      <div>
                        <p className="font-medium text-sm text-surface-900 dark:text-white">Dr. {d.full_name}</p>
                        {d.specialization && <p className="text-xs text-surface-500 dark:text-surface-400">{d.specialization}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Date</label>
              <input
                type="date"
                value={bookForm.appointmentDate}
                onChange={(e) => {
                  setBookForm(f => ({ ...f, appointmentDate: e.target.value, appointmentTime: '' }));
                  if (selectedDentist) loadSlots(selectedDentist.dentist_id || selectedDentist.id, e.target.value);
                }}
                className="w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-surface-900 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Time Slot</label>
              {!selectedDentist ? (
                <p className="text-sm text-surface-500 py-2">Select a dentist first</p>
              ) : loadingSlots ? (
                <Spinner />
              ) : slots.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 py-2">No slots available</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                  {slots.map((s) => {
                    const time = typeof s === 'string' ? s : (s as { time?: string })?.time || '';
                    return (
                      <button
                        key={time}
                        onClick={() => setBookForm(f => ({ ...f, appointmentTime: time }))}
                        className={`rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                          bookForm.appointmentTime === time
                            ? 'bg-primary-600 text-white'
                            : 'bg-surface-100 text-surface-700 hover:bg-primary-100 dark:bg-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {time.slice(0, 5)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Reason & Emergency */}
          <Textarea
            label="Reason for Visit"
            value={bookForm.reason}
            onChange={(e) => setBookForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="Describe the reason..."
            className="mb-4"
          />

          <label className="flex items-center gap-3 rounded-lg border border-surface-200 p-3 cursor-pointer transition-colors hover:bg-surface-50 dark:border-surface-700 mb-6">
            <input
              type="checkbox"
              checked={bookForm.isEmergency}
              onChange={(e) => setBookForm(f => ({ ...f, isEmergency: e.target.checked }))}
              className="h-5 w-5 rounded border-surface-300 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <p className="font-medium text-sm text-surface-900 dark:text-white">Emergency</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Mark as an emergency walk-in</p>
            </div>
          </label>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={handleReset}>Start Over</Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!selectedDentist || !bookForm.appointmentTime}
            >
              Create Walk-in Appointment
            </Button>
          </div>
        </Card>
      )}

      {/* Success */}
      {step === 'success' && (
        <Card className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Walk-in Appointment Created!</h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-md mx-auto mb-8">
            The appointment has been created and forwarded to the dentist for approval.
            You can add the patient to the queue once approved.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={handleReset}>Register Another</Button>
            <Button onClick={() => window.location.href = '/dashboard/receptionist/queue'}>Go to Queue</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
