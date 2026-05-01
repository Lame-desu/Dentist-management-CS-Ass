'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { clinicalApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DentalRecord = Record<string, any>;

export default function DentalRecordsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<DentalRecord[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clinicalApi.getRecords({ limit: 100 });
      const data = res.data?.data?.records || res.data?.data || [];
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load dental records' });
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

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
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Dental Records</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Your dental history and treatment records
        </p>
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No dental records yet"
          description="Your dental records will appear here after your first visit."
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25" />
            </svg>
          }
        />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-surface-200 dark:bg-surface-700 hidden sm:block" />

          <div className="space-y-4">
            {records.map((record) => {
              const isExpanded = expandedId === record.id;
              return (
                <div key={record.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="hidden sm:flex flex-shrink-0 mt-6">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center z-10">
                      <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                      </svg>
                    </div>
                  </div>

                  {/* Card */}
                  <Card className="flex-1 cursor-pointer" noPadding>
                    <button
                      className="w-full text-left p-5"
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-white">
                            {record.dentist_name ? `Dr. ${record.dentist_name}` : (record.dentist_full_name ? `Dr. ${record.dentist_full_name}` : 'Visit')}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                            {new Date(record.visit_date || record.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <svg className={`h-5 w-5 text-surface-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>

                      {/* Summary */}
                      {!isExpanded && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {record.diagnosis && (
                            <Badge variant="info">{record.diagnosis.slice(0, 40)}{record.diagnosis.length > 40 ? '...' : ''}</Badge>
                          )}
                          {record.treatment && (
                            <Badge variant="success">{record.treatment.slice(0, 40)}{record.treatment.length > 40 ? '...' : ''}</Badge>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-surface-200 dark:border-surface-700 px-5 pb-5 pt-4 space-y-4">
                        {record.diagnosis && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Diagnosis</p>
                            <p className="text-sm text-surface-700 dark:text-surface-300">{record.diagnosis}</p>
                          </div>
                        )}
                        {record.treatment && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Treatment</p>
                            <p className="text-sm text-surface-700 dark:text-surface-300">{record.treatment}</p>
                          </div>
                        )}
                        {record.tooth_number && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Tooth Number</p>
                            <p className="text-sm text-surface-700 dark:text-surface-300">{record.tooth_number}</p>
                          </div>
                        )}
                        {record.notes && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Notes</p>
                            <p className="text-sm text-surface-700 dark:text-surface-300">{record.notes}</p>
                          </div>
                        )}
                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">Prescriptions</p>
                            <div className="space-y-2">
                              {record.prescriptions.map((rx: { id: number; medication_name: string; dosage: string; frequency: string; duration: string; instructions?: string }) => (
                                <div key={rx.id} className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700/50">
                                  <p className="font-medium text-sm text-surface-900 dark:text-white">{rx.medication_name}</p>
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
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
