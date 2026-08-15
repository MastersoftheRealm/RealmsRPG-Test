/**
 * Crafting tool page state + derived values (TASK-607 / TASK-666e)
 * ================================================================
 * Co-located hook for the crafting session facade — presentation lives in sibling panels.
 * Pure derived/sync helpers: `crafting-tool-derived.ts`.
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
  getEnhancedMarketPrice,
  calculateCraftingOutcome,
  type CraftingRequirements,
} from '@/lib/game/crafting-utils';
import type { CraftingSelectedItem } from '@/components/crafting/CraftingItemSelectModal';
import type { CraftingSession as CraftingSessionType } from '@/types/crafting';
import { bootstrapCraftingSession, craftingSessionNeedsRules } from '../../crafting-bootstrap';
import {
  type PowerOption,
  type UsesType,
  toCraftingItemRef,
  getSessionDsForIndex,
  computeCraftingRequirements,
  computeRequirementsBreakdown,
  computeOptionalModifierMaxSteps,
} from './crafting-tool-helpers';
import {
  filterCraftSubSkills,
  buildCraftingPowerOptions,
  resolveLiveCraftingPowerRef,
  buildRequirementsSyncPatch,
  mapDisplaySessionsWithRollResults,
  computeCraftingSessionTallies,
  computeLiveCraftingOutcome,
  computeBaseOutcomeForDisplay,
} from './crafting-tool-derived';

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

  const updateData = useCallback((updates: Partial<CraftingSessionType['data']>) => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, data: { ...prev.data, ...updates } };
    });
  }, []);

  const { data: codexSkills = [] } = useCodexSkills();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: userPowers = [] } = useUserPowers();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');

  // Render-time bootstrap (encounter skill page pattern) — no hydrate effect.
  const canBootstrap = !!sessionData && (!craftingSessionNeedsRules(sessionData) || !!rulesData);
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

  const craftSubSkills = useMemo(() => filterCraftSubSkills(codexSkills), [codexSkills]);

  const craftSubSkill = session?.data.item?.subSkillId
    ? codexSkills.find(
        (s: { id: string }) => String(s.id) === String(session.data.item?.subSkillId),
      )
    : null;

  const powerOptions = useMemo<PowerOption[]>(
    () => buildCraftingPowerOptions(userPowers, officialPowers, powerPartsDb),
    [userPowers, officialPowers, powerPartsDb],
  );

  const resolvedPowerRef = useMemo(
    () =>
      resolveLiveCraftingPowerRef(session?.data.isEnhanced, session?.data.powerRef, powerOptions),
    [session?.data.isEnhanced, session?.data.powerRef, powerOptions],
  );

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
  if (initialized && requirements && session && (item || customBaseItem)) {
    const patch = buildRequirementsSyncPatch({
      session,
      requirements,
      requirementsBreakdown,
      rulesData: rulesData!,
      isEnhanced,
      isConsumable,
      resolvedPowerRef,
      usesType,
      usesCount,
      quantity,
    });
    if (patch) {
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, data: { ...prev.data, ...patch } };
      });
    }
  }

  const baseDS = requirements?.difficultyScore ?? session?.data.difficultyScore ?? 0;
  const effectiveDS = baseDS + (session?.data.dsModifier ?? 0);

  const displaySessions = useMemo(
    () =>
      mapDisplaySessionsWithRollResults({
        sessions: session?.data.sessions ?? [],
        effectiveDS,
        dsModifier: session?.data.dsModifier ?? 0,
        isEnhanced,
        craftBaseItemAlso: !!session?.data.craftBaseItemAlso,
        requirementsBreakdown,
      }),
    [session, effectiveDS, isEnhanced, requirementsBreakdown],
  );

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
        roll != null ? computeSkillRollResult(roll, dsForSession) : { successes: 0, failures: 0 };
      sessions[index] = { label, roll, successes, failures };
      updateData({ sessions });
    },
    [session, effectiveDS, updateData, isEnhanced, requirementsBreakdown],
  );

  const tallies = useMemo(
    () =>
      computeCraftingSessionTallies({
        displaySessions,
        requirementsBreakdown,
        isEnhanced,
        craftBaseItemAlso: !!session?.data.craftBaseItemAlso,
        requiredSuccesses: session?.data.requiredSuccesses ?? 0,
        additionalSuccesses: session?.data.additionalSuccesses ?? 0,
        additionalFailures: session?.data.additionalFailures ?? 0,
      }),
    [displaySessions, requirementsBreakdown, isEnhanced, session],
  );

  const {
    baseSessionSuccesses,
    baseSessionFailures,
    enhSessionSuccesses,
    enhSessionFailures,
    baseRequired,
    required,
    totalEnhSuccesses,
    totalEnhFailures,
    netDelta,
  } = tallies;

  const liveOutcome = useMemo(
    () =>
      computeLiveCraftingOutcome({
        rulesData,
        isEnhanced,
        materialCost: session?.data.materialCost ?? 0,
        item,
        customBaseItem,
        netDelta,
      }),
    [rulesData, isEnhanced, item, customBaseItem, netDelta, session?.data.materialCost],
  );

  const baseOutcomeForDisplay = useMemo(
    () =>
      computeBaseOutcomeForDisplay({
        rulesData,
        requirementsBreakdown,
        isEnhanced,
        craftBaseItemAlso: !!session?.data.craftBaseItemAlso,
        item,
        customBaseItem,
        baseRequired,
        baseSessionSuccesses,
        baseSessionFailures,
      }),
    [
      rulesData,
      requirementsBreakdown,
      isEnhanced,
      session?.data.craftBaseItemAlso,
      item,
      customBaseItem,
      baseRequired,
      baseSessionSuccesses,
      baseSessionFailures,
    ],
  );

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
      rulesData.successesTable,
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
    [rulesData, requirements],
  );

  const sessions = displaySessions;
  const outcome = session?.data.outcome;
  const displayName = item?.name ?? customBaseItem?.name ?? 'New Crafting Session';
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
