'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi, availabilityApi, type ProfileUpdatePayload } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DentistProfilePage() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  // Profile form
  const [profileForm, setProfileForm] = useState({
    fullName: user?.full_name || '',
    phoneNumber: user?.phone_number || '',
    dateOfBirth: user?.date_of_birth?.split('T')[0] || '',
    gender: user?.gender || '',
    address: user?.address || '',
    emergencyContact: user?.emergency_contact || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Availability
  const [availability, setAvailability] = useState<Record<string, unknown>[]>([]);
  const [availLoaded, setAvailLoaded] = useState(false);
  const [availSaving, setAvailSaving] = useState(false);
  const [showAvail, setShowAvail] = useState(false);

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    setProfileErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    setPasswordErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!profileForm.fullName.trim()) errors.fullName = 'Name is required';
    if (!profileForm.phoneNumber.trim()) errors.phoneNumber = 'Phone is required';

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    try {
      setProfileSaving(true);
      const data: ProfileUpdatePayload = {
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
        dateOfBirth: profileForm.dateOfBirth || undefined,
        gender: profileForm.gender || undefined,
        address: profileForm.address || undefined,
        emergencyContact: profileForm.emergencyContact || undefined,
      };
      await updateProfile(data);
      addToast({ type: 'success', title: 'Profile Updated', message: 'Your profile has been updated successfully.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    if (passwordForm.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setPasswordSaving(true);
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      addToast({ type: 'success', title: 'Password Changed', message: 'Your password has been updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Load availability
  const loadAvailability = async () => {
    if (availLoaded || !user?.profile_id) return;
    try {
      const res = await availabilityApi.getAvailability(user.profile_id);
      const data = res.data?.data?.availability || res.data?.data || [];
      setAvailability(Array.isArray(data) ? data : []);
      setAvailLoaded(true);
    } catch {
      // silent
    }
  };

  const updateAvailDay = (dayOfWeek: number, field: string, value: string | boolean) => {
    setAvailability(prev => {
      const existing = prev.find((a: Record<string, unknown>) => a.day_of_week === dayOfWeek);
      if (existing) {
        return prev.map((a: Record<string, unknown>) =>
          a.day_of_week === dayOfWeek ? { ...a, [field]: value } : a
        );
      }
      return [...prev, { day_of_week: dayOfWeek, start_time: '08:00', end_time: '17:00', is_available: true, [field]: value }];
    });
  };

  const handleSaveAvailability = async () => {
    try {
      setAvailSaving(true);
      await availabilityApi.setAvailability(
        availability
          .filter((a: Record<string, unknown>) => a.is_available !== false)
          .map((a: Record<string, unknown>) => ({
            dayOfWeek: a.day_of_week,
            startTime: a.start_time,
            endTime: a.end_time,
          }))
      );
      addToast({ type: 'success', title: 'Saved', message: 'Availability updated successfully.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setAvailSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Manage your professional information and availability
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <div className="flex items-center gap-6">
          <Avatar name={user?.full_name || ''} size="xl" />
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Dr. {user?.full_name}</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">{user?.email}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-surface-400">
              {user?.specialization && <span className="uppercase">{user.specialization}</span>}
              {user?.license_number && <span>• License: {user.license_number}</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <Card>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              value={profileForm.fullName}
              onChange={(e) => handleProfileChange('fullName', e.target.value)}
              error={profileErrors.fullName}
            />
            <Input
              label="Phone Number"
              value={profileForm.phoneNumber}
              onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
              error={profileErrors.phoneNumber}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={profileForm.dateOfBirth}
              onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
            />
            <Select
              label="Gender"
              value={profileForm.gender}
              onChange={(e) => handleProfileChange('gender', e.target.value)}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              placeholder="Select gender"
            />
          </div>
          <Input
            label="Address"
            value={profileForm.address}
            onChange={(e) => handleProfileChange('address', e.target.value)}
          />
          <Input
            label="Emergency Contact"
            value={profileForm.emergencyContact}
            onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
            hint="Name and phone number of emergency contact"
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={profileSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Availability Schedule */}
      <Card>
        <button
          onClick={() => { setShowAvail(!showAvail); loadAvailability(); }}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Weekly Availability</h2>
          <svg className={`h-5 w-5 text-surface-400 transition-transform ${showAvail ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showAvail && (
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
              const avail = availability.find((a: Record<string, unknown>) => a.day_of_week === dayOfWeek);
              const isAvailable = avail ? avail.is_available !== false && !!avail.start_time : false;
              return (
                <div key={dayOfWeek} className="flex items-center gap-4 rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                  <label className="flex items-center gap-2 w-28 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => updateAvailDay(dayOfWeek, 'is_available', e.target.checked)}
                      className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{DAY_NAMES[dayOfWeek]}</span>
                  </label>
                  {isAvailable ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={(avail?.start_time as string) || '08:00'}
                        onChange={(e) => updateAvailDay(dayOfWeek, 'start_time', e.target.value)}
                        className="!w-28"
                      />
                      <span className="text-surface-400">to</span>
                      <Input
                        type="time"
                        value={(avail?.end_time as string) || '17:00'}
                        onChange={(e) => updateAvailDay(dayOfWeek, 'end_time', e.target.value)}
                        className="!w-28"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-surface-400 italic">Unavailable</span>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveAvailability} loading={availSaving}>Save Availability</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Change Password */}
      <Card>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            error={passwordErrors.currentPassword}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              error={passwordErrors.newPassword}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              error={passwordErrors.confirmPassword}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={passwordSaving}>
              Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
