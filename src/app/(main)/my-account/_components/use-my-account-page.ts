/**
 * My Account page state + handlers (TASK-666)
 * ============================================
 * Co-located hook for the account facade — presentation lives in sibling sections.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiUpload, getErrorMessage } from '@/lib/api-client';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { changeUsernameAction, deleteAccountAction } from '@/app/(auth)/actions';
import { useAuthStore } from '@/stores';
import { useAdmin, useAccountProfile } from '@/hooks';
import { fileFromCroppedBlob } from '@/lib/crop-image';
import { areTutorialsEnabled, setTutorialsEnabled } from '@/lib/onboarding-preferences';
import {
  hasPasswordProvider,
  getAuthProviderLabel,
  type AccountMessage,
} from './account-helpers';

export function useMyAccountPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();

  const canChangeEmailPassword = useMemo(() => hasPasswordProvider(user), [user]);
  const authProviderLabel = useMemo(() => getAuthProviderLabel(user), [user]);

  const {
    profile,
    loading,
    loadError: profileLoadError,
    retrying: profileRetrying,
    refetch: refetchProfile,
    patchProfile,
  } = useAccountProfile(user);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailMessage, setEmailMessage] = useState<AccountMessage | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<AccountMessage | null>(null);

  const [showPictureModal, setShowPictureModal] = useState(false);
  const [showPictureBank, setShowPictureBank] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureMessage, setPictureMessage] = useState<AccountMessage | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [usernameChanging, setUsernameChanging] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<AccountMessage | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [tutorialsEnabled, setTutorialsEnabledState] = useState(() => areTutorialsEnabled());
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleProfilePictureUpload = async (blob: Blob) => {
    if (!user) return;
    setUploadingPicture(true);
    setPictureMessage(null);
    try {
      const file = fileFromCroppedBlob(blob, 'profile');
      const formData = new FormData();
      formData.append('file', file);

      const { url } = await apiUpload<{ url: string }>('/api/upload/profile-picture', formData);
      // Cache-bust so Header + this page share the new image (same path is overwritten in storage)
      patchProfile({ photoURL: `${url}?t=${Date.now()}` });
      // Sync to Supabase Auth so any useAuth() consumer sees the new picture
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
      patchProfile({ photoURL: `${url}?t=${Date.now()}` });
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
      patchProfile({ username: newUsername.trim() });
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
      patchProfile({ email: newEmail });
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
      setPasswordMessage({
        type: 'error',
        text: getAuthErrorMessage(err, 'update-password'),
      });
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
      setDeleteError(getAuthErrorMessage(err, 'delete-account'));
      setDeleting(false);
    }
  };

  const cancelDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteError(null);
  };

  const handleTutorialsChange = (next: boolean) => {
    setTutorialsEnabledState(next);
    setTutorialsEnabled(next);
  };

  return {
    loading,
    profile,
    profileLoadError,
    profileRetrying,
    refetchProfile,
    isAdmin,
    canChangeEmailPassword,
    authProviderLabel,

    newEmail,
    setNewEmail,
    emailPassword,
    setEmailPassword,
    emailChanging,
    emailMessage,
    handleEmailChange,

    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordChanging,
    passwordMessage,
    handlePasswordChange,
    handleSendResetEmail,

    showPictureModal,
    setShowPictureModal,
    showPictureBank,
    setShowPictureBank,
    uploadingPicture,
    pictureMessage,
    handleProfilePictureUpload,
    handleBankProfilePicture,

    newUsername,
    setNewUsername,
    usernameChanging,
    usernameMessage,
    handleUsernameChange,

    showDeleteConfirm,
    setShowDeleteConfirm,
    deletePassword,
    setDeletePassword,
    deleteConfirmText,
    setDeleteConfirmText,
    deleting,
    deleteError,
    handleDeleteAccount,
    cancelDeleteConfirm,

    tutorialsEnabled,
    handleTutorialsChange,
  };
}

export type MyAccountPageModel = ReturnType<typeof useMyAccountPage>;
