/**
 * In-context ability effect blurbs for the character creator (Layer 1).
 * No DB change — REALMS_PRODUCT_OVERVIEW.md Appendix C.
 */

import type { AbilityName } from '@/types';

export const ABILITY_EFFECT_BLURBS: Record<AbilityName, string> = {
  strength:
    'Physical power — affects Might defense, melee damage, and feats that rely on raw force.',
  vitality:
    'Life and endurance — affects Fortitude defense, maximum Health, and staying power in combat.',
  agility:
    'Speed and reflexes — affects Reflex defense, Evasion, and finesse-based actions.',
  acuity:
    'Perception and precision — affects Discernment defense and ranged accuracy.',
  intelligence:
    'Knowledge and focus — affects Mental Fortitude defense and analytical skills.',
  charisma:
    'Presence and will — affects Resolve defense, social skills, and leadership.',
};

export function formatAbilityLabel(name: AbilityName): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
