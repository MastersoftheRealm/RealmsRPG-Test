'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { wouldExceedSharedTp } from '@/lib/guided-creator/loadout-tp';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { normalizeId } from '@/lib/utils';
import {
  applyInnateSelection,
  innateSelectionBlockMessage,
  pickAffordableIds,
  pickInnateFillIds,
  resolveLibraryItem,
  type GuidedPathLibraryRow,
} from '@/lib/guided-creator/powers-techniques-step-helpers';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

type PowersTechniquesSelectionArgs = {
  draft: GuidedDraft;
  updateDraft: (patch: Partial<GuidedDraft>) => void;
  isTechniques: boolean;
  showInnateTrack: boolean;
  isLoading: boolean;
  pathData: unknown;
  lookup: Map<string, GuidedPathLibraryRow>;
  allOptionIds: string[];
  innateRecommendedIds: string[];
  selectedIds: string[];
  selectedInnateIds: string[];
  loadoutTpSpent: number;
  loadoutTpLimit: number;
  regularTpSpent: number;
  innateTpSpent: number;
  /**
   * TP already spent on tracks that are not the current inner screen
   * (e.g. techniques while picking powers). Shared budget (TASK-756).
   */
  siblingTpSpent?: number;
  innateEnergyMax: number;
  innateThreshold: number;
  resolveTpCost: (id: string) => number;
  resolveEnergy: (id: string) => number | undefined;
};

export function usePowersTechniquesSelection({
  draft,
  updateDraft,
  isTechniques,
  showInnateTrack,
  isLoading,
  pathData,
  lookup,
  allOptionIds,
  innateRecommendedIds,
  selectedIds,
  selectedInnateIds,
  loadoutTpSpent,
  loadoutTpLimit,
  regularTpSpent,
  innateTpSpent,
  siblingTpSpent = 0,
  innateEnergyMax,
  innateThreshold,
  resolveTpCost,
  resolveEnergy,
}: PowersTechniquesSelectionArgs) {
  const [budgetMessage, setBudgetMessage] = useState<string | null>(null);
  const didSeedSelection = useRef(false);
  const didSeedInnate = useRef(false);

  const isSelectedId = useCallback(
    (id: string, pool: string[]) => {
      const key = String(id).toLowerCase();
      if (pool.some((x) => String(x).toLowerCase() === key)) return true;
      const resolved = resolveLibraryItem(id, lookup);
      if (!resolved) return false;
      const canonical = String(resolved.id ?? resolved.name ?? '').toLowerCase();
      const nameKey = String(resolved.name ?? '').toLowerCase();
      return pool.some((x) => {
        const sx = String(x).toLowerCase();
        if (sx === canonical || (nameKey && sx === nameKey)) return true;
        const other = resolveLibraryItem(x, lookup);
        return Boolean(other && other === resolved);
      });
    },
    [lookup],
  );

  const removeSelectedAlias = useCallback(
    (ids: string[], id: string) => {
      const resolved = resolveLibraryItem(id, lookup);
      const key = String(id).toLowerCase();
      const canonical = resolved
        ? String(resolved.id ?? resolved.name ?? '').toLowerCase()
        : key;
      const nameKey = resolved ? String(resolved.name ?? '').toLowerCase() : '';
      return ids.filter((x) => {
        const sx = String(x).toLowerCase();
        if (sx === key || sx === canonical || (nameKey && sx === nameKey)) return false;
        const other = resolveLibraryItem(x, lookup);
        return !(resolved && other && other === resolved);
      });
    },
    [lookup],
  );

  /**
   * Soft-seed once: innate first (energy + TP), then regular with remaining TP,
   * so innate recommendations are not starved by regular seed spend.
   */
  useEffect(() => {
    if (isLoading || pathData == null) return;

    if (showInnateTrack && !didSeedInnate.current) {
      if (selectedInnateIds.length > 0) {
        didSeedInnate.current = true;
      } else if (innateRecommendedIds.length === 0 || innateEnergyMax <= 0) {
        didSeedInnate.current = true;
      } else {
        const regularKeys = new Set(selectedIds.map((id) => normalizeId(id)));
        const innatePool = innateRecommendedIds.filter(
          (id) => !regularKeys.has(normalizeId(id)),
        );
        const seed = pickInnateFillIds(
          innatePool,
          resolveEnergy,
          resolveTpCost,
          innateThreshold,
          innateEnergyMax,
          loadoutTpSpent + regularTpSpent + siblingTpSpent,
          loadoutTpLimit,
        );
        didSeedInnate.current = true;
        if (seed.length > 0) {
          updateDraft({ innatePowerIds: seed });
          return;
        }
      }
    }

    if (didSeedSelection.current) return;
    if (selectedIds.length > 0) {
      didSeedSelection.current = true;
      return;
    }
    if (showInnateTrack && !didSeedInnate.current) return;
    if (allOptionIds.length === 0) {
      didSeedSelection.current = true;
      return;
    }
    const innateKeys = new Set(innateRecommendedIds.map((id) => normalizeId(id)));
    const regularPool = allOptionIds.filter((id) => !innateKeys.has(normalizeId(id)));
    const seed = pickAffordableIds(
      regularPool,
      resolveTpCost,
      loadoutTpSpent + innateTpSpent + siblingTpSpent,
      loadoutTpLimit,
    );
    didSeedSelection.current = true;
    if (seed.length === 0) return;
    if (isTechniques) {
      updateDraft({ techniqueIds: seed });
    } else {
      updateDraft({ powerIds: seed });
    }
  }, [
    allOptionIds,
    innateRecommendedIds,
    isTechniques,
    showInnateTrack,
    selectedIds,
    selectedInnateIds.length,
    updateDraft,
    isLoading,
    pathData,
    resolveTpCost,
    resolveEnergy,
    loadoutTpSpent,
    loadoutTpLimit,
    innateEnergyMax,
    innateThreshold,
    regularTpSpent,
    innateTpSpent,
    siblingTpSpent,
  ]);

  /** Keep innate vs regular exclusive if both lists somehow share a pick. */
  useEffect(() => {
    if (!showInnateTrack || draft.innatePowerIds.length === 0 || draft.powerIds.length === 0) {
      return;
    }
    const nextRegular = draft.powerIds.filter(
      (pid) =>
        !draft.innatePowerIds.some(
          (iid) =>
            normalizeId(pid) === normalizeId(iid) ||
            isSelectedId(pid, [iid]) ||
            isSelectedId(iid, [pid]),
        ),
    );
    if (nextRegular.length === draft.powerIds.length) return;
    updateDraft({ powerIds: nextRegular });
  }, [
    showInnateTrack,
    draft.innatePowerIds,
    draft.powerIds,
    isSelectedId,
    updateDraft,
  ]);

  const toggleRegularId = useCallback(
    (id: string) => {
      const key = String(id);
      setBudgetMessage(null);
      if (isTechniques) {
        if (isSelectedId(key, draft.techniqueIds)) {
          updateDraft({ techniqueIds: removeSelectedAlias(draft.techniqueIds, key) });
          return;
        }
        const addTp = resolveTpCost(key);
        const othersSpent = draft.techniqueIds.reduce((sum, x) => sum + resolveTpCost(x), 0);
        if (wouldExceedSharedTp(loadoutTpSpent + siblingTpSpent + othersSpent, loadoutTpLimit, addTp)) {
          setBudgetMessage(ptCopy.tpBlocked);
          return;
        }
        updateDraft({ techniqueIds: [...draft.techniqueIds, key] });
        return;
      }

      if (isSelectedId(key, draft.powerIds)) {
        updateDraft({ powerIds: removeSelectedAlias(draft.powerIds, key) });
        return;
      }
      const addTp = resolveTpCost(key);
      const othersSpent =
        draft.powerIds.reduce((sum, x) => sum + resolveTpCost(x), 0) +
        draft.innatePowerIds.reduce((sum, x) => sum + resolveTpCost(x), 0);
      if (wouldExceedSharedTp(loadoutTpSpent + siblingTpSpent + othersSpent, loadoutTpLimit, addTp)) {
        setBudgetMessage(ptCopy.tpBlocked);
        return;
      }
      const nextInnate = isSelectedId(key, draft.innatePowerIds)
        ? removeSelectedAlias(draft.innatePowerIds, key)
        : draft.innatePowerIds;
      updateDraft({ powerIds: [...draft.powerIds, key], innatePowerIds: nextInnate });
    },
    [
      draft.techniqueIds,
      draft.powerIds,
      draft.innatePowerIds,
      isTechniques,
      updateDraft,
      resolveTpCost,
      loadoutTpSpent,
      loadoutTpLimit,
      siblingTpSpent,
      isSelectedId,
      removeSelectedAlias,
    ],
  );

  const toggleInnateId = useCallback(
    (id: string) => {
      const key = String(id);
      setBudgetMessage(null);
      if (isSelectedId(key, draft.innatePowerIds)) {
        updateDraft({ innatePowerIds: removeSelectedAlias(draft.innatePowerIds, key) });
        return;
      }
      const regularTp = draft.powerIds.reduce((sum, x) => sum + resolveTpCost(x), 0);
      const applied = applyInnateSelection({
        selectedIds: draft.innatePowerIds,
        id: key,
        energyOf: resolveEnergy,
        tpOf: resolveTpCost,
        threshold: innateThreshold,
        energyMax: innateEnergyMax,
        otherTpSpent: loadoutTpSpent + siblingTpSpent + regularTp,
        tpLimit: loadoutTpLimit,
      });
      if (!applied.ok) {
        setBudgetMessage(innateSelectionBlockMessage(applied.reason));
        return;
      }
      const nextRegular = isSelectedId(key, draft.powerIds)
        ? removeSelectedAlias(draft.powerIds, key)
        : draft.powerIds;
      updateDraft({
        innatePowerIds: applied.nextIds,
        powerIds: nextRegular,
      });
    },
    [
      draft.innatePowerIds,
      draft.powerIds,
      innateThreshold,
      innateEnergyMax,
      resolveEnergy,
      resolveTpCost,
      loadoutTpSpent,
      loadoutTpLimit,
      siblingTpSpent,
      isSelectedId,
      removeSelectedAlias,
      updateDraft,
    ],
  );

  const isRegularUnavailable = useCallback(
    (id: string) => {
      if (isSelectedId(id, selectedIds)) return false;
      const othersSpent = regularTpSpent + innateTpSpent;
      return wouldExceedSharedTp(loadoutTpSpent + siblingTpSpent + othersSpent, loadoutTpLimit, resolveTpCost(id));
    },
    [
      isSelectedId,
      selectedIds,
      resolveTpCost,
      loadoutTpSpent,
      loadoutTpLimit,
      regularTpSpent,
      innateTpSpent,
      siblingTpSpent,
    ],
  );

  const isInnateUnavailable = useCallback(
    (id: string) => {
      if (isSelectedId(id, selectedInnateIds)) return false;
      const applied = applyInnateSelection({
        selectedIds: selectedInnateIds,
        id,
        energyOf: resolveEnergy,
        tpOf: resolveTpCost,
        threshold: innateThreshold,
        energyMax: innateEnergyMax,
        otherTpSpent: loadoutTpSpent + siblingTpSpent + regularTpSpent,
        tpLimit: loadoutTpLimit,
      });
      return !applied.ok;
    },
    [
      isSelectedId,
      selectedInnateIds,
      resolveEnergy,
      resolveTpCost,
      innateThreshold,
      innateEnergyMax,
      loadoutTpSpent,
      loadoutTpLimit,
      siblingTpSpent,
      regularTpSpent,
    ],
  );

  const handleL2Confirm = useCallback(
    (ids: string[], l2Modal: 'regular' | 'innate' | null) => {
      if (l2Modal === 'innate') {
        const nextRegular = draft.powerIds.filter(
          (pid) => !ids.some((iid) => isSelectedId(iid, [pid]) || isSelectedId(pid, [iid])),
        );
        updateDraft({ innatePowerIds: ids, powerIds: nextRegular });
        return;
      }
      if (isTechniques) {
        updateDraft({ techniqueIds: ids });
        return;
      }
      const nextInnate = draft.innatePowerIds.filter(
        (iid) => !ids.some((pid) => isSelectedId(pid, [iid]) || isSelectedId(iid, [pid])),
      );
      updateDraft({ powerIds: ids, innatePowerIds: nextInnate });
    },
    [isTechniques, draft.powerIds, draft.innatePowerIds, updateDraft, isSelectedId],
  );

  return {
    budgetMessage,
    isSelectedId,
    toggleRegularId,
    toggleInnateId,
    isRegularUnavailable,
    isInnateUnavailable,
    handleL2Confirm,
  };
}
