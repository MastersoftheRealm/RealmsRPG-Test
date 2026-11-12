/**
 * Shared search / path / rules-source filtering for official Library list row helpers.
 */

import {
  filterRowsByCodexRulesSources,
  readRowRulesSources,
} from '@/lib/codex/list-rules-source-filter';
import {
  libraryRowPathIds,
  rowMatchesPathRecommendedIds,
} from '@/lib/game/path-recommendation-index';
import { applyArmamentFilters, type ArmamentFilterState } from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import {
  applyPowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import type { AbilityRequirement, WeaponPropertyRef } from '@/lib/game/weapon-attack-ability';

type CatalogRowWithPath = {
  id?: string | number | undefined;
  raw?:
    | { id?: string | number | null | undefined; docId?: string | number | null | undefined }
    | undefined;
  name?: string | undefined;
  description?: string | undefined;
};

function applyOfficialCatalogCommonFilters<T extends CatalogRowWithPath>(
  rows: T[],
  search: string,
  pathRecommendedIds: ReadonlySet<string> | null | undefined,
  matchesExtraSearch?: (row: T, searchLower: string) => boolean,
): T[] {
  let result = rows;
  if (pathRecommendedIds) {
    result = result.filter((x) =>
      rowMatchesPathRecommendedIds(libraryRowPathIds(x), pathRecommendedIds),
    );
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter((x) => {
      const inNameOrDescription =
        String(x.name ?? '')
          .toLowerCase()
          .includes(s) ||
        String(x.description ?? '')
          .toLowerCase()
          .includes(s);
      return inNameOrDescription || (matchesExtraSearch?.(x, s) ?? false);
    });
  }
  return result;
}

export type OfficialPowerTechniqueFilterableRow = CatalogRowWithPath & {
  categories?: string[] | undefined;
  energy?: string | number | null | undefined;
  tp?: number | null | undefined;
  action?: string | null | undefined;
  actionTypeRaw?: string | null | undefined;
  isReaction?: boolean | undefined;
  partIds?: string[] | undefined;
  partNames?: string[] | undefined;
  category?: string | undefined;
  weapon?: string | undefined;
};

export type OfficialPowerTechniqueRowFilters = {
  pathRecommendedIds?: ReadonlySet<string> | null;
  advanced?: PowerTechniqueFilterState;
  character?: PowerTechniqueCharacterContext | null;
  rulesSources?: readonly string[];
};

export function filterOfficialPowerTechniqueRows<T extends OfficialPowerTechniqueFilterableRow>({
  rows,
  search,
  sortItems,
  kind,
  rowFilters,
}: {
  rows: T[];
  search: string;
  sortItems: (items: T[]) => T[];
  kind: 'power' | 'technique';
  rowFilters?: OfficialPowerTechniqueRowFilters | null;
}): T[] {
  const pathRecommendedIds = rowFilters?.pathRecommendedIds ?? null;
  let result = applyOfficialCatalogCommonFilters(
    rows,
    search,
    pathRecommendedIds,
    (x, s) =>
      String(x.category ?? '')
        .toLowerCase()
        .includes(s) ||
      (kind === 'technique'
        ? String(x.weapon ?? '')
            .toLowerCase()
            .includes(s)
        : false),
  );
  const advanced = rowFilters?.advanced;
  const character = rowFilters?.character;
  if (advanced) {
    result = applyPowerTechniqueFilters(result, advanced, kind, character ?? null);
  }
  const rulesSources = rowFilters?.rulesSources;
  if (rulesSources && rulesSources.length > 0) {
    result = filterRowsByCodexRulesSources(result, rulesSources, readRowRulesSources);
  }
  return sortItems(result);
}

export type OfficialArmamentFilterableRow = CatalogRowWithPath & {
  currency?: number | null | undefined;
  tp?: number | null | undefined;
  rarity?: string | null | undefined;
  abilityReq?: AbilityRequirement | null | undefined;
  properties?: WeaponPropertyRef[] | undefined;
};

export type OfficialArmamentRowFilters = {
  pathRecommendedIds?: ReadonlySet<string> | null;
  armament?: ArmamentFilterState;
  character?: ArmamentCharacterContext | null;
  rulesSources?: readonly string[];
};

export function filterOfficialArmamentRows<T extends OfficialArmamentFilterableRow>({
  rows,
  search,
  sortItems,
  rowFilters,
}: {
  rows: T[];
  search: string;
  sortItems: (items: T[]) => T[];
  rowFilters?: OfficialArmamentRowFilters | null;
}): T[] {
  const pathRecommendedIds = rowFilters?.pathRecommendedIds ?? null;
  let result = applyOfficialCatalogCommonFilters(rows, search, pathRecommendedIds);
  const filters = rowFilters?.armament;
  const characterContext = rowFilters?.character;
  if (filters) {
    result = applyArmamentFilters(result, filters, characterContext ?? null);
  }
  const rulesSources = rowFilters?.rulesSources;
  if (rulesSources && rulesSources.length > 0) {
    result = filterRowsByCodexRulesSources(result, rulesSources, readRowRulesSources);
  }
  return sortItems(result);
}
