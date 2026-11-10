/**
 * Warn-only checks for powers / techniques set to No Attack with parts that assume an attack roll.
 * Does not block save; does not change cost math.
 */

import type { AttackMode } from '@/lib/attack-mode';
import { PART_IDS } from '@/lib/id-constants';

/* PLACEHOLDER_COPY (Kadin): Technique creator — No Attack with damage parts (Additional Damage, True Damage, etc.). */
const TECHNIQUE_NO_ATTACK_DAMAGE_WARNING =
  'Attack is set to No Attack, but this technique still has damage parts. They will not apply without an attack.';

/* PLACEHOLDER_COPY (Kadin): Power creator — No Weapon/Attack with cone area or attack-roll parts (e.g. Attack / Potency Increase). */
const POWER_NO_ATTACK_INCOMPATIBLE_WARNING =
  'Attack is set to No Weapon/Attack, but this power still has area or parts that require an attack roll. They will not apply without an attack.';

const TECHNIQUE_DAMAGE_PART_IDS = new Set<number>([
  PART_IDS.TRUE_DAMAGE,
  PART_IDS.ADDITIONAL_DAMAGE,
  PART_IDS.SPLIT_DAMAGE_DICE,
]);

const TECHNIQUE_DAMAGE_PART_NAMES = new Set([
  'True Damage',
  'Additional Damage',
  'Split Damage Dice',
]);

const POWER_ATTACK_DEPENDENT_PART_NAMES = new Set(['Attack / Potency Increase']);

type TechniqueNoAttackWarningInput = {
  attackMode: AttackMode;
  additionalDamage?: { amount: number; size: number } | undefined;
  manualParts?:
    | ReadonlyArray<{ id?: number | string | undefined; name?: string | undefined }>
    | undefined;
};

type PowerNoAttackWarningInput = {
  attackMode: AttackMode;
  areaType?: 'none' | 'sphere' | 'cylinder' | 'cone' | 'line' | 'trail' | string | undefined;
  selectedParts?: ReadonlyArray<{ name?: string | undefined }> | undefined;
  advancedParts?: ReadonlyArray<{ part?: { name?: string | undefined } | undefined }> | undefined;
};

function isTechniqueDamagePartRef(part: {
  id?: number | string | undefined;
  name?: string | undefined;
}): boolean {
  const name = part.name?.trim() ?? '';
  if (TECHNIQUE_DAMAGE_PART_NAMES.has(name)) return true;
  const id = part.id;
  if (id == null || id === '') return false;
  const numeric = typeof id === 'number' ? id : Number(id);
  return Number.isFinite(numeric) && TECHNIQUE_DAMAGE_PART_IDS.has(numeric);
}

function techniqueHasNoAttackDamageConflict(input: TechniqueNoAttackWarningInput): boolean {
  if (input.attackMode !== 'none') return false;

  const amount = input.additionalDamage?.amount ?? 0;
  const size = input.additionalDamage?.size ?? 0;
  if (amount > 0 && size >= 4) return true;

  const manual = input.manualParts ?? [];
  return manual.some((part) => isTechniqueDamagePartRef(part));
}

function techniqueNoAttackDamageWarning(input: TechniqueNoAttackWarningInput): string | null {
  return techniqueHasNoAttackDamageConflict(input) ? TECHNIQUE_NO_ATTACK_DAMAGE_WARNING : null;
}

function powerSelectedPartNames(input: PowerNoAttackWarningInput): string[] {
  const names: string[] = [];
  for (const row of input.selectedParts ?? []) {
    const name = row.name?.trim();
    if (name) names.push(name);
  }
  for (const row of input.advancedParts ?? []) {
    const name = row.part?.name?.trim();
    if (name) names.push(name);
  }
  return names;
}

function powerHasNoAttackAttackConflict(input: PowerNoAttackWarningInput): boolean {
  if (input.attackMode !== 'none') return false;
  if (input.areaType === 'cone') return true;
  return powerSelectedPartNames(input).some((name) => POWER_ATTACK_DEPENDENT_PART_NAMES.has(name));
}

function powerNoAttackIncompatibleWarning(input: PowerNoAttackWarningInput): string | null {
  return powerHasNoAttackAttackConflict(input) ? POWER_NO_ATTACK_INCOMPATIBLE_WARNING : null;
}

type NoAttackCreatorKind = 'technique' | 'power';

/** Single entry for creator workspaces — dispatches to technique vs power rules. */
export function noAttackCreatorWarning(
  kind: 'technique',
  input: TechniqueNoAttackWarningInput,
): string | null;
export function noAttackCreatorWarning(
  kind: 'power',
  input: PowerNoAttackWarningInput,
): string | null;
export function noAttackCreatorWarning(
  kind: NoAttackCreatorKind,
  input: TechniqueNoAttackWarningInput | PowerNoAttackWarningInput,
): string | null {
  if (kind === 'technique') {
    return techniqueNoAttackDamageWarning(input as TechniqueNoAttackWarningInput);
  }
  return powerNoAttackIncompatibleWarning(input as PowerNoAttackWarningInput);
}
