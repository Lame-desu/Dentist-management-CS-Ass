'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { configApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ClinicConfigPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  // Config state
  const [config, setConfig] = useState<Record<string, string>>({});
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('17:00');
  const [workingDays, setWorkingDays] = useState<boolean[]>([true, true, true, true, true, false, false]);
  const [appointmentDuration, setAppointmentDuration] = useState('30');
  const [maxPerDentist, setMaxPerDentist] = useState('20');

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await configApi.getAll();
      const data = res.data?.data || {};
      const configMap: Record<string, string> = {};

      // The config may come as an array of key-value pairs or an object
      if (Array.isArray(data)) {
        data.forEach((item: { config_key?: string; key?: string; config_value?: string; value?: string }) => {
          const key = item.config_key || item.key || '';
          const value = item.config_value || item.value || '';
          if (key) configMap[key] = value;
        });
      } else if (typeof data === 'object') {
        Object.assign(configMap, data);
      }

      setConfig(configMap);

      // Parse values
      if (configMap.opening_time) setOpenTime(configMap.opening_time);
      if (configMap.closing_time) setCloseTime(configMap.closing_time);
      if (configMap.appointment_duration) setAppointmentDuration(configMap.appointment_duration);
      if (configMap.max_appointments_per_dentist) setMaxPerDentist(configMap.max_appointments_per_dentist);
      if (configMap.working_days) {
        try {
          const days = JSON.parse(configMap.working_days);
          if (Array.isArray(days)) {
            const newDays = [false, false, false, false, false, false, false];
            days.forEach((d: number) => { if (d >= 0 && d < 7) newDays[d] = true; });
            setWorkingDays(newDays);
          }
        } catch {
          // default
        }
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setConfirmModal(false);

      const updates: { key: string; value: string }[] = [
        { key: 'opening_time', value: openTime },
        { key: 'closing_time', value: closeTime },
        { key: 'appointment_duration', value: appointmentDuration },
        { key: 'max_appointments_per_dentist', value: maxPerDentist },
        { key: 'working_days', value: JSON.stringify(workingDays.map((v, i) => v ? i : -1).filter(i => i >= 0)) },
      ];

      for (const update of updates) {
        await configApi.update(update.key, update.value);
      }

      addToast({ type: 'success', title: 'Configuration Saved', message: 'Clinic settings have been updated successfully.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSaving(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Clinic Configuration</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Configure working hours, appointment settings, and operating days
        </p>
      </div>

      {/* Working Hours */}
      <Card>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Working Hours</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Opening Time"
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
          />
          <Input
            label="Closing Time"
            type="time"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
          />
        </div>
      </Card>

      {/* Working Days */}
      <Card>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Working Days</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DAY_NAMES.map((day, i) => (
            <label
              key={day}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                workingDays[i]
                  ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700'
              }`}
            >
              <input
                type="checkbox"
                checked={workingDays[i]}
                onChange={(e) => {
                  const newDays = [...workingDays];
                  newDays[i] = e.target.checked;
                  setWorkingDays(newDays);
                }}
                className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{day}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Appointment Settings */}
      <Card>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Appointment Settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Appointment Duration (minutes)"
            type="number"
            value={appointmentDuration}
            onChange={(e) => setAppointmentDuration(e.target.value)}
            min="10"
            max="120"
            hint="Default duration for each appointment slot"
          />
          <Input
            label="Max Appointments per Dentist/Day"
            type="number"
            value={maxPerDentist}
            onChange={(e) => setMaxPerDentist(e.target.value)}
            min="1"
            max="50"
            hint="Maximum number of appointments a dentist can have per day"
          />
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="secondary" onClick={loadConfig}>Reset</Button>
        <Button onClick={() => setConfirmModal(true)}>Save Configuration</Button>
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="Save Configuration"
        description="Are you sure you want to update the clinic configuration? Changes will affect appointment booking rules."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-2 rounded-lg bg-surface-50 p-4 dark:bg-surface-700/50 text-sm">
          <p><strong>Hours:</strong> {openTime} — {closeTime}</p>
          <p><strong>Working Days:</strong> {workingDays.map((v, i) => v ? DAY_NAMES[i].slice(0, 3) : null).filter(Boolean).join(', ')}</p>
          <p><strong>Duration:</strong> {appointmentDuration} minutes</p>
          <p><strong>Max/Dentist:</strong> {maxPerDentist} per day</p>
        </div>
      </Modal>
    </div>
  );
}
