/**
 * Shared enrichment + display helpers for character sheet library lists.
 */

import { formatRange } from '@/lib/calculators/item-calc';
import { formatDamageDisplay } from '@/lib/utils';
import {
  characterPartsToPartData,
  itemPropertiesToPartData,
  type CodexPartRow,
  type CodexPropertyRow,
} from '@/lib/library/part-display';
import type { PartData } from '@/components/shared';
import type { Abilities, CharacterPower, CharacterTechnique, Item } from '@/types';

export type CodexPart = CodexPartRow;
export type CodexProperty = CodexPropertyRow;

export type ItemWithLibrarySource = Item & {
  libraryItem?: { properties?: Item['properties'] };
};

export function partsToPartData(
  parts?: CharacterPower['parts'] | CharacterTechnique['parts'],
  codexParts: CodexPart[] = [],
  variant: 'power' | 'technique' = 'power'
): PartData[] {
  return characterPartsToPartData(parts, codexParts, variant);
}

export const propertiesToPartData = itemPropertiesToPartData;

export function chipDescriptionWithOptionLevels(
  baseDescription: string | undefined,
  optionLevels: PartData['optionLevels']
): string | undefined {
  const parts: string[] = [];
  if (baseDescription?.trim()) parts.push(baseDescription.trim());
  if (optionLevels) {
    const opts: string[] = [];
    if ((optionLevels.opt1 ?? 0) > 0) opts.push(`Option 1: Lv.${optionLevels.opt1}`);
    if ((optionLevels.opt2 ?? 0) > 0) opts.push(`Option 2: Lv.${optionLevels.opt2}`);
    if ((optionLevels.opt3 ?? 0) > 0) opts.push(`Option 3: Lv.${optionLevels.opt3}`);
    if (opts.length > 0) parts.push(opts.join('; '));
  }
  return parts.length > 0 ? parts.join('\n\n') : undefined;
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatArea(area: string | undefined): string {
  if (!area) return '-';
  const lower = area.toLowerCase().trim();
  if (lower === '1 target' || lower === 'single target' || lower === 'target') return 'Target';
  return capitalizeWords(area);
}

export function formatDuration(duration: string | undefined): string {
  if (!duration) return '-';
  const lower = duration.toLowerCase().trim();
  const withoutParens = lower.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (withoutParens === 'instant' || withoutParens === 'instantaneous') return 'Instant';
  if (withoutParens === 'concentration') return 'Conc.';
  const minMatch = withoutParens.match(/^(\d+)\s*min(ute)?s?$/);
  if (minMatch) return `${minMatch[1]} MIN`;
  const rndMatch = withoutParens.match(/^(\d+)\s*rounds?$/);
  if (rndMatch) return rndMatch[1] === '1' ? '1 RND' : `${rndMatch[1]} RNDS`;
  const hrMatch = withoutParens.match(/^(\d+)\s*hours?$/);
  if (hrMatch) return hrMatch[1] === '1' ? '1 HR' : `${hrMatch[1]} HRS`;
  const dayMatch = withoutParens.match(/^(\d+)\s*days?$/);
  if (dayMatch) return dayMatch[1] === '1' ? '1 Day' : `${dayMatch[1]} Days`;
  if (withoutParens === 'permanent') return 'Permanent';
  return capitalizeWords(withoutParens);
}

export function formatDamageType(damage: string | undefined): string {
  if (!damage) return '-';
  return capitalizeWords(damage);
}

export function resolveItemProperties(item: ItemWithLibrarySource): Item['properties'] | undefined {
  const fromLib = item.libraryItem?.properties;
  if (fromLib && fromLib.length > 0) return fromLib as Item['properties'];
  return item.properties;
}

export function getWeaponAttackBonus(
  weapon: Item,
  abilities?: Abilities,
  martialProficiency?: number
): { bonus: number; abilityName: string } {
  const prof = martialProficiency ?? 0;
  if (!abilities) return { bonus: prof, abilityName: 'Strength' };

  const props = (weapon.properties || []).map((p) =>
    typeof p === 'string' ? p : (p as { name?: string }).name || ''
  );

  if (props.some((p) => p.toLowerCase() === 'finesse')) {
    return { bonus: (abilities.agility ?? 0) + prof, abilityName: 'Agility' };
  }

  const rangeStr = formatRange((weapon.properties || []) as { id?: number; name?: string; op_1_lvl?: number }[]);
  if (rangeStr.toLowerCase() !== 'melee') {
    return { bonus: (abilities.acuity ?? 0) + prof, abilityName: 'Acuity' };
  }

  return { bonus: (abilities.strength ?? 0) + prof, abilityName: 'Strength' };
}

export function partDataToChips(parts: PartData[]) {
  return parts.map((p) => ({
    name: p.name,
    description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
    cost: p.tpCost,
    costLabel: 'TP',
    category: p.tpCost && p.tpCost > 0 ? ('cost' as const) : ('default' as const),
    level: p.optionLevels
      ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) || undefined
      : undefined,
    options: p.options,
  }));
}

export function splitDamageDiceAndType(damage: unknown): { dice: string; type: string; rollStr: string } {
  if (!damage) return { dice: '-', type: '', rollStr: '-' };
  if (typeof damage === 'string') {
    const str = damage.trim();
    const match = str.match(/^([\dd+\-\s]+)(?:\s+(.+))?$/);
    if (!match) return { dice: str, type: '', rollStr: str };
    return { dice: match[1].trim(), type: (match[2] ?? '').trim(), rollStr: str };
  }
  const formatted = formatDamageDisplay(damage as never);
  const str = formatted ? String(formatted) : '-';
  const match = str.match(/^([\dd+\-\s]+)(?:\s+(.+))?$/);
  if (!match) return { dice: str, type: '', rollStr: str };
  return { dice: match[1].trim(), type: (match[2] ?? '').trim(), rollStr: str };
}
