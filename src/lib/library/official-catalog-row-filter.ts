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

export function filterOfficialPowerTechniqueRows<T extends OfficialPowerTechniqueFilterableRow>(
  rows: T[],
  search: string,
  sortItems: (items: T[]) => T[],
  kind: 'power' | 'technique',
  advanced?: PowerTechniqueFilterState,
  character?: PowerTechniqueCharacterContext | null,
  pathRecommendedIds?: ReadonlySet<string> | null,
  rulesSources?: readonly string[],
): T[] {
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
  if (advanced) {
    result = applyPowerTechniqueFilters(result, advanced, kind, character);
  }
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

export function filterOfficialArmamentRows<T extends OfficialArmamentFilterableRow>(
  rows: T[],
  search: string,
  sortItems: (items: T[]) => T[],
  filters?: ArmamentFilterState,
  characterContext?: ArmamentCharacterContext | null,
  pathRecommendedIds?: ReadonlySet<string> | null,
  rulesSources?: readonly string[],
): T[] {
  let result = applyOfficialCatalogCommonFilters(rows, search, pathRecommendedIds);
  if (filters) {
    result = applyArmamentFilters(result, filters, characterContext ?? null);
  }
  if (rulesSources && rulesSources.length > 0) {
    result = filterRowsByCodexRulesSources(result, rulesSources, readRowRulesSources);
  }
  return sortItems(result);
}
