// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createDefaultEncounter } from '@/types/encounter';
import { CombatAddSidebar } from './combat-add-sidebar';
import { createEmptyNewCombatantForm } from './combat-encounter-helpers';

let rosterProps: Record<string, unknown> | null = null;

vi.mock('../EncounterCampaignRosterSection', () => ({
  EncounterCampaignRosterSection: (props: Record<string, unknown>) => {
    rosterProps = props;
    return <div data-testid="roster-section" />;
  },
}));

afterEach(() => {
  rosterProps = null;
});

describe('CombatAddSidebar roster gate', () => {
  it('locks add-all during active combat via disableAddAllWhenActive', () => {
    const encounter = {
      ...createDefaultEncounter('combat', 'Fight'),
      id: 'enc-c',
      isActive: true,
      combatants: [],
    };
    render(
      <CombatAddSidebar
        encounter={encounter}
        setEncounter={vi.fn()}
        campaignsFull={[]}
        linkedCampaign={undefined}
        availableCampaignCharacterCount={2}
        addingAllChars={false}
        newCombatant={createEmptyNewCombatantForm()}
        setNewCombatant={vi.fn()}
        onOpenAddModal={vi.fn()}
        onAddAllCampaignCharacters={vi.fn()}
        onAddCombatant={vi.fn()}
      />,
    );
    expect(rosterProps?.disableAddAllWhenActive).toBe(true);
  });
});
