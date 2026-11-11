'use client';

import { useMemo, useState } from 'react';
import { usePathListFilter } from '@/hooks';
import {
  POWER_LIST_PATH_KINDS,
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

/** Realms / My Library browse filter state for powers and techniques (DUP-09). */
export function useOfficialPowerTechniqueBrowseFilters<
  T extends PathRecommendationEntity,
>(options: {
  kind: 'power' | 'technique';
  entities: readonly T[];
  pathFilterEnabled?: boolean | undefined;
}) {
  const { kind, entities, pathFilterEnabled = true } = options;

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
      enabled: pathFilterEnabled,
    });

  const effectivePathFilterActive = pathFilterEnabled && pathFilterActive;
  const pathRecommendedIdsForFilter = pathFilterEnabled ? pathRecommendedIds : null;

  const filterActiveCount = useMemo(
    () =>
      countActivePowerTechniqueFilters(advancedFilters, kind, Boolean(characterContext)) +
      countActiveCodexRulesSourceFilters(rulesSources) +
      (characterFilterId ? 1 : 0) +
      (effectivePathFilterActive ? 1 : 0),
    [
      kind,
      advancedFilters,
      characterContext,
      rulesSources,
      characterFilterId,
      effectivePathFilterActive,
    ],
  );

  return {
    advancedFilters,
    setAdvancedFilters,
    characterContext,
    setCharacterContext,
    characterFilterId,
    setCharacterFilterId,
    rulesSources,
    setRulesSources,
    selectedPathIds,
    setSelectedPathIds,
    pathIndex,
    pathRecommendedIds: pathRecommendedIdsForFilter,
    pathFilterActive: effectivePathFilterActive,
    filterActiveCount,
  };
}
