/**
 * Empowered Technique Creator — cost derivation (TASK-610, TASK-683)
 * Payload assembly, section costs, advanced calc rows, and display summaries.
 *
 * Attack-mode parts follow the empowered cheaper-EN overlap rule: when both
 * power and technique have a matching hard-tied part (e.g. Add Weapon), attach
 * the cheaper live `base_en`. No Weapon/Attack adds technique No Attack.
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
  pickCheaperEnPart,
  toEmpoweredAutoMechanicPart,
  analyzePowerEnergy,
  analyzeTechniqueEnergy,
  buildEmpoweredAdvancedCalculationGroups,
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

const emptySectionCost = (): EmpoweredSectionCostSlice => ({ energyRaw: 0, totalTP: 0 });

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

  /** Attack-mode auto parts: cheaper Add Weapon (power vs technique) or No Attack. */
  const attackModeParts = useMemo(() => {
    if (attackMode === 'weapon') {
      const powerWeapon = findByIdOrName(powerParts, {
        id: PART_IDS.ADD_WEAPON_TO_POWER,
        name: 'Add Weapon to Power',
      });
      const techniqueWeapon = findByIdOrName(techniqueParts, {
        id: PART_IDS.ADD_WEAPON_TO_TECHNIQUE,
        name: 'Add Weapon to Technique',
      });
      const picked = pickCheaperEnPart([
        powerWeapon ? { side: 'power' as const, part: powerWeapon } : null,
        techniqueWeapon ? { side: 'technique' as const, part: techniqueWeapon } : null,
      ]);
      if (!picked) {
        return { powerPart: null, techniquePart: null };
      }
      const row = toEmpoweredAutoMechanicPart(picked.part);
      return picked.side === 'power'
        ? { powerPart: row, techniquePart: null }
        : { powerPart: null, techniquePart: row };
    }

    if (attackMode === 'none') {
      const noAttack = findByIdOrName(techniqueParts, {
        id: PART_IDS.NO_ATTACK,
        name: 'No Attack',
      });
      if (!noAttack || !noAttack.mechanic) {
        return { powerPart: null, techniquePart: null };
      }
      return {
        powerPart: null,
        techniquePart: toEmpoweredAutoMechanicPart(noAttack),
      };
    }

    return { powerPart: null, techniquePart: null };
  }, [attackMode, powerParts, techniqueParts]);

  const attackModePowerPart = attackModeParts.powerPart;
  const attackModeTechniquePart = attackModeParts.techniquePart;

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
      ...(attackModePowerPart ? [attackModePowerPart] : []),
    ],
    [attackModePowerPart, powerMechanicParts, selectedPowerAdvancedParts, selectedPowerParts],
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
      ...(attackModeTechniquePart
        ? [
            {
              id: Number(attackModeTechniquePart.id),
              name: attackModeTechniquePart.name,
              op_1_lvl: attackModeTechniquePart.op_1_lvl,
              op_2_lvl: attackModeTechniquePart.op_2_lvl,
              op_3_lvl: attackModeTechniquePart.op_3_lvl,
            },
          ]
        : []),
    ],
    [attackModeTechniquePart, selectedTechniqueParts, techniqueDamageMechanicParts],
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

  const advancedCalcGroups = useMemo(
    () =>
      buildEmpoweredAdvancedCalculationGroups({
        powerAnalysis: analyzePowerEnergy(powerPayload, powerParts),
        techniqueAnalysis: analyzeTechniqueEnergy(techniquePayload, techniqueParts),
        techniquePercentageMultiplier: costs.techniquePercentageMultiplier,
        energyRaw: costs.energyRaw,
        totalEnergy: costs.totalEnergy,
      }),
    [
      costs.energyRaw,
      costs.techniquePercentageMultiplier,
      costs.totalEnergy,
      powerPayload,
      powerParts,
      techniquePayload,
      techniqueParts,
    ],
  );

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
    const durationParts = powerMechanicParts.filter((part) =>
      durationPartNames.includes(part.name),
    );
    const powerDamageParts = powerMechanicParts.filter((part) =>
      powerDamageNames.includes(part.name),
    );
    const techniqueDamageParts: TechniquePartPayload[] = techniqueDamageMechanicParts.map(
      (part) => ({
        id: Number(part.id),
        name: part.name,
        op_1_lvl: part.op_1_lvl,
        op_2_lvl: part.op_2_lvl,
        op_3_lvl: part.op_3_lvl,
      }),
    );

    let weaponCost: EmpoweredSectionCostSlice = emptySectionCost();
    if (attackModePowerPart) {
      weaponCost = calculatePowerCosts([attackModePowerPart], powerParts);
    } else if (attackModeTechniquePart) {
      weaponCost = calculateTechniqueCosts(
        [
          {
            id: Number(attackModeTechniquePart.id),
            name: attackModeTechniquePart.name,
            op_1_lvl: attackModeTechniquePart.op_1_lvl,
            op_2_lvl: attackModeTechniquePart.op_2_lvl,
            op_3_lvl: attackModeTechniquePart.op_3_lvl,
          },
        ],
        techniqueParts,
      );
    }

    return {
      action: calculatePowerCosts(actionParts, powerParts),
      weapon: weaponCost,
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
    attackModePowerPart,
    attackModeTechniquePart,
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
    () =>
      techniqueDamage.amount > 0 ? `+${techniqueDamage.amount}d${techniqueDamage.size}` : 'None',
    [techniqueDamage.amount, techniqueDamage.size],
  );

  return {
    powerMechanicParts,
    techniqueDamageMechanicParts,
    attackModePowerPart,
    attackModeTechniquePart,
    powerPayload,
    techniquePayload,
    costs,
    advancedCalcGroups,
    sectionCosts,
    actionDisplay,
    rangeDisplay,
    areaDisplay,
    durationDisplay,
    powerDamageSummary,
    techniqueDamageSummary,
  };
}
