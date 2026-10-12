/**
 * Training Points shown for a saved power, technique, or creature snapshot.
 * The number comes from the current Codex rates and the character-wide
 * rounding rule. A `tp` field saved before that rule is not the price.
 */

import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { derivePowerDisplay, type PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay, type TechniqueDocument } from '@/lib/calculators/technique-calc';
import {
  libraryItemToPowerDocument,
  libraryItemToTechniqueDocument,
} from '@/lib/library-selectable-builders';

export interface PublishedTrainingPoints {
  tp: number;
  /** False when the Codex list is empty or no part on the snapshot could be priced. */
  priced: boolean;
}

type PartRates = {
  id?: string | number | null | undefined;
  name?: string | null | undefined;
  base_tp?: number | null | undefined;
  op_1_tp?: number | null | undefined;
  op_2_tp?: number | null | undefined;
  op_3_tp?: number | null | undefined;
};

export interface PowerTrainingSnapshot {
  name?: string | undefined;
  description?: string | undefined;
  parts?: PowerDocument['parts'] | undefined;
  tp?: number | undefined;
  actionType?: string | undefined;
  isReaction?: boolean | undefined;
  range?: PowerDocument['range'] | string | undefined;
  rangeValue?: PowerDocument['range'] | undefined;
  area?: PowerDocument['area'] | string | undefined;
  areaValue?: PowerDocument['area'] | undefined;
  duration?: PowerDocument['duration'] | string | undefined;
  durationValue?: PowerDocument['duration'] | undefined;
  damage?: PowerDocument['damage'] | string | undefined;
  damageValue?: PowerDocument['damage'] | undefined;
  attackMode?: PowerDocument['attackMode'] | undefined;
  composition?: PowerDocument['composition'] | undefined;
}

export interface TechniqueTrainingSnapshot {
  name?: string | undefined;
  description?: string | undefined;
  parts?: TechniqueDocument['parts'] | undefined;
  tp?: number | undefined;
  actionType?: string | undefined;
  isReaction?: boolean | undefined;
  attackMode?: TechniqueDocument['attackMode'] | undefined;
  /** Saved attack reference. A display string is not a priced weapon part. */
  weapon?: TechniqueDocument['weapon'] | string | undefined;
  weaponName?: string | undefined;
  damage?: TechniqueDocument['damage'] | TechniqueDocument['damage'][] | string | undefined;
}

function storedTrainingPoints(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function structured<T>(value: T | string | undefined): T | undefined {
  if (value == null || typeof value === 'string') return undefined;
  return value;
}

function publishedFromDisplay(
  tp: number,
  priced: boolean,
  stored: number | undefined,
): PublishedTrainingPoints {
  if (!priced) return { tp: stored ?? 0, priced: false };
  return { tp, priced: true };
}

/** Per-power Training Points from live part rates. Mechanic parts (Range, damage) count. */
export function publishedPowerTrainingPoints(
  snapshot: PowerTrainingSnapshot,
  partsDb: readonly PartRates[],
): PublishedTrainingPoints {
  const stored = storedTrainingPoints(snapshot.tp);
  if (!Array.isArray(partsDb) || partsDb.length === 0) {
    return { tp: stored ?? 0, priced: false };
  }
  const damage = snapshot.damageValue ?? structured(snapshot.damage);
  const display = derivePowerDisplay(
    libraryItemToPowerDocument({
      name: snapshot.name,
      description: snapshot.description,
      parts: snapshot.parts ?? [],
      actionType: snapshot.actionType,
      isReaction: snapshot.isReaction,
      range: snapshot.rangeValue ?? structured(snapshot.range),
      area: snapshot.areaValue ?? structured(snapshot.area),
      duration: snapshot.durationValue ?? structured(snapshot.duration),
      damage,
      attackMode: snapshot.attackMode,
      ...(snapshot.composition ? { composition: snapshot.composition } : {}),
    }),
    partsDb as PowerPart[],
  );
  const priced = display.partChips.length > 0 || display.tp > 0;
  return publishedFromDisplay(display.tp, priced, stored);
}

/** Per-technique Training Points from live part rates. */
export function publishedTechniqueTrainingPoints(
  snapshot: TechniqueTrainingSnapshot,
  partsDb: readonly PartRates[],
): PublishedTrainingPoints {
  const stored = storedTrainingPoints(snapshot.tp);
  if (!Array.isArray(partsDb) || partsDb.length === 0) {
    return { tp: stored ?? 0, priced: false };
  }
  const rawDamage = snapshot.damage;
  const damage = Array.isArray(rawDamage)
    ? rawDamage[0]
    : rawDamage && typeof rawDamage === 'object'
      ? rawDamage
      : undefined;
  const display = deriveTechniqueDisplay(
    libraryItemToTechniqueDocument({
      name: snapshot.name,
      description: snapshot.description,
      parts: snapshot.parts ?? [],
      actionType: snapshot.actionType,
      isReaction: snapshot.isReaction,
      attackMode: snapshot.attackMode,
      weapon: snapshot.weapon && typeof snapshot.weapon === 'object' ? snapshot.weapon : undefined,
      weaponName: snapshot.weaponName,
      damage,
    }),
    partsDb as TechniquePart[],
  );
  const priced = display.partChips.length > 0 || display.tp > 0;
  return publishedFromDisplay(display.tp, priced, stored);
}

/** Replace a saved `tp` when the live price differs. Leaves an unpriced row alone. */
export function applyPublishedPowerTrainingPoints<T extends PowerTrainingSnapshot>(
  snapshot: T,
  partsDb: readonly PartRates[],
): { value: T; changed: boolean } {
  const published = publishedPowerTrainingPoints(snapshot, partsDb);
  if (!published.priced || snapshot.tp === published.tp) return { value: snapshot, changed: false };
  return { value: { ...snapshot, tp: published.tp }, changed: true };
}

/** Replace a saved technique `tp` when the live price differs. */
export function applyPublishedTechniqueTrainingPoints<T extends TechniqueTrainingSnapshot>(
  snapshot: T,
  partsDb: readonly PartRates[],
): { value: T; changed: boolean } {
  const published = publishedTechniqueTrainingPoints(snapshot, partsDb);
  if (!published.priced || snapshot.tp === published.tp) return { value: snapshot, changed: false };
  return { value: { ...snapshot, tp: published.tp }, changed: true };
}
