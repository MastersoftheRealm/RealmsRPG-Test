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
} {
  const archetypePathId = useGuidedCreatorStore((s) => s.draft.archetypePathId);
  const { data: codexArchetypes = [] } = useCodexArchetypes();

  return useMemo(() => {
    if (!archetypePathId) return { archetype: undefined, pathData: undefined };
    const archetype = (codexArchetypes as Archetype[]).find(
      (a) => String(a.id) === String(archetypePathId)
    );
    if (!archetype) return { archetype: undefined, pathData: undefined };
    return {
      archetype,
      pathData: parseArchetypePathData(archetype.path_data),
    };
  }, [archetypePathId, codexArchetypes]);
}
