/**
 * Guided powers/techniques L2 — UnifiedSelectionModal (TASK-463 / TASK-471).
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
  /** Cross-phase Loadout TP already spent (regular mode). */
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
    mode === 'innate'
      ? l2Copy.innateDescription || undefined
      : l2Copy.description(kind);

  const handleConfirm = useCallback(
    (selected: SelectableItem[]) => {
      if (mode === 'regular') {
        const tpSpent = computeL2PowersTechniquesTpSpent(selected, loadoutTpSpent);
        if (tpSpent > tpLimit) {
          setError(ptCopy.tpBlocked);
          return;
        }
      } else {
        const energySpent = selected.reduce((sum, row) => {
          const data = row.data as { energy?: number } | undefined;
          return sum + Math.max(0, Math.floor(data?.energy ?? 0));
        }, 0);
        if (energySpent > innateEnergyMax) {
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
      if (mode === 'innate') {
        const spent = selected.reduce((sum, row) => {
          const data = row.data as { energy?: number } | undefined;
          return sum + Math.max(0, Math.floor(data?.energy ?? 0));
        }, 0);
        return (
          <div className="flex flex-col items-center gap-2">
            <PointStatus
              total={innateEnergyMax}
              spent={spent}
              label={ptCopy.innateEnergyLabel}
              variant="inline"
            />
            {error ? (
              <p
                className="font-nunito text-sm text-warning-700 dark:text-warning-400 text-center"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
        );
      }
      const tpSpent = computeL2PowersTechniquesTpSpent(selected, loadoutTpSpent);
      return (
        <LoadoutBudgetBar tpTotal={tpLimit} tpSpent={tpSpent}>
          {error ? (
            <p
              className="font-nunito text-sm text-warning-700 dark:text-warning-400 text-center"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </LoadoutBudgetBar>
      );
    },
    [mode, innateEnergyMax, loadoutTpSpent, tpLimit, error]
  );

  const confirmDisabled = useCallback(
    (selected: SelectableItem[]) => {
      if (mode === 'regular') {
        return computeL2PowersTechniquesTpSpent(selected, loadoutTpSpent) > tpLimit;
      }
      const spent = selected.reduce((sum, row) => {
        const data = row.data as { energy?: number } | undefined;
        return sum + Math.max(0, Math.floor(data?.energy ?? 0));
      }, 0);
      return spent > innateEnergyMax;
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
