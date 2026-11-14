// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';
import { CreatureCreatorMovementSection } from './creature-creator-movement-section';
import { CreatureCreatorSensesSection } from './creature-creator-senses-section';
import { movementAfterBuiltInMode } from './creature-movement';
import { sensesAfterBuiltInLevel } from './creature-senses';
import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';

const movementCatalog: CodexCreatureFeat[] = [
  {
    id: String(CREATURE_FEAT_IDS.FLYING),
    name: 'Flying',
    description: '',
    points: 2,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.FLYING_II),
    name: 'Fly',
    description: 'Fly at full regular speed.',
    points: 3,
    feat_lvl: 2,
    base_feat_id: String(CREATURE_FEAT_IDS.FLYING),
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.SWIMMING),
    name: 'Swimming',
    description: '',
    points: 0.5,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
  {
    id: String(CREATURE_FEAT_IDS.BURROW),
    name: 'Burrow',
    description: '',
    points: 1,
    feat_lvl: 1,
    mechanic: true,
    category: 'Movement',
  },
];

const senseCatalog: CodexCreatureFeat[] = [
  {
    id: String(CREATURE_FEAT_IDS.DARKVISION),
    name: 'Darkvision',
    description: 'Sees in darkness out to 6 spaces.',
    points: 1,
    feat_lvl: 1,
    mechanic: true,
    category: 'Senses',
  },
  {
    id: String(CREATURE_FEAT_IDS.DARKVISION_II),
    name: 'Darkvision II',
    description: 'Sees in darkness out to 12 spaces.',
    points: 2,
    feat_lvl: 2,
    base_feat_id: String(CREATURE_FEAT_IDS.DARKVISION),
    mechanic: true,
    category: 'Senses',
  },
];

describe('CreatureCreatorMovementSection UI', () => {
  it('does not render add-plus or movement feat dropdown controls', () => {
    render(
      <CreatureCreatorMovementSection
        creature={initialState}
        walkSpeed={6}
        catalog={movementCatalog}
        updateCreature={vi.fn()}
      />,
    );
    expect(screen.queryByPlaceholderText(/add movement feat/i)).toBeNull();
    expect(screen.queryByTitle('Add flying speed')).toBeNull();
    expect(screen.queryByTitle('Add swimming speed')).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Flying' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Swimming' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Burrow' })).toBeTruthy();
  });

  it('disables minus on flying, swimming, and burrow steppers at tier 1', () => {
    let creature = initialState;
    for (const kind of ['fly', 'swim', 'burrow'] as const) {
      creature = { ...creature, ...movementAfterBuiltInMode(creature, kind, 1, movementCatalog) };
    }
    const updateCreature = vi.fn((updates) => {
      creature = { ...creature, ...updates };
    });

    const { rerender } = render(
      <CreatureCreatorMovementSection
        creature={creature}
        walkSpeed={6}
        catalog={movementCatalog}
        updateCreature={updateCreature}
      />,
    );

    expect(screen.getByTitle('Decrease Flying Speed')).toHaveProperty('disabled', true);
    expect(screen.getByTitle('Decrease Swimming Speed')).toHaveProperty('disabled', true);
    expect(screen.getByTitle('Decrease Burrow Speed')).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByTitle('Decrease Flying Speed'));
    rerender(
      <CreatureCreatorMovementSection
        creature={creature}
        walkSpeed={6}
        catalog={movementCatalog}
        updateCreature={updateCreature}
      />,
    );
    expect(updateCreature).not.toHaveBeenCalled();
  });
});

describe('CreatureCreatorSensesSection UI', () => {
  it('does not render a sequential add-plus control', () => {
    render(
      <CreatureCreatorSensesSection
        creature={initialState}
        catalog={senseCatalog}
        updateCreature={vi.fn()}
      />,
    );
    expect(screen.queryByTitle(/Add Darkvision/i)).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Darkvision' })).toBeTruthy();
  });

  it('disables minus on an active sense stepper at tier 1', () => {
    const stepped = sensesAfterBuiltInLevel(initialState, 'darkvision', 1, senseCatalog);
    const updateCreature = vi.fn();

    render(
      <CreatureCreatorSensesSection
        creature={{ ...initialState, ...stepped }}
        catalog={senseCatalog}
        updateCreature={updateCreature}
      />,
    );

    const decrease = screen.getByTitle('Decrease Darkvision');
    expect(decrease).toHaveProperty('disabled', true);
    fireEvent.click(decrease);
    expect(updateCreature).not.toHaveBeenCalled();
  });
});
