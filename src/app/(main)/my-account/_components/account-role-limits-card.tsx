/**
 * Role & Limits card (TASK-666)
 */

'use client';

import type { AccountProfile } from '@/hooks';
import { Card } from '@/components/ui';
import { formatRoleLabel } from '@/lib/role-quota-messages';

type Props = {
  profile: AccountProfile | null;
};

export function AccountRoleLimitsCard({ profile }: Props) {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-3 text-lg font-bold text-text-primary">Role &amp; Limits</h2>
      <p className="mb-4 text-text-secondary">
        Your role controls quotas for campaigns, characters, and custom library items.
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-border-subtle py-2">
          <span className="text-text-secondary">Role</span>
          <span className="font-medium text-text-primary">{formatRoleLabel(profile?.role)}</span>
        </div>

        {profile?.rolePolicy ? (
          <>
            <div className="flex items-center justify-between border-b border-border-subtle py-2">
              <span className="text-text-secondary">Max Campaigns</span>
              <span className="font-medium text-text-primary">
                {profile.rolePolicy.maxCampaigns}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border-subtle py-2">
              <span className="text-text-secondary">Max Players Per Campaign</span>
              <span className="font-medium text-text-primary">
                {profile.rolePolicy.maxPlayersPerCampaign}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border-subtle py-2">
              <span className="text-text-secondary">Max Characters</span>
              <span className="font-medium text-text-primary">
                {profile.rolePolicy.maxCharacters}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border-subtle py-2">
              <span className="text-text-secondary">Max Custom Powers</span>
              <span className="font-medium text-text-primary">{profile.rolePolicy.maxPowers}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border-subtle py-2">
              <span className="text-text-secondary">Max Custom Techniques</span>
              <span className="font-medium text-text-primary">
                {profile.rolePolicy.maxTechniques}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border-subtle py-2">
              <span className="text-text-secondary">Max Custom Armaments</span>
              <span className="font-medium text-text-primary">
                {profile.rolePolicy.maxArmaments}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border-subtle py-2">
              <span className="text-text-secondary">Max Custom Creatures</span>
              <span className="font-medium text-text-primary">
                {profile.rolePolicy.maxCreatures}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">Profile Picture Uploads</span>
              <span className="font-medium text-text-primary">
                {profile.rolePolicy.canUploadProfilePicture ? 'Allowed' : 'Not allowed'}
              </span>
            </div>
          </>
        ) : (
          <p className="text-text-muted italic">Limits unavailable.</p>
        )}
      </div>
    </Card>
  );
}
