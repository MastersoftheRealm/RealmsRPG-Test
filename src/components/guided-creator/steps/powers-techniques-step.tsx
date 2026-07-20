/**
 * Powers OR Techniques — step title depends on archetype (never both).
 * L1: path cards (innate vs regular when Power) + shared Training Points.
 * L2: UnifiedSelectionModal (TASK-463); innate modal (TASK-471/472/573).
 * Innate Energy fill is soft-warn only; innate picks spend TP like regular Powers.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Spinner, EmptyState, DescriptorChip } from '@/components/ui';
import { GuidedLayerNav, PointStatus } from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  useEquipment,
  useOfficialLibrary,
  usePowerParts,
  useTechniqueParts,
  useGuidedEquipmentCatalog,
} from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GuidedPowersTechniquesL2Modal } from '../guided-powers-techniques-l2-modal';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from '../guided-choice-styles';
import { GuidedStepLayout } from '../guided-step-layout';
import type { ArchetypeCategory } from '@/types';
import type { PathGuidanceGroup } from '@/types/archetype';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import {
  buildPowerTechniqueCardFacts,
  resolvePowerTechniqueEnergy,
  resolvePowerTechniqueTpCost,
} from '@/lib/guided-creator/power-technique-display';
import {
  getPowersTechniquesL1Ids,
  isPathRecommendedPowersTechniquesId,
} from '@/lib/guided-creator/powers-techniques-l1-candidates';
import {
  combineGuidedTpBudgets,
  wouldExceedSharedTp,
} from '@/lib/guided-creator/loadout-tp';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import { ARCHETYPE_CONFIGS } from '@/lib/game/constants';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { GuidedFactChipRow } from '../guided-equipment-fact-chips';
import { LoadoutBudgetBar } from '../loadout-budget-bar';
import { normalizeId } from '@/lib/utils';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

type ItemKind = 'powers' | 'techniques';
type L2ModalKind = 'regular' | 'innate' | null;

function stepCopy(type: ArchetypeCategory | null): {
  title: string;
  description: string;
  kind: ItemKind;
} {
  if (type === 'martial') {
    return { ...ptCopy.martial, kind: 'techniques' as const };
  }
  if (type === 'powered-martial') {
    return { ...ptCopy.poweredMartial, kind: 'powers' as const };
  }
  return { ...ptCopy.power, kind: 'powers' as const };
}

type GuidedPathLibraryRow = LibraryPower | LibraryTechnique;

function buildLookup(items: GuidedPathLibraryRow[]): Map<string, GuidedPathLibraryRow> {
  const map = new Map<string, GuidedPathLibraryRow>();
  items.forEach((item) => {
    const id = item.id != null ? String(item.id) : '';
    const name = item.name != null ? String(item.name) : '';
    if (id) map.set(id.toLowerCase(), item);
    if (name) map.set(name.toLowerCase(), item);
  });
  return map;
}

function resolveLibraryItem(
  id: string,
  lookup: Map<string, GuidedPathLibraryRow>
): GuidedPathLibraryRow | undefined {
  return lookup.get(String(id).toLowerCase());
}

function pickAffordableIds(
  ids: string[],
  costOf: (id: string) => number,
  alreadySpent: number,
  limit: number
): string[] {
  const picked: string[] = [];
  let spent = alreadySpent;
  for (const id of ids) {
    const cost = costOf(id);
    if (spent + cost > limit) continue;
    picked.push(id);
    spent += cost;
  }
  return picked;
}

/**
 * Soft-seed innate picks that fit threshold, fill as much Innate Energy as possible,
 * and stay within the shared Training Points budget.
 */
function pickInnateFillIds(
  ids: string[],
  energyOf: (id: string) => number | undefined,
  tpOf: (id: string) => number,
  threshold: number,
  energyMax: number,
  tpAlreadySpent: number,
  tpLimit: number
): string[] {
  const candidates = ids
    .map((id) => ({ id, energy: energyOf(id), tp: tpOf(id) }))
    .filter(
      (row): row is { id: string; energy: number; tp: number } =>
        row.energy != null && row.energy >= 0 && row.energy <= threshold
    )
    .sort((a, b) => b.energy - a.energy);

  const picked: string[] = [];
  let energySpent = 0;
  let tpSpent = tpAlreadySpent;
  for (const row of candidates) {
    if (energySpent + row.energy > energyMax) continue;
    if (tpSpent + row.tp > tpLimit) continue;
    picked.push(row.id);
    energySpent += row.energy;
    tpSpent += row.tp;
    if (energySpent === energyMax) break;
  }
  return picked;
}

export function PowersTechniquesStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const copy = stepCopy(draft.archetypeType);
  const isTechniques = copy.kind === 'techniques';
  const showInnateTrack =
    !isTechniques &&
    (draft.archetypeType === 'power' || draft.archetypeType === 'powered-martial');

  const [budgetMessage, setBudgetMessage] = useState<string | null>(null);
  const [l2Modal, setL2Modal] = useState<L2ModalKind>(null);
  const didSeedSelection = useRef(false);
  const didSeedInnate = useRef(false);

  const { data: officialPowers = [], isLoading: powersLoading } = useOfficialLibrary('powers', {
    enabled: !isTechniques,
  });
  const { data: officialTechniques = [], isLoading: techniquesLoading } = useOfficialLibrary(
    'techniques',
    { enabled: isTechniques }
  );
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: codexEquipment = [] } = useEquipment();
  const { tpSummary: loadoutTp } = useGuidedEquipmentCatalog(
    draft,
    officialItems,
    codexEquipment
  );
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const isLoading = isTechniques ? techniquesLoading : powersLoading;
  const libraryItems = isTechniques ? officialTechniques : officialPowers;
  const lookup = useMemo(() => buildLookup(libraryItems), [libraryItems]);

  const innateProgression = useMemo(() => {
    const type = draft.archetypeType;
    const cfg = type ? ARCHETYPE_CONFIGS[type] : null;
    const martProf = cfg?.proficiency.martial ?? 0;
    const powProf = cfg?.proficiency.power ?? 0;
    return calculateArchetypeProgression(1, martProf, powProf);
  }, [draft.archetypeType]);

  const innateEnergyMax = showInnateTrack ? innateProgression.innateEnergy : 0;
  const innateThreshold = showInnateTrack ? innateProgression.innateThreshold : 0;

  const recommendedIds = useMemo(() => {
    const fromPath = isTechniques
      ? (pathData?.level1?.techniques ?? [])
      : (pathData?.level1?.powers ?? []);
    return fromPath.map(String);
  }, [isTechniques, pathData]);

  const innateRecommendedIds = useMemo(() => {
    if (!showInnateTrack) return [];
    return (pathData?.level1?.innatePowers ?? []).map(String);
  }, [showInnateTrack, pathData]);

  const groups = useMemo(
    () =>
      pathData?.level1?.guidance_groups?.filter((g) =>
        isTechniques ? g.techniques?.length : g.powers?.length
      ) ?? [],
    [pathData, isTechniques]
  );

  const allOptionIds = useMemo(() => {
    const ids = new Set<string>();
    recommendedIds.forEach((id) => ids.add(String(id)));
    groups.forEach((group) => {
      const list = isTechniques ? group.techniques : group.powers;
      list?.forEach((id) => ids.add(String(id)));
    });
    return Array.from(ids);
  }, [recommendedIds, groups, isTechniques]);

  const selectedIds = isTechniques ? draft.techniqueIds : draft.powerIds;
  const selectedInnateIds = draft.innatePowerIds;

  const resolveCanonicalId = useCallback(
    (id: string): string | undefined => {
      const raw = resolveLibraryItem(id, lookup);
      if (!raw) return undefined;
      const canonical = String(raw.id ?? raw.name ?? '').trim();
      return canonical || undefined;
    },
    [lookup]
  );

  const { displayIds: l1DisplayIds, promotedIds } = useMemo(
    () => getPowersTechniquesL1Ids(allOptionIds, selectedIds, resolveCanonicalId),
    [allOptionIds, selectedIds, resolveCanonicalId]
  );

  const { displayIds: innateDisplayIds, promotedIds: innatePromotedIds } = useMemo(
    () =>
      getPowersTechniquesL1Ids(innateRecommendedIds, selectedInnateIds, resolveCanonicalId),
    [innateRecommendedIds, selectedInnateIds, resolveCanonicalId]
  );

  const showPathDescriptor = promotedIds.length > 0 && groups.length === 0;

  const resolveTpCost = useCallback(
    (id: string): number => {
      const raw = resolveLibraryItem(id, lookup);
      return resolvePowerTechniqueTpCost(
        isTechniques ? 'techniques' : 'powers',
        raw,
        powerPartsDb,
        techniquePartsDb
      );
    },
    [lookup, isTechniques, techniquePartsDb, powerPartsDb]
  );

  const resolveEnergy = useCallback(
    (id: string): number | undefined => {
      const raw = resolveLibraryItem(id, lookup);
      return resolvePowerTechniqueEnergy(
        'powers',
        raw,
        powerPartsDb,
        techniquePartsDb
      );
    },
    [lookup, powerPartsDb, techniquePartsDb]
  );

  const regularTpSpent = useMemo(
    () => selectedIds.reduce((sum, id) => sum + resolveTpCost(id), 0),
    [selectedIds, resolveTpCost]
  );

  const innateTpSpent = useMemo(
    () =>
      showInnateTrack
        ? selectedInnateIds.reduce((sum, id) => sum + resolveTpCost(id), 0)
        : 0,
    [showInnateTrack, selectedInnateIds, resolveTpCost]
  );

  /** Innate + regular powers both spend the shared Training Points budget. */
  const combatTpSpent = regularTpSpent + innateTpSpent;

  const tpBudget = useMemo(
    () => combineGuidedTpBudgets(loadoutTp, combatTpSpent),
    [loadoutTp, combatTpSpent]
  );

  const innateEnergySpent = useMemo(
    () =>
      selectedInnateIds.reduce((sum, id) => {
        const energy = resolveEnergy(id);
        return sum + (energy != null ? energy : 0);
      }, 0),
    [selectedInnateIds, resolveEnergy]
  );

  const innateRemaining = innateEnergyMax - innateEnergySpent;

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
          (id) => !regularKeys.has(normalizeId(id))
        );
        const seed = pickInnateFillIds(
          innatePool,
          resolveEnergy,
          resolveTpCost,
          innateThreshold,
          innateEnergyMax,
          loadoutTp.spent + regularTpSpent,
          loadoutTp.limit
        );
        didSeedInnate.current = true;
        if (seed.length > 0) {
          updateDraft({ innatePowerIds: seed });
          // Wait for draft update before seeding regular against remaining TP.
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
      loadoutTp.spent + innateTpSpent,
      loadoutTp.limit
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
    loadoutTp.spent,
    loadoutTp.limit,
    innateEnergyMax,
    innateThreshold,
    regularTpSpent,
    innateTpSpent,
  ]);

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
    [lookup]
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
    [lookup]
  );

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
            isSelectedId(iid, [pid])
        )
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
        if (wouldExceedSharedTp(loadoutTp.spent + othersSpent, loadoutTp.limit, addTp)) {
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
      if (wouldExceedSharedTp(loadoutTp.spent + othersSpent, loadoutTp.limit, addTp)) {
        setBudgetMessage(ptCopy.tpBlocked);
        return;
      }
      // Keep out of innate list if present
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
      loadoutTp,
      isSelectedId,
      removeSelectedAlias,
    ]
  );

  const toggleInnateId = useCallback(
    (id: string) => {
      const key = String(id);
      setBudgetMessage(null);
      if (isSelectedId(key, draft.innatePowerIds)) {
        updateDraft({ innatePowerIds: removeSelectedAlias(draft.innatePowerIds, key) });
        return;
      }
      const energy = resolveEnergy(key);
      if (energy == null || energy > innateThreshold) {
        setBudgetMessage(ptCopy.innateThresholdBlocked);
        return;
      }
      const othersEnergy = draft.innatePowerIds.reduce((sum, x) => {
        const e = resolveEnergy(x);
        return sum + (e != null ? e : 0);
      }, 0);
      if (othersEnergy + energy > innateEnergyMax) {
        setBudgetMessage(ptCopy.innateEnergyBlocked);
        return;
      }
      const addTp = resolveTpCost(key);
      const othersTp =
        draft.innatePowerIds.reduce((sum, x) => sum + resolveTpCost(x), 0) +
        draft.powerIds.reduce((sum, x) => sum + resolveTpCost(x), 0);
      if (wouldExceedSharedTp(loadoutTp.spent + othersTp, loadoutTp.limit, addTp)) {
        setBudgetMessage(ptCopy.tpBlocked);
        return;
      }
      const nextRegular = isSelectedId(key, draft.powerIds)
        ? removeSelectedAlias(draft.powerIds, key)
        : draft.powerIds;
      updateDraft({
        innatePowerIds: [...draft.innatePowerIds, key],
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
      loadoutTp,
      isSelectedId,
      removeSelectedAlias,
      updateDraft,
    ]
  );

  const isRegularUnavailable = useCallback(
    (id: string) => {
      if (isSelectedId(id, selectedIds)) return false;
      const othersSpent = regularTpSpent + innateTpSpent;
      return wouldExceedSharedTp(loadoutTp.spent + othersSpent, loadoutTp.limit, resolveTpCost(id));
    },
    [
      isSelectedId,
      selectedIds,
      resolveTpCost,
      loadoutTp.spent,
      loadoutTp.limit,
      regularTpSpent,
      innateTpSpent,
    ]
  );

  const isInnateUnavailable = useCallback(
    (id: string) => {
      if (isSelectedId(id, selectedInnateIds)) return false;
      const energy = resolveEnergy(id);
      if (energy == null || energy > innateThreshold) return true;
      const othersEnergy = selectedInnateIds.reduce((sum, x) => {
        const e = resolveEnergy(x);
        return sum + (e != null ? e : 0);
      }, 0);
      if (othersEnergy + energy > innateEnergyMax) return true;
      return wouldExceedSharedTp(
        loadoutTp.spent + regularTpSpent + innateTpSpent,
        loadoutTp.limit,
        resolveTpCost(id)
      );
    },
    [
      isSelectedId,
      selectedInnateIds,
      resolveEnergy,
      resolveTpCost,
      innateThreshold,
      innateEnergyMax,
      loadoutTp.spent,
      loadoutTp.limit,
      regularTpSpent,
      innateTpSpent,
    ]
  );

  const resolveDisplay = useCallback(
    (id: string) => {
      const raw = resolveLibraryItem(id, lookup);
      const facts = buildPowerTechniqueCardFacts(
        isTechniques ? 'techniques' : 'powers',
        raw,
        id,
        powerPartsDb,
        techniquePartsDb
      );
      return {
        id: String(id),
        name: facts.name,
        description: facts.description,
        titleChips: facts.titleChips,
        detailChips: facts.detailChips,
        tpCost: facts.tpCost,
      };
    },
    [lookup, isTechniques, techniquePartsDb, powerPartsDb]
  );

  const renderItemCard = (
    id: string,
    opts: {
      selected: boolean;
      unavailable: boolean;
      onToggle: () => void;
      pathRecommended?: boolean;
    }
  ) => {
    const item = resolveDisplay(id);
    return (
      <GuidedChoiceCard
        key={item.id}
        density="compact"
        title={item.name}
        description={item.description}
        titleMeta={
          item.titleChips.length > 0 || opts.pathRecommended ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              {opts.pathRecommended ? (
                <DescriptorChip size="sm">{ptCopy.pathRecommendedChip}</DescriptorChip>
              ) : null}
              {item.titleChips.length > 0 ? (
                <GuidedFactChipRow chips={item.titleChips} />
              ) : null}
            </span>
          ) : undefined
        }
        expandedExtra={
          item.detailChips.length > 0 ? (
            <GuidedFactChipRow chips={item.detailChips} />
          ) : undefined
        }
        selected={opts.selected}
        onSelect={opts.onToggle}
        selectAriaLabel={
          opts.unavailable
            ? `${item.name} unavailable: ${budgetMessage ?? ptCopy.tpBlocked}`
            : `${opts.selected ? 'Deselect' : 'Select'} ${item.name}`
        }
      />
    );
  };

  const renderGroupSection = (group: PathGuidanceGroup) => {
    const ids = (isTechniques ? group.techniques : group.powers) ?? [];
    if (ids.length === 0) return null;
    const GroupHeading = showInnateTrack ? 'h4' : 'h3';
    return (
      <section key={group.id}>
        <GroupHeading className="font-display text-lg font-semibold text-text-primary">
          {group.title}
        </GroupHeading>
        {group.why ? (
          <p className="mt-1 font-nunito text-sm text-text-secondary">{group.why}</p>
        ) : null}
        <div className={cn(GUIDED_CHOICE_COMPACT_GRID_CLASS, 'mt-3')}>
          {ids.map((id) =>
            renderItemCard(String(id), {
              selected: isSelectedId(String(id), selectedIds),
              unavailable: isRegularUnavailable(String(id)),
              onToggle: () => toggleRegularId(String(id)),
            })
          )}
        </div>
      </section>
    );
  };

  /** Innate Energy under-fill is a soft warning only — never block Continue (TASK-573). */
  const canContinue = true;
  const innateSoftWarn =
    showInnateTrack && innateEnergyMax > 0 && innateRemaining !== 0;

  const budgetBar = (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
      {showInnateTrack && innateEnergyMax > 0 ? (
        <PointStatus
          total={innateEnergyMax}
          spent={innateEnergySpent}
          label={ptCopy.innateEnergyLabel}
          variant="inline"
        />
      ) : null}
      <LoadoutBudgetBar tpTotal={tpBudget.limit} tpSpent={tpBudget.spent} />
    </div>
  );

  const archetypeAbility = draft.pow_abil ?? draft.mart_abil;

  /** TP spent outside the open L2 modal (loadout + the other powers track). */
  const l2BaseTpSpent =
    loadoutTp.spent + (l2Modal === 'innate' ? regularTpSpent : innateTpSpent);

  const handleL2Confirm = useCallback(
    (ids: string[]) => {
      if (l2Modal === 'innate') {
        const nextRegular = draft.powerIds.filter(
          (pid) => !ids.some((iid) => isSelectedId(iid, [pid]) || isSelectedId(pid, [iid]))
        );
        updateDraft({ innatePowerIds: ids, powerIds: nextRegular });
        return;
      }
      if (isTechniques) {
        updateDraft({ techniqueIds: ids });
        return;
      }
      const nextInnate = draft.innatePowerIds.filter(
        (iid) => !ids.some((pid) => isSelectedId(pid, [iid]) || isSelectedId(iid, [pid]))
      );
      updateDraft({ powerIds: ids, innatePowerIds: nextInnate });
    },
    [l2Modal, isTechniques, draft.powerIds, draft.innatePowerIds, updateDraft, isSelectedId]
  );

  return (
    <GuidedStepLayout
      subStep="powers-techniques"
      title={copy.title}
      description={copy.description}
      canContinue={canContinue}
      continueLabel={GUIDED_CREATOR_COPY.steps.skills.continueLabel}
      completionHint={
        <span
          className={
            innateSoftWarn
              ? 'font-nunito text-warning-700 dark:text-warning-400'
              : 'font-nunito'
          }
        >
          {innateSoftWarn
            ? ptCopy.innateMustFill
            : `${selectedIds.length}${allOptionIds.length ? ` / ${allOptionIds.length}` : ''}`}
        </span>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          {budgetBar}

          {budgetMessage ? (
            <p
              className="font-nunito text-sm text-warning-700 dark:text-warning-400 text-center"
              role="status"
            >
              {budgetMessage}
            </p>
          ) : null}

          {showInnateTrack ? (
            <section className="space-y-3">
              <h3 className="font-display text-xl font-semibold text-text-primary">
                {ptCopy.innateHeading}
              </h3>
              <p className="font-nunito text-sm text-text-secondary">{ptCopy.innateIntro}</p>
              <p className="font-nunito text-xs text-text-secondary dark:text-text-secondary">
                {ptCopy.innateThresholdHint(innateThreshold)}
              </p>
              {innateDisplayIds.length === 0 ? (
                <EmptyState title={ptCopy.innateEmpty} />
              ) : (
                <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
                  {innateDisplayIds.map((id) =>
                    renderItemCard(id, {
                      selected: isSelectedId(id, selectedInnateIds),
                      unavailable: isInnateUnavailable(id),
                      onToggle: () => toggleInnateId(id),
                      pathRecommended:
                        innatePromotedIds.length > 0 &&
                        isPathRecommendedPowersTechniquesId(
                          id,
                          innateRecommendedIds,
                          resolveCanonicalId
                        ),
                    })
                  )}
                </div>
              )}
              <GuidedLayerNav
                expandLabel={ptCopy.innateSeeMore}
                onExpand={() => setL2Modal('innate')}
              />
            </section>
          ) : null}

          <section className="space-y-3">
            {showInnateTrack ? (
              <h3 className="font-display text-xl font-semibold text-text-primary">
                {isTechniques ? ptCopy.techniquesHeading : ptCopy.powersHeading}
              </h3>
            ) : null}

            {allOptionIds.length === 0 && groups.length === 0 && libraryItems.length === 0 ? (
              <EmptyState
                title={ptCopy.emptyTitle(copy.kind)}
                description={ptCopy.emptyDescription(copy.kind)}
              />
            ) : groups.length > 0 ? (
              <div className="space-y-8">
                <p className="font-nunito text-sm text-text-secondary">
                  {ptCopy.groupIntro(copy.kind)}
                </p>
                {groups.map(renderGroupSection)}
                {promotedIds.length > 0 ? (
                  <section>
                    {showInnateTrack ? (
                      <h4 className="font-display text-lg font-semibold text-text-primary">
                        {ptCopy.otherPicksHeading(copy.kind)}
                      </h4>
                    ) : (
                      <h3 className="font-display text-lg font-semibold text-text-primary">
                        {ptCopy.otherPicksHeading(copy.kind)}
                      </h3>
                    )}
                    <p className="mt-1 font-nunito text-sm text-text-secondary">
                      {ptCopy.otherPicksHint}
                    </p>
                    <div className={cn(GUIDED_CHOICE_COMPACT_GRID_CLASS, 'mt-3')}>
                      {promotedIds.map((id) =>
                        renderItemCard(id, {
                          selected: isSelectedId(id, selectedIds),
                          unavailable: isRegularUnavailable(id),
                          onToggle: () => toggleRegularId(id),
                        })
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : allOptionIds.length > 0 || promotedIds.length > 0 ? (
              <div className="space-y-4">
                <p className="font-nunito text-sm text-text-secondary">
                  {ptCopy.groupIntro(copy.kind)}
                </p>
                <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
                  {l1DisplayIds.map((id) =>
                    renderItemCard(id, {
                      selected: isSelectedId(id, selectedIds),
                      unavailable: isRegularUnavailable(id),
                      onToggle: () => toggleRegularId(id),
                      pathRecommended:
                        showPathDescriptor &&
                        isPathRecommendedPowersTechniquesId(
                          id,
                          allOptionIds,
                          resolveCanonicalId
                        ),
                    })
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title={ptCopy.emptyTitle(copy.kind)}
                description={ptCopy.emptyDescription(copy.kind)}
              />
            )}

            <GuidedLayerNav
              expandLabel={ptCopy.seeMore}
              onExpand={() => setL2Modal('regular')}
            />
          </section>
        </div>
      )}

      <GuidedPowersTechniquesL2Modal
        isOpen={l2Modal != null}
        kind={copy.kind}
        mode={l2Modal === 'innate' ? 'innate' : 'regular'}
        items={libraryItems}
        powerPartsDb={powerPartsDb}
        techniquePartsDb={techniquePartsDb}
        pathRecommendedIds={l2Modal === 'innate' ? innateRecommendedIds : allOptionIds}
        initialSelectedIds={l2Modal === 'innate' ? selectedInnateIds : selectedIds}
        loadoutTpSpent={l2BaseTpSpent}
        tpLimit={loadoutTp.limit}
        archetypeAbility={archetypeAbility}
        abilities={draft.abilities}
        innateThreshold={innateThreshold}
        innateEnergyMax={innateEnergyMax}
        onClose={() => setL2Modal(null)}
        onConfirm={handleL2Confirm}
      />
    </GuidedStepLayout>
  );
}
