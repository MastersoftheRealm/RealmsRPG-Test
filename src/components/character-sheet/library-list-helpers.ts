/**
 * Shared enrichment + display helpers for character sheet library lists.
 */

import { getWeaponAttackBonusFromProperties } from '@/lib/game/weapon-attack-ability';
import { formatDamageDisplay } from '@/lib/utils';
import {
  characterPartsToPartData,
  itemPropertiesToPartData,
  type CodexPartRow,
  type CodexPropertyRow,
} from '@/lib/library/part-display';
import { TRAINING_POINTS_COST_LABEL } from '@/lib/detail-option/compact-facts';
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
  const props = resolveItemProperties(weapon) ?? weapon.properties ?? [];
  const { bonus, abilityName } = getWeaponAttackBonusFromProperties(
    props as { id?: number; name?: string; op_1_lvl?: number }[],
    abilities,
    martialProficiency
  );
  return { bonus, abilityName };
}

export function partDataToChips(parts: PartData[]) {
  return parts.map((p) => {
    const hasOptions = (p.options?.length ?? 0) > 0;
    const hasCost = (p.tpCost ?? 0) > 0;
    return {
      name: p.name,
      description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
      cost: p.tpCost,
      costLabel: TRAINING_POINTS_COST_LABEL,
      category: hasCost ? ('cost' as const) : ('default' as const),
      level: p.optionLevels
        ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) ||
          undefined
        : undefined,
      options: p.options,
      // Expand only when option levels need disclosure; otherwise descriptor + InfoTippy.
      kind: hasOptions ? ('expandable' as const) : ('descriptor' as const),
    };
  });
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
