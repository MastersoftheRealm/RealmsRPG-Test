'use client';

import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { usePowerParts, useTechniqueParts, useGameRules } from '@/hooks';
import { calculateMaxHealth, calculateMaxEnergy } from '@/lib/game/calculations';
import { calculateHealthEnergyPool } from '@/lib/game/formulas';
import { HealthEnergyAllocator } from '@/components/creator';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import type { CharacterPower, CharacterTechnique } from '@/types';

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
  
  // Calculate base values using centralized calculations
  const abilities = draft.abilities || { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 };
  const level = draft.level || 1;
  const powAbil = draft.pow_abil || draft.archetype?.pow_abil || draft.archetype?.ability;
  const martAbil = draft.mart_abil || draft.archetype?.mart_abil;
  
  // Base = max with 0 allocation; used for display
  const baseHealth = calculateMaxHealth(0, abilities.vitality || 0, level, powAbil, abilities, rules, martAbil);
  const baseEnergy = calculateMaxEnergy(0, powAbil || martAbil, abilities, level);
  
  const hePool = calculateHealthEnergyPool(level, 'PLAYER', false, rules);
  
  // Now using bonus values (stored directly)
  const hpBonus = draft.healthPoints || 0;
  const enBonus = draft.energyPoints || 0;
  
  // Calculated max values for display
  const maxHp = calculateMaxHealth(hpBonus, abilities.vitality || 0, level, powAbil, abilities, rules, martAbil);
  const maxEnergy = calculateMaxEnergy(enBonus, powAbil || martAbil, abilities, level);
  
  // Highest energy cost among powers and techniques (for auto-allocate)
  const highestEnergyCost = useMemo(() => {
    let max = 0;
    const powers = (draft.powers || []) as CharacterPower[];
    const techniques = (draft.techniques || []) as CharacterTechnique[];
    powers.forEach((p) => {
      try {
        const disp = derivePowerDisplay(p as unknown as PowerDocument, powerPartsDb);
        if (typeof disp.energy === 'number') max = Math.max(max, disp.energy);
      } catch {
        // ignore invalid power
      }
    });
    techniques.forEach((t) => {
      try {
        const disp = deriveTechniqueDisplay(t as unknown as TechniqueDocument, techniquePartsDb);
        if (typeof disp.energy === 'number') max = Math.max(max, disp.energy);
      } catch {
        // ignore invalid technique
      }
    });
    return max;
  }, [draft.powers, draft.techniques, powerPartsDb, techniquePartsDb]);
  
  const onAutoAllocate = useCallback(() => {
    // Target max EN = highest power/technique cost, capped by what the pool can provide
    const maxAchievableEN = baseEnergy + hePool;
    const targetEN = Math.min(highestEnergyCost, maxAchievableEN);
    const energyBonusNeeded = Math.max(0, targetEN - baseEnergy);
    const energyBonusFinal = Math.min(hePool, energyBonusNeeded);
    const hpBonusFinal = hePool - energyBonusFinal;
    updateDraft({ healthPoints: hpBonusFinal, energyPoints: energyBonusFinal });
  }, [baseEnergy, hePool, highestEnergyCost, updateDraft]);
  
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs text-text-muted dark:text-text-secondary">
          Base Health: {baseHealth} | Base Energy: {baseEnergy}
        </p>
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
