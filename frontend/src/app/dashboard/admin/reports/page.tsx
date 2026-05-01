'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = Record<string, any>;

export default function AdminReportsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Date range
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);

  // Data
  const [apptReport, setApptReport] = useState<ReportData | null>(null);
  const [patientReport, setPatientReport] = useState<ReportData | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const [apptRes, patRes] = await Promise.allSettled([
        adminApi.getAppointmentReport({ from: fromDate, to: toDate }),
        adminApi.getPatientReport({ from: fromDate, to: toDate }),
      ]);

      if (apptRes.status === 'fulfilled') {
        setApptReport(apptRes.value.data?.data || {});
      }
      if (patRes.status === 'fulfilled') {
        setPatientReport(patRes.value.data?.data || {});
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load reports' });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Reports</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Appointment and patient analytics
        </p>
      </div>

      {/* Date Range Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="sm:max-w-[200px]"
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="sm:max-w-[200px]"
          />
          <Button onClick={loadReports} loading={loading}>Generate Report</Button>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="xl" />
        </div>
      )}

      {!loading && apptReport && (
        <>
          {/* Appointment Report Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Appointment Report</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 text-center">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{apptReport.totalAppointments ?? 0}</p>
                <p className="text-xs text-surface-500 mt-1">Total Appointments</p>
              </div>
              <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{apptReport.completedCount ?? 0}</p>
                <p className="text-xs text-surface-500 mt-1">Completed</p>
              </div>
              <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 text-center">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {typeof apptReport.cancellationRate === 'number' ? `${apptReport.cancellationRate.toFixed(1)}%` : '--'}
                </p>
                <p className="text-xs text-surface-500 mt-1">Cancellation Rate</p>
              </div>
              <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{apptReport.emergencyCount ?? 0}</p>
                <p className="text-xs text-surface-500 mt-1">Emergencies</p>
              </div>
            </div>

            {/* Status Breakdown Table */}
            {apptReport.statusBreakdown && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Status Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="px-3 py-2 text-left font-medium text-surface-500">Status</th>
                        <th className="px-3 py-2 text-right font-medium text-surface-500">Count</th>
                        <th className="px-3 py-2 text-right font-medium text-surface-500">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                      {Object.entries(apptReport.statusBreakdown).map(([status, count]) => (
                        <tr key={status} className="hover:bg-surface-50 dark:hover:bg-surface-700/30">
                          <td className="px-3 py-2 capitalize text-surface-900 dark:text-white">{status}</td>
                          <td className="px-3 py-2 text-right font-medium text-surface-700 dark:text-surface-300">{count as number}</td>
                          <td className="px-3 py-2 text-right text-surface-500">
                            {apptReport.totalAppointments ? ((count as number / apptReport.totalAppointments) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Busiest Days */}
            {apptReport.dailyCounts?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Daily Distribution</h3>
                <div className="flex items-end gap-1 h-32">
                  {(apptReport.dailyCounts as { date: string; count: number }[]).slice(0, 30).map((day: { date: string; count: number }, i: number) => {
                    const max = Math.max(...(apptReport.dailyCounts as { count: number }[]).map((d: { count: number }) => d.count), 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${day.date}: ${day.count}`}>
                        <div
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300 rounded-t transition-all"
                          style={{ height: `${(day.count / max) * 100}%`, minHeight: day.count > 0 ? '2px' : '0' }}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-surface-400 mt-1 text-center">Daily counts (last 30 days)</p>
              </div>
            )}

            {/* Additional Stats */}
            {apptReport.avgAppointmentsPerDentist && (
              <div className="mt-4 flex gap-4">
                <Badge variant="info">
                  Avg per dentist: {typeof apptReport.avgAppointmentsPerDentist === 'number'
                    ? apptReport.avgAppointmentsPerDentist.toFixed(1)
                    : apptReport.avgAppointmentsPerDentist}
                </Badge>
              </div>
            )}
          </Card>
        </>
      )}

      {!loading && patientReport && (
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Patient Report</h2>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 text-center">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{patientReport.totalActivePatients ?? 0}</p>
              <p className="text-xs text-surface-500 mt-1">Active Patients</p>
            </div>
            <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{patientReport.newRegistrations ?? 0}</p>
              <p className="text-xs text-surface-500 mt-1">New Registrations</p>
            </div>
            <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700 text-center">
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{patientReport.totalPatients ?? patientReport.totalActivePatients ?? 0}</p>
              <p className="text-xs text-surface-500 mt-1">Total Patients</p>
            </div>
          </div>

          {/* Top Patients by Visits */}
          {patientReport.topPatientsByVisits?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Top Patients by Visits</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      <th className="px-3 py-2 text-left font-medium text-surface-500">#</th>
                      <th className="px-3 py-2 text-left font-medium text-surface-500">Patient</th>
                      <th className="px-3 py-2 text-right font-medium text-surface-500">Visits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                    {patientReport.topPatientsByVisits.map((patient: { full_name?: string; patient_name?: string; visit_count?: number; appointment_count?: number }, i: number) => (
                      <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-700/30">
                        <td className="px-3 py-2 text-surface-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-surface-900 dark:text-white">
                          {patient.full_name || patient.patient_name || 'Unknown'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Badge variant="primary">{patient.visit_count || patient.appointment_count || 0}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
