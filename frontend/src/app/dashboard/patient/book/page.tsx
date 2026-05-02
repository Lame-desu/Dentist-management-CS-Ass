'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { dentistApi, appointmentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dentist = Record<string, any>;

const STEPS = ['Select Dentist', 'Select Date & Time', 'Confirm Details', 'Success'];

export default function BookAppointmentPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1 state
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loadingDentists, setLoadingDentists] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);

  // Step 2 state
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  // Step 3 state
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load dentists
  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load available slots when dentist + date selected
  const loadSlots = useCallback(async () => {
    if (!selectedDentist || !selectedDate) return;
    try {
      setLoadingSlots(true);
      setSelectedTime('');
      const res = await dentistApi.getSlots(
        selectedDentist.dentist_id || selectedDentist.id,
        selectedDate
      );
      const data = res.data?.data;
      // The schedule endpoint returns { slots: [{ time, status }], ... }
      const allSlots = data?.slots || data?.availableSlots || [];
      // Filter to only free slots and extract time strings
      const freeSlots = Array.isArray(allSlots)
        ? allSlots
            .filter((s: { status?: string }) => !s.status || s.status === 'free')
            .map((s: { time?: string } | string) => typeof s === 'string' ? s : s.time || '')
            .filter(Boolean)
        : [];
      setSlots(freeSlots);
    } catch {
      setSlots([]);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load time slots' });
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDentist, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedDentist && selectedDate) {
      loadSlots();
    }
  }, [selectedDentist, selectedDate, loadSlots]);

  // Filter dentists
  const specializations = [...new Set(dentists.map(d => d.specialization).filter(Boolean))];
  const filteredDentists = dentists.filter(d => {
    const name = (d.full_name || '').toLowerCase();
    const spec = (d.specialization || '').toLowerCase();
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || spec.includes(searchQuery.toLowerCase());
    const matchesSpec = !specFilter || d.specialization === specFilter;
    return matchesSearch && matchesSpec;
  });

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Submit booking
  const handleSubmit = async () => {
    if (!selectedDentist || !selectedDate || !selectedTime) return;
    try {
      setSubmitting(true);
      await appointmentApi.create({
        dentistId: selectedDentist.dentist_id || selectedDentist.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason: reason || 'General checkup',
        isEmergency,
      });
      setCurrentStep(3);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to book appointment';
      addToast({ type: 'error', title: 'Booking Failed', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Book Appointment</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Schedule a visit with one of our dental professionals
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i < currentStep
                    ? 'bg-emerald-500 text-white'
                    : i === currentStep
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                    : 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                }`}
              >
                {i < currentStep ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                i === currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'
              }`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-emerald-500' : 'bg-surface-200 dark:bg-surface-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Dentist */}
      {currentStep === 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Select a Dentist</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search dentists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                }
              />
            </div>
            <select
              value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}
              className="rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-surface-900 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
            >
              <option value="">All Specializations</option>
              {specializations.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {loadingDentists ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : filteredDentists.length === 0 ? (
            <p className="text-center py-8 text-surface-500 dark:text-surface-400">No dentists found</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredDentists.map((dentist) => {
                const isSelected = selectedDentist?.id === dentist.id;
                return (
                  <button
                    key={dentist.id}
                    onClick={() => setSelectedDentist(dentist)}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 shadow-md dark:border-primary-400 dark:bg-primary-900/20'
                        : 'border-surface-200 hover:border-surface-300 hover:shadow-sm dark:border-surface-700 dark:hover:border-surface-600'
                    }`}
                  >
                    <Avatar name={dentist.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-surface-900 dark:text-white truncate">
                        {dentist.full_name?.startsWith('Dr.') ? dentist.full_name : `Dr. ${dentist.full_name}`}
                      </p>
                      {dentist.specialization && (
                        <Badge variant="primary" className="mt-1">{dentist.specialization}</Badge>
                      )}
                      {dentist.years_of_experience && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                          {dentist.years_of_experience} years experience
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 rounded-full bg-primary-600 p-1">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setCurrentStep(1)}
              disabled={!selectedDentist}
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Select Date & Time */}
      {currentStep === 1 && (
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">Select Date & Time</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
            Choose your preferred date and available time slot for {selectedDentist?.full_name?.startsWith('Dr.') ? selectedDentist.full_name : `Dr. ${selectedDentist?.full_name}`}
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Date Picker */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                Appointment Date
              </label>
              <input
                type="date"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-surface-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
              />
            </div>

            {/* Time Slots */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                Available Time Slots
              </label>
              {!selectedDate ? (
                <p className="text-sm text-surface-500 dark:text-surface-400 py-4">Select a date to see available slots</p>
              ) : loadingSlots ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : slots.length === 0 ? (
                <Alert variant="warning" className="mt-2">
                  No available slots for this date. Please try another date.
                </Alert>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const time = typeof slot === 'string' ? slot : (slot as { time?: string })?.time || '';
                    const timeStr = time.slice(0, 5);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-600 text-white shadow-md'
                            : 'border-surface-200 text-surface-700 hover:border-primary-300 hover:bg-primary-50 dark:border-surface-700 dark:text-surface-300 dark:hover:border-primary-600 dark:hover:bg-primary-900/20'
                        }`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setCurrentStep(0)}>Back</Button>
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!selectedDate || !selectedTime}
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm Details */}
      {currentStep === 2 && (
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Confirm Your Appointment</h2>

          {/* Summary */}
          <div className="rounded-xl border border-surface-200 p-5 mb-6 dark:border-surface-700">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">Dentist</p>
                <p className="mt-1 font-semibold text-surface-900 dark:text-white">{selectedDentist?.full_name?.startsWith('Dr.') ? selectedDentist.full_name : `Dr. ${selectedDentist?.full_name}`}</p>
                {selectedDentist?.specialization && (
                  <Badge variant="primary" className="mt-1">{selectedDentist.specialization}</Badge>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">Date & Time</p>
                <p className="mt-1 font-semibold text-surface-900 dark:text-white">
                  {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-sm text-surface-600 dark:text-surface-400">{selectedTime?.slice(0, 5)}</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-4">
            <Textarea
              label="Reason for Visit"
              placeholder="Describe your dental concern or reason for the visit..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Emergency Toggle */}
          <label className="flex items-center gap-3 rounded-lg border border-surface-200 p-4 cursor-pointer transition-colors hover:bg-surface-50 dark:border-surface-700 dark:hover:bg-surface-700/30 mb-6">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="h-5 w-5 rounded border-surface-300 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <p className="font-medium text-surface-900 dark:text-white">Mark as Emergency</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Emergency appointments are prioritized by the reception team</p>
            </div>
          </label>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>Back</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Submit Request
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Success */}
      {currentStep === 3 && (
        <Card className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Appointment Request Submitted!</h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-md mx-auto mb-8">
            Your appointment request has been submitted and is being reviewed by our reception team.
            You&apos;ll receive a notification once it&apos;s been processed.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push('/dashboard/patient/appointments')}>
              View My Appointments
            </Button>
            <Button onClick={() => router.push('/dashboard/patient')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
