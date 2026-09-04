/**
 * Power Creator — cost derivation (TASK-616)
 * Payload assembly, section costs, advanced calc rows, and display summaries.
 */

'use client';

import { useMemo } from 'react';
import type { PowerPart } from '@/hooks';
import { findByIdOrName, PART_IDS } from '@/lib/id-constants';
import {
  buildMechanicParts,
  calculatePowerCosts,
  calculatePowerSectionContribution,
  computePowerActionTypeFromSelection,
  deriveRange,
  deriveArea,
  deriveDuration,
  formatPowerRangeFromSteps,
  formatAreaForDisplay,
  formatDamageEnergyLabel,
  getAreaPartForDisplay,
  analyzePowerEnergy,
  buildPowerAdvancedCalculationGroups,
  POWER_CALC_SECTION_BY_NAME,
  POWER_DURATION_TYPE_PART_NAMES,
  type PowerPartPayload,
  type AreaConfig,
  type DurationConfig,
  type MechanicPartResult,
} from '@/lib/calculators';
import { formatDurationFromTypeAndValue } from '@/lib/utils/duration';
import { attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';
import type { SelectedPart, AdvancedPart, DamageConfig, RangeConfig } from './power-creator-types';

function enrichMechanicPayloads(
  mechanicParts: MechanicPartResult[],
  ctx: {
    actionType: string;
    damages: DamageConfig[];
    range: RangeConfig;
    area: AreaConfig;
    duration: DurationConfig;
  },
): PowerPartPayload[] {
  const validDamages = ctx.damages.filter((d) => d.type !== 'none' && d.amount > 0);
  let damageCursor = 0;
  return mechanicParts.map((mp) => {
    let displayLabel: string | undefined;
    const section = POWER_CALC_SECTION_BY_NAME[mp.name];
    if (section === 'damage' && mp.name !== 'Power Split Damage Dice') {
      const dmg = validDamages[damageCursor];
      damageCursor += 1;
      if (dmg) displayLabel = formatDamageEnergyLabel(dmg.type, dmg.amount, dmg.size);
    } else if (mp.name === 'Power Range' && ctx.range.steps > 0) {
      const formatted = formatPowerRangeFromSteps(ctx.range.steps);
      displayLabel = formatted.replace(/\bspaces\b/, 'Spaces').replace(/\bspace\b/, 'Space');
    } else if (mp.name.endsWith(' of Effect') && ctx.area.type !== 'none') {
      displayLabel = formatAreaForDisplay(ctx.area.type, ctx.area.level);
    } else if (POWER_DURATION_TYPE_PART_NAMES.has(mp.name) && ctx.duration.type !== 'instant') {
      displayLabel = formatDurationFromTypeAndValue(ctx.duration.type, ctx.duration.value);
    } else if (mp.name === 'Power Quick or Free Action') {
      displayLabel = ctx.actionType === 'free' ? 'Free Action' : 'Quick Action';
    }
    return {
      id: mp.id,
      name: mp.name,
      op_1_lvl: mp.op_1_lvl,
      op_2_lvl: mp.op_2_lvl,
      op_3_lvl: mp.op_3_lvl,
      applyDuration: mp.applyDuration,
      calcSection: section,
      displayLabel,
    };
  });
}

export type PowerSectionCostSlice = {
  energyRaw: number;
  totalTP: number;
};

export type PowerSectionCosts = {
  action: PowerSectionCostSlice;
  weapon: PowerSectionCostSlice;
  range: PowerSectionCostSlice;
  area: PowerSectionCostSlice;
  duration: PowerSectionCostSlice;
  damage: PowerSectionCostSlice;
  powerParts: PowerSectionCostSlice;
  powerMechanics: PowerSectionCostSlice;
};

type UsePowerCreatorCostDerivationArgs = {
  actionType: string;
  isReaction: boolean;
  damages: DamageConfig[];
  range: RangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  attackMode: AttackMode;
  selectedParts: SelectedPart[];
  selectedAdvancedParts: AdvancedPart[];
  powerParts: PowerPart[];
};

export function usePowerCreatorCostDerivation({
  actionType,
  isReaction,
  damages,
  range,
  area,
  duration,
  attackMode,
  selectedParts,
  selectedAdvancedParts,
  powerParts,
}: UsePowerCreatorCostDerivationArgs) {
  const mechanicParts = useMemo(
    () =>
      buildMechanicParts({
        creatorType: 'power',
        partsDb: powerParts,
        action: { type: actionType, isReaction },
        powerDamage: damages.map((d) => ({
          type: d.type,
          diceAmount: d.amount,
          dieSize: d.size,
          applyDuration: d.applyDuration ?? false,
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
    [actionType, isReaction, damages, range, area, duration, powerParts],
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
      calcSection: 'attack' as const,
      displayLabel: 'Weapon Attack',
    };
  }, [attackMode, powerParts]);

  const labeledMechanicParts = useMemo(
    () =>
      enrichMechanicPayloads(mechanicParts, {
        actionType,
        damages,
        range,
        area,
        duration,
      }),
    [actionType, area, damages, duration, mechanicParts, range],
  );

  const partsPayload: PowerPartPayload[] = useMemo(
    () => [
      ...selectedParts.map((sp) => ({
        part: sp.part,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
        calcSection: 'parts' as const,
      })),
      ...selectedAdvancedParts.map((ap) => ({
        part: ap.part,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
        calcSection: 'mechanics' as const,
      })),
      ...labeledMechanicParts,
      ...(addWeaponToPowerPart ? [addWeaponToPowerPart] : []),
    ],
    [selectedParts, selectedAdvancedParts, labeledMechanicParts, addWeaponToPowerPart],
  );

  const costs = useMemo(
    () => calculatePowerCosts(partsPayload, powerParts),
    [partsPayload, powerParts],
  );

  const advancedCalcGroups = useMemo(
    () => buildPowerAdvancedCalculationGroups(analyzePowerEnergy(partsPayload, powerParts)),
    [partsPayload, powerParts],
  );

  const actionTypeDisplay = useMemo(
    () => computePowerActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction],
  );

  const attackModeLabel = useMemo(() => attackModeColumnLabel(attackMode), [attackMode]);

  const rangeDisplay = useMemo(() => deriveRange(partsPayload), [partsPayload]);
  const areaDisplay = useMemo(() => deriveArea(partsPayload), [partsPayload]);
  const durationDisplay = useMemo(() => deriveDuration(partsPayload), [partsPayload]);

  const rangeSummary = useMemo(() => {
    if (range.steps === 0) return '1 Space / Melee';
    const formatted = formatPowerRangeFromSteps(range.steps);
    return formatted.replace(/\bspaces\b/, 'Spaces').replace(/\bspace\b/, 'Space');
  }, [range.steps]);

  const areaPartInfo = useMemo(
    () => (area.type !== 'none' ? getAreaPartForDisplay(area.type, area.level, powerParts) : null),
    [area.type, area.level, powerParts],
  );

  const damageSummary = useMemo(() => {
    const valid = damages.filter((d) => d.type !== 'none' && d.amount > 0);
    if (valid.length === 0) return 'No damage';
    return valid.map((d) => `${d.amount}d${d.size} ${d.type}`).join(', ');
  }, [damages]);

  const powerPartsSummary = useMemo(() => {
    if (selectedParts.length === 0) return 'No parts';
    const names = selectedParts.slice(0, 5).map((sp) => sp.part.name);
    const more = selectedParts.length > 5 ? ` +${selectedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedParts]);

  const powerMechanicsSummary = useMemo(() => {
    if (selectedAdvancedParts.length === 0) return 'No mechanics';
    const names = selectedAdvancedParts.slice(0, 5).map((ap) => ap.part.name);
    const more =
      selectedAdvancedParts.length > 5 ? ` +${selectedAdvancedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedAdvancedParts]);

  const durationSummary = useMemo(() => {
    if (duration.type === 'instant') return 'Instant';
    if (duration.type === 'permanent') return 'Permanent';
    return formatDurationFromTypeAndValue(duration.type, duration.value);
  }, [duration.type, duration.value]);

  const sectionCosts = useMemo(() => {
    const toPayload = (mp: {
      id: number | string;
      name: string;
      op_1_lvl: number;
      op_2_lvl: number;
      op_3_lvl: number;
      applyDuration?: boolean | undefined;
    }) => ({
      id: mp.id,
      name: mp.name,
      op_1_lvl: mp.op_1_lvl,
      op_2_lvl: mp.op_2_lvl,
      op_3_lvl: mp.op_3_lvl,
      applyDuration: mp.applyDuration ?? false,
    });
    const rangeParts = mechanicParts.filter((mp) => mp.name === 'Power Range').map(toPayload);
    const areaNames = [
      'Sphere of Effect',
      'Cylinder of Effect',
      'Cone of Effect',
      'Line of Effect',
      'Trail of Effect',
    ];
    const areaParts = mechanicParts.filter((mp) => areaNames.includes(mp.name)).map(toPayload);
    const durationNames = [
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
    const durationParts = mechanicParts
      .filter((mp) => durationNames.includes(mp.name))
      .map(toPayload);
    const damageNames = [
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
    const damageParts = mechanicParts.filter((mp) => damageNames.includes(mp.name)).map(toPayload);
    const actionNames = ['Power Reaction', 'Power Quick or Free Action', 'Power Long Action'];
    const actionParts = mechanicParts.filter((mp) => actionNames.includes(mp.name)).map(toPayload);
    const partsPayloadForSections = selectedParts.map((sp) => ({
      part: sp.part,
      op_1_lvl: sp.op_1_lvl,
      op_2_lvl: sp.op_2_lvl,
      op_3_lvl: sp.op_3_lvl,
      applyDuration: sp.applyDuration,
    }));
    const mechanicPayload = selectedAdvancedParts.map((ap) => ({
      part: ap.part,
      op_1_lvl: ap.op_1_lvl,
      op_2_lvl: ap.op_2_lvl,
      op_3_lvl: ap.op_3_lvl,
      applyDuration: ap.applyDuration,
    }));
    return {
      action: calculatePowerCosts(actionParts, powerParts),
      weapon: calculatePowerCosts(addWeaponToPowerPart ? [addWeaponToPowerPart] : [], powerParts),
      range: calculatePowerSectionContribution(rangeParts, powerParts, durationParts),
      area: calculatePowerSectionContribution(areaParts, powerParts, durationParts),
      duration: calculatePowerCosts(durationParts, powerParts),
      damage: calculatePowerSectionContribution(damageParts, powerParts, durationParts),
      powerParts: calculatePowerSectionContribution(
        partsPayloadForSections,
        powerParts,
        durationParts,
      ),
      powerMechanics: calculatePowerSectionContribution(mechanicPayload, powerParts, durationParts),
    };
  }, [mechanicParts, powerParts, selectedParts, selectedAdvancedParts, addWeaponToPowerPart]);

  return {
    mechanicParts,
    addWeaponToPowerPart,
    partsPayload,
    costs,
    advancedCalcGroups,
    actionTypeDisplay,
    attackModeLabel,
    rangeDisplay,
    areaDisplay,
    durationDisplay,
    rangeSummary,
    areaPartInfo,
    damageSummary,
    powerPartsSummary,
    powerMechanicsSummary,
    durationSummary,
    sectionCosts,
  };
}
