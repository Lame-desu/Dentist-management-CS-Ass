'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { appointmentApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = Record<string, any>;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'forwarded', label: 'Forwarded' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AllAppointmentsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  // Detail modal
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.fromDate = dateFrom;
      if (dateTo) params.toDate = dateTo;
      if (search) params.search = search;

      const res = await appointmentApi.getAll(params);
      const data = res.data?.data?.appointments || res.data?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
      setTotal(res.data?.data?.pagination?.total || (Array.isArray(data) ? data.length : 0));
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateFrom, dateTo, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">All Appointments</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Complete appointment registry with filters
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search patient or dentist..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-surface-900 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="date"
          placeholder="From"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-surface-900 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
        />
        <input
          type="date"
          placeholder="To"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm text-surface-900 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="xl" /></div>
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Patient</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Dentist</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Time</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    onClick={() => setDetailAppt(appt)}
                    className="cursor-pointer bg-white transition-colors hover:bg-surface-50 dark:bg-surface-800 dark:hover:bg-surface-700/50"
                  >
                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">
                      {appt.patient_name || appt.patient_full_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                      Dr. {appt.dentist_name || appt.dentist_full_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                      {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                      {appt.appointment_time?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={appt.status} /></td>
                    <td className="px-4 py-3 text-surface-500 dark:text-surface-400 text-xs">
                      {new Date(appt.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailAppt}
        onClose={() => setDetailAppt(null)}
        title="Appointment Details"
        size="lg"
      >
        {detailAppt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-surface-500">Patient</p>
                <p className="mt-1 font-medium text-surface-900 dark:text-white">{detailAppt.patient_name || detailAppt.patient_full_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-surface-500">Dentist</p>
                <p className="mt-1 font-medium text-surface-900 dark:text-white">Dr. {detailAppt.dentist_name || detailAppt.dentist_full_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-surface-500">Date & Time</p>
                <p className="mt-1 font-medium text-surface-900 dark:text-white">
                  {new Date(detailAppt.appointment_date).toLocaleDateString()} at {detailAppt.appointment_time?.slice(0, 5)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-surface-500">Status</p>
                <div className="mt-1"><StatusBadge status={detailAppt.status} /></div>
              </div>
            </div>
            {detailAppt.reason && (
              <div>
                <p className="text-xs font-medium uppercase text-surface-500">Reason</p>
                <p className="mt-1 text-sm text-surface-700 dark:text-surface-300">{detailAppt.reason}</p>
              </div>
            )}
            {detailAppt.rejection_reason && (
              <div>
                <p className="text-xs font-medium uppercase text-surface-500">Rejection Reason</p>
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{detailAppt.rejection_reason}</p>
              </div>
            )}
            {detailAppt.reviewed_by_name && (
              <div>
                <p className="text-xs font-medium uppercase text-surface-500">Reviewed By</p>
                <p className="mt-1 text-sm text-surface-700 dark:text-surface-300">{detailAppt.reviewed_by_name}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
