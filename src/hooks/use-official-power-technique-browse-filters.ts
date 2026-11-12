'use client';

import { useMemo, useState } from 'react';
import { usePathListFilter } from './use-path-recommendation-index';
import {
  POWER_LIST_PATH_KINDS,
  pathFilterEmptyTitle,
  type PathRecommendationEntity,
  type PathRecommendationKindInput,
} from '@/lib/game/path-recommendation-index';
import { countActiveCodexRulesSourceFilters } from '@/lib/codex/list-rules-source-filter';
import {
  EMPTY_POWER_TECHNIQUE_FILTERS,
  countActivePowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import type { OfficialPowerTechniqueRowFilters } from '@/lib/library/official-catalog-row-filter';

/**
 * Browse filter state for powers and techniques on **My Library tabs** and **Official*List** surfaces.
 * Same PowerTechniqueFilters UX as Codex; not used for creator modals (they keep local state).
 */
export function useOfficialPowerTechniqueBrowseFilters<
  T extends PathRecommendationEntity,
>(options: {
  kind: 'power' | 'technique';
  entities: readonly T[];
  /** When false, row filtering and filter badge count are off (empowered techniques tab). Matches master. */
  rowFiltersEnabled?: boolean | undefined;
}) {
  const { kind, entities, rowFiltersEnabled = true } = options;

  const [advancedFilters, setAdvancedFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS,
  );
  const [characterContext, setCharacterContext] = useState<PowerTechniqueCharacterContext | null>(
    null,
  );
  const [characterFilterId, setCharacterFilterId] = useState('');
  const [rulesSources, setRulesSources] = useState<string[]>([]);

  const pathKind: PathRecommendationKindInput =
    kind === 'power' ? POWER_LIST_PATH_KINDS : 'techniques';
  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({
      entities,
      kind: pathKind,
      enabled: rowFiltersEnabled,
    });

  const rowFilters = useMemo((): OfficialPowerTechniqueRowFilters | null => {
    if (!rowFiltersEnabled) return null;
    return {
      pathRecommendedIds,
      advanced: advancedFilters,
      character: characterContext,
      rulesSources,
    };
  }, [rowFiltersEnabled, pathRecommendedIds, advancedFilters, characterContext, rulesSources]);

  const filterActiveCount = useMemo(() => {
    if (!rowFiltersEnabled) return undefined;
    return (
      countActivePowerTechniqueFilters(advancedFilters, kind, Boolean(characterContext)) +
      countActiveCodexRulesSourceFilters(rulesSources) +
      (characterFilterId ? 1 : 0) +
      (pathFilterActive ? 1 : 0)
    );
  }, [
    rowFiltersEnabled,
    kind,
    advancedFilters,
    characterContext,
    rulesSources,
    characterFilterId,
    pathFilterActive,
  ]);

  const pathEmptyListTitle =
    rowFiltersEnabled && pathFilterActive
      ? pathFilterEmptyTitle(kind === 'power' ? 'powers' : 'techniques')
      : undefined;

  return {
    advancedFilters,
    setAdvancedFilters,
    setCharacterContext,
    characterFilterId,
    setCharacterFilterId,
    rulesSources,
    setRulesSources,
    selectedPathIds,
    setSelectedPathIds,
    pathIndex,
    rowFilters,
    pathFilterActive,
    filterActiveCount,
    pathEmptyListTitle,
  };
}
