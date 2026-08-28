/**
 * Guided equipment Layer 2 catalog — items + budget context shared by the L2 modal
 * (`GuidedEquipmentL2Modal`) and the L3 inline catalog (`LoadoutStep`), so eligibility,
 * ranking, and TP/currency budgets never diverge between the two (TASK-684).
 *
 * Callers pass the base `useGuidedEquipmentCatalog` result so the catalog is built once
 * per step (not again inside this hook or the modal).
 */

'use client';

import { useMemo } from 'react';
import type { GuidedDraft, GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import {
  buildGuidedEquipmentEligibilityContext,
  useGuidedEquipmentCatalog,
} from './use-guided-equipment-catalog';
import {
  buildGuidedEquipmentL2Items,
  crossPhaseTpSpent,
} from '@/lib/guided-creator/guided-equipment-l2';
import { pathRecommendedIdSet } from '@/lib/guided-creator/equipment-phase-candidates';
import { buildPathLoadoutPool } from '@/lib/guided-creator/loadout-pool';

type GuidedEquipmentCatalogBase = Pick<
  ReturnType<typeof useGuidedEquipmentCatalog>,
  'catalog' | 'tpSummary' | 'itemProperties'
>;

export function useGuidedEquipmentL2Catalog(
  phase: GuidedEquipmentPhase,
  draft: GuidedDraft,
  pathLevel1: Parameters<typeof buildPathLoadoutPool>[0],
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  /** Level-1 starting Currency (PointStatus total). */
  currencyStarting: number,
  /** Currency spent on weapons/armor (gear PointStatus budget base). */
  armsSpent: number,
  /** Shared base catalog from the step — avoids a second `useGuidedEquipmentCatalog`. */
  base: GuidedEquipmentCatalogBase,
) {
  const { catalog, tpSummary, itemProperties } = base;

  const pool = useMemo(() => buildPathLoadoutPool(pathLevel1), [pathLevel1]);

  const pathRecommendedIds = useMemo(
    () => pathRecommendedIdSet(pool, phase, officialItems, codexEquipment),
    [phase, pool, officialItems, codexEquipment],
  );

  /** Ceiling is starting − arms (not − current Equipment selection). */
  const gearBudget = currencyStarting - armsSpent;

  /**
   * Cross-phase TP only — current-phase draft spend is reclaimable when Confirm/inline
   * toggle replaces that phase's selection.
   */
  const crossPhaseTp = useMemo(
    () => crossPhaseTpSpent(phase, draft, catalog),
    [phase, draft, catalog],
  );

  const eligibilityCtx = useMemo(
    () =>
      buildGuidedEquipmentEligibilityContext(
        phase,
        draft,
        { spent: crossPhaseTp, limit: tpSummary.limit },
        pathRecommendedIds,
        phase === 'gear' ? gearBudget : undefined,
      ),
    [phase, draft, crossPhaseTp, tpSummary.limit, pathRecommendedIds, gearBudget],
  );

  const items = useMemo(
    () =>
      buildGuidedEquipmentL2Items(
        phase,
        catalog,
        eligibilityCtx,
        officialItems,
        codexEquipment,
        itemProperties,
      ),
    [phase, catalog, eligibilityCtx, officialItems, codexEquipment, itemProperties],
  );

  return { catalog, tpSummary, itemProperties, eligibilityCtx, items, gearBudget };
}
