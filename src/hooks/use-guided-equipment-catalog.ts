/**
 * Shared guided equipment catalog + eligibility context.
 */

'use client';

import { useMemo } from 'react';
import { useGameRules, useItemProperties } from '@/hooks';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import { buildEquipmentCatalogRows } from '@/lib/guided-creator/equipment-catalog-rows';
import { computeGuidedLoadoutTpSummary } from '@/lib/guided-creator/loadout-tp';
import type {
  EquipmentEligibilityContext,
  EquipmentPhase,
} from '@/lib/guided-creator/equipment-eligibility';
import { mergeLibraryBySource, type LibrarySourceScope } from '@/lib/library/source-scope';

export function useGuidedEquipmentCatalog(
  draft: GuidedDraft,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  options?: {
    userItems?: LibraryItem[] | undefined;
    source?: LibrarySourceScope | undefined;
  },
) {
  const { rules } = useGameRules();
  const { data: itemProperties = [] } = useItemProperties();
  const userItems = useMemo(() => options?.userItems ?? [], [options?.userItems]);
  const source = options?.source ?? 'public';

  const selectedIds = useMemo(
    () =>
      [...draft.loadoutWeapons, ...draft.loadoutArmor, ...draft.equipment].map((r) => String(r.id)),
    [draft.loadoutWeapons, draft.loadoutArmor, draft.equipment],
  );

  const scopedOfficial = useMemo(
    () => mergeLibraryBySource(source, officialItems, userItems, selectedIds),
    [source, officialItems, userItems, selectedIds],
  );
  const scopedCodex = useMemo(
    () => (source === 'my' ? [] : codexEquipment),
    [source, codexEquipment],
  );

  const allOfficial = useMemo(
    () => mergeLibraryBySource('all', officialItems, userItems),
    [officialItems, userItems],
  );

  const catalog = useMemo(
    () => buildEquipmentCatalogRows(scopedOfficial, scopedCodex, itemProperties),
    [scopedOfficial, scopedCodex, itemProperties],
  );

  const tpSummary = useMemo(
    () => computeGuidedLoadoutTpSummary(draft, allOfficial, codexEquipment, itemProperties, rules),
    [draft, allOfficial, codexEquipment, itemProperties, rules],
  );

  return { catalog, tpSummary, itemProperties, rules, scopedOfficial, allOfficial };
}

export function buildGuidedEquipmentEligibilityContext(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  tpSummary: { spent: number; limit: number },
  pathRecommendedIds: Set<string>,
  remainingCurrency?: number,
): EquipmentEligibilityContext {
  return {
    phase,
    abilities: draft.abilities,
    martAbil: draft.mart_abil,
    powAbil: draft.pow_abil,
    archetypeType: draft.archetypeType,
    pathRecommendedIds,
    selectedTpSpent: tpSummary.spent,
    tpLimit: tpSummary.limit,
    remainingCurrency,
  };
}
