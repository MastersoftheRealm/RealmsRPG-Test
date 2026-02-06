/**
 * My Account Page
 * ===============
 * User profile and account settings page.
 * Allows viewing/editing user info, changing email/password, and account management.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  updateEmail, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { changeUsernameAction } from '@/app/(auth)/actions';
import { auth, db, storage } from '@/lib/firebase/client';
import { useAuthStore } from '@/stores';
import { ProtectedRoute } from '@/components/layout';
import { LoadingState, Button, Input, Alert, PageContainer } from '@/components/ui';
import { ImageUploadModal } from '@/components/shared';
import { User as UserIcon, Mail, Lock, Trash2, AlertTriangle, AtSign, Camera } from 'lucide-react';

/** Returns whether the user signed in with email/password (can change email/password) */
function hasPasswordProvider(firebaseUser: User | null): boolean {
  if (!firebaseUser?.providerData?.length) return false;
  return firebaseUser.providerData.some(
    (p) => p.providerId === 'password'
  );
}

/** Human-readable auth provider label */
function getAuthProviderLabel(firebaseUser: User | null): string {
  if (!firebaseUser?.providerData?.length) return 'Unknown';
  const provider = firebaseUser.providerData[0]?.providerId;
  if (provider === 'google.com') return 'Google';
  if (provider === 'apple.com') return 'Apple';
  if (provider === 'password') return 'Email/Password';
  return provider?.replace('.com', '') ?? 'Unknown';
}

interface UserProfile {
  username?: string;
  email?: string;
  createdAt?: Date;
  photoURL?: string;
}

function AccountContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const canChangeEmailPassword = useMemo(() => hasPasswordProvider(user), [user]);
  const authProviderLabel = useMemo(() => getAuthProviderLabel(user), [user]);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile picture state
  const [showPictureModal, setShowPictureModal] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureMessage, setPictureMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Username change state
  const [newUsername, setNewUsername] = useState('');
  const [usernameChanging, setUsernameChanging] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        
        setProfile({
          username: data?.username,
          email: user.email || undefined,
          createdAt: data?.createdAt?.toDate?.() || undefined,
          photoURL: data?.photoURL || user.photoURL || undefined,
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [user]);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (blob: Blob) => {
    if (!user || !storage) return;
    setUploadingPicture(true);
    setPictureMessage(null);
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const downloadUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadUrl });
      setProfile((prev) => (prev ? { ...prev, photoURL: downloadUrl } : null));
      setPictureMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err) {
      console.error('Profile picture upload error:', err);
      setPictureMessage({ type: 'error', text: 'Failed to upload profile picture' });
    } finally {
      setUploadingPicture(false);
    }
  };

  // Handle username change
  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    
    setUsernameChanging(true);
    setUsernameMessage(null);
    
    const result = await changeUsernameAction(newUsername.trim());
    
    if (result.success) {
      setProfile((prev) => (prev ? { ...prev, username: newUsername.trim().toLowerCase() } : null));
      setNewUsername('');
      setUsernameMessage({ type: 'success', text: 'Username updated successfully!' });
    } else {
      setUsernameMessage({ type: 'error', text: result.error ?? 'Failed to change username' });
    }
    setUsernameChanging(false);
  };

  // Handle email change
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    setEmailChanging(true);
    setEmailMessage(null);
    
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, emailPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, newEmail);
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), { email: newEmail });
      
      setProfile(prev => prev ? { ...prev, email: newEmail } : null);
      setNewEmail('');
      setEmailPassword('');
      setEmailMessage({ type: 'success', text: 'Email updated successfully!' });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let message = 'Failed to update email';
      if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'Email already in use';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      setEmailMessage({ type: 'error', text: message });
    } finally {
      setEmailChanging(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
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
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let message = 'Failed to update password';
      if (error.code === 'auth/wrong-password') {
        message = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak';
      }
      setPasswordMessage({ type: 'error', text: message });
    } finally {
      setPasswordChanging(false);
    }
  };

  // Handle password reset email
  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPasswordMessage({ type: 'success', text: 'Password reset email sent!' });
    } catch {
      setPasswordMessage({ type: 'error', text: 'Failed to send reset email' });
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;
    if (deleteConfirmText !== 'DELETE') return;
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      // Delete character subcollection
      const charsRef = collection(db, 'users', user.uid, 'character');
      const charsSnapshot = await getDocs(charsRef);
      for (const charDoc of charsSnapshot.docs) {
        await deleteDoc(charDoc.ref);
      }
      
      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete username mapping if exists
      if (profile?.username) {
        await deleteDoc(doc(db, 'usernames', profile.username));
      }
      
      // Delete Firebase Auth user
      await deleteUser(user);
      
      router.push('/');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let message = 'Failed to delete account';
      if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      }
      setDeleteError(message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer size="xs" padded={false}>
        <LoadingState message="Loading account..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xs" padded={false} className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <UserIcon className="w-8 h-8 text-primary-600" />
          My Account
        </h1>
        <p className="text-text-secondary mt-2">Manage your profile and account settings</p>
      </div>

      {/* Profile Info */}
      <div className="bg-surface rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Profile Information</h2>
        
        {/* Profile Picture */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border-subtle">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-alt border-2 border-border-light flex-shrink-0">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <UserIcon className="w-8 h-8" />
              </div>
            )}
            {uploadingPicture && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPictureModal(true)}
              disabled={uploadingPicture}
            >
              <Camera className="w-4 h-4" />
              {profile?.photoURL ? 'Change Picture' : 'Add Picture'}
            </Button>
            <p className="text-xs text-text-muted mt-1">JPG, PNG, GIF, or WebP. Max 5MB.</p>
            {pictureMessage && (
              <p className={`text-xs mt-1 ${pictureMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
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
              {profile?.createdAt?.toLocaleDateString() || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Username */}
      <div className="bg-surface rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <AtSign className="w-5 h-5 text-text-secondary" />
          Change Username
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Usernames can only be changed once per week. Use 3–24 characters (letters, numbers, underscores, hyphens).
        </p>
        <form onSubmit={handleUsernameChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              New Username
            </label>
            <Input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={profile?.username ? `Current: ${profile.username}` : 'Enter new username'}
              minLength={3}
              maxLength={24}
              pattern="[-a-zA-Z0-9_]+"
              title="Letters, numbers, underscores, and hyphens only"
            />
          </div>
          
          {usernameMessage && (
            <Alert variant={usernameMessage.type === 'success' ? 'success' : 'danger'}>
              {usernameMessage.text}
            </Alert>
          )}
          
          <Button
            type="submit"
            disabled={usernameChanging || !newUsername.trim() || newUsername.trim().length < 3}
            isLoading={usernameChanging}
          >
            Update Username
          </Button>
        </form>
      </div>

      {/* Change Email - only for email/password users */}
      {canChangeEmailPassword && (
      <div className="bg-surface rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-text-secondary" />
          Change Email
        </h2>
        
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              New Email Address
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="Enter new email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Current Password
            </label>
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
      </div>
      )}

      {/* Change Password - only for email/password users */}
      {canChangeEmailPassword && (
      <div className="bg-surface rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-text-secondary" />
          Change Password
        </h2>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Current Password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              New Password
            </label>
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
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Confirm New Password
            </label>
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
            <Button
              type="button"
              variant="link"
              onClick={handleSendResetEmail}
            >
              Send password reset email instead
            </Button>
          </div>
        </form>
      </div>
      )}

      {/* OAuth users: show info that email/password can't be changed */}
      {!canChangeEmailPassword && (
      <div className="bg-surface rounded-xl shadow-md p-6 border border-border-light">
        <p className="text-text-secondary text-sm">
          You signed in with {authProviderLabel}. Email and password cannot be changed here. 
          To update your email, use your {authProviderLabel} account settings.
        </p>
      </div>
      )}

      {/* Danger Zone */}
      <div className="bg-surface rounded-xl shadow-md p-6 border-2 border-red-200">
        <h2 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        
        <p className="text-text-secondary mb-4">
          Deleting your account is permanent and cannot be undone. All your characters, 
          creations, and data will be permanently deleted.
        </p>
        
        {!showDeleteConfirm ? (
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </Button>
        ) : (
          <div className="bg-red-50 rounded-lg p-4 space-y-4">
            <p className="text-sm text-red-700 font-medium">
              To confirm deletion, enter your password and type DELETE below:
            </p>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="border-red-300 focus:ring-red-500"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Type DELETE to confirm
              </label>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="border-red-300 focus:ring-red-500"
                placeholder="DELETE"
              />
            </div>
            
            {deleteError && (
              <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE' || !deletePassword}
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
      </div>

      {/* Profile Picture Upload Modal */}
      <ImageUploadModal
        isOpen={showPictureModal}
        onClose={() => setShowPictureModal(false)}
        onConfirm={handleProfilePictureUpload}
        cropShape="round"
        aspect={1}
        title="Upload Profile Picture"
      />
    </PageContainer>
  );
}

export default function MyAccountPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-8 px-4">
        <AccountContent />
      </div>
    </ProtectedRoute>
  );
}
