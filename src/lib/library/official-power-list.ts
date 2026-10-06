/**
 * Shared official power list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/patterns';
import type { ColumnValue } from '@/components/patterns/list/grid-list-row';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import {
  derivePowerDisplay,
  formatEnergyStat,
  formatPowerDamage,
} from '@/lib/calculators/power-calc';
import {
  composedPowerCategoryDamage,
  composedPowerDamage,
  composedPowerSavedParts,
  type PowerCompositionResolution,
} from '@/lib/calculators/power-composition';
import {
  snapshotOfficialPowerForInnate,
  type InnatePowerSnapshot,
} from '@/lib/game/innate-eligibility';
import { powerVariantsDetailSection, withPowerReverseNote } from '@/lib/power-variant-chips';
import { libraryItemToPowerDocument } from '@/lib/library-selectable-builders';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  collectCategoryFilterOptions,
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
import {
  glrSurfaceDetailSections,
  mergeDetailSections,
  metadataDetailSection,
  partsProficienciesSection,
} from '@/lib/chip/list-row-metadata';
import { targetsFactChip } from '@/lib/detail-option/compact-facts';
import { parseCatalogListing } from '@/lib/library/catalog-listing';

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
  catalogListing?: LibraryPower['catalogListing'];
  /** Built-in variants resolved for browse (ADR-0029). */
  composition?: PowerCompositionResolution | undefined;
  /** Appendix G snapshot for composed powers (all parts / every duration; Alternate per variant). */
  innateSnapshot?: InnatePowerSnapshot | undefined;
}

export function buildOfficialPowerRows(
  items: LibraryPower[],
  partsDb: PowerPart[],
): OfficialPowerRow[] {
  return items.map((p) => {
    const doc = libraryItemToPowerDocument(p);
    const display = derivePowerDisplay(doc, partsDb);
    const composition = display.composition;
    const savedParts = composition ? composedPowerSavedParts(composition) : (doc.parts ?? []);
    const damage = composition ? composedPowerDamage(composition) : doc.damage;
    const damageStr = formatPowerDamage(damage);
    const parts = partChipsFromDisplay(display.partChips, { stripOptionSuffix: true });
    const categories = withDamageCategory(
      derivePartCategories(savedParts, partsDb),
      powerHasDamageCategory(composition ? composedPowerCategoryDamage(composition) : doc.damage),
    );
    return {
      id: String(p.id ?? p.docId ?? ''),
      raw: p,
      name: display.name,
      description: withPowerReverseNote(display.description, composition),
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
      catalogListing: parseCatalogListing(p.catalogListing),
      ...(composition
        ? {
            composition,
            innateSnapshot: snapshotOfficialPowerForInnate({ ...p, parts: p.parts ?? [] }, partsDb),
          }
        : {}),
    };
  });
}

/** Filter options from the same categories the rows show, including composed faces. */
export function officialPowerCategoryOptions(
  items: LibraryPower[],
  partsDb: PowerPart[],
): string[] {
  return collectCategoryFilterOptions(
    buildOfficialPowerRows(items, partsDb).map((row) => row.categories),
  );
}

export function officialPowerDetailSections(row: OfficialPowerRow) {
  const parts = partsProficienciesSection(row.parts, 'power');
  const targets = metadataDetailSection(
    [targetsFactChip(row.raw.targetedDefenses)].filter(Boolean) as ChipData[],
  );
  return mergeDetailSections(
    glrSurfaceDetailSections(
      'library-official-power',
      { trainingPoints: row.tp > 0 ? row.tp : undefined },
      parts ? [parts] : undefined,
    ),
    targets,
    powerVariantsDetailSection(row.composition),
  );
}

/** Dense browse columns — same keys as `OFFICIAL_POWER_HEADER_COLUMNS` (Library + Guided L2/L3). */
export function officialPowerRowColumns(row: OfficialPowerRow): ColumnValue[] {
  const values: Record<string, string | number> = {
    category: row.category || '-',
    energy: formatEnergyStat(typeof row.energy === 'number' ? row.energy : 0),
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
    id?: string | number | undefined;
    raw?:
      | { id?: string | number | null | undefined; docId?: string | number | null | undefined }
      | undefined;
    name?: string | undefined;
    description?: string | undefined;
    categories?: string[] | undefined;
    energy?: string | number | null | undefined;
    tp?: number | null | undefined;
    action?: string | null | undefined;
    actionTypeRaw?: string | null | undefined;
    isReaction?: boolean | undefined;
    partIds?: string[] | undefined;
    partNames?: string[] | undefined;
    category?: string | undefined;
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
