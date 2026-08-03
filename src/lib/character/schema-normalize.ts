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

/**
 * Merge legacy aliases into canonical fields on load and strip legacy keys.
 */
export function normalizeCharacterOnLoad<T extends Record<string, unknown>>(data: T): T {
  const next: Record<string, unknown> = { ...data };

  const defenseVals = resolveDefenseVals(next);
  if (defenseVals !== undefined) {
    next.defenseVals = defenseVals;
  }

  const martProf = resolveMartProf(next);
  if (martProf !== undefined) {
    next.mart_prof = martProf;
  }

  const powProf = resolvePowProf(next);
  if (powProf !== undefined) {
    next.pow_prof = powProf;
  }

  const archetype = next.archetype;
  if (archetype && typeof archetype === 'object') {
    const arch = { ...(archetype as Record<string, unknown>) };
    const normalizedType = normalizeArchetypeCategoryValue(arch.type as string | undefined);
    if (normalizedType) arch.type = normalizedType;
    next.archetype = arch;
  }

  for (const key of LEGACY_CHARACTER_FIELD_KEYS) {
    delete next[key];
  }

  return next as T;
}

const LEGACY_CHARACTER_FIELD_KEYS = [
  'defenseSkills',
  'martialProficiency',
  'powerProficiency',
] as const;

/** Strip legacy aliases and normalize canonical fields before persistence. */
export function normalizeCharacterForSave(
  data: Record<string, unknown>,
  legacySource?: Character | Record<string, unknown>,
): void {
  const legacyRecord = legacySource as Record<string, unknown> | undefined;
  const merged = legacyRecord ? { ...legacyRecord, ...data } : data;

  const defenseVals = resolveDefenseVals(merged);
  if (defenseVals !== undefined) {
    data.defenseVals = defenseVals;
  }

  const martProf = resolveMartProf(merged);
  if (martProf !== undefined) {
    data.mart_prof = martProf;
  }

  const powProf = resolvePowProf(merged);
  if (powProf !== undefined) {
    data.pow_prof = powProf;
  }

  const archetype = merged.archetype ?? data.archetype;
  if (archetype && typeof archetype === 'object') {
    const arch = { ...(archetype as Record<string, unknown>) };
    const normalizedType = normalizeArchetypeCategoryValue(arch.type as string | undefined);
    if (normalizedType) arch.type = normalizedType;
    data.archetype = arch;
  }

  for (const key of LEGACY_CHARACTER_FIELD_KEYS) {
    delete data[key];
  }
}
