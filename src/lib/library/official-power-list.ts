/**
 * Shared official power list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { ColumnValue } from '@/components/shared/grid-list-row';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { libraryItemToPowerDocument } from '@/lib/library-selectable-builders';
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
import {
  libraryRowPathIds,
  rowMatchesPathRecommendedIds,
} from '@/lib/game/path-recommendation-index';
import { glrColumnKeyFor, glrListChrome } from '@/lib/glr';
import { glrSurfaceDetailSections, partsProficienciesSection } from '@/lib/chip/list-row-metadata';

const officialPowerChrome = glrListChrome({ entityType: 'power', mode: 'browse' });

/** Data columns only — edit/delete/add use ListHeader `rowChrome` (not a leftover 40px track). */
export const OFFICIAL_POWER_GRID = officialPowerChrome.grid;

export const OFFICIAL_POWER_HEADER_COLUMNS = officialPowerChrome.headers.map(
  ({ key, label, align }) => ({
    key,
    label,
    align: align ?? ('center' as const),
  }),
);

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
  partsDb: PowerPart[],
): OfficialPowerRow[] {
  return items.map((p) => {
    const doc = libraryItemToPowerDocument(p);
    const savedParts = doc.parts ?? [];
    const display = derivePowerDisplay(doc, partsDb);
    const damageStr = formatPowerDamage(doc.damage);
    const parts = partChipsFromDisplay(display.partChips, { stripOptionSuffix: true });
    const categories = withDamageCategory(
      derivePartCategories(savedParts, partsDb),
      powerHasDamageCategory(doc.damage),
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
      partIds: savedParts.map((part) => (part.id != null ? String(part.id) : '')).filter(Boolean),
      partNames: savedParts
        .map((part) => (part.name != null ? String(part.name) : ''))
        .filter(Boolean),
    };
  });
}

export function officialPowerDetailSections(row: OfficialPowerRow) {
  const parts = partsProficienciesSection(row.parts, 'power');
  return glrSurfaceDetailSections(
    'library-official-power',
    { trainingPoints: row.tp > 0 ? row.tp : undefined },
    parts ? [parts] : undefined,
  );
}

/** Dense browse columns — same keys as `OFFICIAL_POWER_HEADER_COLUMNS` (Library + Guided L2/L3). */
export function officialPowerRowColumns(row: OfficialPowerRow): ColumnValue[] {
  const values: Record<string, string | number> = {
    category: row.category || '-',
    energy: row.energy ?? '-',
    action: row.action || '-',
    duration: row.duration || '-',
    range: row.range || '-',
    area: row.area || '-',
    damage: row.damage || '-',
  };
  return officialPowerChrome.layout.columnFacts.map((id) => {
    const key = glrColumnKeyFor(id, 'power', 'browse');
    return {
      key,
      value: values[key] ?? '-',
      highlight: id === 'energy' ? true : undefined,
      align: 'center' as const,
    };
  });
}

export function filterOfficialPowerRows<
  T extends {
    id?: string | number;
    raw?: { id?: string | number | null; docId?: string | number | null };
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
        String(x.category ?? '')
          .toLowerCase()
          .includes(s),
    );
  }
  if (advanced) {
    result = applyPowerTechniqueFilters(result, advanced, 'power', character);
  }
  return sortItems(result);
}
