/** @vitest-environment happy-dom */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { applySheetEnergyPointsChange } from '@/lib/character/current-follows-max';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import { pickDirtyCharacterFields } from '@/lib/character/dirty-patch';
import { HealthEnergyAllocator } from './health-energy-allocator';
import { DEFAULT_ABILITIES } from '@/types';
import type { Character } from '@/types';

function Harness({
  initial,
  onAfterChange,
}: {
  initial: Character;
  onAfterChange?: (next: Character) => void;
}) {
  const [character, setCharacter] = useState(initial);
  const handleEnergyPointsChange = useCallback(
    (value: number) => {
      setCharacter((prev) => {
        const next = applySheetEnergyPointsChange(prev, value);
        onAfterChange?.(next);
        return next;
      });
    },
    [onAfterChange],
  );

  return (
    <HealthEnergyAllocator
      hpBonus={character.healthPoints ?? 0}
      energyBonus={character.energyPoints ?? 0}
      poolTotal={36}
      maxHp={20}
      maxEnergy={16}
      onHpChange={() => {}}
      onEnergyChange={handleEnergyPointsChange}
      variant="inline"
      enableHoldRepeat
    />
  );
}

describe('HealthEnergyAllocator Add EN points', () => {
  it('updates energyPoints through the sheet resource handler path', async () => {
    const user = userEvent.setup();
    const initial = {
      id: 'c1',
      name: 'Hero',
      level: 4,
      abilities: { ...DEFAULT_ABILITIES, acuity: 2 },
      archetype: { type: 'power' },
      pow_abil: 'acuity',
      pow_prof: 1,
      mart_prof: 0,
      healthPoints: 0,
      energyPoints: 0,
      currentHealth: 20,
      currentEnergy: 6,
    } as Character;

    let latest = initial;
    render(
      <Harness
        initial={initial}
        onAfterChange={(next) => {
          latest = next;
        }}
      />,
    );

    const addEn = screen.getByTitle('Add EN points');
    await act(async () => {
      await user.click(addEn);
    });

    expect(latest.energyPoints).toBe(1);

    const baseline = cleanForSave(initial) as Record<string, unknown>;
    const dirty = pickDirtyCharacterFields(
      cleanForSave(latest) as Record<string, unknown>,
      baseline,
    );
    expect(dirty.energyPoints).toBe(1);
  });
});
