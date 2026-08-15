/**
 * Email / password change cards + OAuth notice (TASK-666)
 */

'use client';

import { Mail, Lock } from 'lucide-react';
import { Alert, Button, Card, Input } from '@/components/ui';
import type { AccountMessage } from './account-helpers';

type EmailProps = {
  newEmail: string;
  setNewEmail: (v: string) => void;
  emailPassword: string;
  setEmailPassword: (v: string) => void;
  emailChanging: boolean;
  emailMessage: AccountMessage | null;
  onSubmit: (e: React.FormEvent) => void;
};

export function AccountEmailCard({
  newEmail,
  setNewEmail,
  emailPassword,
  setEmailPassword,
  emailChanging,
  emailMessage,
  onSubmit,
}: EmailProps) {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
        <Mail className="h-5 w-5 text-text-secondary" />
        Change Email
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="account-new-email"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            New Email Address
          </label>
          <Input
            id="account-new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="Enter new email"
          />
        </div>
        <div>
          <label
            htmlFor="account-email-password"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Current Password
          </label>
          <Input
            id="account-email-password"
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
  );
}

type PasswordProps = {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordChanging: boolean;
  passwordMessage: AccountMessage | null;
  onSubmit: (e: React.FormEvent) => void;
  onSendResetEmail: () => void;
};

export function AccountPasswordCard({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordChanging,
  passwordMessage,
  onSubmit,
  onSendResetEmail,
}: PasswordProps) {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
        <Lock className="h-5 w-5 text-text-secondary" />
        Change Password
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="account-current-password"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Current Password
          </label>
          <Input
            id="account-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label
            htmlFor="account-new-password"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            New Password
          </label>
          <Input
            id="account-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label
            htmlFor="account-confirm-password"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Confirm New Password
          </label>
          <Input
            id="account-confirm-password"
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button
            type="submit"
            disabled={passwordChanging || !currentPassword || !newPassword || !confirmPassword}
            isLoading={passwordChanging}
          >
            Update Password
          </Button>
          <Button type="button" variant="link" onClick={onSendResetEmail}>
            Send password reset email instead
          </Button>
        </div>
      </form>
    </Card>
  );
}

type OauthProps = {
  authProviderLabel: string;
};

export function AccountOauthNoticeCard({ authProviderLabel }: OauthProps) {
  return (
    <Card className="p-6 shadow-md">
      <p className="text-sm text-text-secondary">
        You signed in with {authProviderLabel}. Email and password cannot be changed here. To update
        your email, use your {authProviderLabel} account settings.
      </p>
    </Card>
  );
}
