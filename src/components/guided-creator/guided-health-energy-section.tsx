'use client';

import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui';
import { HealthEnergyAllocator } from '@/components/creator';
import { InfoTippy } from '@/components/shared';
import {
  useGameRules,
  usePowerParts,
  useTechniqueParts,
  useOfficialLibrary,
  useUserPowers,
  useUserTechniques,
} from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { calculateMaxHealth, calculateMaxEnergyForArchetype } from '@/lib/game/calculations';
import { allocateHealthEnergyPool, calculateHealthEnergyPool } from '@/lib/game/formulas';
import { findHighestEnergyCostPick } from '@/lib/guided-creator/power-technique-display';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { getGuidedAutoAllocateHelp } from '../../../public/tooltip-text';
import { GuidedSectionTitle } from './guided-section-title';
import type { LibraryPower, LibraryTechnique } from '@/types/library';

const copy = GUIDED_CREATOR_COPY.steps.reveal.healthEnergy;

export function GuidedHealthEnergySection() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { rules } = useGameRules();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');
  const { data: officialTechniques = [] } = useOfficialLibrary('techniques');
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();

  const level = 1;
  const abilities = draft.abilities;
  const powAbil = draft.pow_abil ?? undefined;
  const martAbil = draft.mart_abil ?? undefined;

  const baseEnergy = calculateMaxEnergyForArchetype(0, abilities, level, powAbil, martAbil);
  const hePool = calculateHealthEnergyPool(level, 'PLAYER', false, rules);

  const hpBonus = draft.hpAllocated ?? 0;
  const enBonus = draft.energyAllocated ?? 0;
  const remaining = hePool - (hpBonus + enBonus);

  const maxHp = calculateMaxHealth(
    hpBonus,
    abilities.vitality || 0,
    level,
    powAbil,
    abilities,
    rules,
    martAbil,
  );
  const maxEnergy = calculateMaxEnergyForArchetype(enBonus, abilities, level, powAbil, martAbil);

  const highestPick = useMemo(
    () =>
      findHighestEnergyCostPick({
        powerIds: [...draft.powerIds, ...draft.innatePowerIds],
        techniqueIds: draft.techniqueIds,
        powers: [...officialPowers, ...userPowers] as LibraryPower[],
        techniques: [...officialTechniques, ...userTechniques] as LibraryTechnique[],
        powerPartsDb,
        techniquePartsDb,
      }),
    [
      draft.powerIds,
      draft.innatePowerIds,
      draft.techniqueIds,
      officialPowers,
      officialTechniques,
      userPowers,
      userTechniques,
      powerPartsDb,
      techniquePartsDb,
    ],
  );

  const onAutoAllocate = useCallback(() => {
    const { hpBonus: hpBonusFinal, energyBonus: energyBonusFinal } = allocateHealthEnergyPool({
      baseEnergy,
      pool: hePool,
      highestEnergyCost: highestPick?.energy ?? 0,
    });
    updateDraft({ hpAllocated: hpBonusFinal, energyAllocated: energyBonusFinal });
  }, [baseEnergy, hePool, highestPick?.energy, updateDraft]);

  const autoAllocateHelp = getGuidedAutoAllocateHelp(
    highestPick
      ? { name: highestPick.name, energy: highestPick.energy, kind: highestPick.kind }
      : undefined,
  );

  return (
    <div className="rounded-card border border-border-light bg-surface p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <GuidedSectionTitle>{copy.title}</GuidedSectionTitle>
          <p className="mt-1 font-nunito text-sm text-text-secondary">{copy.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
          <InfoTippy content={autoAllocateHelp} label="How auto-allocate works" size="inline" />
        </div>
      </div>

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
        <p className="mt-3 font-nunito text-sm text-text-secondary">
          {copy.allocateHint(remaining)}
        </p>
      )}
    </div>
  );
}
