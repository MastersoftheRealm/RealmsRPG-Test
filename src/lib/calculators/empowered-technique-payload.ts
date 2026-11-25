/**
 * Empowered technique — shared payload assembly for the creator hook and library readers.
 */

import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { findByIdOrName, PART_IDS } from '@/lib/id-constants';
import { normalizeAttackMode, type AttackMode } from '@/lib/attack-mode';
import { buildMechanicParts } from './mechanic-builder';
import { pickCheaperEnPart, toEmpoweredAutoMechanicPart } from './empowered-overlap-parts';
import type { AreaConfig, DurationConfig } from './mechanic-builder';
import type { PowerPartPayload } from './power-calc';
import type { TechniquePartPayload } from './technique-calc';
import {
  calculateEmpoweredTechniqueCosts,
  type EmpoweredTechniqueCostResult,
} from './empowered-technique-calc';
import { formatEnergyStat } from './power-calc';

export type EmpoweredDamageConfig = {
  amount: number;
  size: number;
  type: string;
  applyDuration?: boolean | undefined;
};

export type EmpoweredRangeConfig = {
  steps: number;
};

export type EmpoweredSelectedPowerPart = {
  part: PowerPart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
};

export type EmpoweredSelectedTechniquePart = {
  part: TechniquePart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
};

export type BuildEmpoweredTechniqueCostPayloadsInput = {
  actionType: string;
  isReaction: boolean;
  powerDamages: EmpoweredDamageConfig[];
  techniqueDamage: { amount: number; size: number };
  range: EmpoweredRangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  attackMode: AttackMode;
  selectedPowerParts: EmpoweredSelectedPowerPart[];
  selectedPowerAdvancedParts: EmpoweredSelectedPowerPart[];
  selectedTechniqueParts: EmpoweredSelectedTechniquePart[];
  powerParts: PowerPart[];
  techniqueParts: TechniquePart[];
};

export type EmpoweredTechniqueBuiltPayloads = {
  powerMechanicParts: ReturnType<typeof buildMechanicParts>;
  techniqueDamageMechanicParts: ReturnType<typeof buildMechanicParts>;
  attackModePowerPart: PowerPartPayload | null;
  attackModeTechniquePart: ReturnType<typeof toEmpoweredAutoMechanicPart> | null;
  powerPayload: PowerPartPayload[];
  techniquePayload: TechniquePartPayload[];
};

export function buildEmpoweredTechniqueCostPayloads(
  input: BuildEmpoweredTechniqueCostPayloadsInput,
): EmpoweredTechniqueBuiltPayloads {
  const {
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
  } = input;

  const powerMechanicParts = buildMechanicParts({
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
  });

  const techniqueDamageMechanicParts = buildMechanicParts({
    creatorType: 'technique',
    partsDb: techniqueParts,
    techniqueDamage:
      techniqueDamage.amount > 0
        ? { diceAmount: techniqueDamage.amount, dieSize: techniqueDamage.size }
        : undefined,
  });

  let attackModePowerPart: PowerPartPayload | null = null;
  let attackModeTechniquePart: ReturnType<typeof toEmpoweredAutoMechanicPart> | null = null;

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
    if (picked) {
      const row = toEmpoweredAutoMechanicPart(picked.part);
      if (picked.side === 'power') {
        attackModePowerPart = row;
      } else {
        attackModeTechniquePart = row;
      }
    }
  } else if (attackMode === 'none') {
    const noAttack = findByIdOrName(techniqueParts, {
      id: PART_IDS.NO_ATTACK,
      name: 'No Attack',
    });
    if (noAttack?.mechanic) {
      attackModeTechniquePart = toEmpoweredAutoMechanicPart(noAttack);
    }
  }

  const powerPayload: PowerPartPayload[] = [
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
  ];

  const techniquePayload: TechniquePartPayload[] = [
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
  ];

  return {
    powerMechanicParts,
    techniqueDamageMechanicParts,
    attackModePowerPart,
    attackModeTechniquePart,
    powerPayload,
    techniquePayload,
  };
}

type SavedPartRow = {
  id?: number | string | undefined;
  partId?: number | string | undefined;
  name?: string | undefined;
  op_1_lvl?: number | undefined;
  op_2_lvl?: number | undefined;
  op_3_lvl?: number | undefined;
  applyDuration?: boolean | undefined;
  selectedCategory?: string | undefined;
};

function mapSavedPowerRows(
  rows: SavedPartRow[],
  powerParts: PowerPart[],
): EmpoweredSelectedPowerPart[] {
  return rows
    .map((row) => {
      const key = row.partId ?? row.id;
      const part = findByIdOrName(powerParts, { id: key, name: row.name });
      if (!part) return null;
      return {
        part,
        op_1_lvl: row.op_1_lvl ?? 0,
        op_2_lvl: row.op_2_lvl ?? 0,
        op_3_lvl: row.op_3_lvl ?? 0,
        applyDuration: row.applyDuration ?? false,
      };
    })
    .filter((row): row is EmpoweredSelectedPowerPart => row !== null);
}

function mapSavedTechniqueRows(
  rows: SavedPartRow[],
  techniqueParts: TechniquePart[],
): EmpoweredSelectedTechniquePart[] {
  return rows
    .map((row) => {
      const key = row.partId ?? row.id;
      const part = findByIdOrName(techniqueParts, { id: key, name: row.name });
      if (!part) return null;
      return {
        part,
        op_1_lvl: row.op_1_lvl ?? 0,
        op_2_lvl: row.op_2_lvl ?? 0,
        op_3_lvl: row.op_3_lvl ?? 0,
      };
    })
    .filter((row): row is EmpoweredSelectedTechniquePart => row !== null);
}

/** Recompute empowered energy from a saved library row; dash when codex is not loaded. */
export function computeEmpoweredTechniqueEnergyFromSaved(
  item: unknown,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
): {
  totalEnergy: number | string;
  trainingPoints: number;
  costs: EmpoweredTechniqueCostResult;
} | null {
  if (!powerPartsDb.length || !techniquePartsDb.length) return null;

  const raw = item as Record<string, unknown>;
  const power = (raw.power ?? {}) as Record<string, unknown>;
  const technique = (raw.technique ?? {}) as Record<string, unknown>;
  const additional = Array.isArray(technique.additionalDamage)
    ? (technique.additionalDamage[0] as { amount?: number; size?: number } | undefined)
    : undefined;

  const attackMode =
    normalizeAttackMode(raw.attackMode as AttackMode | undefined) ??
    (raw.addWeapon || power.addWeapon ? 'weapon' : 'none');

  const built = buildEmpoweredTechniqueCostPayloads({
    actionType: String(raw.actionType ?? 'basic'),
    isReaction: raw.isReaction === true,
    powerDamages: Array.isArray(power.damage)
      ? (power.damage as EmpoweredDamageConfig[])
      : [{ amount: 0, size: 6, type: 'none', applyDuration: false }],
    techniqueDamage: {
      amount: additional?.amount ?? 0,
      size: additional?.size ?? 6,
    },
    range: (power.range as EmpoweredRangeConfig) ?? { steps: 0 },
    area: (power.area as AreaConfig) ?? { type: 'none', level: 1, applyDuration: false },
    duration: (power.duration ??
      raw.duration ?? {
        type: 'instant',
        value: 1,
        applyDuration: false,
        focus: false,
        noHarm: false,
        endsOnActivation: false,
        sustain: 0,
      }) as DurationConfig,
    attackMode,
    selectedPowerParts: mapSavedPowerRows((power.parts as SavedPartRow[]) ?? [], powerPartsDb),
    selectedPowerAdvancedParts: mapSavedPowerRows(
      (power.mechanics as SavedPartRow[]) ?? [],
      powerPartsDb,
    ),
    selectedTechniqueParts: mapSavedTechniqueRows(
      (technique.parts as SavedPartRow[]) ?? [],
      techniquePartsDb,
    ),
    powerParts: powerPartsDb,
    techniqueParts: techniquePartsDb,
  });

  const costs = calculateEmpoweredTechniqueCosts({
    powerPartsPayload: built.powerPayload,
    techniquePartsPayload: built.techniquePayload,
    powerPartsDb,
    techniquePartsDb,
  });

  return {
    totalEnergy: formatEnergyStat(costs.totalEnergy),
    trainingPoints: costs.totalTP,
    costs,
  };
}
