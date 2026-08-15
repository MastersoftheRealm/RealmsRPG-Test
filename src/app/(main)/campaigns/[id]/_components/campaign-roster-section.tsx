/**
 * Campaign roster — Realm Master + players (TASK-666c)
 */

'use client';

import { Crown, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui';
import type { CampaignCharacter } from '@/types/campaign';
import { CharacterChip } from './character-chip';

export function CampaignRosterSection({
  campaignId,
  ownerUsername,
  ownerCharacters,
  otherCharacters,
  isRealmMaster,
  currentUserId,
  canAddOwnCharacters,
  onAddClick,
  onRemoveClick,
}: {
  campaignId: string;
  ownerUsername?: string;
  ownerCharacters: CampaignCharacter[];
  otherCharacters: CampaignCharacter[];
  isRealmMaster: boolean;
  currentUserId?: string;
  canAddOwnCharacters: boolean;
  onAddClick: () => void;
  onRemoveClick: (c: CampaignCharacter) => void;
}) {
  return (
    <>
      <div className="mb-6 rounded-xl border border-border-light bg-surface p-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
          <Crown className="h-5 w-5 text-accent-500" />
          Realm Master: {ownerUsername || 'Unknown'}
        </h2>
        {ownerCharacters.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {ownerCharacters.map((c) => (
              <CharacterChip
                key={`${c.userId}-${c.characterId}`}
                character={c}
                isOwner={true}
                canRemove={isRealmMaster}
                onRemove={() => onRemoveClick(c)}
              />
            ))}
            {canAddOwnCharacters && (
              <button
                type="button"
                onClick={onAddClick}
                className="flex h-24 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-light text-text-muted transition-colors hover:border-primary-outline-border hover:bg-primary-subtle-bg dark:hover:bg-surface"
              >
                <UserPlus className="h-6 w-6" />
                <span className="mt-1 text-xs">Add</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {canAddOwnCharacters ? (
              <Button variant="outline" onClick={onAddClick}>
                <UserPlus className="h-4 w-4" />
                Add Your Characters
              </Button>
            ) : (
              <p className="text-sm text-text-muted">No characters added yet.</p>
            )}
          </div>
        )}
      </div>

      {otherCharacters.length > 0 && (
        <div className="mb-6 rounded-xl border border-border-light bg-surface p-6">
          <h2 className="mb-3 font-semibold text-text-primary">Players</h2>
          <div className="flex flex-wrap gap-4">
            {otherCharacters.map((c) => (
              <CharacterChip
                key={`${c.userId}-${c.characterId}`}
                character={c}
                isOwner={false}
                canRemove={isRealmMaster || c.userId === currentUserId}
                onRemove={() => onRemoveClick(c)}
                onViewSheet={
                  isRealmMaster
                    ? `/campaigns/${campaignId}/view/${c.userId}/${c.characterId}`
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
