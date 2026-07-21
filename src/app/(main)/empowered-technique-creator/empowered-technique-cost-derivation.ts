/**
 * Empowered Technique Creator — cost derivation (TASK-610)
 * Payload assembly, section costs, advanced calc rows, and display summaries.
 */

'use client';

import { useMemo } from 'react';
import type { PowerPart, TechniquePart } from '@/hooks';
import { findByIdOrName, PART_IDS } from '@/lib/id-constants';
import {
  buildMechanicParts,
  calculatePowerCosts,
  calculateTechniqueCosts,
  calculateEmpoweredTechniqueCosts,
  computePowerActionTypeFromSelection,
  deriveRange,
  deriveArea,
  deriveDuration,
  type PowerPartPayload,
  type TechniquePartPayload,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import type { AttackMode } from '@/lib/attack-mode';
import type {
  EmpoweredDamageConfig as DamageConfig,
  EmpoweredRangeConfig as RangeConfig,
  SelectedPowerPart,
  SelectedTechniquePart,
} from './empowered-technique-bootstrap';

export type EmpoweredAdvancedCalcRow = {
  label: string;
  value: string;
};

export type EmpoweredSectionCostSlice = {
  energyRaw: number;
  totalTP: number;
};

export type EmpoweredSectionCosts = {
  action: EmpoweredSectionCostSlice;
  weapon: EmpoweredSectionCostSlice;
  range: EmpoweredSectionCostSlice;
  area: EmpoweredSectionCostSlice;
  duration: EmpoweredSectionCostSlice;
  powerDamage: EmpoweredSectionCostSlice;
  powerParts: EmpoweredSectionCostSlice;
  powerMechanics: EmpoweredSectionCostSlice;
  techniqueParts: EmpoweredSectionCostSlice;
  techniqueDamage: EmpoweredSectionCostSlice;
};

type UseEmpoweredTechniqueCostDerivationArgs = {
  actionType: string;
  isReaction: boolean;
  powerDamages: DamageConfig[];
  techniqueDamage: { amount: number; size: number };
  range: RangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  attackMode: AttackMode;
  selectedPowerParts: SelectedPowerPart[];
  selectedPowerAdvancedParts: SelectedPowerPart[];
  selectedTechniqueParts: SelectedTechniquePart[];
  powerParts: PowerPart[];
  techniqueParts: TechniquePart[];
};

export function useEmpoweredTechniqueCostDerivation({
  actionType,
  isReaction,
  powerDamages,
  techniqueDamage,
  range,
  area,
  duration,
  attackMode,
  selectedPowerParts,
  selectedPowerAdvancedParts,
  selectedTechniqueParts,
  powerParts,
  techniqueParts,
}: UseEmpoweredTechniqueCostDerivationArgs) {
  const powerMechanicParts = useMemo(
    () =>
      buildMechanicParts({
        creatorType: 'power',
        partsDb: powerParts,
        action: { type: actionType, isReaction },
        powerDamage: powerDamages.map((damage) => ({
          type: damage.type,
          diceAmount: damage.amount,
          dieSize: damage.size,
          applyDuration: damage.applyDuration ?? false,
        })),
        range: { steps: range.steps },
        area:
          area.type !== 'none'
            ? { type: area.type, level: area.level, applyDuration: area.applyDuration ?? false }
            : undefined,
        duration:
          duration.type !== 'instant'
            ? {
                type: duration.type,
                value: duration.value,
                applyDuration: duration.applyDuration ?? false,
                focus: duration.focus,
                noHarm: duration.noHarm,
                endsOnActivation: duration.endsOnActivation,
                sustain: duration.sustain,
              }
            : undefined,
      }),
    [actionType, area, duration, isReaction, powerDamages, powerParts, range.steps],
  );

  const techniqueDamageMechanicParts = useMemo(
    () =>
      buildMechanicParts({
        creatorType: 'technique',
        partsDb: techniqueParts,
        techniqueDamage:
          techniqueDamage.amount > 0
            ? { diceAmount: techniqueDamage.amount, dieSize: techniqueDamage.size }
            : undefined,
      }),
    [techniqueDamage, techniqueParts],
  );

  const addWeaponToPowerPart = useMemo(() => {
    if (attackMode !== 'weapon') return null;
    const part = findByIdOrName(powerParts, {
      id: PART_IDS.ADD_WEAPON_TO_POWER,
      name: 'Add Weapon to Power',
    });
    if (!part) return null;
    return {
      id: part.id,
      name: part.name,
      op_1_lvl: 0,
      op_2_lvl: 0,
      op_3_lvl: 0,
      applyDuration: false,
    };
  }, [powerParts, attackMode]);

  const powerPayload: PowerPartPayload[] = useMemo(
    () => [
      ...selectedPowerParts.map((selected) => ({
        part: selected.part,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
        applyDuration: selected.applyDuration,
      })),
      ...selectedPowerAdvancedParts.map((selected) => ({
        part: selected.part,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
        applyDuration: selected.applyDuration,
      })),
      ...powerMechanicParts,
      ...(addWeaponToPowerPart ? [addWeaponToPowerPart] : []),
    ],
    [addWeaponToPowerPart, powerMechanicParts, selectedPowerAdvancedParts, selectedPowerParts],
  );

  const techniquePayload: TechniquePartPayload[] = useMemo(
    () => [
      ...selectedTechniqueParts.map((selected) => ({
        part: selected.part,
        id: Number(selected.part.id),
        name: selected.part.name,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
      })),
      ...techniqueDamageMechanicParts.map((part) => ({
        id: Number(part.id),
        name: part.name,
        op_1_lvl: part.op_1_lvl,
        op_2_lvl: part.op_2_lvl,
        op_3_lvl: part.op_3_lvl,
      })),
    ],
    [selectedTechniqueParts, techniqueDamageMechanicParts],
  );

  const costs = useMemo(
    () =>
      calculateEmpoweredTechniqueCosts({
        powerPartsPayload: powerPayload,
        techniquePartsPayload: techniquePayload,
        powerPartsDb: powerParts,
        techniquePartsDb: techniqueParts,
      }),
    [powerPayload, powerParts, techniquePayload, techniqueParts],
  );

  const powerBaseCosts = useMemo(
    () => calculatePowerCosts(powerPayload, powerParts),
    [powerPayload, powerParts],
  );
  const techniqueBaseCosts = useMemo(
    () => calculateTechniqueCosts(techniquePayload, techniqueParts),
    [techniquePayload, techniqueParts],
  );

  const advancedCalcRows = useMemo((): EmpoweredAdvancedCalcRow[] => {
    const powerRawBeforeMultiplier = powerBaseCosts.energyRaw;
    const techniqueRaw = techniqueBaseCosts.energyRaw;
    const techniqueMultiplier = costs.techniquePercentageMultiplier;
    const adjustedPowerRaw = powerRawBeforeMultiplier * techniqueMultiplier;
    const combinedRaw = adjustedPowerRaw + techniqueRaw;
    return [
      {
        label: 'Power side: energy (raw, before technique %)',
        value: powerRawBeforeMultiplier.toFixed(2),
      },
      {
        label: 'Technique % multiplier',
        value: techniqueMultiplier.toFixed(3),
      },
      {
        label: 'Power side: energy (adjusted)',
        value: `${powerRawBeforeMultiplier.toFixed(2)} × ${techniqueMultiplier.toFixed(3)} = ${adjustedPowerRaw.toFixed(2)}`,
      },
      {
        label: 'Technique side: energy (raw)',
        value: techniqueRaw.toFixed(2),
      },
      {
        label: 'Combined energy (raw)',
        value: `${adjustedPowerRaw.toFixed(2)} + ${techniqueRaw.toFixed(2)} = ${combinedRaw.toFixed(2)}`,
      },
      {
        label: 'Energy (final)',
        value: `ceil(${combinedRaw.toFixed(2)}) = ${costs.totalEnergy}`,
      },
      {
        label: 'Training points (power side)',
        value: String(powerBaseCosts.totalTP),
      },
      {
        label: 'Training points (technique side)',
        value: String(techniqueBaseCosts.totalTP),
      },
      {
        label: 'Training points (final)',
        value: `${powerBaseCosts.totalTP} + ${techniqueBaseCosts.totalTP} = ${costs.totalTP}`,
      },
    ];
  }, [
    costs.techniquePercentageMultiplier,
    costs.totalEnergy,
    costs.totalTP,
    powerBaseCosts.energyRaw,
    powerBaseCosts.totalTP,
    techniqueBaseCosts.energyRaw,
    techniqueBaseCosts.totalTP,
  ]);

  const sectionCosts = useMemo((): EmpoweredSectionCosts => {
    const actionPartNames = ['Power Reaction', 'Power Quick or Free Action', 'Power Long Action'];
    const rangePartNames = ['Power Range'];
    const areaPartNames = [
      'Sphere of Effect',
      'Cylinder of Effect',
      'Cone of Effect',
      'Line of Effect',
      'Trail of Effect',
    ];
    const durationPartNames = [
      'Duration (Round)',
      'Duration (Minute)',
      'Duration (Hour)',
      'Duration (Days)',
      'Duration (Permanent)',
      'Focus for Duration',
      'No Harm or Adaptation for Duration',
      'Duration Ends On Activation',
      'Sustain for Duration',
    ];
    const powerDamageNames = [
      'Magic Damage',
      'Light Damage',
      'Elemental Damage',
      'Poison or Necrotic Damage',
      'Sonic Damage',
      'Spiritual Damage',
      'Psychic Damage',
      'Physical Damage',
      'Power Split Damage Dice',
    ];

    const actionParts = powerMechanicParts.filter((part) => actionPartNames.includes(part.name));
    const rangeParts = powerMechanicParts.filter((part) => rangePartNames.includes(part.name));
    const areaParts = powerMechanicParts.filter((part) => areaPartNames.includes(part.name));
    const durationParts = powerMechanicParts.filter((part) => durationPartNames.includes(part.name));
    const powerDamageParts = powerMechanicParts.filter((part) => powerDamageNames.includes(part.name));
    const techniqueDamageParts: TechniquePartPayload[] = techniqueDamageMechanicParts.map((part) => ({
      id: Number(part.id),
      name: part.name,
      op_1_lvl: part.op_1_lvl,
      op_2_lvl: part.op_2_lvl,
      op_3_lvl: part.op_3_lvl,
    }));

    return {
      action: calculatePowerCosts(actionParts, powerParts),
      weapon: calculatePowerCosts(addWeaponToPowerPart ? [addWeaponToPowerPart] : [], powerParts),
      range: calculatePowerCosts(rangeParts, powerParts),
      area: calculatePowerCosts(areaParts, powerParts),
      duration: calculatePowerCosts(durationParts, powerParts),
      powerDamage: calculatePowerCosts(powerDamageParts, powerParts),
      powerParts: calculatePowerCosts(
        selectedPowerParts.map((selected) => ({
          part: selected.part,
          op_1_lvl: selected.op_1_lvl,
          op_2_lvl: selected.op_2_lvl,
          op_3_lvl: selected.op_3_lvl,
          applyDuration: selected.applyDuration,
        })),
        powerParts,
      ),
      powerMechanics: calculatePowerCosts(
        selectedPowerAdvancedParts.map((selected) => ({
          part: selected.part,
          op_1_lvl: selected.op_1_lvl,
          op_2_lvl: selected.op_2_lvl,
          op_3_lvl: selected.op_3_lvl,
          applyDuration: selected.applyDuration,
        })),
        powerParts,
      ),
      techniqueParts: calculateTechniqueCosts(
        selectedTechniqueParts.map((selected) => ({
          part: selected.part,
          op_1_lvl: selected.op_1_lvl,
          op_2_lvl: selected.op_2_lvl,
          op_3_lvl: selected.op_3_lvl,
        })),
        techniqueParts,
      ),
      techniqueDamage: calculateTechniqueCosts(techniqueDamageParts, techniqueParts),
    };
  }, [
    addWeaponToPowerPart,
    powerMechanicParts,
    powerParts,
    selectedPowerAdvancedParts,
    selectedPowerParts,
    selectedTechniqueParts,
    techniqueDamageMechanicParts,
    techniqueParts,
  ]);

  const actionDisplay = useMemo(
    () => computePowerActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction],
  );
  const rangeDisplay = useMemo(() => deriveRange(powerPayload), [powerPayload]);
  const areaDisplay = useMemo(() => deriveArea(powerPayload), [powerPayload]);
  const durationDisplay = useMemo(() => deriveDuration(powerPayload), [powerPayload]);

  const powerDamageSummary = useMemo(() => {
    const rows = powerDamages.filter((damage) => damage.type !== 'none' && damage.amount > 0);
    if (rows.length === 0) return 'No damage';
    return rows.map((damage) => `${damage.amount}d${damage.size} ${damage.type}`).join(', ');
  }, [powerDamages]);

  const techniqueDamageSummary = useMemo(
    () => (techniqueDamage.amount > 0 ? `+${techniqueDamage.amount}d${techniqueDamage.size}` : 'None'),
    [techniqueDamage.amount, techniqueDamage.size],
  );

  return {
    powerMechanicParts,
    techniqueDamageMechanicParts,
    addWeaponToPowerPart,
    powerPayload,
    techniquePayload,
    costs,
    advancedCalcRows,
    sectionCosts,
    actionDisplay,
    rangeDisplay,
    areaDisplay,
    durationDisplay,
    powerDamageSummary,
    techniqueDamageSummary,
  };
}
