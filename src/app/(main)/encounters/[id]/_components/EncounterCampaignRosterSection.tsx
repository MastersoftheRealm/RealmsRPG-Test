'use client';

import { Button } from '@/components/ui';
import type { Encounter } from '@/types/encounter';
import type { Campaign } from '@/types/campaign';

export interface EncounterCampaignRosterSectionProps {
  selectId: string;
  encounter: Encounter;
  setEncounter: React.Dispatch<React.SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  linkedCampaign: Campaign | undefined;
  availableCampaignCharacterCount: number;
  addingAllChars: boolean;
  onAddAllCampaignCharacters: () => void;
  /** Combat encounter disables add-all while the tracker is active; skill does not. */
  disableAddAllWhenActive?: boolean;
  onOpenAddModal: () => void;
}

export function EncounterCampaignRosterSection({
  selectId,
  encounter,
  setEncounter,
  campaignsFull,
  linkedCampaign,
  availableCampaignCharacterCount,
  addingAllChars,
  onAddAllCampaignCharacters,
  disableAddAllWhenActive = false,
  onOpenAddModal,
}: EncounterCampaignRosterSectionProps) {
  const addAllDisabled =
    addingAllChars ||
    availableCampaignCharacterCount === 0 ||
    (disableAddAllWhenActive && encounter.isActive);

  return (
    <>
      <div className="mb-4 space-y-2">
        <label htmlFor={selectId} className="block text-sm font-medium text-text-secondary">
          Campaign
        </label>
        <select
          id={selectId}
          value={encounter.campaignId ?? ''}
          onChange={(e) => {
            const id = e.target.value || undefined;
            setEncounter((prev) => (prev ? { ...prev, campaignId: id } : prev));
          }}
          className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary"
        >
          <option value="">No campaign</option>
          {campaignsFull.map((c: Campaign) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {linkedCampaign && (linkedCampaign.characters?.length ?? 0) > 0 && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={onAddAllCampaignCharacters}
            disabled={addAllDisabled}
          >
            {addingAllChars
              ? 'Adding…'
              : availableCampaignCharacterCount === 0
                ? 'All Characters Added'
                : `Add all Characters (${availableCampaignCharacterCount})`}
          </Button>
        )}
      </div>
      <Button variant="secondary" className="mb-4 w-full" onClick={onOpenAddModal}>
        From Library / Campaign
      </Button>
    </>
  );
}
