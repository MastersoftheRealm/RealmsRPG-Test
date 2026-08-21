'use client';

import { useMemo } from 'react';
import { useCodexArchetypes } from '@/hooks';
import { parseArchetypePathData } from '@/lib/game/archetype-path';
import type { Archetype, ArchetypePathData } from '@/types/archetype';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';

/**
 * Resolves the selected path's parsed level-1 data for the guided creator,
 * looked up from codex by the guided draft's `archetypePathId`.
 */
export function useGuidedPathData(): {
  archetype: Archetype | undefined;
  pathData: ArchetypePathData | undefined;
  /** True while codex archetypes are loading and a path id is selected. */
  isLoading: boolean;
} {
  const archetypePathId = useGuidedCreatorStore((s) => s.draft.archetypePathId);
  const { data: codexArchetypes = [], isLoading: archetypesLoading } = useCodexArchetypes();

  return useMemo(() => {
    const isLoading = Boolean(archetypePathId) && archetypesLoading;
    if (!archetypePathId) {
      return { archetype: undefined, pathData: undefined, isLoading: false };
    }
    const archetype = (codexArchetypes as Archetype[]).find(
      (a) => String(a.id) === String(archetypePathId),
    );
    if (!archetype) {
      return { archetype: undefined, pathData: undefined, isLoading };
    }
    return {
      archetype,
      pathData: parseArchetypePathData(archetype.path_data),
      isLoading,
    };
  }, [archetypePathId, codexArchetypes, archetypesLoading]);
}
