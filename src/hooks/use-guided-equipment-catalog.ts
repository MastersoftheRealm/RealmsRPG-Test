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

export function useGuidedEquipmentCatalog(
  draft: GuidedDraft,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
) {
  const { rules } = useGameRules();
  const { data: itemProperties = [] } = useItemProperties();

  const catalog = useMemo(
    () => buildEquipmentCatalogRows(officialItems, codexEquipment, itemProperties),
    [officialItems, codexEquipment, itemProperties]
  );

  const tpSummary = useMemo(
    () =>
      computeGuidedLoadoutTpSummary(
        draft,
        officialItems,
        codexEquipment,
        itemProperties,
        rules
      ),
    [draft, officialItems, codexEquipment, itemProperties, rules]
  );

  return { catalog, tpSummary, itemProperties, rules };
}

export function buildGuidedEquipmentEligibilityContext(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  tpSummary: { spent: number; limit: number },
  pathRecommendedIds: Set<string>,
  remainingCurrency?: number
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
