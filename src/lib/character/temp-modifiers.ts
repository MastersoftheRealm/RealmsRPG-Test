/**
 * Temp Modifier helpers (ADR-0006 / TASK-585)
 * ==========================================
 * UI convenience layered Bonus/Penalty on character values.
 * Not a GAME_RULES term — see ADR-0006 for cascade + tint contract.
 */

import type { Abilities, AbilityName, DefenseName } from '@/types/abilities';
import type { CharacterTempModifiers } from '@/types/character';

export type TempModifierScalarKey =
  | 'speed'
  | 'evasion'
  | 'damageReduction'
  | 'criticalRange'
  | 'terminal';

const SCALAR_KEYS: TempModifierScalarKey[] = [
  'speed',
  'evasion',
  'damageReduction',
  'criticalRange',
  'terminal',
];

const ABILITY_KEYS: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

const DEFENSE_KEYS: DefenseName[] = [
  'might',
  'fortitude',
  'reflex',
  'discernment',
  'mentalFortitude',
  'resolve',
];

/** Apply a sparse temp delta to a base value (null/undefined/0 → base unchanged). */
export function applyTempModifier(base: number, delta?: number | null): number {
  if (delta == null || delta === 0) return base;
  return base + delta;
}

/**
 * Value tint classes for Temp Modifier deltas.
 * Tint the VALUE only — never RollButton chrome (ADR-0006).
 * Positive → warning/gold family (same idea as over-max HP/EN); negative → danger.
 */
export function tempModifierValueClass(delta?: number | null): string {
  if (delta == null || delta === 0) return '';
  return delta > 0 ? 'text-warning-fg' : 'text-danger-fg';
}

export function getScalarTempModifier(
  mods: CharacterTempModifiers | undefined,
  key: TempModifierScalarKey
): number {
  const n = mods?.[key];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export function getAbilityTempModifier(
  mods: CharacterTempModifiers | undefined,
  ability: AbilityName
): number {
  const n = mods?.abilities?.[ability];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export function getDefenseTempModifier(
  mods: CharacterTempModifiers | undefined,
  defense: DefenseName
): number {
  const n = mods?.defenses?.[defense];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export function getSkillTempModifier(
  mods: CharacterTempModifiers | undefined,
  skillId: string
): number {
  const n = mods?.skills?.[skillId];
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

/** Whether ability temps should adjust max Health / max Energy / TP maxima. */
export function shouldApplyAbilityTempsToResourceMaxima(
  mods: CharacterTempModifiers | undefined
): boolean {
  return mods?.applyAbilityToResourceMaxima === true;
}

/**
 * When the resource-maxima toggle is on, return character with effective abilities
 * so TP / max HP / max EN consumers (e.g. `getArchetypeAbilityScore`) see cascade.
 * Default off — returns the same reference.
 */
export function withAbilitiesForResourceMaxima<
  T extends { abilities: Abilities; tempModifiers?: CharacterTempModifiers },
>(character: T): T {
  if (!shouldApplyAbilityTempsToResourceMaxima(character.tempModifiers)) {
    return character;
  }
  return {
    ...character,
    abilities: getEffectiveAbilities(character.abilities, character.tempModifiers),
  };
}

/**
 * Merge ability base + temp deltas for display/rolls.
 * Resource maxima consumers must gate with `shouldApplyAbilityTempsToResourceMaxima`.
 */
export function getEffectiveAbilities(
  abilities: Abilities,
  mods: CharacterTempModifiers | undefined
): Abilities {
  if (!mods?.abilities) return abilities;
  return {
    strength: applyTempModifier(abilities.strength, mods.abilities.strength),
    vitality: applyTempModifier(abilities.vitality, mods.abilities.vitality),
    agility: applyTempModifier(abilities.agility, mods.abilities.agility),
    acuity: applyTempModifier(abilities.acuity, mods.abilities.acuity),
    intelligence: applyTempModifier(abilities.intelligence, mods.abilities.intelligence),
    charisma: applyTempModifier(abilities.charisma, mods.abilities.charisma),
  };
}

function prunePartialRecord<T extends string>(
  record: Partial<Record<T, number>> | undefined
): Partial<Record<T, number>> | undefined {
  if (!record) return undefined;
  const next: Partial<Record<T, number>> = {};
  for (const [key, value] of Object.entries(record) as Array<[T, number | undefined]>) {
    if (typeof value === 'number' && Number.isFinite(value) && value !== 0) {
      next[key] = value;
    }
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

/**
 * Merge a sparse patch into current temps, then normalize.
 * Nested maps (abilities/defenses/skills) are shallow-merged per key.
 */
export function patchTempModifiers(
  current: CharacterTempModifiers | undefined,
  patch: CharacterTempModifiers
): CharacterTempModifiers | undefined {
  return normalizeTempModifiers({
    ...current,
    ...patch,
    abilities:
      patch.abilities !== undefined
        ? { ...current?.abilities, ...patch.abilities }
        : current?.abilities,
    defenses:
      patch.defenses !== undefined
        ? { ...current?.defenses, ...patch.defenses }
        : current?.defenses,
    skills:
      patch.skills !== undefined
        ? { ...current?.skills, ...patch.skills }
        : current?.skills,
  });
}

/** True when any ability/defense/skill/scalar temp in the given maps is non-zero. */
export function sectionHasTempModifiers(
  mods: CharacterTempModifiers | undefined,
  section: 'header' | 'abilities' | 'skills'
): boolean {
  if (!mods) return false;
  if (section === 'header') {
    return SCALAR_KEYS.some((key) => getScalarTempModifier(mods, key) !== 0);
  }
  if (section === 'abilities') {
    if (mods.abilities) {
      for (const key of ABILITY_KEYS) {
        if (getAbilityTempModifier(mods, key) !== 0) return true;
      }
    }
    if (mods.defenses) {
      for (const key of DEFENSE_KEYS) {
        if (getDefenseTempModifier(mods, key) !== 0) return true;
      }
    }
    return mods.applyAbilityToResourceMaxima === true;
  }
  if (mods.skills) {
    for (const delta of Object.values(mods.skills)) {
      if (typeof delta === 'number' && delta !== 0) return true;
    }
  }
  return false;
}

/**
 * Apply scalar temps (+ optional resource-maxima override) for sheet display.
 * Callers that opt into ability→resource maxima must pass precomputed override
 * from `calculateAllStats` with effective abilities.
 */
export function applyTempModifiersToDisplayStats<
  T extends {
    maxHealth: number;
    maxEnergy: number;
    terminal: number;
    speed: number;
    evasion: number;
  },
>(
  base: T,
  mods: CharacterTempModifiers | undefined,
  resourceMaximaOverride?: Pick<T, 'maxHealth' | 'maxEnergy' | 'terminal'>
): T {
  const resources =
    resourceMaximaOverride && shouldApplyAbilityTempsToResourceMaxima(mods)
      ? { ...base, ...resourceMaximaOverride }
      : base;

  return {
    ...resources,
    speed: applyTempModifier(resources.speed, getScalarTempModifier(mods, 'speed')),
    evasion: applyTempModifier(resources.evasion, getScalarTempModifier(mods, 'evasion')),
    terminal: applyTempModifier(resources.terminal, getScalarTempModifier(mods, 'terminal')),
  };
}

/**
 * Drop zero/empty keys so JSONB stays sparse.
 * Returns undefined when nothing remains (caller may delete the field).
 */
export function normalizeTempModifiers(
  mods: CharacterTempModifiers | undefined | null
): CharacterTempModifiers | undefined {
  if (!mods) return undefined;

  const next: CharacterTempModifiers = {};

  for (const key of SCALAR_KEYS) {
    const n = mods[key];
    if (typeof n === 'number' && Number.isFinite(n) && n !== 0) {
      next[key] = n;
    }
  }

  const abilities = prunePartialRecord(mods.abilities);
  if (abilities) next.abilities = abilities;

  const defenses = prunePartialRecord(mods.defenses);
  if (defenses) next.defenses = defenses;

  if (mods.skills) {
    const skills: Record<string, number> = {};
    for (const [id, value] of Object.entries(mods.skills)) {
      if (typeof value === 'number' && Number.isFinite(value) && value !== 0) {
        skills[id] = value;
      }
    }
    if (Object.keys(skills).length > 0) next.skills = skills;
  }

  if (mods.applyAbilityToResourceMaxima === true) {
    next.applyAbilityToResourceMaxima = true;
  }

  return Object.keys(next).length > 0 ? next : undefined;
}
