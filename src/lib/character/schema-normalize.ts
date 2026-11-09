/**
 * Character schema normalization — save/load boundary (TASK-663).
 *
 * Canonical persisted fields:
 * - defenseVals (not defenseSkills)
 * - mart_prof / pow_prof (not martialProficiency / powerProficiency)
 * - archetype.type: ArchetypeCategory ('powered-martial', not legacy 'mixed')
 *
 * Armor item DR uses damageReduction at display time; armorValue/armor are read
 * fallbacks in deriveArmorItemCombatStats — not persisted on lean equipment rows.
 */

import { coerceCharacterAgeValue } from '@/lib/character/appearance-age';
import type { ArchetypeCategory, Character, DefenseSkills } from '@/types';

const LEGACY_ARCHETYPE_TYPE_ALIASES: Record<string, ArchetypeCategory> = {
  mixed: 'powered-martial',
};

/** Normalize stored archetype.type vocabulary to ArchetypeCategory. */
export function normalizeArchetypeCategoryValue(
  type: string | undefined | null,
): ArchetypeCategory | undefined {
  if (!type) return undefined;
  const alias = LEGACY_ARCHETYPE_TYPE_ALIASES[type];
  if (alias) return alias;
  if (type === 'power' || type === 'martial' || type === 'powered-martial') {
    return type;
  }
  return undefined;
}

/** Dual-read defense allocation from legacy or canonical field names. */
export function resolveDefenseVals(
  data: Pick<Character, 'defenseVals' | 'defenseSkills'> | Record<string, unknown>,
): DefenseSkills | undefined {
  const record = data as Record<string, unknown>;
  return (record.defenseVals ?? record.defenseSkills) as DefenseSkills | undefined;
}

export function resolveMartProf(data: Record<string, unknown>): number | undefined {
  const mart = data.mart_prof ?? data.martialProficiency;
  return typeof mart === 'number' ? mart : undefined;
}

export function resolvePowProf(data: Record<string, unknown>): number | undefined {
  const pow = data.pow_prof ?? data.powerProficiency;
  return typeof pow === 'number' ? pow : undefined;
}

/** JSONB stores milestone level keys as strings; coerce to numeric levels. */
export function normalizeArchetypeChoices(
  raw: Record<string | number, unknown> | undefined | null,
): Record<number, 'innate' | 'feat'> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<number, 'innate' | 'feat'> = {};
  for (const [key, value] of Object.entries(raw)) {
    const level = Number(key);
    if (!Number.isFinite(level) || level < 1) continue;
    if (value === 'innate' || value === 'feat') out[level] = value;
  }
  return out;
}

const LEGACY_CHARACTER_FIELD_KEYS = [
  'defenseSkills',
  'martialProficiency',
  'powerProficiency',
] as const;

/**
 * Promote legacy character field aliases to canonical keys (single path for load and save).
 */
function applyLegacyCharacterFieldAliases(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): void {
  const defenseVals = resolveDefenseVals(source);
  if (defenseVals !== undefined) {
    target.defenseVals = defenseVals;
  }

  const martProf = resolveMartProf(source);
  if (martProf !== undefined) {
    target.mart_prof = martProf;
  }

  const powProf = resolvePowProf(source);
  if (powProf !== undefined) {
    target.pow_prof = powProf;
  }

  const archetype = source.archetype;
  if (archetype && typeof archetype === 'object') {
    const arch = { ...(archetype as Record<string, unknown>) };
    const normalizedType = normalizeArchetypeCategoryValue(arch.type as string | undefined);
    if (normalizedType) arch.type = normalizedType;
    target.archetype = arch;
  }

  for (const key of LEGACY_CHARACTER_FIELD_KEYS) {
    delete target[key];
  }
}

/**
 * Merge legacy aliases into canonical fields on load and strip legacy keys.
 */
export function normalizeCharacterOnLoad<T extends Record<string, unknown>>(data: T): T {
  const next: Record<string, unknown> = { ...data };

  applyLegacyCharacterFieldAliases(next, next);

  if (next.archetypeChoices !== undefined) {
    next.archetypeChoices = normalizeArchetypeChoices(
      next.archetypeChoices as Record<string | number, unknown>,
    );
  }

  if ('age' in next) {
    const age = coerceCharacterAgeValue(next.age);
    if (age) next.age = age;
    else delete next.age;
  }

  return next as T;
}

/** Strip legacy aliases and normalize canonical fields before persistence. */
export function normalizeCharacterForSave(
  data: Record<string, unknown>,
  legacySource?: Character | Record<string, unknown>,
): void {
  const legacyRecord = legacySource as Record<string, unknown> | undefined;
  const merged = legacyRecord ? { ...legacyRecord, ...data } : data;

  applyLegacyCharacterFieldAliases(data, merged);
}
