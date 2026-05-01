'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi, type ProfileUpdatePayload, type ChangePasswordPayload } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

export default function ProfilePage() {
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

      {/* Profile Photo Placeholder */}
      <Card>
        <div className="flex items-center gap-6">
          <Avatar name={user?.full_name || ''} size="xl" />
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{user?.full_name}</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">{user?.email}</p>
            <p className="text-xs text-surface-400 mt-1 capitalize">{user?.role} Account</p>
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
