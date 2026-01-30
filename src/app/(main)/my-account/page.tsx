/**
 * My Account Page
 * ===============
 * User profile and account settings page.
 * Allows viewing/editing user info, changing email/password, and account management.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  updateEmail, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useAuthStore } from '@/stores';
import { ProtectedRoute } from '@/components/layout';
import { LoadingState, Button, Input, Alert, PageContainer } from '@/components/ui';
import { User, Mail, Lock, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface UserProfile {
  username?: string;
  email?: string;
  createdAt?: Date;
}

function AccountContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  
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
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [user]);

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
          <User className="w-8 h-8 text-primary-600" />
          My Account
        </h1>
        <p className="text-text-secondary mt-2">Manage your profile and account settings</p>
      </div>

      {/* Profile Info */}
      <div className="bg-surface rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Profile Information</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Username</span>
            <span className="font-medium text-text-primary">{profile?.username || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-text-secondary">Email</span>
            <span className="font-medium text-text-primary">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-text-secondary">Member Since</span>
            <span className="font-medium text-text-primary">
              {profile?.createdAt?.toLocaleDateString() || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Email */}
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

      {/* Change Password */}
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
