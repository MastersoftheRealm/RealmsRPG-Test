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
      <div className="rounded-xl border border-border-light bg-surface p-6 mb-6">
        <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent-500" />
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
                className="flex flex-col items-center justify-center w-20 h-24 rounded-lg border-2 border-dashed border-border-light hover:border-primary-outline-border hover:bg-primary-subtle-bg dark:hover:bg-surface transition-colors text-text-muted dark:text-text-secondary"
              >
                <UserPlus className="w-6 h-6" />
                <span className="text-xs mt-1">Add</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {canAddOwnCharacters ? (
              <Button variant="outline" onClick={onAddClick}>
                <UserPlus className="w-4 h-4" />
                Add Your Characters
              </Button>
            ) : (
              <p className="text-text-muted dark:text-text-secondary text-sm">No characters added yet.</p>
            )}
          </div>
        )}
      </div>

      {otherCharacters.length > 0 && (
        <div className="rounded-xl border border-border-light bg-surface p-6 mb-6">
          <h2 className="font-semibold text-text-primary mb-3">Players</h2>
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
