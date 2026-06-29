'use client';

import { useMemo } from 'react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useCodexArchetypes } from '@/hooks/use-codex';
import { parseArchetypePathData } from '@/lib/game/archetype-path';
import type { ArchetypePathData } from '@/types/archetype';

/**
 * Resolved path_data for the active creator session.
 * Prefers draft.archetype.path_data; falls back to codex by archetypePathId when missing
 * (e.g. Playwright seeds, stale localStorage, or lean draft saves).
 */
export function useCreatorPathData(): ArchetypePathData | undefined {
  const draft = useCharacterCreatorStore((s) => s.draft);
  const { data: codexArchetypes = [] } = useCodexArchetypes();

  return useMemo(() => {
    const fromDraft = parseArchetypePathData(draft.archetype?.path_data);
    const draftHasContent = Boolean(
      fromDraft?.level1 &&
        (fromDraft.level1.feats?.length ||
          fromDraft.level1.skills?.length ||
          fromDraft.level1.powers?.length ||
          fromDraft.level1.techniques?.length ||
          fromDraft.level1.armaments?.length ||
          fromDraft.level1.equipment?.length ||
          fromDraft.level1.guidance_groups?.length ||
          fromDraft.level1.recommended_species?.length ||
          fromDraft.level1.notes?.trim())
    );
    if (draftHasContent || draft.creationMode !== 'path') return fromDraft;

    const lookupId = draft.archetypePathId ?? draft.archetype?.id;
    if (!lookupId) return fromDraft;

    const codexMatch = codexArchetypes.find((a) => String(a.id) === String(lookupId));
    if (!codexMatch?.path_data) return fromDraft;

    return parseArchetypePathData(codexMatch.path_data) ?? fromDraft;
  }, [
    draft.archetype?.path_data,
    draft.archetype?.id,
    draft.archetypePathId,
    draft.creationMode,
    codexArchetypes,
  ]);
}
