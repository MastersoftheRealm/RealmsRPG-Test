/**
 * Weapon attack ability resolution — single source for sheet + guided equipment.
 * @see GAME_RULES.md — Melee/Thrown → Strength, Ranged → Acuity, Finesse → Agility,
 * Heavy ranged → Strength
 */

import { resolveWeaponRangeDisplay, type ItemPropertyPayload } from '@/lib/calculators/item-calc';
import type { WeaponRangeType } from '@/lib/game/creator-constants';
import { PROPERTY_IDS } from '@/lib/id-constants';
import type { Abilities, AbilityName } from '@/types';

export type WeaponAttackAbility = 'strength' | 'agility' | 'acuity';

const ABILITY_LABELS: Record<WeaponAttackAbility, string> = {
  strength: 'Strength',
  agility: 'Agility',
  acuity: 'Acuity',
};

export type WeaponPropertyRef =
  | string
  | { id?: number | undefined; name?: string | undefined; op_1_lvl?: number | undefined };

/** Ability score requirement derived from item property rows (e.g. Strength Requirement). */
export interface AbilityRequirement {
  name: string;
  level: number;
}

/**
 * Derive ability requirement from item properties when not stored as abilityRequirement.
 * Handles older saves or items where requirement was only in the properties list.
 */
export function deriveAbilityRequirementFromProperties(
  properties: WeaponPropertyRef[] | undefined,
): AbilityRequirement | undefined {
  for (const p of properties ?? []) {
    const name = typeof p === 'string' ? p : String(p.name ?? '');
    const op1 = typeof p === 'object' && p != null ? (p.op_1_lvl ?? 0) : 0;
    const level = 1 + (Number(op1) || 0);
    if (level < 1) continue;
    if (name.includes('Strength Requirement')) return { name: 'Strength', level };
    if (name.includes('Agility Requirement')) return { name: 'Agility', level };
    if (name.includes('Vitality Requirement')) return { name: 'Vitality', level };
    if (name.includes('Acuity Requirement')) return { name: 'Acuity', level };
    if (name.includes('Intelligence Requirement')) return { name: 'Intelligence', level };
    if (name.includes('Charisma Requirement')) return { name: 'Charisma', level };
  }
  return undefined;
}

const ABILITY_KEY_MAP: Record<string, keyof Abilities> = {
  strength: 'strength',
  agility: 'agility',
  vitality: 'vitality',
  acuity: 'acuity',
  intelligence: 'intelligence',
  charisma: 'charisma',
};

/** True when abilities meet (or exceed) the requirement, or when there is no requirement. */
export function meetsAbilityRequirement(
  req: AbilityRequirement | null | undefined,
  abilities: Abilities,
): boolean {
  if (!req) return true;
  const key = ABILITY_KEY_MAP[req.name.toLowerCase()];
  if (!key) return true;
  return (abilities[key] ?? 0) >= req.level;
}

function normalizePropertyName(ref: WeaponPropertyRef): string {
  if (typeof ref === 'string') return ref.trim().toLowerCase();
  return String(ref.name ?? '')
    .trim()
    .toLowerCase();
}

function hasPropertyId(ref: WeaponPropertyRef, id: number): boolean {
  if (typeof ref === 'object' && ref != null && ref.id === id) return true;
  return false;
}

function propertyList(properties: WeaponPropertyRef[] | undefined): WeaponPropertyRef[] {
  return properties ?? [];
}

function hasFinesseProperty(properties: WeaponPropertyRef[] | undefined): boolean {
  return propertyList(properties).some(
    (p) => hasPropertyId(p, PROPERTY_IDS.FINESSE) || normalizePropertyName(p) === 'finesse',
  );
}

function hasHeavyProperty(properties: WeaponPropertyRef[] | undefined): boolean {
  return propertyList(properties).some(
    (p) => hasPropertyId(p, PROPERTY_IDS.HEAVY) || normalizePropertyName(p) === 'heavy',
  );
}

export function hasThrownProperty(properties: WeaponPropertyRef[] | undefined): boolean {
  return propertyList(properties).some(
    (p) => hasPropertyId(p, PROPERTY_IDS.THROWN) || normalizePropertyName(p) === 'thrown',
  );
}

export function hasReachProperty(properties: WeaponPropertyRef[] | undefined): boolean {
  return propertyList(properties).some(
    (p) => hasPropertyId(p, PROPERTY_IDS.REACH) || normalizePropertyName(p) === 'reach',
  );
}

export function hasTwoHandedProperty(properties: WeaponPropertyRef[] | undefined): boolean {
  return propertyList(properties).some(
    (p) =>
      hasPropertyId(p, PROPERTY_IDS.TWO_HANDED) ||
      normalizePropertyName(p) === 'two-handed' ||
      normalizePropertyName(p) === 'two handed',
  );
}

/** Default Ability utilized for a range type (no Finesse / Heavy). */
export function defaultWeaponAbilityUtilized(rangeType: WeaponRangeType): WeaponAttackAbility {
  return rangeType === 'ranged' ? 'acuity' : 'strength';
}

/** Legal Ability utilized dropdown values for a range type. */
export function weaponAbilityUtilizedOptions(
  rangeType: WeaponRangeType,
): { value: WeaponAttackAbility; label: string }[] {
  if (rangeType === 'ranged') {
    return [
      { value: 'acuity', label: ABILITY_LABELS.acuity },
      { value: 'strength', label: ABILITY_LABELS.strength },
      { value: 'agility', label: ABILITY_LABELS.agility },
    ];
  }
  return [
    { value: 'strength', label: ABILITY_LABELS.strength },
    { value: 'agility', label: ABILITY_LABELS.agility },
  ];
}

export function clampWeaponAbilityUtilized(
  ability: WeaponAttackAbility,
  rangeType: WeaponRangeType,
): WeaponAttackAbility {
  const allowed = weaponAbilityUtilizedOptions(rangeType).some((opt) => opt.value === ability);
  return allowed ? ability : defaultWeaponAbilityUtilized(rangeType);
}

/**
 * Creator Ability utilized from saved mechanic properties (not a stored ability string).
 * Finesse → Agility; Heavy on ranged → Strength; else the range-type default.
 */
export function deriveWeaponAbilityUtilized(
  properties: WeaponPropertyRef[] | undefined,
  rangeType: WeaponRangeType,
): WeaponAttackAbility {
  if (hasFinesseProperty(properties)) return 'agility';
  if (rangeType === 'ranged' && hasHeavyProperty(properties)) return 'strength';
  return defaultWeaponAbilityUtilized(rangeType);
}

/**
 * Resolve which ability applies to weapon attacks.
 * Priority: Finesse → Agility | Thrown → Strength | Reach → Strength |
 * Heavy → Strength | non-melee Range → Acuity | else Strength
 */
export function getWeaponAttackAbility(
  properties: WeaponPropertyRef[] | undefined,
  rangeOverride?: string | null,
): WeaponAttackAbility {
  if (hasFinesseProperty(properties)) return 'agility';
  if (hasThrownProperty(properties)) return 'strength';
  if (hasReachProperty(properties)) return 'strength';
  if (hasHeavyProperty(properties)) return 'strength';

  const rangeStr = resolveWeaponRangeDisplay(
    rangeOverride,
    (properties ?? []) as ItemPropertyPayload[],
  );
  if (rangeStr.toLowerCase() !== 'melee') return 'acuity';

  return 'strength';
}

export function weaponAttackAbilityLabel(ability: WeaponAttackAbility): string {
  return ABILITY_LABELS[ability];
}

export function getWeaponAttackBonusFromProperties(
  properties: WeaponPropertyRef[] | undefined,
  abilities: Abilities | undefined,
  martialProficiency = 0,
  rangeOverride?: string | null,
): { bonus: number; abilityName: string; ability: WeaponAttackAbility } {
  const ability = getWeaponAttackAbility(properties, rangeOverride);
  const label = ABILITY_LABELS[ability];
  const prof = martialProficiency ?? 0;
  if (!abilities) {
    return { bonus: prof, abilityName: label, ability };
  }
  const stat = abilities[ability] ?? 0;
  return { bonus: stat + prof, abilityName: label, ability };
}

export function weaponMatchesArchetypeAbilities(
  properties: WeaponPropertyRef[] | undefined,
  martAbil: AbilityName | null | undefined,
  powAbil: AbilityName | null | undefined,
  rangeOverride?: string | null,
): boolean {
  const attack = getWeaponAttackAbility(properties, rangeOverride);
  return attack === martAbil || attack === powAbil;
}
