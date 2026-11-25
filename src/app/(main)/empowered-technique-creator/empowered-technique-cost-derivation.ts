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
import {
  calculatePowerCosts,
  calculateTechniqueCosts,
  calculatePowerSectionContribution,
  calculateEmpoweredTechniqueCosts,
  computePowerActionTypeFromSelection,
  deriveRange,
  deriveArea,
  deriveDuration,
  analyzePowerEnergy,
  analyzeTechniqueEnergy,
  buildEmpoweredAdvancedCalculationGroups,
  buildEmpoweredTechniqueCostPayloads,
  filterMechanicPartsBySection,
  mechanicPartsToSectionPayload,
  type AreaConfig,
  type DurationConfig,
  type TechniquePartPayload,
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
  const builtPayloads = useMemo(
    () =>
      buildEmpoweredTechniqueCostPayloads({
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
      }),
    [
      actionType,
      area,
      attackMode,
      duration,
      isReaction,
      powerDamages,
      powerParts,
      range,
      selectedPowerAdvancedParts,
      selectedPowerParts,
      selectedTechniqueParts,
      techniqueDamage,
      techniqueParts,
    ],
  );

  const powerMechanicParts = builtPayloads.powerMechanicParts;
  const techniqueDamageMechanicParts = builtPayloads.techniqueDamageMechanicParts;
  const attackModePowerPart = builtPayloads.attackModePowerPart;
  const attackModeTechniquePart = builtPayloads.attackModeTechniquePart;
  const powerPayload = builtPayloads.powerPayload;
  const techniquePayload = builtPayloads.techniquePayload;

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
        actionEnergyMultiplier: costs.actionEnergyMultiplier,
        powerEnergyRaw: costs.powerEnergyRaw,
        techniqueEnergyRaw: costs.techniqueEnergyRaw,
        energyRaw: costs.energyRaw,
        totalEnergy: costs.totalEnergy,
      }),
    [
      costs.actionEnergyMultiplier,
      costs.energyRaw,
      costs.powerEnergyRaw,
      costs.techniqueEnergyRaw,
      costs.techniquePercentageMultiplier,
      costs.totalEnergy,
      powerPayload,
      powerParts,
      techniquePayload,
      techniqueParts,
    ],
  );

  const sectionCosts = useMemo((): EmpoweredSectionCosts => {
    const actionParts = mechanicPartsToSectionPayload(
      filterMechanicPartsBySection(powerMechanicParts, 'action'),
    );
    const rangeParts = mechanicPartsToSectionPayload(
      filterMechanicPartsBySection(powerMechanicParts, 'range'),
    );
    const areaParts = mechanicPartsToSectionPayload(
      filterMechanicPartsBySection(powerMechanicParts, 'area'),
    );
    const durationParts = mechanicPartsToSectionPayload(
      filterMechanicPartsBySection(powerMechanicParts, 'duration'),
    );
    const powerDamageParts = mechanicPartsToSectionPayload(
      filterMechanicPartsBySection(powerMechanicParts, 'damage'),
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

    const durationContext = durationParts;

    return {
      action: calculatePowerCosts(actionParts, powerParts),
      weapon: weaponCost,
      range: calculatePowerSectionContribution(rangeParts, powerParts, durationContext),
      area: calculatePowerSectionContribution(areaParts, powerParts, durationContext),
      duration: calculatePowerCosts(durationParts, powerParts),
      powerDamage: calculatePowerSectionContribution(powerDamageParts, powerParts, durationContext),
      powerParts: calculatePowerSectionContribution(
        selectedPowerParts.map((selected) => ({
          part: selected.part,
          op_1_lvl: selected.op_1_lvl,
          op_2_lvl: selected.op_2_lvl,
          op_3_lvl: selected.op_3_lvl,
          applyDuration: selected.applyDuration,
        })),
        powerParts,
        durationContext,
      ),
      powerMechanics: calculatePowerSectionContribution(
        selectedPowerAdvancedParts.map((selected) => ({
          part: selected.part,
          op_1_lvl: selected.op_1_lvl,
          op_2_lvl: selected.op_2_lvl,
          op_3_lvl: selected.op_3_lvl,
          applyDuration: selected.applyDuration,
        })),
        powerParts,
        durationContext,
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
