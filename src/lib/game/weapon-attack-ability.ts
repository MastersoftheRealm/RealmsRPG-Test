/**
 * Weapon attack ability resolution — single source for sheet + guided equipment.
 * @see GAME_RULES.md — Melee/Thrown → Strength, Ranged → Acuity, Finesse → Agility
 */

import { formatRange, type ItemPropertyPayload } from '@/lib/calculators/item-calc';
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
  | { id?: number; name?: string; op_1_lvl?: number };

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
  properties: WeaponPropertyRef[] | undefined
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
  abilities: Abilities
): boolean {
  if (!req) return true;
  const key = ABILITY_KEY_MAP[req.name.toLowerCase()];
  if (!key) return true;
  return (abilities[key] ?? 0) >= req.level;
}

function normalizePropertyName(ref: WeaponPropertyRef): string {
  if (typeof ref === 'string') return ref.trim().toLowerCase();
  return String(ref.name ?? '').trim().toLowerCase();
}

function hasPropertyId(ref: WeaponPropertyRef, id: number): boolean {
  if (typeof ref === 'object' && ref != null && ref.id === id) return true;
  return false;
}

function propertyList(properties: WeaponPropertyRef[] | undefined): WeaponPropertyRef[] {
  return properties ?? [];
}

export function hasFinesseProperty(properties: WeaponPropertyRef[] | undefined): boolean {
  return propertyList(properties).some(
    (p) => hasPropertyId(p, PROPERTY_IDS.FINESSE) || normalizePropertyName(p) === 'finesse'
  );
}

export function hasThrownProperty(properties: WeaponPropertyRef[] | undefined): boolean {
  return propertyList(properties).some(
    (p) => hasPropertyId(p, PROPERTY_IDS.THROWN) || normalizePropertyName(p) === 'thrown'
  );
}

export function hasTwoHandedProperty(properties: WeaponPropertyRef[] | undefined): boolean {
  return propertyList(properties).some(
    (p) =>
      hasPropertyId(p, PROPERTY_IDS.TWO_HANDED) ||
      normalizePropertyName(p) === 'two-handed' ||
      normalizePropertyName(p) === 'two handed'
  );
}

/**
 * Resolve which ability applies to weapon attacks.
 * Priority: Finesse → Agility | Thrown → Strength | non-melee Range → Acuity | else Strength
 */
export function getWeaponAttackAbility(
  properties: WeaponPropertyRef[] | undefined,
  rangeOverride?: string | null
): WeaponAttackAbility {
  if (hasFinesseProperty(properties)) return 'agility';
  if (hasThrownProperty(properties)) return 'strength';

  const rangeStr =
    rangeOverride?.trim() ||
    formatRange((properties ?? []) as ItemPropertyPayload[]);
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
  rangeOverride?: string | null
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
  rangeOverride?: string | null
): boolean {
  const attack = getWeaponAttackAbility(properties, rangeOverride);
  return attack === martAbil || attack === powAbil;
}
