/**
 * My Account page state + handlers (TASK-666)
 * ============================================
 * Co-located hook for the account facade — presentation lives in sibling sections.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiFetch, apiUpload, getErrorMessage } from '@/lib/api-client';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import {
  changeAccountEmailAction,
  changeAccountPasswordAction,
  changeUsernameAction,
  deleteAccountAction,
  setProfilePhotoFromLibraryAction,
} from '@/app/(auth)/actions';
import { useAuthStore } from '@/stores';
import { useAdmin, useAccountProfile } from '@/hooks';
import { fileFromCroppedBlob } from '@/lib/crop-image';
import { areTutorialsEnabled, setTutorialsEnabled } from '@/lib/onboarding-preferences';
import { OAUTH_DELETE_REAUTH_REQUIRED } from '@/lib/auth/oauth-delete-reauth';
import { hasPasswordProvider, getAuthProviderLabel, type AccountMessage } from './account-helpers';

const MY_ACCOUNT_DELETE_REAUTH_PATH = '/my-account?deleteReauth=1';

export function useMyAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [needsGoogleReauthForDelete, setNeedsGoogleReauthForDelete] = useState(false);
  const deleteReauthReturn = searchParams.get('deleteReauth') === '1';
  const effectiveShowDeleteConfirm = showDeleteConfirm || deleteReauthReturn;

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
      const { error: authSyncError } = await supabase.auth.updateUser({
        data: { avatar_url: url },
      });
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

  const handleProfilePictureRemove = async () => {
    if (!user || !profile?.photoURL) return;
    setUploadingPicture(true);
    setPictureMessage(null);
    try {
      await apiFetch<void>('/api/upload/profile-picture', { method: 'DELETE' });
      const supabase = createClient();
      const { error: authSyncError } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });
      if (authSyncError) {
        setPictureMessage({
          type: 'error',
          text: 'Picture removed, but account avatar sync failed. Refresh or try again.',
        });
        return;
      }
      patchProfile({ photoURL: '' });
      setPictureMessage({ type: 'success', text: 'Profile picture removed.' });
    } catch (err: unknown) {
      setPictureMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to remove profile picture'),
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
      const result = await setProfilePhotoFromLibraryAction(url);
      if (!result.success) {
        setPictureMessage({ type: 'error', text: result.error });
        return;
      }
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: result.photoUrl },
      });
      if (authError) throw authError;
      patchProfile({ photoURL: `${result.photoUrl}?t=${Date.now()}` });
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
      const result = await changeAccountEmailAction(newEmail, emailPassword);
      if (!result.success) throw new Error(result.error);
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
      const result = await changeAccountPasswordAction(currentPassword, newPassword);
      if (!result.success) throw new Error(result.error);
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
      const result = await deleteAccountAction(
        canChangeEmailPassword
          ? { currentPassword: deletePassword }
          : { deleteConfirm: deleteConfirmText },
      );
      if (!result.success) {
        if (result.error === OAUTH_DELETE_REAUTH_REQUIRED) {
          setNeedsGoogleReauthForDelete(true);
        }
        throw new Error(result.error ?? 'Failed to delete account');
      }
      router.push('/');
    } catch (err: unknown) {
      setDeleteError(getAuthErrorMessage(err, 'delete-account'));
      setDeleting(false);
    }
  };

  const handleGoogleReauthForDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(MY_ACCOUNT_DELETE_REAUTH_PATH)}`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('Failed to start Google sign-in');
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
    setNeedsGoogleReauthForDelete(false);
    if (deleteReauthReturn) {
      router.replace('/my-account', { scroll: false });
    }
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
    handleProfilePictureRemove,
    handleBankProfilePicture,

    newUsername,
    setNewUsername,
    usernameChanging,
    usernameMessage,
    handleUsernameChange,

    showDeleteConfirm: effectiveShowDeleteConfirm,
    setShowDeleteConfirm,
    deletePassword,
    setDeletePassword,
    deleteConfirmText,
    setDeleteConfirmText,
    deleting,
    deleteError,
    needsGoogleReauthForDelete,
    handleGoogleReauthForDelete,
    handleDeleteAccount,
    cancelDeleteConfirm,

    tutorialsEnabled,
    handleTutorialsChange,
  };
}
