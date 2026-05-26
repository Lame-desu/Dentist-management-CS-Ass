'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { userApi, authApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type User = Record<string, any>;

type TabKey = 'all' | 'dentist' | 'receptionist';

const SHIFT_OPTIONS = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'full_day', label: 'Full Day' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isAvailable: false },
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isAvailable: false },
];

export default function StaffManagementPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [saving, setSaving] = useState(false);

  // Add staff modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    role: 'dentist' as 'dentist' | 'receptionist',
    fullName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '',
    bio: '',
    shift: 'full_day',
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    DEFAULT_AVAILABILITY.map(s => ({ ...s }))
  );

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  // Toggle active confirmation
  const [toggleUser, setToggleUser] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { limit: 200 };
      if (activeTab !== 'all') params.role = activeTab;
      const res = await userApi.getAll(params);
      const data = res.data?.data?.users || res.data?.data || [];
      const arr = Array.isArray(data) ? data : [];
      // Filter to only staff roles
      setUsers(arr.filter((u: User) => u.role === 'dentist' || u.role === 'receptionist'));
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load staff' });
    } finally {
      setLoading(false);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = activeTab === 'all'
    ? users
    : users.filter(u => u.role === activeTab);

  // Add staff
  const validateAdd = () => {
    const errs: Record<string, string> = {};
    if (!addForm.fullName.trim()) errs.fullName = 'Name is required';
    if (!addForm.email.trim()) errs.email = 'Email is required';
    if (!addForm.phoneNumber.trim()) errs.phoneNumber = 'Phone is required';
    if (addForm.role === 'dentist') {
      if (!addForm.specialization.trim()) errs.specialization = 'Specialization is required';
      if (!addForm.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
    }
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddStaff = async () => {
    if (!validateAdd()) return;
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        fullName: addForm.fullName,
        email: addForm.email,
        phoneNumber: addForm.phoneNumber,
        role: addForm.role,
      };
      if (addForm.role === 'dentist') {
        payload.specialization = addForm.specialization;
        payload.licenseNumber = addForm.licenseNumber;
        if (addForm.yearsOfExperience) payload.yearsOfExperience = Number(addForm.yearsOfExperience);
        if (addForm.bio) payload.bio = addForm.bio;
        // Send only the enabled availability slots
        payload.availability = availability
          .filter(s => s.isAvailable)
          .map(s => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: true,
          }));
      } else {
        payload.shift = addForm.shift;
      }
      await userApi.createStaff(payload);
      addToast({ type: 'success', title: 'Staff Created', message: `${addForm.role === 'dentist' ? 'Dentist' : 'Receptionist'} account created. An invitation email has been sent.` });
      setShowAddModal(false);
      setAddForm({ role: 'dentist', fullName: '', email: '', phoneNumber: '', specialization: '', licenseNumber: '', yearsOfExperience: '', bio: '', shift: 'full_day' });
      setAvailability(DEFAULT_AVAILABILITY.map(s => ({ ...s })));
      setAddErrors({});
      loadUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create staff';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  // Edit staff
  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({
      fullName: u.full_name || '',
      phoneNumber: u.phone_number || '',
      specialization: u.specialization || '',
      shift: u.shift || 'full_day',
    });
  };

  const handleEditStaff = async () => {
    if (!editUser) return;
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
      };
      if (editUser.role === 'dentist') {
        payload.specialization = editForm.specialization;
      } else {
        payload.shift = editForm.shift;
      }
      await userApi.updateStaff(editUser.id, payload);
      addToast({ type: 'success', title: 'Updated', message: 'Staff profile updated.' });
      setEditUser(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  // Toggle active
  const handleToggleActive = async () => {
    if (!toggleUser) return;
    try {
      setSaving(true);
      await userApi.toggleActive(toggleUser.id);
      addToast({ type: 'success', title: 'Updated', message: `${toggleUser.full_name} has been ${toggleUser.is_active ? 'deactivated' : 'activated'}.` });
      setToggleUser(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to toggle';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All Staff' },
    { key: 'dentist', label: 'Dentists' },
    { key: 'receptionist', label: 'Receptionists' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Staff Management</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Manage dentists and receptionists
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Staff
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-surface-200 p-1 dark:border-surface-700 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Staff Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No staff found"
          description={activeTab !== 'all' ? `No ${activeTab}s found. Add one using the button above.` : 'No staff members found.'}
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400 hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400 hidden md:table-cell">Detail</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Verified</th>
                  <th className="px-4 py-3 text-right font-medium text-surface-500 dark:text-surface-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/30">
                    <td className="px-4 py-3 font-medium text-surface-900 dark:text-white">
                      {u.role === 'dentist' ? 'Dr. ' : ''}{u.full_name}
                    </td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{u.email}</td>
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400 hidden sm:table-cell">{u.phone_number || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'dentist' ? 'primary' : 'info'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-surface-500 dark:text-surface-400 hidden md:table-cell">
                      {u.role === 'dentist' ? (u.specialization || '—') : (u.shift || '—')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active !== false ? 'success' : 'danger'}>
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_email_verified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Edit</Button>
                        {u.is_email_verified === false && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await authApi.resendVerification(u.email);
                                addToast({ type: 'success', title: 'Sent', message: 'Invitation email resent.' });
                              } catch {
                                addToast({ type: 'error', title: 'Error', message: 'Failed to resend.' });
                              }
                            }}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            Resend
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setToggleUser(u)}
                          className={u.is_active !== false ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'}
                        >
                          {u.is_active !== false ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setAddErrors({}); }}
        title="Add Staff Member"
        description="Create a new dentist or receptionist account."
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setAddErrors({}); }}>Cancel</Button>
            <Button onClick={handleAddStaff} loading={saving}>Create Account</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Role"
            value={addForm.role}
            onChange={(e) => setAddForm(prev => ({ ...prev, role: e.target.value as 'dentist' | 'receptionist' }))}
            options={[
              { value: 'dentist', label: 'Dentist' },
              { value: 'receptionist', label: 'Receptionist' },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full Name *" value={addForm.fullName} onChange={(e) => setAddForm(prev => ({ ...prev, fullName: e.target.value }))} error={addErrors.fullName} />
            <Input label="Email *" type="email" value={addForm.email} onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))} error={addErrors.email} />
            <Input label="Phone *" value={addForm.phoneNumber} onChange={(e) => setAddForm(prev => ({ ...prev, phoneNumber: e.target.value }))} error={addErrors.phoneNumber} />
            <div className="sm:col-span-2 rounded-lg border border-primary-500/20 bg-primary-500/5 px-4 py-3">
              <p className="text-sm text-primary-300">
                📧 An invitation email will be sent to the staff member. They will set their own password.
              </p>
            </div>
          </div>

          {addForm.role === 'dentist' && (
            <div className="space-y-4 border-t border-surface-200 dark:border-surface-700 pt-4 mt-4">
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">Dentist Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Specialization *" value={addForm.specialization} onChange={(e) => setAddForm(prev => ({ ...prev, specialization: e.target.value }))} error={addErrors.specialization} />
                <Input label="License Number *" value={addForm.licenseNumber} onChange={(e) => setAddForm(prev => ({ ...prev, licenseNumber: e.target.value }))} error={addErrors.licenseNumber} />
                <Input label="Years of Experience" type="number" value={addForm.yearsOfExperience} onChange={(e) => setAddForm(prev => ({ ...prev, yearsOfExperience: e.target.value }))} />
                <Input label="Bio" value={addForm.bio} onChange={(e) => setAddForm(prev => ({ ...prev, bio: e.target.value }))} />
              </div>

              {/* Weekly Availability Schedule */}
              <div className="mt-4">
                <p className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Weekly Availability</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">
                  Set the dentist&apos;s working hours. Toggle days on/off and adjust times as needed.
                </p>
                <div className="space-y-2">
                  {availability.map((slot, idx) => (
                    <div
                      key={slot.dayOfWeek}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                        slot.isAvailable
                          ? 'border-primary-500/30 bg-primary-500/5 dark:border-primary-400/20 dark:bg-primary-500/10'
                          : 'border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50 opacity-60'
                      }`}
                    >
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setAvailability(prev => prev.map((s, i) =>
                            i === idx ? { ...s, isAvailable: !s.isAvailable } : s
                          ));
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          slot.isAvailable ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
                        }`}
                        role="switch"
                        aria-checked={slot.isAvailable}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            slot.isAvailable ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Day name */}
                      <span className={`text-sm font-medium w-12 ${
                        slot.isAvailable
                          ? 'text-surface-900 dark:text-white'
                          : 'text-surface-400 dark:text-surface-500'
                      }`}>
                        <span className="hidden sm:inline">{DAY_NAMES[slot.dayOfWeek]}</span>
                        <span className="sm:hidden">{DAY_NAMES_SHORT[slot.dayOfWeek]}</span>
                      </span>

                      {/* Time inputs */}
                      {slot.isAvailable && (
                        <div className="flex items-center gap-2 ml-auto">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              setAvailability(prev => prev.map((s, i) =>
                                i === idx ? { ...s, startTime: e.target.value } : s
                              ));
                            }}
                            className="rounded-md border border-surface-300 bg-white px-2 py-1 text-xs dark:border-surface-600 dark:bg-surface-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <span className="text-xs text-surface-400">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              setAvailability(prev => prev.map((s, i) =>
                                i === idx ? { ...s, endTime: e.target.value } : s
                              ));
                            }}
                            className="rounded-md border border-surface-300 bg-white px-2 py-1 text-xs dark:border-surface-600 dark:bg-surface-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      )}
                      {!slot.isAvailable && (
                        <span className="text-xs text-surface-400 dark:text-surface-500 ml-auto italic">Day off</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {addForm.role === 'receptionist' && (
            <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mt-4">
              <Select
                label="Shift"
                value={addForm.shift}
                onChange={(e) => setAddForm(prev => ({ ...prev, shift: e.target.value }))}
                options={SHIFT_OPTIONS}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Edit ${editUser?.role === 'dentist' ? 'Dr. ' : ''}${editUser?.full_name || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditStaff} loading={saving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" value={editForm.fullName || ''} onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))} />
          <Input label="Phone Number" value={editForm.phoneNumber || ''} onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))} />
          {editUser?.role === 'dentist' && (
            <Input label="Specialization" value={editForm.specialization || ''} onChange={(e) => setEditForm(prev => ({ ...prev, specialization: e.target.value }))} />
          )}
          {editUser?.role === 'receptionist' && (
            <Select
              label="Shift"
              value={editForm.shift || 'full_day'}
              onChange={(e) => setEditForm(prev => ({ ...prev, shift: e.target.value }))}
              options={SHIFT_OPTIONS}
            />
          )}
        </div>
      </Modal>

      {/* Toggle Active Confirmation */}
      <Modal
        isOpen={!!toggleUser}
        onClose={() => setToggleUser(null)}
        title={`${toggleUser?.is_active !== false ? 'Deactivate' : 'Activate'} ${toggleUser?.full_name || ''}?`}
        description={
          toggleUser?.is_active !== false
            ? 'This will prevent this user from logging in to the system.'
            : 'This will allow this user to log in again.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setToggleUser(null)}>Cancel</Button>
            <Button
              variant={toggleUser?.is_active !== false ? 'danger' : 'primary'}
              onClick={handleToggleActive}
              loading={saving}
            >
              {toggleUser?.is_active !== false ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      >
        <div className="rounded-lg bg-surface-50 p-4 dark:bg-surface-700/50 text-sm">
          <p><strong>Name:</strong> {toggleUser?.full_name}</p>
          <p><strong>Role:</strong> {toggleUser?.role}</p>
          <p><strong>Email:</strong> {toggleUser?.email}</p>
        </div>
      </Modal>
    </div>
  );
}
