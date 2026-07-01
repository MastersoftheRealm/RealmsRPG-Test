'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui';
import { HealthEnergyAllocator } from '@/components/creator';
import { useGameRules, usePowerParts, useTechniqueParts, useOfficialLibrary } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { calculateMaxHealth, calculateMaxEnergy } from '@/lib/game/calculations';
import { calculateHealthEnergyPool } from '@/lib/game/formulas';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const copy = GUIDED_CREATOR_COPY.steps.reveal.healthEnergy;

export function GuidedHealthEnergySection() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { rules } = useGameRules();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');
  const { data: officialTechniques = [] } = useOfficialLibrary('techniques');
  const autoApplied = useRef(false);

  const level = 1;
  const abilities = draft.abilities;
  const powAbil = draft.pow_abil ?? undefined;
  const martAbil = draft.mart_abil ?? undefined;

  const baseHealth = calculateMaxHealth(
    0,
    abilities.vitality || 0,
    level,
    powAbil,
    abilities,
    rules,
    martAbil
  );
  const baseEnergy = calculateMaxEnergy(0, powAbil || martAbil, abilities, level);
  const hePool = calculateHealthEnergyPool(level, 'PLAYER', false, rules);

  const hpBonus = draft.hpAllocated ?? 0;
  const enBonus = draft.energyAllocated ?? 0;
  const spent = hpBonus + enBonus;
  const remaining = hePool - spent;

  const maxHp = calculateMaxHealth(
    hpBonus,
    abilities.vitality || 0,
    level,
    powAbil,
    abilities,
    rules,
    martAbil
  );
  const maxEnergy = calculateMaxEnergy(enBonus, powAbil || martAbil, abilities, level);

  const highestEnergyCost = useMemo(() => {
    let max = 0;
    const powerById = new Map(officialPowers.map((p) => [String(p.id), p]));
    const techniqueById = new Map(officialTechniques.map((t) => [String(t.id), t]));

    draft.powerIds.forEach((id) => {
      const raw = powerById.get(String(id));
      if (!raw) return;
      try {
        const doc: PowerDocument = {
          name: String(raw.name ?? ''),
          description: String(raw.description ?? ''),
          parts: Array.isArray(raw.parts) ? (raw.parts as PowerDocument['parts']) : [],
        };
        const disp = derivePowerDisplay(doc, powerPartsDb);
        if (typeof disp.energy === 'number') max = Math.max(max, disp.energy);
      } catch {
        // ignore invalid power
      }
    });

    draft.techniqueIds.forEach((id) => {
      const raw = techniqueById.get(String(id));
      if (!raw) return;
      try {
        const doc: TechniqueDocument = {
          name: String(raw.name ?? ''),
          description: String(raw.description ?? ''),
          parts: Array.isArray(raw.parts) ? (raw.parts as TechniqueDocument['parts']) : [],
        };
        const disp = deriveTechniqueDisplay(doc, techniquePartsDb);
        if (typeof disp.energy === 'number') max = Math.max(max, disp.energy);
      } catch {
        // ignore invalid technique
      }
    });

    return max;
  }, [draft.powerIds, draft.techniqueIds, officialPowers, officialTechniques, powerPartsDb, techniquePartsDb]);

  const onAutoAllocate = useCallback(() => {
    const maxAchievableEN = baseEnergy + hePool;
    const targetEN = Math.min(highestEnergyCost, maxAchievableEN);
    const energyBonusNeeded = Math.max(0, targetEN - baseEnergy);
    const energyBonusFinal = Math.min(hePool, energyBonusNeeded);
    const hpBonusFinal = hePool - energyBonusFinal;
    updateDraft({ hpAllocated: hpBonusFinal, energyAllocated: energyBonusFinal });
  }, [baseEnergy, hePool, highestEnergyCost, updateDraft]);

  useEffect(() => {
    if (autoApplied.current) return;
    if (draft.hpAllocated !== null || draft.energyAllocated !== null) return;
    autoApplied.current = true;
    onAutoAllocate();
  }, [draft.hpAllocated, draft.energyAllocated, onAutoAllocate]);

  return (
    <div className="rounded-card border border-border-light bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold text-text-primary">{copy.title}</h3>
        <p className="mt-1 font-nunito text-sm text-text-secondary">{copy.description}</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-nunito text-xs text-text-muted dark:text-text-secondary">
          {copy.baseStats(baseHealth, baseEnergy)}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAutoAllocate}
          aria-label={copy.autoAllocateAria}
          className="min-h-11"
        >
          {copy.autoAllocate}
        </Button>
      </div>

      {highestEnergyCost > 0 && (
        <p className="mb-3 font-nunito text-sm text-text-secondary">
          {copy.highestCostHint(highestEnergyCost)}
        </p>
      )}

      <HealthEnergyAllocator
        hpBonus={hpBonus}
        energyBonus={enBonus}
        poolTotal={hePool}
        maxHp={maxHp}
        maxEnergy={maxEnergy}
        onHpChange={(v) => updateDraft({ hpAllocated: v })}
        onEnergyChange={(v) => updateDraft({ energyAllocated: v })}
        enableHoldRepeat
      />

      {remaining !== 0 && (
        <p className="mt-3 font-nunito text-sm text-text-secondary">{copy.allocateHint(remaining)}</p>
      )}
    </div>
  );
}
