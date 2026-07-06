/**
 * Layer 1 stat chips/lines for guided equipment choice cards.
 */

import { formatDamageDisplay } from '@/lib/utils';
import { formatRange, type ItemPropertyPayload } from '@/lib/calculators/item-calc';
import {
  getWeaponAttackAbility,
  hasThrownProperty,
  hasTwoHandedProperty,
  weaponAttackAbilityLabel,
  type WeaponPropertyRef,
} from '@/lib/game/weapon-attack-ability';
import type { LoadoutItemCategory } from '@/lib/guided-creator/resolve-loadout-items';

const SIGNATURE_PROPERTY_NAMES = new Set([
  'cleave',
  'reach',
  'versatile',
  'quick',
  'loading',
  'ammunition',
  'block',
]);

function normalizePropName(ref: WeaponPropertyRef): string {
  if (typeof ref === 'string') return ref.trim().toLowerCase();
  return String(ref.name ?? '').trim().toLowerCase();
}

function handednessLabel(properties: WeaponPropertyRef[] | undefined): string {
  if (hasTwoHandedProperty(properties)) return 'Two-handed';
  if (hasThrownProperty(properties)) return 'Thrown';
  const range = formatRange((properties ?? []) as ItemPropertyPayload[]);
  if (range.toLowerCase() !== 'melee') return 'Ranged';
  return 'One-handed';
}

function rangeLabel(properties: WeaponPropertyRef[] | undefined): string | undefined {
  const range = formatRange((properties ?? []) as ItemPropertyPayload[]);
  if (range.toLowerCase() === 'melee') return undefined;
  return range;
}

function signatureProperties(properties: WeaponPropertyRef[] | undefined, max = 2): string[] {
  const out: string[] = [];
  for (const p of properties ?? []) {
    const name = normalizePropName(p);
    if (!name || name.includes('requirement')) continue;
    if (SIGNATURE_PROPERTY_NAMES.has(name) || name === 'finesse') {
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      if (!out.includes(label)) out.push(label);
    }
    if (out.length >= max) break;
  }
  return out;
}

export interface EquipmentPhaseCardStats {
  tags: string[];
  primaryLine?: string;
  secondaryLine?: string;
}

export interface BuildPhaseCardStatsInput {
  category: LoadoutItemCategory;
  properties?: WeaponPropertyRef[];
  damageLine?: string;
  damageReduction?: number | null;
  agilityPenalty?: number | null;
  shortUse?: string;
}

/** Build compact stats for GuidedChoiceCard on weapon/armor/gear phases. */
export function buildEquipmentPhaseCardStats(input: BuildPhaseCardStatsInput): EquipmentPhaseCardStats {
  const { category, properties, damageLine, damageReduction, agilityPenalty, shortUse } = input;

  if (category === 'weapon') {
    const tags = [handednessLabel(properties)];
    const range = rangeLabel(properties);
    if (range) tags.push(range);
    tags.push(...signatureProperties(properties));

    const attack = getWeaponAttackAbility(properties);
    const primaryLine = damageLine ? `Damage: ${damageLine}` : undefined;
    const secondaryLine = `${weaponAttackAbilityLabel(attack)} attack`;

    return { tags, primaryLine, secondaryLine };
  }

  if (category === 'armor') {
    const tags: string[] = [];
    if (damageReduction != null) tags.push(`DR ${damageReduction}`);
    if (agilityPenalty != null && agilityPenalty !== 0) {
      tags.push(`Agility ${agilityPenalty > 0 ? '+' : ''}${agilityPenalty}`);
    }
    return {
      tags,
      primaryLine: damageReduction != null ? `Damage reduction ${damageReduction}` : undefined,
    };
  }

  return {
    tags: [],
    primaryLine: shortUse,
  };
}

/** Format library damage array for card display. */
export function formatWeaponDamageLine(
  damage: Array<{ amount?: number | string; size?: number | string; type?: string }> | undefined
): string | undefined {
  if (!damage?.length) return undefined;
  const formatted = formatDamageDisplay(damage[0]);
  return formatted || undefined;
}
