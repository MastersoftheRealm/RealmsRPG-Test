'use client';

import { useMemo, useState, useCallback, type ReactNode } from 'react';
import {
  UnifiedSelectionModal,
  LoadoutBudgetBar,
  type SelectableItem,
} from '@/components/shared';
import { ArchetypePathFilter } from '@/components/shared/filters';
import { usePathListFilter } from '@/hooks';
import {
  applyLivePathFilter,
  pathFilterEmptyTitle,
  selectableItemPathIds,
} from '@/lib/game/path-recommendation-index';
import type { GuidedDraft, GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import type { EligibleEquipmentRow } from '@/lib/guided-creator/equipment-eligibility';
import {
  applyGuidedEquipmentL2Selection,
  computeL2CurrencySpent,
  computeL2TpSpent,
  initialSelectedIdsForPhase,
  pathRecommendationKindForEquipmentPhase,
} from '@/lib/guided-creator/guided-equipment-l2';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import {
  l2GridColumnsForPhase,
  l2HeaderColumnsForPhase,
} from './guided-equipment-l2-grid';

const l2Copy = GUIDED_CREATOR_COPY.steps.loadout.phases.l2;

export interface GuidedEquipmentL2ModalProps {
  isOpen: boolean;
  phase: GuidedEquipmentPhase;
  draft: GuidedDraft;
  /** Shared catalog + L2 items from the step (single `useGuidedEquipmentCatalog` + L2 hook). */
  catalog: Map<string, EligibleEquipmentRow>;
  items: SelectableItem[];
  tpLimit: number;
  /** Level-1 starting Currency — PointStatus total and the ceiling for every phase. */
  currencyStarting: number;
  scopeExtra?: ReactNode;
  onClose: () => void;
  onDraftChange: (partial: Partial<GuidedDraft>) => void;
}

export function GuidedEquipmentL2Modal({
  isOpen,
  phase,
  draft,
  catalog,
  items,
  tpLimit,
  currencyStarting,
  scopeExtra,
  onClose,
  onDraftChange,
}: GuidedEquipmentL2ModalProps) {
  const [error, setError] = useState<string | null>(null);

  const initialSelectedIds = useMemo(
    () => initialSelectedIdsForPhase(phase, draft),
    [phase, draft]
  );

  const {
    selectedPathIds,
    setSelectedPathIds,
    pathIndex,
    pathRecommendedIds: pathMatchIds,
    pathFilterActive,
  } = usePathListFilter({
    entities: items,
    kind: pathRecommendationKindForEquipmentPhase(phase),
    autoSelectType: draft.archetypeType,
    autoSelectWhen: isOpen,
  });

  const visibleItems = useMemo(
    () =>
      applyLivePathFilter(items, {
        pathMatchIds,
        pathIndex,
        selectedPathIds,
        keepIds: initialSelectedIds,
        idsForItem: selectableItemPathIds,
      }),
    [items, pathMatchIds, pathIndex, selectedPathIds, initialSelectedIds]
  );

  const initialQuantities = useMemo(() => {
    if (phase !== 'gear') return {};
    const next: Record<string, number> = {};
    for (const row of draft.equipment) {
      next[String(row.id)] = Math.max(1, Math.floor(Number(row.quantity)) || 1);
    }
    return next;
  }, [phase, draft.equipment]);

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
        tpLimit,
        currencyStarting
      );
      if (!result.ok) {
        setError(result.message ?? l2Copy.confirmError);
        return;
      }
      setError(null);
      if (result.partial) onDraftChange(result.partial);
    },
    [phase, draft, catalog, tpLimit, currencyStarting, onDraftChange]
  );

  const footerExtra = useCallback(
    (selected: SelectableItem[]) => {
      const currencySpent = computeL2CurrencySpent(phase, draft, selected, catalog);
      const tpSpent = computeL2TpSpent(phase, draft, selected, catalog);
      return (
        <LoadoutBudgetBar
          currencyTotal={currencyStarting}
          currencySpent={currencySpent}
          tpTotal={tpLimit}
          tpSpent={tpSpent}
          currencyLabel={l2Copy.currencyLabel}
          trainingPointsLabel={l2Copy.tpLabel}
        >
          {error ? (
            <p className="font-nunito text-sm text-warning-fg text-center" role="alert">
              {error}
            </p>
          ) : null}
        </LoadoutBudgetBar>
      );
    },
    [phase, draft, catalog, tpLimit, currencyStarting, error]
  );

  const confirmDisabled = useCallback(
    (selected: SelectableItem[]) => {
      if (computeL2CurrencySpent(phase, draft, selected, catalog) > currencyStarting) return true;
      if (phase === 'gear') return false;
      return computeL2TpSpent(phase, draft, selected, catalog) > tpLimit;
    },
    [phase, draft, catalog, tpLimit, currencyStarting]
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
      items={visibleItems}
      onConfirm={handleConfirm}
      initialSelectedIds={initialSelectedIds}
      maxSelections={phase === 'armor' ? 1 : undefined}
      showQuantity={phase === 'gear'}
      initialQuantities={initialQuantities}
      columns={headerColumns}
      gridColumns={gridColumns}
      itemLabel={phase === 'gear' ? 'item' : phase}
      emptyMessage={
        pathFilterActive
          ? pathFilterEmptyTitle(phase === 'weapon' ? 'weapons' : phase === 'armor' ? 'armor' : 'gear')
          : l2Copy.emptyMessage(phase)
      }
      searchPlaceholder={l2Copy.searchPlaceholder(phase)}
      scopeExtra={scopeExtra}
      filterContent={
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ArchetypePathFilter
            options={pathIndex.options}
            selectedPathIds={selectedPathIds}
            onChange={setSelectedPathIds}
          />
        </div>
      }
      showFilters
      optionsDefaultExpanded
      optionsActiveCount={pathFilterActive ? 1 : 0}
      footerExtra={footerExtra}
      confirmDisabled={confirmDisabled}
      size="xl"
    />
  );
}
