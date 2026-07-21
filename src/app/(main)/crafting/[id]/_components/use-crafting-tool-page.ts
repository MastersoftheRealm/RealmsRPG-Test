/**
 * Crafting tool page state + derived values (TASK-607)
 * ====================================================
 * Co-located hook for the crafting session facade — presentation lives in sibling panels.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  useCraftingSession,
  useSaveCraftingSession,
  useCreateEnhancedItem,
  useUpdateEnhancedItem,
  useCodexSkills,
  usePowerParts,
  useUserPowers,
  useOfficialLibrary,
} from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { useToast } from '@/components/ui';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import {
  getCraftingSessionLabels,
  getEnhancedCraftingRequirements,
  getConsumableEnhancedRequirements,
  getEnhancedMarketPrice,
  calculateCraftingOutcome,
  type CraftingRequirements,
} from '@/lib/game/crafting-utils';
import type { CraftingSelectedItem } from '@/components/crafting/CraftingItemSelectModal';
import type {
  CraftingSession as CraftingSessionType,
  CraftingRollSession,
  CraftingPowerRef,
} from '@/types/crafting';
import { derivePowerDisplay, type PowerDocument } from '@/lib/calculators/power-calc';
import type { LibraryPower } from '@/types/library';
import {
  bootstrapCraftingSession,
  craftingSessionNeedsRules,
} from '../../crafting-bootstrap';
import {
  type PowerOption,
  type UsesType,
  toCraftingItemRef,
  resolveMultipleUseIndex,
  getEffectiveCraftingEnergy,
  getSessionDsForIndex,
  computeCraftingRequirements,
  computeRequirementsBreakdown,
  computeOptionalModifierMaxSteps,
} from './crafting-tool-helpers';

export function useCraftingToolPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { data: sessionData, isLoading, error } = useCraftingSession(id);
  const saveMutation = useSaveCraftingSession();
  const createEnhanced = useCreateEnhancedItem();
  const updateEnhanced = useUpdateEnhancedItem();
  const { showToast } = useToast();
  const { rules } = useGameRules();
  const rulesData = rules?.CRAFTING;

  const [session, setSession] = useState<CraftingSessionType | null>(null);
  const [initializedSessionId, setInitializedSessionId] = useState<string | null>(null);
  const [itemSelectOpen, setItemSelectOpen] = useState(false);
  const [upgradeItemSelectOpen, setUpgradeItemSelectOpen] = useState(false);
  const [upgradePotencyValue, setUpgradePotencyValue] = useState('');
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateData = useCallback(
    (updates: Partial<CraftingSessionType['data']>) => {
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, data: { ...prev.data, ...updates } };
      });
    },
    []
  );

  const { data: codexSkills = [] } = useCodexSkills();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: userPowers = [] } = useUserPowers();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');

  // Render-time bootstrap (encounter skill page pattern) — no hydrate effect.
  const canBootstrap =
    !!sessionData &&
    (!craftingSessionNeedsRules(sessionData) || !!rulesData);
  if (canBootstrap && initializedSessionId !== id) {
    setSession(bootstrapCraftingSession(sessionData!, rulesData));
    setInitializedSessionId(id);
  }
  const initialized = initializedSessionId === id && !!session;

  // Autosave: debounced 2s after any change
  useEffect(() => {
    if (!session || !id || !initialized) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveMutation.mutate({
        id,
        data: session.data,
      });
    }, 2000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.data, id, initialized]);

  const item = session?.data.item ?? null;
  const customBaseItem = session?.data.customBaseItem ?? null;
  const upgradeOriginalItem = session?.data.upgradeOriginalItem ?? null;
  const isConsumable = session?.data.isConsumable ?? false;
  const quantity = session?.data.quantity ?? 1;
  const isEnhanced = session?.data.isEnhanced ?? false;
  const isUpgrade = session?.data.isUpgrade ?? false;
  const isCompleted = session?.data.status === 'completed';
  const usesType = (session?.data.usesType ?? 'full') as UsesType;
  const usesCount = session?.data.usesCount ?? 1;

  const CRAFT_BASE_SKILL_ID = 13;
  const craftSubSkills = useMemo(() => {
    const withCraftDesc = codexSkills.filter(
      (s: { base_skill_id?: number; craft_success_desc?: string; craft_failure_desc?: string }) =>
        s.craft_success_desc || s.craft_failure_desc
    );
    const craftSubs = withCraftDesc.filter(
      (s: { base_skill_id?: number }) => s.base_skill_id === CRAFT_BASE_SKILL_ID
    );
    return craftSubs.length > 0 ? craftSubs : withCraftDesc;
  }, [codexSkills]);

  const craftSubSkill = session?.data.item?.subSkillId
    ? codexSkills.find((s: { id: string }) => String(s.id) === String(session.data.item?.subSkillId))
    : null;

  const powerOptions = useMemo<PowerOption[]>(() => {
    const map = new Map<string, PowerOption>();
    const toEnergyCost = (raw: LibraryPower) => {
      const doc: PowerDocument = {
        name: raw.name,
        description: raw.description,
        parts: raw.parts,
        damage: raw.damage,
        actionType: raw.actionType,
        isReaction: raw.isReaction,
        range: raw.range,
        area: raw.area,
        duration: raw.duration,
      };
      return derivePowerDisplay(doc, powerPartsDb).energy;
    };

    userPowers.forEach((p) => {
      const powerId = String(p.id);
      map.set(powerId, {
        source: 'library',
        id: powerId,
        name: p.name,
        energyCost: toEnergyCost(p),
      });
    });

    officialPowers.forEach((p) => {
      const powerId = String(p.id ?? '');
      if (!powerId || map.has(powerId)) return;
      map.set(powerId, {
        source: 'official',
        id: powerId,
        name: String(p.name ?? powerId),
        energyCost: toEnergyCost(p),
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [userPowers, officialPowers, powerPartsDb]);

  /** Live power metadata for display/requirements; persist only on explicit power select. */
  const resolvedPowerRef = useMemo((): CraftingPowerRef | null | undefined => {
    const ref = session?.data.powerRef;
    if (!session?.data.isEnhanced || !ref) return ref;
    const latest = powerOptions.find((p) => p.id === ref.id);
    if (!latest) return ref;
    if (
      latest.name === ref.name &&
      latest.energyCost === ref.energyCost &&
      latest.source === ref.source
    ) {
      return ref;
    }
    return {
      ...ref,
      name: latest.name,
      source: latest.source,
      energyCost: latest.energyCost,
    };
  }, [session?.data.isEnhanced, session?.data.powerRef, powerOptions]);

  const requirements = useMemo((): CraftingRequirements | null => {
    if (!rulesData || (!item && !customBaseItem) || !session) return null;
    return computeCraftingRequirements({
      rulesData,
      session,
      item,
      customBaseItem,
      upgradeOriginalItem,
      isConsumable,
      quantity,
      isEnhanced,
      isUpgrade,
      resolvedPowerRef,
      usesType,
      usesCount,
    });
  }, [
    item,
    customBaseItem,
    isConsumable,
    isEnhanced,
    resolvedPowerRef,
    session,
    quantity,
    rulesData,
    isUpgrade,
    upgradeOriginalItem,
    usesType,
    usesCount,
  ]);

  const requirementsBreakdown = useMemo(() => {
    if (!rulesData || !session) return null;
    return computeRequirementsBreakdown({
      rulesData,
      session,
      item,
      customBaseItem,
      isConsumable,
      isEnhanced,
      resolvedPowerRef,
      usesType,
      usesCount,
    });
  }, [
    rulesData,
    isEnhanced,
    resolvedPowerRef,
    item,
    customBaseItem,
    isConsumable,
    usesType,
    usesCount,
    session,
  ]);

  // Sync requirements → session snapshot when config changes (render-time — TASK-430)
  if (
    initialized &&
    requirements &&
    session &&
    (item || customBaseItem)
  ) {
    const needsSync =
      session.data.difficultyScore !== requirements.difficultyScore ||
      session.data.requiredSuccesses !== requirements.requiredSuccesses ||
      session.data.materialCost !== requirements.materialCost ||
      session.data.timeValue !== requirements.timeValue ||
      session.data.sessionCount !== requirements.sessionCount;
    if (needsSync) {
      let labels: string[];
      if (
        isEnhanced &&
        session.data.craftBaseItemAlso &&
        requirementsBreakdown
      ) {
        const baseLabels = getCraftingSessionLabels(
          requirementsBreakdown.baseItemReq.timeValue,
          requirementsBreakdown.baseItemReq.timeUnit,
          requirementsBreakdown.baseItemReq.sessionCount
        );
        const enhancementLabels = getCraftingSessionLabels(
          requirementsBreakdown.enhancementReq.timeValue,
          requirementsBreakdown.enhancementReq.timeUnit,
          requirementsBreakdown.enhancementReq.sessionCount
        );
        labels = [...baseLabels, ...enhancementLabels];
      } else {
        labels = getCraftingSessionLabels(
          requirements.timeValue,
          requirements.timeUnit,
          requirements.sessionCount
        );
      }
      const existingSessions = session.data.sessions ?? [];
      const newSessions: CraftingRollSession[] = labels.map((label, i) => {
        if (i < existingSessions.length) {
          return { ...existingSessions[i], label };
        }
        return { label, roll: null, successes: 0, failures: 0 };
      });

      let enhancementMaterialCost: number | undefined;
      if (isEnhanced && resolvedPowerRef?.energyCost != null && rulesData) {
        const idx = resolveMultipleUseIndex(
          rulesData,
          usesType,
          usesCount,
          session.data.multipleUseTableIndex
        );
        const effEnergy = getEffectiveCraftingEnergy(
          resolvedPowerRef.energyCost,
          idx,
          rulesData
        );
        const req = isConsumable
          ? getConsumableEnhancedRequirements(effEnergy, rulesData)
          : getEnhancedCraftingRequirements(effEnergy, rulesData);
        enhancementMaterialCost = req?.materialCost;
      }

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            status: 'in_progress',
            difficultyScore: requirements.difficultyScore,
            requiredSuccesses: requirements.requiredSuccesses,
            materialCost: requirements.materialCost,
            enhancementMaterialCost: isEnhanced ? enhancementMaterialCost : undefined,
            timeValue: requirements.timeValue,
            timeUnit: requirements.timeUnit,
            sessionCount: requirements.sessionCount,
            sessions: newSessions,
            isBulk: quantity === (rulesData?.bulkCraftCount ?? 4),
          },
        };
      });
    }
  }

  const baseDS = requirements?.difficultyScore ?? session?.data.difficultyScore ?? 0;
  const effectiveDS = baseDS + (session?.data.dsModifier ?? 0);

  const displaySessions = useMemo(() => {
    const sessions = session?.data.sessions ?? [];
    if (!sessions.length) return sessions;
    return sessions.map((s, index) => {
      if (s.roll == null) return s;
      const dsForSession = getSessionDsForIndex({
        index,
        effectiveDS,
        dsModifier: session?.data.dsModifier ?? 0,
        isEnhanced,
        craftBaseItemAlso: !!session?.data.craftBaseItemAlso,
        requirementsBreakdown,
      });
      const { successes, failures } = computeSkillRollResult(s.roll, dsForSession);
      if (successes === s.successes && failures === s.failures) return s;
      return { ...s, successes, failures };
    });
  }, [session, effectiveDS, isEnhanced, requirementsBreakdown]);

  const updateSessionRoll = useCallback(
    (index: number, roll: number | null) => {
      if (!session) return;
      const sessions = [...session.data.sessions];
      if (index < 0 || index >= sessions.length) return;
      const label = sessions[index].label;
      const dsForSession = getSessionDsForIndex({
        index,
        effectiveDS,
        dsModifier: session.data.dsModifier ?? 0,
        isEnhanced,
        craftBaseItemAlso: !!session.data.craftBaseItemAlso,
        requirementsBreakdown,
      });
      const { successes, failures } =
        roll != null
          ? computeSkillRollResult(roll, dsForSession)
          : { successes: 0, failures: 0 };
      sessions[index] = { label, roll, successes, failures };
      updateData({ sessions });
    },
    [session, effectiveDS, updateData, isEnhanced, requirementsBreakdown]
  );

  let baseSessionSuccesses = 0;
  let baseSessionFailures = 0;
  let enhSessionSuccesses = 0;
  let enhSessionFailures = 0;

  if (
    displaySessions.length &&
    requirementsBreakdown &&
    isEnhanced &&
    session?.data.craftBaseItemAlso
  ) {
    const baseCount = requirementsBreakdown.baseItemReq.requiredSuccesses;
    displaySessions.forEach((s, index) => {
      if (index < baseCount) {
        baseSessionSuccesses += s.successes;
        baseSessionFailures += s.failures;
      } else {
        enhSessionSuccesses += s.successes;
        enhSessionFailures += s.failures;
      }
    });
  } else {
    const totals = displaySessions.reduce(
      (acc, s) => {
        acc.s += s.successes;
        acc.f += s.failures;
        return acc;
      },
      { s: 0, f: 0 }
    );
    enhSessionSuccesses = totals.s;
    enhSessionFailures = totals.f;
  }

  const additionalSuccesses = session?.data.additionalSuccesses ?? 0;
  const additionalFailures = session?.data.additionalFailures ?? 0;

  const enhancementRequired =
    isEnhanced && requirementsBreakdown && session?.data.craftBaseItemAlso
      ? requirementsBreakdown.enhancementReq.requiredSuccesses
      : session?.data.requiredSuccesses ?? 0;

  const baseRequired =
    isEnhanced && requirementsBreakdown && session?.data.craftBaseItemAlso
      ? requirementsBreakdown.baseItemReq.requiredSuccesses
      : 0;

  const required = enhancementRequired;

  const totalEnhSuccesses = enhSessionSuccesses + additionalSuccesses;
  const totalEnhFailures = enhSessionFailures + additionalFailures;
  const netDelta = totalEnhSuccesses - totalEnhFailures - enhancementRequired;

  const liveOutcome = useMemo(() => {
    if (!rulesData) return null;
    const baseMarketPrice = isEnhanced
      ? getEnhancedMarketPrice(session?.data.materialCost ?? 0, rulesData)
      : (item?.marketPrice ?? customBaseItem?.marketPrice ?? 0);
    if (!baseMarketPrice) return null;
    return calculateCraftingOutcome(
      netDelta,
      session?.data.materialCost ?? 0,
      baseMarketPrice,
      rulesData.successesTable
    );
  }, [
    rulesData,
    isEnhanced,
    item?.marketPrice,
    customBaseItem?.marketPrice,
    netDelta,
    session?.data.materialCost,
  ]);

  const baseOutcomeForDisplay = useMemo(() => {
    if (
      !rulesData ||
      !requirementsBreakdown ||
      !isEnhanced ||
      !session?.data.craftBaseItemAlso
    ) {
      return null;
    }
    const baseMarketPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
    if (!baseMarketPrice) return null;
    const baseMaterialCost = requirementsBreakdown.baseItemReq.materialCost;
    const baseNetDelta =
      baseRequired > 0 ? baseSessionSuccesses - baseSessionFailures - baseRequired : 0;
    return calculateCraftingOutcome(
      baseNetDelta,
      baseMaterialCost,
      baseMarketPrice,
      rulesData.successesTable
    );
  }, [
    rulesData,
    requirementsBreakdown,
    isEnhanced,
    session?.data.craftBaseItemAlso,
    item?.marketPrice,
    customBaseItem?.marketPrice,
    baseRequired,
    baseSessionSuccesses,
    baseSessionFailures,
  ]);

  const handleComplete = useCallback(async () => {
    if (!session || !id || !rulesData || (!item && !customBaseItem)) return;
    const baseMarketPrice = isEnhanced
      ? getEnhancedMarketPrice(session.data.materialCost ?? 0, rulesData)
      : (item?.marketPrice ?? customBaseItem?.marketPrice ?? 0);
    if (!baseMarketPrice) return;
    const outcome = calculateCraftingOutcome(
      netDelta,
      session.data.materialCost ?? 0,
      baseMarketPrice,
      rulesData.successesTable
    );
    const completedData = {
      ...session.data,
      sessions: displaySessions,
      status: 'completed' as const,
      netDelta,
      outcome: {
        finalMaterialCost: outcome.finalMaterialCost,
        materialsRetained: outcome.materialsRetained,
        itemWorth: outcome.itemWorth,
        extraItemCount: outcome.extraItemCount,
        choiceExtraOrEnhance: outcome.choiceExtraOrEnhance,
        effectText: outcome.effectText,
      },
    };
    setSession((prev) => (prev ? { ...prev, data: completedData } : prev));
    try {
      await saveMutation.mutateAsync({ id, data: completedData });
      showToast('Crafting complete!', 'success');
    } catch {
      showToast('Failed to save outcome', 'error');
    }
  }, [
    session,
    id,
    rulesData,
    isEnhanced,
    item,
    customBaseItem,
    netDelta,
    displaySessions,
    saveMutation,
    showToast,
  ]);

  const handleItemSelect = (selected: CraftingSelectedItem) => {
    const ref = toCraftingItemRef(selected);
    updateData({
      item: ref,
      customBaseItem: null,
    });
    setItemSelectOpen(false);
  };

  const handleUpgradeItemSelect = (selected: CraftingSelectedItem) => {
    const ref = toCraftingItemRef(selected);
    updateData({
      isUpgrade: true,
      upgradeOriginalItem: ref,
    });
    setUpgradeItemSelectOpen(false);
  };

  const setOptionModifier = (key: string, value: number) => {
    const prev = session?.data.optionalModifiers ?? {};
    updateData({ optionalModifiers: { ...prev, [key]: value } });
  };

  const {
    maxReduceTimeByDifficultySteps,
    maxReduceTimeByCostSteps,
    maxReduceDifficultyByTimeSteps,
    maxReduceDifficultyByCostSteps,
  } = useMemo(
    () => computeOptionalModifierMaxSteps(rulesData, requirements),
    [rulesData, requirements]
  );

  const sessions = displaySessions;
  const outcome = session?.data.outcome;
  const displayName =
    item?.name ?? customBaseItem?.name ?? 'New Crafting Session';
  const mods = session?.data.optionalModifiers ?? {};

  return {
    id,
    isLoading,
    error,
    initialized,
    session,
    rulesData,
    saveMutation,
    createEnhanced,
    updateEnhanced,
    showToast,
    itemSelectOpen,
    setItemSelectOpen,
    upgradeItemSelectOpen,
    setUpgradeItemSelectOpen,
    upgradePotencyValue,
    setUpgradePotencyValue,
    updateData,
    item,
    customBaseItem,
    upgradeOriginalItem,
    isConsumable,
    quantity,
    isEnhanced,
    isCompleted,
    usesType,
    usesCount,
    craftSubSkills,
    craftSubSkill,
    powerOptions,
    resolvedPowerRef,
    requirements,
    requirementsBreakdown,
    effectiveDS,
    sessions,
    updateSessionRoll,
    baseSessionSuccesses,
    baseSessionFailures,
    enhSessionSuccesses,
    enhSessionFailures,
    totalEnhSuccesses,
    totalEnhFailures,
    required,
    netDelta,
    liveOutcome,
    baseOutcomeForDisplay,
    handleComplete,
    handleItemSelect,
    handleUpgradeItemSelect,
    setOptionModifier,
    maxReduceTimeByDifficultySteps,
    maxReduceTimeByCostSteps,
    maxReduceDifficultyByTimeSteps,
    maxReduceDifficultyByCostSteps,
    outcome,
    displayName,
    mods,
  };
}

export type CraftingToolPageModel = ReturnType<typeof useCraftingToolPage>;
