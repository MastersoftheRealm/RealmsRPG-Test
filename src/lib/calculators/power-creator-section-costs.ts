/**
 * Power creator section slices — PART_IDS filters for badge EN/TP (shared power + empowered).
 */

import { PART_IDS } from '@/lib/id-constants';
import { coerceSavedPartId } from '@/lib/game/saved-part-id';
import type { PowerPartPayload } from './power-calc';
import type { MechanicPartResult } from './mechanic-builder';

export const POWER_SECTION_ACTION_IDS = new Set<number>([
  PART_IDS.POWER_REACTION,
  PART_IDS.POWER_LONG_ACTION,
  PART_IDS.POWER_QUICK_OR_FREE_ACTION,
]);

export const POWER_SECTION_RANGE_IDS = new Set<number>([PART_IDS.POWER_RANGE]);

export const POWER_SECTION_AREA_IDS = new Set<number>([
  PART_IDS.LINE_OF_EFFECT,
  PART_IDS.CONE_OF_EFFECT,
  PART_IDS.CYLINDER_OF_EFFECT,
  PART_IDS.SPHERE_OF_EFFECT,
  PART_IDS.TRAIL_OF_EFFECT,
]);

export const POWER_SECTION_DURATION_IDS = new Set<number>([
  PART_IDS.DURATION_ROUND,
  PART_IDS.DURATION_MINUTE,
  PART_IDS.DURATION_HOUR,
  PART_IDS.DURATION_DAYS,
  PART_IDS.DURATION_PERMANENT,
  PART_IDS.DURATION_ENDS_ON_ACTIVATION,
  PART_IDS.DURATION_NO_HARM,
  PART_IDS.DURATION_FOCUS,
  PART_IDS.DURATION_SUSTAIN,
]);

export const POWER_SECTION_DAMAGE_IDS = new Set<number>([
  PART_IDS.MAGIC_DAMAGE,
  PART_IDS.LIGHT_DAMAGE,
  PART_IDS.PHYSICAL_DAMAGE,
  PART_IDS.ELEMENTAL_DAMAGE,
  PART_IDS.POISON_OR_NECROTIC_DAMAGE,
  PART_IDS.SONIC_DAMAGE,
  PART_IDS.SPIRITUAL_DAMAGE,
  PART_IDS.PSYCHIC_DAMAGE,
  PART_IDS.POWER_SPLIT_DAMAGE_DICE,
  PART_IDS.SPLIT_DAMAGE_DICE,
]);

export type PowerCreatorSectionKey = 'action' | 'range' | 'area' | 'duration' | 'damage';

const SECTION_ID_SETS: Record<PowerCreatorSectionKey, Set<number>> = {
  action: POWER_SECTION_ACTION_IDS,
  range: POWER_SECTION_RANGE_IDS,
  area: POWER_SECTION_AREA_IDS,
  duration: POWER_SECTION_DURATION_IDS,
  damage: POWER_SECTION_DAMAGE_IDS,
};

function partIdNumber(id: number | string | undefined): number | null {
  if (id == null) return null;
  const n = typeof id === 'number' ? id : Number(id);
  return Number.isFinite(n) ? n : null;
}

export function filterMechanicPartsBySection<T extends { id: number | string }>(
  parts: T[],
  section: PowerCreatorSectionKey,
): T[] {
  const set = SECTION_ID_SETS[section];
  return parts.filter((p) => {
    const n = partIdNumber(p.id);
    return n != null && set.has(n);
  });
}

export function mechanicPartsToSectionPayload(parts: MechanicPartResult[]): PowerPartPayload[] {
  return parts.map((mp) => ({
    id: coerceSavedPartId(mp.id),
    name: mp.name,
    op_1_lvl: mp.op_1_lvl,
    op_2_lvl: mp.op_2_lvl,
    op_3_lvl: mp.op_3_lvl,
    applyDuration: mp.applyDuration ?? false,
  }));
}
