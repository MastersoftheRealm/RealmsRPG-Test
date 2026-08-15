/**
 * Tutorials preference + username change cards (TASK-666)
 */

'use client';

import { AtSign } from 'lucide-react';
import type { AccountProfile } from '@/hooks';
import { Alert, Button, Card, Checkbox, Input } from '@/components/ui';
import { ONBOARDING_COPY } from '@/lib/constants/copy/onboarding-copy';
import type { AccountMessage } from './account-helpers';

type TutorialsProps = {
  tutorialsEnabled: boolean;
  onTutorialsChange: (next: boolean) => void;
};

export function AccountTutorialsCard({ tutorialsEnabled, onTutorialsChange }: TutorialsProps) {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-2 text-lg font-bold text-text-primary">
        {ONBOARDING_COPY.account.tutorialsTitle}
      </h2>
      <p className="mb-4 text-sm text-text-secondary">
        {ONBOARDING_COPY.account.tutorialsDescription}
      </p>
      <Checkbox
        id="account-tutorials-enabled"
        checked={tutorialsEnabled}
        label={ONBOARDING_COPY.account.tutorialsLabel}
        onChange={(e) => onTutorialsChange(e.target.checked)}
      />
    </Card>
  );
}

type UsernameProps = {
  profile: AccountProfile | null;
  isAdmin: boolean;
  newUsername: string;
  setNewUsername: (v: string) => void;
  usernameChanging: boolean;
  usernameMessage: AccountMessage | null;
  onSubmit: (e: React.FormEvent) => void;
};

export function AccountUsernameCard({
  profile,
  isAdmin,
  newUsername,
  setNewUsername,
  usernameChanging,
  usernameMessage,
  onSubmit,
}: UsernameProps) {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
        <AtSign className="h-5 w-5 text-text-secondary" />
        Change Username
      </h2>
      <p className="mb-4 text-sm text-text-secondary">
        Usernames can only be changed once per week. Use 3–24 characters (letters, numbers,
        underscores, hyphens).
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="account-new-username"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            New Username
          </label>
          <Input
            id="account-new-username"
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
          disabled={
            usernameChanging || !newUsername.trim() || (!isAdmin && newUsername.trim().length < 3)
          }
          isLoading={usernameChanging}
        >
          Update Username
        </Button>
      </form>
    </Card>
  );
}
