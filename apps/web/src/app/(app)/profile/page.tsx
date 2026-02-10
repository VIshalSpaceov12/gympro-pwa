'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, type User } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  User as UserIcon,
  Save,
  Lock,
  Sun,
  Moon,
  Monitor,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';

const genderOptions = [
  { value: '', label: 'Select gender' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

const fitnessGoalOptions = [
  { value: '', label: 'Select goal' },
  { value: 'LOSE_WEIGHT', label: 'Lose Weight' },
  { value: 'BUILD_MUSCLE', label: 'Build Muscle' },
  { value: 'STAY_FIT', label: 'Stay Fit' },
  { value: 'IMPROVE_FLEXIBILITY', label: 'Improve Flexibility' },
  { value: 'INCREASE_ENDURANCE', label: 'Increase Endurance' },
];

const experienceLevelOptions = [
  { value: '', label: 'Select level' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState<Toast | null>(null);

  // Populate form from user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setBio(user.profile?.bio || '');
      setGender(user.profile?.gender || '');
      setHeight(user.profile?.height ? String(user.profile.height) : '');
      setWeight(user.profile?.weight ? String(user.profile.weight) : '');
      setFitnessGoal(user.profile?.fitnessGoal || '');
      setExperienceLevel(user.profile?.experienceLevel || '');
    }
  }, [user]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);

    try {
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        bio: bio || null,
        gender: gender || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        fitnessGoal: fitnessGoal || null,
        experienceLevel: experienceLevel || null,
      };

      const result = await apiClient<User>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (result.success) {
        showToast('success', 'Profile updated successfully');
        // Refresh user data in auth store
        await fetchUser();
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);

    try {
      const result = await apiClient<{ message: string }>('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (result.success) {
        showToast('success', 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 right-4 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all',
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Profile Header */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-border p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
            {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </h1>
            <p className="text-sm text-muted">{user?.email}</p>
            {memberSince && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <Calendar className="h-3 w-3" />
                Member since {memberSince}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-border p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <UserIcon className="h-5 w-5 text-primary" />
          Edit Profile
        </h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Tell us about yourself..."
              className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gender" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="experienceLevel" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Experience Level
              </label>
              <select
                id="experienceLevel"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {experienceLevelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="height" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Height (cm)
              </label>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                min="0"
                step="0.1"
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="weight" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                min="0"
                step="0.1"
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="fitnessGoal" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fitness Goal
              </label>
              <select
                id="fitnessGoal"
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {fitnessGoalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {profileSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Theme Toggle */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-border p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Sun className="h-5 w-5 text-primary" />
          Appearance
        </h2>
        <div className="flex gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setThemeMode(option.value)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                themeMode === option.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              aria-label={`Set theme to ${option.label}`}
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-border p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Lock className="h-5 w-5 text-primary" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                className="w-full rounded-lg border border-border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
            >
              {passwordSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
