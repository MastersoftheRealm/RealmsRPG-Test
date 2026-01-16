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
import { cn } from '@/lib/utils';
import { User, Mail, Lock, Trash2, AlertTriangle, Check, X, Loader2 } from 'lucide-react';

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
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <User className="w-8 h-8 text-primary-600" />
          My Account
        </h1>
        <p className="text-gray-600 mt-2">Manage your profile and account settings</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Username</span>
            <span className="font-medium text-gray-900">{profile?.username || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Email</span>
            <span className="font-medium text-gray-900">{profile?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Member Since</span>
            <span className="font-medium text-gray-900">
              {profile?.createdAt?.toLocaleDateString() || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Email */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-gray-600" />
          Change Email
        </h2>
        
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter new email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter current password"
            />
          </div>
          
          {emailMessage && (
            <div className={cn(
              'p-3 rounded-lg text-sm flex items-center gap-2',
              emailMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              {emailMessage.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {emailMessage.text}
            </div>
          )}
          
          <button
            type="submit"
            disabled={emailChanging || !newEmail || !emailPassword}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {emailChanging && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Email
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-600" />
          Change Password
        </h2>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Confirm new password"
            />
          </div>
          
          {passwordMessage && (
            <div className={cn(
              'p-3 rounded-lg text-sm flex items-center gap-2',
              passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              {passwordMessage.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {passwordMessage.text}
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={passwordChanging || !currentPassword || !newPassword || !confirmPassword}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {passwordChanging && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
            <button
              type="button"
              onClick={handleSendResetEmail}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              Send password reset email instead
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-md p-6 border-2 border-red-200">
        <h2 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        
        <p className="text-gray-600 mb-4">
          Deleting your account is permanent and cannot be undone. All your characters, 
          creations, and data will be permanently deleted.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </button>
        ) : (
          <div className="bg-red-50 rounded-lg p-4 space-y-4">
            <p className="text-sm text-red-700 font-medium">
              To confirm deletion, enter your password and type DELETE below:
            </p>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="DELETE"
              />
            </div>
            
            {deleteError && (
              <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE' || !deletePassword}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Permanently Delete Account
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyAccountPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <AccountContent />
      </div>
    </ProtectedRoute>
  );
}
