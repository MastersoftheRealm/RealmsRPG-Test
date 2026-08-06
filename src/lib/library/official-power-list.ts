/**
 * Shared official power list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  derivePartCategories,
  formatPartCategoriesColumn,
  powerHasDamageCategory,
  withDamageCategory,
} from '@/lib/library/power-technique-categories';
import {
  applyPowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';

/** Data columns only — edit/delete/add use ListHeader `rowChrome` (not a leftover 40px track). */
export const OFFICIAL_POWER_GRID = '1.4fr 1fr 0.7fr 0.9fr 0.9fr 0.7fr 0.9fr 0.9fr';

export const OFFICIAL_POWER_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'category', label: 'CATEGORY', align: 'center' as const },
  { key: 'energy', label: 'ENERGY', align: 'center' as const },
  { key: 'action', label: 'ACTION', align: 'center' as const },
  { key: 'duration', label: 'DURATION', align: 'center' as const },
  { key: 'range', label: 'RANGE', align: 'center' as const },
  { key: 'area', label: 'AREA', align: 'center' as const },
  { key: 'damage', label: 'DAMAGE', align: 'center' as const },
];

export interface OfficialPowerRow {
  id: string;
  raw: LibraryPower;
  name: string;
  description: string;
  categories: string[];
  category: string;
  energy: string | number | undefined;
  action: string | undefined;
  actionTypeRaw: string | undefined;
  isReaction: boolean;
  duration: string | undefined;
  range: string | undefined;
  area: string | undefined;
  damage: string;
  tp: number;
  parts: ChipData[];
  partIds: string[];
  partNames: string[];
}

export function buildOfficialPowerRows(
  items: LibraryPower[],
  partsDb: PowerPart[]
): OfficialPowerRow[] {
  return items.map((p) => {
    const savedParts: NonNullable<PowerDocument['parts']> = Array.isArray(p.parts)
      ? (p.parts as NonNullable<PowerDocument['parts']>)
      : [];
    const doc: PowerDocument = {
      name: String(p.name ?? ''),
      description: String(p.description ?? ''),
      parts: savedParts,
      damage: p.damage as PowerDocument['damage'],
      actionType: p.actionType,
      isReaction: p.isReaction,
      range: p.range as PowerDocument['range'],
      area: p.area as PowerDocument['area'],
      duration: p.duration as PowerDocument['duration'],
    };
    const display = derivePowerDisplay(doc, partsDb);
    const damageStr = formatPowerDamage(doc.damage);
    const parts = partChipsFromDisplay(display.partChips, { stripOptionSuffix: true });
    const categories = withDamageCategory(
      derivePartCategories(savedParts, partsDb),
      powerHasDamageCategory(doc.damage)
    );
    return {
      id: String(p.id ?? p.docId ?? ''),
      raw: p,
      name: display.name,
      description: display.description,
      categories,
      category: formatPartCategoriesColumn(categories),
      energy: display.energy,
      action: display.actionType,
      actionTypeRaw: p.actionType ?? display.actionType,
      isReaction: p.isReaction === true,
      duration: display.duration,
      range: display.range,
      area: display.area,
      damage: damageStr,
      tp: display.tp,
      parts,
      partIds: savedParts
        .map((part) => (part.id != null ? String(part.id) : ''))
        .filter(Boolean),
      partNames: savedParts
        .map((part) => (part.name != null ? String(part.name) : ''))
        .filter(Boolean),
    };
  });
}

export function filterOfficialPowerRows<
  T extends {
    name?: string;
    description?: string;
    categories?: string[];
    energy?: string | number | null;
    tp?: number | null;
    action?: string | null;
    actionTypeRaw?: string | null;
    isReaction?: boolean;
    partIds?: string[];
    partNames?: string[];
    category?: string;
  },
>(
  rows: T[],
  search: string,
  sortItems: (items: T[]) => T[],
  advanced?: PowerTechniqueFilterState,
  character?: PowerTechniqueCharacterContext | null
): T[] {
  let result = rows;
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (x) =>
        String(x.name ?? '').toLowerCase().includes(s) ||
        String(x.description ?? '').toLowerCase().includes(s) ||
        String(x.category ?? '').toLowerCase().includes(s)
    );
  }
  if (advanced) {
    result = applyPowerTechniqueFilters(result, advanced, 'power', character);
  }
  return sortItems(result);
}
