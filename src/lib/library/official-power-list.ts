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
import { glrColumnKeyFor } from '@/lib/glr';
import { officialEntityBrowseChrome } from '@/lib/glr';
import {
  glrSurfaceDetailSections,
  mergeDetailSections,
  metadataDetailSection,
  partsProficienciesSection,
} from '@/lib/chip/list-row-metadata';
import { targetsFactChip } from '@/lib/detail-option/compact-facts';
import { parseCatalogListing } from '@/lib/library/catalog-listing';

const {
  chrome: officialPowerChrome,
  grid: OFFICIAL_POWER_GRID,
  headers: OFFICIAL_POWER_HEADER_COLUMNS,
} = officialEntityBrowseChrome('power');

/** Data columns only — edit/delete/add use ListHeader `rowChrome` (not a leftover 40px track). */
export { OFFICIAL_POWER_GRID, OFFICIAL_POWER_HEADER_COLUMNS };

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
    powerVariantsDetailSection(row.composition),
    glrSurfaceDetailSections(
      'library-official-power',
      { trainingPoints: row.tp > 0 ? row.tp : undefined },
      parts ? [parts] : undefined,
    ),
    targets,
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
      ...(key === 'duration' ? { allowMultiline: true as const } : {}),
    };
  });
}
