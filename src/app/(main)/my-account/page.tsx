/**
 * My Account Page
 * ===============
 * User profile and account settings page.
 * Uses Supabase Auth, Database, and Storage.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/types/auth';
import { createClient } from '@/lib/supabase/client';
import { apiUpload, getErrorMessage } from '@/lib/api-client';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { changeUsernameAction, getUserProfileAction, deleteAccountAction } from '@/app/(auth)/actions';
import { useAuthStore } from '@/stores';
import { useAdmin } from '@/hooks';
import { ProtectedRoute } from '@/components/layout';
import { cn } from '@/lib/utils';
import { LoadingState, Button, Input, Alert, PageContainer, Spinner, Card, PageHeader } from '@/components/ui';
import { ExpandableImage, ImageUploadModal, RealmsImagePicker } from '@/components/shared';
import { User as UserIcon, Mail, Lock, Trash2, AlertTriangle, AtSign, Camera } from 'lucide-react';

function hasPasswordProvider(authUser: AuthUser | null): boolean {
  if (!authUser) return false;
  return authUser.provider === 'email' || authUser.provider === 'password';
}

function getAuthProviderLabel(authUser: AuthUser | null): string {
  if (!authUser) return 'Unknown';
  const p = authUser.provider;
  if (p === 'google' || p === 'google.com') return 'Google';
  if (p === 'apple' || p === 'apple.com') return 'Apple';
  if (p === 'email' || p === 'password') return 'Email/Password';
  return p ? p.replace('.com', '') : 'Unknown';
}

interface UserProfile {
  username?: string;
  email?: string;
  createdAt?: Date;
  photoURL?: string;
  role?: 'new_player' | 'playtester' | 'developer' | 'admin';
  rolePolicy?: {
    maxCampaigns: number;
    maxPlayersPerCampaign: number;
    maxCharacters: number;
    maxPowers: number;
    maxTechniques: number;
    maxArmaments: number;
    maxCreatures: number;
    canUploadProfilePicture: boolean;
  };
}

function AccountContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();

  const canChangeEmailPassword = useMemo(() => hasPasswordProvider(user), [user]);
  const authProviderLabel = useMemo(() => getAuthProviderLabel(user), [user]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [profileRetrying, setProfileRetrying] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showPictureModal, setShowPictureModal] = useState(false);
  const [showPictureBank, setShowPictureBank] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureMessage, setPictureMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [usernameChanging, setUsernameChanging] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadProfile = useCallback(async (opts?: { isRetry?: boolean }) => {
    if (!user) return;

    if (opts?.isRetry) setProfileRetrying(true);
    setProfileLoadError(null);
    try {
      const { profile: p, error } = await getUserProfileAction();
      if (error) {
        setProfileLoadError(error);
        setProfile({
          email: user.email ?? undefined,
          photoURL: user.photoURL ?? undefined,
        });
        return;
      }
      if (p) {
        const rawPhoto = (p.photoUrl as string) ?? undefined;
        const photoURL = rawPhoto
          ? `${rawPhoto}?t=${p.updatedAt ? new Date(p.updatedAt as string | number | Date).getTime() : Date.now()}`
          : (user.photoURL ?? undefined);
        setProfile({
          username: (p.usernameDisplay as string | undefined) ?? (p.username as string | undefined) ?? undefined,
          email: (p.email as string | undefined) ?? user.email ?? undefined,
          createdAt: p.createdAt instanceof Date ? p.createdAt : p.createdAt ? new Date(p.createdAt as string | number | Date) : undefined,
          photoURL,
          role: (p.role as UserProfile['role']) ?? undefined,
          rolePolicy: (p.rolePolicy as UserProfile['rolePolicy']) ?? undefined,
        });
      } else {
        setProfile({
          email: user.email ?? undefined,
          photoURL: user.photoURL ?? undefined,
        });
      }
    } catch (err: unknown) {
      setProfileLoadError(getErrorMessage(err, 'Failed to load profile'));
      setProfile({
        email: user.email ?? undefined,
        photoURL: user.photoURL ?? undefined,
      });
    } finally {
      setLoading(false);
      setProfileRetrying(false);
    }
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleProfilePictureUpload = async (blob: Blob) => {
    if (!user) return;
    setUploadingPicture(true);
    setPictureMessage(null);
    try {
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      const { url } = await apiUpload<{ url: string }>('/api/upload/profile-picture', formData);
      // Cache-bust so the browser shows the new image (same path is overwritten in storage)
      setProfile((prev) => (prev ? { ...prev, photoURL: `${url}?t=${Date.now()}` } : null));
      // Sync to Supabase Auth so header and any useAuth() consumer see the new picture
      const supabase = createClient();
      const { error: authSyncError } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (authSyncError) {
        setPictureMessage({
          type: 'error',
          text: 'Picture uploaded, but account avatar sync failed. Refresh or try again.',
        });
        return;
      }
      setPictureMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err: unknown) {
      setPictureMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to upload profile picture'),
      });
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleBankProfilePicture = async (url: string) => {
    if (!user) return;
    setUploadingPicture(true);
    setPictureMessage(null);
    try {
      const supabase = createClient();
      const { error: profileError } = await supabase.from('user_profiles').upsert(
        { id: user.uid, photo_url: url, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
      if (profileError) throw profileError;
      const { error: authError } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (authError) throw authError;
      setProfile((prev) => (prev ? { ...prev, photoURL: `${url}?t=${Date.now()}` } : null));
      setPictureMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err: unknown) {
      setPictureMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to update profile picture'),
      });
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setUsernameChanging(true);
    setUsernameMessage(null);

    const result = await changeUsernameAction(newUsername.trim());

    if (result.success) {
      setProfile((prev) => (prev ? { ...prev, username: newUsername.trim() } : null));
      setNewUsername('');
      setUsernameMessage({ type: 'success', text: 'Username updated successfully!' });
    } else {
      setUsernameMessage({ type: 'error', text: result.error ?? 'Failed to change username' });
    }
    setUsernameChanging(false);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setEmailChanging(true);
    setEmailMessage(null);

    if (!emailPassword) {
      setEmailMessage({ type: 'error', text: 'Please enter your current password' });
      setEmailChanging(false);
      return;
    }

    try {
      const supabase = createClient();
      // Re-authenticate with the current password before changing the email so a
      // hijacked session cannot silently take over the account (TASK-331).
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailPassword,
      });
      if (reauthError) throw new Error('Current password is incorrect');
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setProfile((prev) => (prev ? { ...prev, email: newEmail } : null));
      setNewEmail('');
      setEmailPassword('');
      setEmailMessage({ type: 'success', text: 'Email updated successfully!' });
    } catch (err: unknown) {
      setEmailMessage({ type: 'error', text: getAuthErrorMessage(err, 'update-email') });
    } finally {
      setEmailChanging(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setPasswordChanging(true);
    setPasswordMessage(null);

    try {
      const supabase = createClient();
      // Verify the current password before setting a new one (TASK-331).
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) throw new Error('Current password is incorrect');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (err: unknown) {
      const raw = getErrorMessage(err, 'Failed to update password');
      let message = 'Failed to update password';
      if (raw.includes('wrong') || raw.includes('incorrect')) {
        message = 'Current password is incorrect';
      } else if (raw.includes('weak')) {
        message = 'Password is too weak';
      } else {
        message = raw;
      }
      setPasswordMessage({ type: 'error', text: message });
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      setPasswordMessage({ type: 'success', text: 'Password reset email sent!' });
    } catch (err: unknown) {
      setPasswordMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to send reset email'),
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const supabase = createClient();
      // Password accounts re-authenticate; OAuth-only users (no password) confirm
      // via the typed DELETE, so they aren't locked out of deleting (TASK-331).
      if (canChangeEmailPassword) {
        if (!user.email) throw new Error('Missing account email');
        const { error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: deletePassword,
        });
        if (error) throw error;
      }

      const result = await deleteAccountAction();
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to delete account');
      }
      router.push('/');
    } catch (err: unknown) {
      const raw = getErrorMessage(err, 'Failed to delete account');
      let message = 'Failed to delete account';
      if (raw.includes('wrong') || raw.includes('Invalid') || raw.includes('incorrect')) {
        message = 'Incorrect password';
      } else {
        message = raw;
      }
      setDeleteError(message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer size="xs">
        <LoadingState message="Loading account..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xs" className="space-y-6 min-w-0">
      <PageHeader
        title="My Account"
        icon={<UserIcon className="w-8 h-8 text-primary-link-fg" />}
        description="Manage your profile and account settings"
        className="mb-0 min-w-0"
      />

      {profileLoadError && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Alert variant="danger" className="flex-1 min-w-0">
            {profileLoadError}. Some account details may be incomplete.
          </Alert>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadProfile({ isRetry: true })}
            disabled={profileRetrying}
            aria-label="Retry loading account profile"
            className="min-h-[var(--touch-target-min,44px)] shrink-0 self-stretch sm:self-auto"
          >
            {profileRetrying ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      )}

      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-3">Role &amp; Limits</h2>
        <p className="text-text-secondary mb-4">
          Your role controls quotas for campaigns, characters, and custom library items.
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Role</span>
            <span className="font-medium text-text-primary">{formatRoleLabel(profile?.role)}</span>
          </div>

          {profile?.rolePolicy ? (
            <>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-text-secondary">Max Campaigns</span>
                <span className="font-medium text-text-primary">{profile.rolePolicy.maxCampaigns}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-text-secondary">Max Players Per Campaign</span>
                <span className="font-medium text-text-primary">{profile.rolePolicy.maxPlayersPerCampaign}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-text-secondary">Max Characters</span>
                <span className="font-medium text-text-primary">{profile.rolePolicy.maxCharacters}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-text-secondary">Max Custom Powers</span>
                <span className="font-medium text-text-primary">{profile.rolePolicy.maxPowers}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-text-secondary">Max Custom Techniques</span>
                <span className="font-medium text-text-primary">{profile.rolePolicy.maxTechniques}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-text-secondary">Max Custom Armaments</span>
                <span className="font-medium text-text-primary">{profile.rolePolicy.maxArmaments}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-text-secondary">Max Custom Creatures</span>
                <span className="font-medium text-text-primary">{profile.rolePolicy.maxCreatures}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">Profile Picture Uploads</span>
                <span className="font-medium text-text-primary">{profile.rolePolicy.canUploadProfilePicture ? 'Allowed' : 'Not allowed'}</span>
              </div>
            </>
          ) : (
            <p className="text-text-muted dark:text-text-secondary italic">Limits unavailable.</p>
          )}
        </div>
      </Card>

      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Profile Information</h2>

        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border-subtle">
          {profile?.photoURL ? (
            <ExpandableImage
              src={profile.photoURL}
              alt="Profile picture"
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-border-light bg-surface-alt"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic profile photo URL */}
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
              {uploadingPicture && (
                <div className="absolute inset-0 flex items-center justify-center bg-text-primary/40">
                  <Spinner size="sm" variant="white" />
                </div>
              )}
            </ExpandableImage>
          ) : (
            <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border-light bg-surface-alt text-text-muted dark:text-text-secondary">
              <UserIcon className="h-8 w-8" aria-hidden />
              {uploadingPicture && (
                <div className="absolute inset-0 flex items-center justify-center bg-text-primary/40">
                  <Spinner size="sm" variant="white" />
                </div>
              )}
            </div>
          )}
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPictureModal(true)}
              disabled={uploadingPicture}
            >
              <Camera className="w-4 h-4" aria-hidden />
              {profile?.photoURL ? 'Change Picture' : 'Add Picture'}
            </Button>
            <p className="mt-1 text-xs text-text-muted dark:text-text-secondary">
              JPG, PNG, GIF, or WebP. Max 5MB.
            </p>
            {pictureMessage && (
              <p className={cn('text-xs mt-1', pictureMessage.type === 'success' ? 'text-success-700 dark:text-success-400' : 'text-danger-700 dark:text-danger-400')}>
                {pictureMessage.text}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Username</span>
            <span className="font-medium text-text-primary">{profile?.username || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Email</span>
            <span className="font-medium text-text-primary">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Signed in with</span>
            <span className="font-medium text-text-primary">{authProviderLabel}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-text-secondary">Member Since</span>
            <span className="font-medium text-text-primary">
              {profile?.createdAt instanceof Date
                ? profile.createdAt.toLocaleDateString()
                : profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : 'Unknown'}
            </span>
          </div>
        </div>
      </Card>

      <Card className="shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <AtSign className="w-5 h-5 text-text-secondary" />
          Change Username
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Usernames can only be changed once per week. Use 3–24 characters (letters, numbers, underscores, hyphens).
        </p>
        <form onSubmit={handleUsernameChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">New Username</label>
            <Input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={profile?.username ? `Current: ${profile.username}` : 'Enter new username'}
              {...(!isAdmin && {
                minLength: 3,
                maxLength: 24,
                pattern: '[a-zA-Z0-9_-]+',
                title: 'Letters, numbers, underscores, and hyphens only',
              })}
            />
          </div>

          {usernameMessage && (
            <Alert variant={usernameMessage.type === 'success' ? 'success' : 'danger'}>
              {usernameMessage.text}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={usernameChanging || !newUsername.trim() || (!isAdmin && newUsername.trim().length < 3)}
            isLoading={usernameChanging}
          >
            Update Username
          </Button>
        </form>
      </Card>

      {canChangeEmailPassword && (
        <Card className="shadow-md p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-text-secondary" />
            Change Email
          </h2>

          <form onSubmit={handleEmailChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">New Email Address</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="Enter new email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Current Password</label>
              <Input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
            </div>

            {emailMessage && (
              <Alert variant={emailMessage.type === 'success' ? 'success' : 'danger'}>
                {emailMessage.text}
              </Alert>
            )}

            <Button
              type="submit"
              disabled={emailChanging || !newEmail || !emailPassword}
              isLoading={emailChanging}
            >
              Update Email
            </Button>
          </form>
        </Card>
      )}

      {canChangeEmailPassword && (
        <Card className="shadow-md p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-text-secondary" />
            Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Confirm new password"
              />
            </div>

            {passwordMessage && (
              <Alert variant={passwordMessage.type === 'success' ? 'success' : 'danger'}>
                {passwordMessage.text}
              </Alert>
            )}

            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={passwordChanging || !currentPassword || !newPassword || !confirmPassword}
                isLoading={passwordChanging}
              >
                Update Password
              </Button>
              <Button type="button" variant="link" onClick={handleSendResetEmail}>
                Send password reset email instead
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!canChangeEmailPassword && (
        <Card className="shadow-md p-6">
          <p className="text-text-secondary text-sm">
            You signed in with {authProviderLabel}. Email and password cannot be changed here. To update your
            email, use your {authProviderLabel} account settings.
          </p>
        </Card>
      )}

      <Card className="shadow-md p-6 border-2 border-danger-200 dark:border-danger-700/50">
        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>

        <p className="text-text-secondary mb-4">
          Deleting your account is permanent and cannot be undone. All your characters, creations, and data will be
          permanently deleted.
        </p>

        {!showDeleteConfirm ? (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </Button>
        ) : (
          <div className="bg-danger-50 dark:bg-danger-900/30 rounded-lg p-4 space-y-4">
            <p className="text-sm text-danger-700 dark:text-danger-400 font-medium">
              {canChangeEmailPassword
                ? 'To confirm deletion, enter your password and type DELETE below:'
                : 'To confirm deletion, type DELETE below:'}
            </p>
            {canChangeEmailPassword && (
              <div>
                <label className="block text-sm font-medium text-danger-700 dark:text-danger-400 mb-1">Password</label>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="border-danger-300 focus:ring-danger-500"
                  placeholder="Enter your password"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-danger-700 dark:text-danger-400 mb-1">Type DELETE to confirm</label>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="border-danger-300 focus:ring-danger-500"
                placeholder="DELETE"
              />
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-danger-light text-danger-fg text-sm">{deleteError}</div>
            )}

            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={
                  deleting ||
                  deleteConfirmText !== 'DELETE' ||
                  (canChangeEmailPassword && !deletePassword)
                }
                isLoading={deleting}
              >
                Permanently Delete Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ImageUploadModal
        isOpen={showPictureModal}
        onClose={() => setShowPictureModal(false)}
        onConfirm={handleProfilePictureUpload}
        onChooseFromLibrary={() => setShowPictureBank(true)}
        cropShape="round"
        aspect={1}
        title="Upload Profile Picture"
      />
      <RealmsImagePicker
        isOpen={showPictureBank}
        onClose={() => setShowPictureBank(false)}
        onSelect={({ image }) => { void handleBankProfilePicture(image.publicUrl); }}
        categories="portrait"
        allowAdminUpload={false}
        title="Choose Profile Picture"
        description="Pick species or creature art from the Realms Image Library."
      />
    </PageContainer>
  );
}

export default function MyAccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}

function formatRoleLabel(role: UserProfile['role'] | undefined): string {
  if (!role) return 'Unknown';
  if (role === 'new_player') return 'New Player';
  if (role === 'playtester') return 'Playtester';
  if (role === 'developer') return 'Developer';
  if (role === 'admin') return 'Admin';
  return role;
}
