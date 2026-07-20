/**
 * Guided powers/techniques L2 — UnifiedSelectionModal (TASK-463 / TASK-471 / TASK-573).
 * Replaces in-step GuidedPowersTechniquesBrowsePanel card dump.
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/shared';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import type { Abilities, AbilityName } from '@/types';
import {
  buildPowersTechniquesL2Items,
  computeL2PowersTechniquesTpSpent,
  POWERS_TECHNIQUES_L2_GRID,
  POWERS_TECHNIQUES_L2_HEADER_COLUMNS,
  selectedIdsFromL2Items,
  type PowersTechniquesL2Mode,
} from '@/lib/guided-creator/powers-techniques-l2';
import type { PowersTechniquesKind } from '@/lib/guided-creator/power-technique-display';
import { LoadoutBudgetBar } from './loadout-budget-bar';
import { PointStatus } from '@/components/shared';
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
  pathRecommendedIds: string[];
  initialSelectedIds: string[];
  /**
   * Shared TP already spent outside this modal's selection
   * (loadout + the other powers track: innate vs regular).
   */
  loadoutTpSpent: number;
  tpLimit: number;
  archetypeAbility?: AbilityName | string | null;
  abilities?: Partial<Abilities> | null;
  /** Innate mode budgets. */
  innateThreshold?: number;
  innateEnergyMax?: number;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}

function energySpentOf(selected: SelectableItem[]): number {
  return selected.reduce((sum, row) => {
    const data = row.data as { energy?: number } | undefined;
    return sum + Math.max(0, Math.floor(data?.energy ?? 0));
  }, 0);
}

export function GuidedPowersTechniquesL2Modal({
  isOpen,
  kind,
  mode,
  items,
  powerPartsDb,
  techniquePartsDb,
  pathRecommendedIds,
  initialSelectedIds,
  loadoutTpSpent,
  tpLimit,
  archetypeAbility,
  abilities,
  innateThreshold = 0,
  innateEnergyMax = 0,
  onClose,
  onConfirm,
}: GuidedPowersTechniquesL2ModalProps) {
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(
    () =>
      buildPowersTechniquesL2Items({
        kind,
        mode,
        items,
        powerPartsDb,
        techniquePartsDb,
        pathRecommendedIds,
        energyInput: { archetypeAbility, abilities, level: 1 },
        innateThreshold,
      }),
    [
      kind,
      mode,
      items,
      powerPartsDb,
      techniquePartsDb,
      pathRecommendedIds,
      archetypeAbility,
      abilities,
      innateThreshold,
    ]
  );

  const initialSet = useMemo(
    () => new Set(initialSelectedIds.map(String)),
    [initialSelectedIds]
  );

  const title =
    mode === 'innate'
      ? l2Copy.innateTitle
      : kind === 'techniques'
        ? l2Copy.techniquesTitle
        : l2Copy.powersTitle;

  const description =
    mode === 'innate' ? l2Copy.innateDescription : l2Copy.description(kind);

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
      onClose();
    },
    [mode, loadoutTpSpent, tpLimit, innateEnergyMax, onConfirm, onClose]
  );

  const footerExtra = useCallback(
    (selected: SelectableItem[]) => {
      const tpSpent = computeL2PowersTechniquesTpSpent(selected, loadoutTpSpent);
      const errorEl = error ? (
        <p className="font-nunito text-sm text-warning-fg text-center" role="alert">
          {error}
        </p>
      ) : null;

      if (mode === 'innate') {
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <PointStatus
                total={innateEnergyMax}
                spent={energySpentOf(selected)}
                label={ptCopy.innateEnergyLabel}
                variant="inline"
              />
              <LoadoutBudgetBar tpTotal={tpLimit} tpSpent={tpSpent} />
            </div>
            {errorEl}
          </div>
        );
      }

      return (
        <LoadoutBudgetBar tpTotal={tpLimit} tpSpent={tpSpent}>
          {errorEl}
        </LoadoutBudgetBar>
      );
    },
    [mode, innateEnergyMax, loadoutTpSpent, tpLimit, error]
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
    [mode, loadoutTpSpent, tpLimit, innateEnergyMax]
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
      columns={POWERS_TECHNIQUES_L2_HEADER_COLUMNS}
      gridColumns={POWERS_TECHNIQUES_L2_GRID}
      itemLabel={mode === 'innate' ? 'innate power' : kind === 'techniques' ? 'technique' : 'power'}
      emptyMessage={l2Copy.emptyMessage(kind, mode)}
      searchPlaceholder={l2Copy.searchPlaceholder(kind)}
      footerExtra={footerExtra}
      confirmDisabled={confirmDisabled}
      size="xl"
    />
  );
}
