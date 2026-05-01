'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { clinicalApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Prescription = Record<string, any>;

export default function PrescriptionsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clinicalApi.getPrescriptions({ limit: 100 });
      const data = res.data?.data?.prescriptions || res.data?.data || [];
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load prescriptions' });
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, Prescription[]> = {};
  prescriptions.forEach((rx) => {
    const dateKey = new Date(rx.visit_date || rx.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(rx);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Prescriptions</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          All your prescribed medications and treatments
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <EmptyState
          title="No prescriptions yet"
          description="Your prescribed medications will appear here after dental visits."
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 1.232 3.229 0 4.461l-.354.354c-1.232 1.232-3.229 1.232-4.461 0L5 10.125" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, rxList]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">{date}</h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Medicine</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Dosage</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Frequency</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Duration</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Dentist</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                    {rxList.map((rx) => (
                      <tr key={rx.id} className="bg-white dark:bg-surface-800">
                        <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">{rx.medication_name}</td>
                        <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{rx.dosage}</td>
                        <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{rx.frequency}</td>
                        <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{rx.duration}</td>
                        <td className="px-4 py-3 text-surface-500 dark:text-surface-400">
                          {rx.dentist_name ? `Dr. ${rx.dentist_name}` : (rx.dentist_full_name ? `Dr. ${rx.dentist_full_name}` : '—')}
                        </td>
                        <td className="px-4 py-3 text-surface-500 dark:text-surface-400 max-w-[200px] truncate">
                          {rx.instructions || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
