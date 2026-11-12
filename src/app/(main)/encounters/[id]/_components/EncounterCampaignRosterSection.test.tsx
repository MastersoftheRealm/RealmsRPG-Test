// @vitest-environment happy-dom
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultEncounter } from '@/types/encounter';
import type { Campaign } from '@/types/campaign';
import { EncounterCampaignRosterSection } from './EncounterCampaignRosterSection';

describe('EncounterCampaignRosterSection', () => {
  const campaigns: Campaign[] = [
    {
      id: 'camp-1',
      name: 'Linked',
      characters: [{ characterId: 'ch-1', name: 'Hero' }],
    } as unknown as Campaign,
  ];

  const baseEncounter = {
    ...createDefaultEncounter('combat', 'Fight'),
    id: 'enc-1',
    campaignId: 'camp-1',
    isActive: true,
  };

  it('disables add-all while combat is active when disableAddAllWhenActive is set', () => {
    const onAddAll = vi.fn();
    const { container } = render(
      <EncounterCampaignRosterSection
        selectId="campaign-select"
        encounter={baseEncounter}
        setEncounter={vi.fn()}
        campaignsFull={campaigns}
        linkedCampaign={campaigns[0]}
        availableCampaignCharacterCount={1}
        addingAllChars={false}
        onAddAllCampaignCharacters={onAddAll}
        disableAddAllWhenActive
        onOpenAddModal={vi.fn()}
      />,
    );
    const addAll = container.querySelector('button') as HTMLButtonElement;
    expect(addAll.disabled).toBe(true);
    fireEvent.click(addAll);
    expect(onAddAll).not.toHaveBeenCalled();
  });
});
