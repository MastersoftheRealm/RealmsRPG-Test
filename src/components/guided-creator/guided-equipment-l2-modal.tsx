'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  UnifiedSelectionModal,
  PointStatus,
  type SelectableItem,
} from '@/components/shared';
import type { GuidedDraft, GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import {
  applyGuidedEquipmentL2Selection,
  buildGuidedEquipmentL2Items,
  computeL2GearSpend,
  computeL2TpSpent,
  initialSelectedIdsForPhase,
} from '@/lib/guided-creator/guided-equipment-l2';
import { pathRecommendedIdSet } from '@/lib/guided-creator/equipment-phase-candidates';
import { buildPathLoadoutPool } from '@/lib/guided-creator/loadout-pool';
import {
  buildGuidedEquipmentEligibilityContext,
  useGuidedEquipmentCatalog,
} from '@/hooks/use-guided-equipment-catalog';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import {
  l2GridColumnsForPhase,
  l2HeaderColumnsForPhase,
} from './guided-equipment-l2-grid';

const l2Copy = GUIDED_CREATOR_COPY.steps.loadout.phases.l2;

function normalizeId(id: string): string {
  return String(id).trim().toLowerCase();
}

export interface GuidedEquipmentL2ModalProps {
  isOpen: boolean;
  phase: GuidedEquipmentPhase;
  draft: GuidedDraft;
  pathLevel1: Parameters<typeof buildPathLoadoutPool>[0];
  officialItems: LibraryItem[];
  codexEquipment: CodexEquipmentItem[];
  /** Level-1 starting Currency (PointStatus total). */
  currencyStarting: number;
  /** Currency spent on weapons/armor (gear PointStatus budget base). */
  armsSpent: number;
  onClose: () => void;
  onDraftChange: (partial: Partial<GuidedDraft>) => void;
}

export function GuidedEquipmentL2Modal({
  isOpen,
  phase,
  draft,
  pathLevel1,
  officialItems,
  codexEquipment,
  currencyStarting,
  armsSpent,
  onClose,
  onDraftChange,
}: GuidedEquipmentL2ModalProps) {
  const [error, setError] = useState<string | null>(null);
  const { catalog, tpSummary, itemProperties } = useGuidedEquipmentCatalog(
    draft,
    officialItems,
    codexEquipment
  );

  const pool = useMemo(() => buildPathLoadoutPool(pathLevel1), [pathLevel1]);

  const pathRecommendedIds = useMemo(
    () => pathRecommendedIdSet(pool, phase, officialItems, codexEquipment),
    [phase, pool, officialItems, codexEquipment]
  );

  /** Gear L2 replaces draft.equipment — ceiling is starting − arms (not − current gear). */
  const gearBudget = currencyStarting - armsSpent;

  /**
   * Cross-phase TP only — current-phase draft spend is reclaimable when Confirm replaces
   * that phase's selection.
   */
  const crossPhaseTpSpent = useMemo(() => {
    const refs =
      phase === 'weapon' ? draft.loadoutArmor : phase === 'armor' ? draft.loadoutWeapons : [];
    return refs.reduce((sum, ref) => {
      const row = catalog.get(normalizeId(ref.id));
      return sum + (row?.trainingPoints ?? 0) * Math.max(1, ref.quantity);
    }, 0);
  }, [phase, draft.loadoutArmor, draft.loadoutWeapons, catalog]);

  const eligibilityCtx = useMemo(
    () =>
      buildGuidedEquipmentEligibilityContext(
        phase,
        draft,
        { spent: crossPhaseTpSpent, limit: tpSummary.limit },
        pathRecommendedIds,
        phase === 'gear' ? gearBudget : undefined
      ),
    [phase, draft, crossPhaseTpSpent, tpSummary.limit, pathRecommendedIds, gearBudget]
  );

  const items = useMemo(
    () =>
      buildGuidedEquipmentL2Items(
        phase,
        catalog,
        eligibilityCtx,
        officialItems,
        codexEquipment,
        itemProperties
      ),
    [phase, catalog, eligibilityCtx, officialItems, codexEquipment, itemProperties]
  );

  const initialSelectedIds = useMemo(
    () => initialSelectedIdsForPhase(phase, draft),
    [phase, draft]
  );

  const headerColumns = useMemo(() => l2HeaderColumnsForPhase(phase), [phase]);
  const gridColumns = useMemo(() => l2GridColumnsForPhase(phase), [phase]);

  const title =
    phase === 'weapon'
      ? l2Copy.weaponTitle
      : phase === 'armor'
        ? l2Copy.armorTitle
        : l2Copy.gearTitle;

  const description =
    phase === 'gear' ? l2Copy.gearDescription : l2Copy.description;

  const handleConfirm = useCallback(
    (selected: SelectableItem[]) => {
      const result = applyGuidedEquipmentL2Selection(
        phase,
        draft,
        selected,
        catalog,
        tpSummary.limit,
        gearBudget
      );
      if (!result.ok) {
        setError(result.message ?? l2Copy.confirmError);
        return;
      }
      setError(null);
      if (result.partial) onDraftChange(result.partial);
    },
    [phase, draft, catalog, tpSummary.limit, gearBudget, onDraftChange]
  );

  const footerExtra = useCallback(
    (selected: SelectableItem[]) => {
      const status = (
        <div className="flex flex-col gap-2">
          {error ? (
            <p
              className="font-nunito text-sm text-warning-700 dark:text-warning-400 text-center"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {phase === 'gear' ? (
            <div className="flex justify-center">
              <PointStatus
                total={gearBudget}
                spent={computeL2GearSpend(selected)}
                label={l2Copy.currencyLabel}
                variant="inline"
                metric="remaining"
                className="text-base"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <PointStatus
                total={tpSummary.limit}
                spent={computeL2TpSpent(phase, draft, selected, catalog)}
                label={l2Copy.tpLabel}
                variant="inline"
                className="text-base"
              />
            </div>
          )}
        </div>
      );
      return status;
    },
    [phase, draft, catalog, tpSummary.limit, gearBudget, error]
  );

  const confirmDisabled = useCallback(
    (selected: SelectableItem[]) => {
      if (phase === 'gear') {
        return computeL2GearSpend(selected) > gearBudget;
      }
      return computeL2TpSpent(phase, draft, selected, catalog) > tpSummary.limit;
    },
    [phase, draft, catalog, tpSummary.limit, gearBudget]
  );

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title={title}
      description={description}
      items={items}
      onConfirm={handleConfirm}
      initialSelectedIds={initialSelectedIds}
      maxSelections={phase === 'armor' ? 1 : undefined}
      showQuantity={phase === 'gear'}
      columns={headerColumns}
      gridColumns={gridColumns}
      itemLabel={phase === 'gear' ? 'item' : phase}
      emptyMessage={l2Copy.emptyMessage(phase)}
      searchPlaceholder={l2Copy.searchPlaceholder(phase)}
      footerExtra={footerExtra}
      confirmDisabled={confirmDisabled}
      size="xl"
    />
  );
}
