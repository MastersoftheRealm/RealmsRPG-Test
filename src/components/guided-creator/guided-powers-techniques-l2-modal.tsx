/**
 * Guided powers/techniques L2 — UnifiedSelectionModal (TASK-463 / TASK-471 / TASK-573).
 * Innate mode: add-path uses applyInnateSelection (last-in energy swap, TASK-727).
 */

'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  UnifiedSelectionModal,
  LoadoutBudgetBar,
  PointStatus,
  InfoTippy,
  type SelectableItem,
} from '@/components/patterns';
import { innateEnergyHelp, innatePowersHelp } from '../../../public/tooltip-text';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import type { Abilities, AbilityName } from '@/types';
import { ArchetypePathFilter } from '@/components/patterns/filters';
import { usePathListFilter } from '@/hooks';
import {
  applyLivePathFilter,
  pathFilterEmptyTitle,
  selectableItemPathIds,
} from '@/lib/game/path-recommendation-index';
import type { ArchetypeCategory } from '@/types/archetype';
import {
  buildPowersTechniquesL2Items,
  computeL2PowersTechniquesTpSpent,
  powersTechniquesL2Grid,
  powersTechniquesL2Headers,
  selectedIdsFromL2Items,
  pathRecommendationKindForL2,
  type PowersTechniquesL2Mode,
} from '@/lib/guided-creator/powers-techniques-l2';
import type { PowersTechniquesKind } from '@/lib/guided-creator/power-technique-display';
import {
  applyInnateSelection,
  innateSelectionBlockMessage,
} from '@/lib/guided-creator/powers-techniques-step-helpers';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;
const l2Copy = ptCopy.l2;

export interface GuidedPowersTechniquesL2ModalProps {
  isOpen: boolean;
  kind: PowersTechniquesKind;
  mode: PowersTechniquesL2Mode;
  items: Array<LibraryPower | LibraryTechnique>;
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
  initialSelectedIds: string[];
  /**
   * Shared TP already spent outside this modal's selection
   * (loadout + the other powers track: innate vs regular).
   */
  loadoutTpSpent: number;
  tpLimit: number;
  archetypeAbility?: AbilityName | string | null | undefined;
  abilities?: Partial<Abilities> | null | undefined;
  /** Innate mode budgets. */
  innateThreshold?: number | undefined;
  innateEnergyMax?: number | undefined;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  /** SourceFilter — always-visible `scopeExtra` (same as L3), not collapsed Filters. */
  scopeExtra?: ReactNode | undefined;
  /** Same-type auto-select on path See more. Omit on custom / no-path. */
  autoSelectPathType?: ArchetypeCategory | null | undefined;
}

function energySpentOf(selected: SelectableItem[]): number {
  return selected.reduce((sum, row) => {
    const data = row.data as { energy?: number | undefined } | undefined;
    return sum + Math.max(0, Math.floor(data?.energy ?? 0));
  }, 0);
}

function l2InnateEnergyOf(items: SelectableItem[], id: string): number | undefined {
  const row = items.find((item) => String(item.id) === id);
  const data = row?.data as { energy?: number | undefined } | undefined;
  return data?.energy;
}

function l2InnateTpOf(items: SelectableItem[], id: string): number {
  const row = items.find((item) => String(item.id) === id);
  const data = row?.data as { tpCost?: number | undefined } | undefined;
  if (data?.tpCost != null) return data.tpCost;
  return Math.max(0, Math.floor(row?.totalCost ?? 0));
}

/** Innate Energy PointStatus for Powers L1 budget bar + innate L2 footer (TASK-706 / TASK-726). */
export function InnateEnergyPointStatus({ total, spent }: { total: number; spent: number }) {
  return (
    <PointStatus
      total={total}
      spent={spent}
      label={ptCopy.innateEnergyLabel}
      labelAccessory={
        <InfoTippy content={innateEnergyHelp} label="Innate Energy help" size="inline" />
      }
      variant="inline"
    />
  );
}

/** Innate Powers heading (i) — L1 cards + L3 inline catalog (TASK-726). */
export function InnatePowersHelpTip() {
  return <InfoTippy content={innatePowersHelp} label="Innate Powers help" size="inline" />;
}

export function GuidedPowersTechniquesL2Modal({
  isOpen,
  kind,
  mode,
  items,
  powerPartsDb,
  techniquePartsDb,
  initialSelectedIds,
  loadoutTpSpent,
  tpLimit,
  archetypeAbility,
  abilities,
  innateThreshold = 0,
  innateEnergyMax = 0,
  onClose,
  onConfirm,
  scopeExtra,
  autoSelectPathType,
}: GuidedPowersTechniquesL2ModalProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    selectedPathIds,
    setSelectedPathIds,
    pathIndex,
    pathRecommendedIds: pathMatchIds,
    pathFilterActive,
  } = usePathListFilter({
    entities: items,
    kind: pathRecommendationKindForL2(kind, mode),
    autoSelectType: autoSelectPathType,
    autoSelectWhen: isOpen,
  });

  const catalogItems = useMemo(
    () =>
      buildPowersTechniquesL2Items({
        kind,
        mode,
        items,
        powerPartsDb,
        techniquePartsDb,
        energyInput: { archetypeAbility, abilities, level: 1 },
        innateThreshold,
      }),
    [
      kind,
      mode,
      items,
      powerPartsDb,
      techniquePartsDb,
      archetypeAbility,
      abilities,
      innateThreshold,
    ],
  );

  const initialSet = useMemo(() => new Set(initialSelectedIds.map(String)), [initialSelectedIds]);

  const selectable = useMemo(
    () =>
      applyLivePathFilter(catalogItems, {
        pathMatchIds,
        pathIndex,
        selectedPathIds,
        keepIds: initialSet,
        idsForItem: selectableItemPathIds,
      }),
    [catalogItems, pathMatchIds, pathIndex, selectedPathIds, initialSet],
  );

  const title =
    mode === 'innate'
      ? l2Copy.innateTitle
      : kind === 'techniques'
        ? l2Copy.techniquesTitle
        : l2Copy.powersTitle;

  // Innate: no header help (budget lives in footer). USM closes after onConfirm — do not double-close.
  const description = mode === 'innate' ? undefined : l2Copy.description(kind);

  const handleConfirm = useCallback(
    (selected: SelectableItem[]) => {
      const tpSpent = computeL2PowersTechniquesTpSpent(selected, loadoutTpSpent);
      if (tpSpent > tpLimit) {
        setError(ptCopy.tpBlocked);
        return;
      }
      if (mode === 'innate') {
        if (energySpentOf(selected) > innateEnergyMax) {
          setError(ptCopy.innateEnergyBlocked);
          return;
        }
      }
      setError(null);
      onConfirm(selectedIdsFromL2Items(selected));
    },
    [mode, loadoutTpSpent, tpLimit, innateEnergyMax, onConfirm],
  );

  const nextInnateSelectedIds = useCallback(
    (currentIds: string[], id: string) => {
      const applied = applyInnateSelection({
        selectedIds: currentIds,
        id,
        energyOf: (itemId) => l2InnateEnergyOf(selectable, itemId),
        tpOf: (itemId) => l2InnateTpOf(selectable, itemId),
        threshold: innateThreshold,
        energyMax: innateEnergyMax,
        otherTpSpent: loadoutTpSpent,
        tpLimit,
      });
      if (!applied.ok) {
        setError(innateSelectionBlockMessage(applied.reason));
        return currentIds;
      }
      setError(null);
      return applied.nextIds;
    },
    [selectable, innateThreshold, innateEnergyMax, loadoutTpSpent, tpLimit],
  );

  const footerExtra = useCallback(
    (selected: SelectableItem[]) => {
      const tpSpent = computeL2PowersTechniquesTpSpent(selected, loadoutTpSpent);
      const errorEl = error ? (
        <p className="text-center font-nunito text-sm text-warning-fg" role="alert">
          {error}
        </p>
      ) : null;

      if (mode === 'innate') {
        return (
          <LoadoutBudgetBar
            tpTotal={tpLimit}
            tpSpent={tpSpent}
            leading={
              <InnateEnergyPointStatus total={innateEnergyMax} spent={energySpentOf(selected)} />
            }
          >
            {errorEl}
          </LoadoutBudgetBar>
        );
      }

      return (
        <LoadoutBudgetBar tpTotal={tpLimit} tpSpent={tpSpent}>
          {errorEl}
        </LoadoutBudgetBar>
      );
    },
    [mode, innateEnergyMax, loadoutTpSpent, tpLimit, error],
  );

  const confirmDisabled = useCallback(
    (selected: SelectableItem[]) => {
      if (computeL2PowersTechniquesTpSpent(selected, loadoutTpSpent) > tpLimit) {
        return true;
      }
      if (mode === 'innate') {
        return energySpentOf(selected) > innateEnergyMax;
      }
      return false;
    },
    [mode, loadoutTpSpent, tpLimit, innateEnergyMax],
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
      items={selectable}
      onConfirm={handleConfirm}
      initialSelectedIds={initialSet}
      columns={powersTechniquesL2Headers(kind)}
      gridColumns={powersTechniquesL2Grid(kind)}
      itemLabel={mode === 'innate' ? 'innate power' : kind === 'techniques' ? 'technique' : 'power'}
      emptyMessage={
        pathFilterActive
          ? pathFilterEmptyTitle(mode === 'innate' ? 'innate powers' : kind)
          : l2Copy.emptyMessage(kind, mode)
      }
      searchPlaceholder={l2Copy.searchPlaceholder(kind)}
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
      nextSelectedIds={mode === 'innate' ? nextInnateSelectedIds : undefined}
      size="xl"
    />
  );
}
