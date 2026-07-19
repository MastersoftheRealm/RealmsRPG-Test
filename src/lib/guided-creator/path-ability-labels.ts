/**
 * Resolve Primary / Secondary Ability labels for guided path cards, deep-dives, and select.
 * Mirrors admin Primary Ability / Secondary Ability fields with pow/mart fallbacks.
 *
 * DESIGN_INTENT: GAME_RULES still names governing scores “Archetype Ability” (and for
 * Powered-Martial, Power/Martial Archetype Abilities). Guided creator UI labels them
 * Primary / Secondary Ability per owner product language — same fields, different words.
 */

import type { AbilityName, Archetype } from '@/types';

export interface PathAbilityLabels {
  primary: AbilityName | null;
  secondary: AbilityName | null;
}

function asAbility(value: unknown): AbilityName | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().toLowerCase() as AbilityName;
}

/**
 * Primary = governing archetype ability; Secondary = distinct recommended/paired ability.
 * Powered-Martial: power side is Primary, martial side is Secondary.
 */
export function resolvePathAbilityLabels(path: Archetype): PathAbilityLabels {
  const pathType = (path.type || 'power') as Archetype['type'];

  if (pathType === 'powered-martial') {
    const primary =
      asAbility(path.archetype_ability) ?? asAbility(path.pow_abil) ?? null;
    const secondary =
      asAbility(path.secondary_ability) ?? asAbility(path.mart_abil) ?? null;
    return {
      primary,
      secondary: secondary && secondary !== primary ? secondary : null,
    };
  }

  if (pathType === 'martial') {
    const primary =
      asAbility(path.mart_abil) ??
      asAbility(path.archetype_ability) ??
      asAbility(path.secondary_ability) ??
      null;
    const secondaryRaw = asAbility(path.secondary_ability);
    return {
      primary,
      secondary:
        secondaryRaw && secondaryRaw !== primary ? secondaryRaw : null,
    };
  }

  const primary =
    asAbility(path.archetype_ability) ?? asAbility(path.pow_abil) ?? null;
  const secondaryRaw = asAbility(path.secondary_ability);
  return {
    primary,
    secondary: secondaryRaw && secondaryRaw !== primary ? secondaryRaw : null,
  };
}
