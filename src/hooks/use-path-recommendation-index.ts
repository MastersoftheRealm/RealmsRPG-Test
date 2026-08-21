'use client';

import { useMemo, useState } from 'react';
import { useCodexArchetypes } from '@/hooks/use-codex';
import { listPlayerVisiblePaths } from '@/lib/game/archetype-edit';
import {
  buildPathRecommendationIndex,
  EMPTY_PATH_RECOMMENDATION_INDEX,
  pathIdsForArchetypeType,
  pathRecommendedEntityIds,
  type PathRecommendationEntity,
  type PathRecommendationIndex,
  type PathRecommendationKindInput,
} from '@/lib/game/path-recommendation-index';
import type { Archetype } from '@/types';
import type { ArchetypeCategory, ArchetypePathData } from '@/types/archetype';

/**
 * Archetype Path recommendation index for a browse list (ADR-0014 / TASK-751).
 *
 * Reads the live path arrays from the `['codex', 'archetypes']` query — no extra fetch, store, or
 * cached copy, so an admin path save (which invalidates the `['codex']` prefix) applies immediately.
 * Filtering a list of feats therefore downloads archetypes, not the whole codex (TASK-775).
 */
export function usePathRecommendationIndex({
  entities,
  kind,
  enabled = true,
}: {
  entities: readonly PathRecommendationEntity[] | undefined;
  kind: PathRecommendationKindInput;
  enabled?: boolean | undefined;
}): PathRecommendationIndex {
  const { data: codexArchetypes = [] } = useCodexArchetypes({ enabled });
  const kindsKey = typeof kind === 'string' ? kind : kind.join(',');

  return useMemo(() => {
    if (!enabled || !entities?.length) return EMPTY_PATH_RECOMMENDATION_INDEX;
    const paths = listPlayerVisiblePaths(codexArchetypes as Archetype[]).map((path) => ({
      id: String(path.id),
      name: path.name,
      type: path.type,
      path_data: path.path_data as ArchetypePathData | undefined,
    }));
    return buildPathRecommendationIndex({ paths, entities, kind });
    // kindsKey is the value identity for `kind` (array literals would rebuild every render).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kindsKey
  }, [codexArchetypes, entities, kindsKey, enabled]);
}

/** Selection + resolved id union for one browse list (TASK-752 / TASK-753). */
export function usePathListFilter({
  entities,
  kind,
  enabled = true,
  autoSelectType,
  autoSelectWhen = true,
}: {
  entities: readonly PathRecommendationEntity[] | undefined;
  kind: PathRecommendationKindInput;
  enabled?: boolean | undefined;
  /** When set and the user has not touched the control, select every player-visible path of this type. */
  autoSelectType?: ArchetypeCategory | null | undefined;
  /** Skip auto-select while false (closed modal). Custom / no-path catalogs omit `autoSelectType`. */
  autoSelectWhen?: boolean | undefined;
}) {
  const [selectedPathIds, setSelectedPathIds] = useState<string[] | null>(null);
  const pathIndex = usePathRecommendationIndex({ entities, kind, enabled });
  const resolvedSelectedPathIds = useMemo(() => {
    if (selectedPathIds !== null) return selectedPathIds;
    if (autoSelectType && autoSelectWhen && pathIndex.options.length > 0) {
      return pathIdsForArchetypeType(pathIndex.options, autoSelectType);
    }
    return [];
  }, [selectedPathIds, autoSelectType, autoSelectWhen, pathIndex]);
  const pathRecommendedIds = useMemo(
    () =>
      resolvedSelectedPathIds.length > 0
        ? pathRecommendedEntityIds(pathIndex, resolvedSelectedPathIds)
        : null,
    [pathIndex, resolvedSelectedPathIds],
  );

  return {
    selectedPathIds: resolvedSelectedPathIds,
    setSelectedPathIds: (pathIds: string[]) => setSelectedPathIds(pathIds),
    pathIndex,
    pathRecommendedIds,
    pathFilterActive: resolvedSelectedPathIds.length > 0,
  };
}
