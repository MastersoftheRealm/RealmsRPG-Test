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
    <div className="rounded-xl border border-border-light bg-surface p-6 mb-6">
      <h2 className="font-semibold text-text-primary mb-2 flex items-center gap-1">
        Invite Code
      </h2>
      <p className="text-sm text-text-secondary mb-3">
        Share this code with players so they can join your campaign.
        {isCampaignFull && ' (Campaign is full. No new players can join until someone leaves.)'}
      </p>
      <div className="flex items-center gap-3">
        <code className="px-4 py-2 bg-surface-alt rounded-lg font-mono text-xl font-bold tracking-widest text-primary-subtle-fg">
          {inviteCode}
        </code>
        <Button variant="secondary" size="sm" onClick={onCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
