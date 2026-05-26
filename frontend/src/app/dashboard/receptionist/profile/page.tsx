'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi, type ProfileUpdatePayload } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

export default function ReceptionistProfilePage() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  // Profile form state
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

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <div className="flex items-center gap-6">
          <Avatar name={user?.full_name || ''} size="xl" />
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{user?.full_name}</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Receptionist
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information Form */}
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
