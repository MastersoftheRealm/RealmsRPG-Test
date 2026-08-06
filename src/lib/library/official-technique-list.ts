/**
 * Shared official technique list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { TechniquePart } from '@/hooks/codex-types';
import type { LibraryTechnique } from '@/types/library';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  derivePartCategories,
  formatPartCategoriesColumn,
} from '@/lib/library/power-technique-categories';
import {
  applyPowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';

/** Data columns only — edit/delete/add use ListHeader `rowChrome`. */
export const OFFICIAL_TECHNIQUE_GRID = '1.4fr 1fr 0.7fr 0.7fr 0.9fr 1fr 1fr';

export const OFFICIAL_TECHNIQUE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'category', label: 'CATEGORY', align: 'center' as const },
  { key: 'energy', label: 'ENERGY', align: 'center' as const },
  { key: 'tp', label: 'TP', align: 'center' as const },
  { key: 'action', label: 'ACTION', align: 'center' as const },
  { key: 'weapon', label: 'ATTACK', align: 'center' as const },
  { key: 'damage', label: 'DAMAGE', align: 'center' as const },
];

export interface OfficialTechniqueRow {
  id: string;
  raw: LibraryTechnique;
  name: string;
  description: string;
  categories: string[];
  category: string;
  energy: string | number | undefined;
  tp: number;
  action: string | undefined;
  actionTypeRaw: string | undefined;
  isReaction: boolean;
  weapon: string;
  damage: string;
  parts: ChipData[];
  partIds: string[];
  partNames: string[];
}

export function getEmpoweredTechniqueTotals(item: LibraryTechnique & {
  totals?: { energy?: number; trainingPoints?: number };
}): { energy?: number; tp?: number } {
  const totals = item.totals;
  const energy = typeof totals?.energy === 'number' ? totals.energy : undefined;
  const tp = typeof totals?.trainingPoints === 'number' ? totals.trainingPoints : undefined;
  return { energy, tp };
}

export function buildOfficialTechniqueRows(
  items: LibraryTechnique[],
  partsDb: TechniquePart[],
  mode: 'standard' | 'empowered' = 'standard'
): OfficialTechniqueRow[] {
  return items.map((t) => {
    const empowered = mode === 'empowered';
    const savedParts: NonNullable<TechniqueDocument['parts']> = Array.isArray(t.parts)
      ? (t.parts as NonNullable<TechniqueDocument['parts']>)
      : [];
    const doc: TechniqueDocument = {
      name: String(t.name ?? ''),
      description: String(t.description ?? ''),
      parts: savedParts,
      damage: Array.isArray(t.damage)
        ? (t.damage[0] as TechniqueDocument['damage'])
        : (t.damage as TechniqueDocument['damage']),
      attackMode: t.attackMode,
      weaponName: t.weaponName,
      weapon: t.weapon as TechniqueDocument['weapon'],
      actionType: t.actionType,
      isReaction: t.isReaction,
    };
    const display = deriveTechniqueDisplay(doc, partsDb);
    const totals = empowered ? getEmpoweredTechniqueTotals(t) : {};
    const damageStr = formatTechniqueDamage(doc.damage);
    const parts = empowered
      ? []
      : partChipsFromDisplay(display.partChips, { stripOptionSuffix: true });
    const categories = empowered ? [] : derivePartCategories(savedParts, partsDb);
    return {
      id: String(t.id ?? t.docId ?? ''),
      raw: t,
      name: display.name,
      description: display.description,
      categories,
      category: formatPartCategoriesColumn(categories),
      energy: empowered ? (totals.energy ?? display.energy) : display.energy,
      tp: empowered ? (totals.tp ?? display.tp) : display.tp,
      action: display.actionType,
      actionTypeRaw: t.actionType ?? display.actionType,
      isReaction: t.isReaction === true,
      weapon: display.weaponName || '-',
      damage: damageStr,
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

export function filterOfficialTechniqueRows<
  T extends {
    name?: string;
    description?: string;
    weapon?: string;
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
        String(x.weapon ?? '').toLowerCase().includes(s) ||
        String(x.category ?? '').toLowerCase().includes(s)
    );
  }
  if (advanced) {
    result = applyPowerTechniqueFilters(result, advanced, 'technique', character);
  }
  return sortItems(result);
}
