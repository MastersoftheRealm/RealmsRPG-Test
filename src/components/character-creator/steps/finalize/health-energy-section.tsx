'use client';

import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui';
import { InfoTippy } from '@/components/shared';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { usePowerParts, useTechniqueParts, useGameRules } from '@/hooks';
import { calculateMaxHealth, calculateMaxEnergy } from '@/lib/game/calculations';
import { allocateHealthEnergyPool, calculateHealthEnergyPool } from '@/lib/game/formulas';
import { HealthEnergyAllocator } from '@/components/creator';
import { findHighestEnergyCostPick } from '@/lib/guided-creator/power-technique-display';
import { getGuidedAutoAllocateHelp } from '../../../../../public/tooltip-text';
import type { LibraryPower, LibraryTechnique } from '@/types/library';

/**
 * Health & Energy Allocation Section
 * Uses the shared HealthEnergyAllocator component for consistent UX
 * across character creator, character sheet, and creature creator.
 * Auto-allocate button sets energy to match highest power/technique cost (if possible), rest to health.
 */
export function HealthEnergyAllocationSection() {
  const { draft, updateDraft } = useCharacterCreatorStore();
  const { rules } = useGameRules();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const abilities = draft.abilities || { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 };
  const level = draft.level || 1;
  const powAbil = draft.pow_abil || draft.archetype?.pow_abil || draft.archetype?.ability;
  const martAbil = draft.mart_abil || draft.archetype?.mart_abil;

  const baseHealth = calculateMaxHealth(0, abilities.vitality || 0, level, powAbil, abilities, rules, martAbil);
  const baseEnergy = calculateMaxEnergy(0, powAbil || martAbil, abilities, level);

  const hePool = calculateHealthEnergyPool(level, 'PLAYER', false, rules);

  const hpBonus = draft.healthPoints || 0;
  const enBonus = draft.energyPoints || 0;

  const maxHp = calculateMaxHealth(hpBonus, abilities.vitality || 0, level, powAbil, abilities, rules, martAbil);
  const maxEnergy = calculateMaxEnergy(enBonus, powAbil || martAbil, abilities, level);

  const highestPick = useMemo(
    () =>
      findHighestEnergyCostPick({
        powers: (draft.powers || []) as unknown as LibraryPower[],
        techniques: (draft.techniques || []) as unknown as LibraryTechnique[],
        powerPartsDb,
        techniquePartsDb,
      }),
    [draft.powers, draft.techniques, powerPartsDb, techniquePartsDb]
  );

  const onAutoAllocate = useCallback(() => {
    const { hpBonus: hpBonusFinal, energyBonus: energyBonusFinal } = allocateHealthEnergyPool({
      baseEnergy,
      pool: hePool,
      highestEnergyCost: highestPick?.energy ?? 0,
    });
    updateDraft({ healthPoints: hpBonusFinal, energyPoints: energyBonusFinal });
  }, [baseEnergy, hePool, highestPick?.energy, updateDraft]);

  const autoAllocateHelp = getGuidedAutoAllocateHelp(
    highestPick
      ? { name: highestPick.name, energy: highestPick.energy, kind: highestPick.kind }
      : undefined
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs text-text-muted dark:text-text-secondary">
          Base Health: {baseHealth} | Base Energy: {baseEnergy}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAutoAllocate}
            aria-label="Auto-allocate points so max energy matches highest power or technique cost, rest to health"
            className="min-h-11"
          >
            Auto-allocate to match highest cost
          </Button>
          <InfoTippy
            content={autoAllocateHelp}
            label="How auto-allocate works"
            size="inline"
          />
        </div>
      </div>
      <HealthEnergyAllocator
        hpBonus={hpBonus}
        energyBonus={enBonus}
        poolTotal={hePool}
        maxHp={maxHp}
        maxEnergy={maxEnergy}
        onHpChange={(val) => updateDraft({ healthPoints: val })}
        onEnergyChange={(val) => updateDraft({ energyPoints: val })}
        enableHoldRepeat
      />
    </div>
  );
}
