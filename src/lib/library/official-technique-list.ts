/**
 * Shared official technique list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { ColumnValue } from '@/components/shared/grid-list-row';
import type { TechniquePart } from '@/hooks/codex-types';
import type { LibraryTechnique } from '@/types/library';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import { libraryItemToTechniqueDocument } from '@/lib/library-selectable-builders';
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
import {
  libraryRowPathIds,
  rowMatchesPathRecommendedIds,
} from '@/lib/game/path-recommendation-index';

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

export function getEmpoweredTechniqueTotals(
  item: LibraryTechnique & {
    totals?: { energy?: number; trainingPoints?: number };
  },
): { energy?: number; tp?: number } {
  const totals = item.totals;
  const energy = typeof totals?.energy === 'number' ? totals.energy : undefined;
  const tp = typeof totals?.trainingPoints === 'number' ? totals.trainingPoints : undefined;
  return { energy, tp };
}

export function buildOfficialTechniqueRows(
  items: LibraryTechnique[],
  partsDb: TechniquePart[],
  mode: 'standard' | 'empowered' = 'standard',
): OfficialTechniqueRow[] {
  return items.map((t) => {
    const empowered = mode === 'empowered';
    const doc = libraryItemToTechniqueDocument(t);
    const savedParts = doc.parts ?? [];
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
      partIds: savedParts.map((part) => (part.id != null ? String(part.id) : '')).filter(Boolean),
      partNames: savedParts
        .map((part) => (part.name != null ? String(part.name) : ''))
        .filter(Boolean),
    };
  });
}

/** Dense browse columns — same keys as `OFFICIAL_TECHNIQUE_HEADER_COLUMNS` (Library + Guided L2/L3). */
export function officialTechniqueRowColumns(row: OfficialTechniqueRow): ColumnValue[] {
  return [
    { key: 'category', value: row.category || '-', align: 'center' },
    { key: 'energy', value: row.energy ?? '-', highlight: true, align: 'center' },
    { key: 'tp', value: row.tp, align: 'center' },
    { key: 'action', value: row.action || '-', align: 'center' },
    { key: 'weapon', value: row.weapon || '-', align: 'center' },
    { key: 'damage', value: row.damage || '-', align: 'center' },
  ];
}

export function filterOfficialTechniqueRows<
  T extends {
    id?: string | number;
    raw?: { id?: string | number | null; docId?: string | number | null };
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
  character?: PowerTechniqueCharacterContext | null,
  pathRecommendedIds?: ReadonlySet<string> | null,
): T[] {
  let result = rows;
  if (pathRecommendedIds) {
    result = result.filter((x) =>
      rowMatchesPathRecommendedIds(libraryRowPathIds(x), pathRecommendedIds),
    );
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (x) =>
        String(x.name ?? '')
          .toLowerCase()
          .includes(s) ||
        String(x.description ?? '')
          .toLowerCase()
          .includes(s) ||
        String(x.weapon ?? '')
          .toLowerCase()
          .includes(s) ||
        String(x.category ?? '')
          .toLowerCase()
          .includes(s),
    );
  }
  if (advanced) {
    result = applyPowerTechniqueFilters(result, advanced, 'technique', character);
  }
  return sortItems(result);
}
