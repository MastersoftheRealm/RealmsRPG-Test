/**
 * Campaign invite code section — RM only (TASK-666c)
 */

'use client';

import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui';

export function CampaignInviteSection({
  inviteCode,
  isCampaignFull,
  copied,
  onCopy,
}: {
  inviteCode: string;
  isCampaignFull: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mb-6 rounded-xl border border-border-light bg-surface p-6">
      <h2 className="mb-2 flex items-center gap-1 font-semibold text-text-primary">Invite Code</h2>
      <p className="mb-3 text-sm text-text-secondary">
        Share this code with players so they can join your campaign.
        {isCampaignFull && ' (Campaign is full. No new players can join until someone leaves.)'}
      </p>
      <div className="flex items-center gap-3">
        <code className="rounded-lg bg-surface-alt px-4 py-2 font-mono text-xl font-bold tracking-widest text-primary-subtle-fg">
          {inviteCode}
        </code>
        <Button variant="secondary" size="sm" onClick={onCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
