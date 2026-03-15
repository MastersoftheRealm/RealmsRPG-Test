/**
 * Crafting Tool Page (Single-Page)
 * =================================
 * All-in-one crafting tool: select item, set options, configure optional rules,
 * enter rolls, see live results and outcome. Autosaves progress.
 * Layout inspired by creators (sidebar summary) and skill encounters (roll tracking).
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Hammer,
  Gauge,
  Coins,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Button,
  LoadingState,
  Alert,
  Input,
} from '@/components/ui';
import { ValueStepper, SectionHeader } from '@/components/shared';
import { CreatorLayout, CreatorSummaryPanel, CollapsibleSection } from '@/components/creator';
import {
  useCraftingSession,
  useSaveCraftingSession,
  useCreateEnhancedItem,
  useUpdateEnhancedItem,
  useCodexSkills,
  usePowerParts,
  useUserPowers,
  useOfficialLibrary,
  useEnhancedItems,
} from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { useToast } from '@/components/ui';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import {
  getCraftingRequirements,
  getUpgradeRequirements,
  getCraftingSessionLabels,
  getEnhancedCraftingRequirements,
  getConsumableEnhancedRequirements,
  getMultipleUseAdjustedEnergy,
  calculateCraftingOutcome,
  applyReduceTimeByDifficulty,
  applyReduceTimeByCost,
  applyReduceDifficultyByTime,
  applyReduceDifficultyByCost,
  getEnhancedMarketPrice,
  type CraftingRequirements,
} from '@/lib/game/crafting-utils';
import {
  CraftingItemSelectModal,
  type CraftingSelectedItem,
} from '@/components/crafting/CraftingItemSelectModal';
import type {
  CraftingSession as CraftingSessionType,
  CraftingRollSession,
  CraftingItemRef,
  CraftingPowerRef,
} from '@/types/crafting';
import { derivePowerDisplay, type PowerDocument } from '@/lib/calculators/power-calc';

function toCraftingItemRef(c: CraftingSelectedItem): CraftingItemRef {
  return {
    source: c.source === 'library' ? 'library' : 'codex',
    id: c.id,
    name: c.name,
    marketPrice: c.marketPrice,
  };
}

type PowerOption = {
  source: 'library' | 'official';
  id: string;
  name: string;
  energyCost: number;
};

export default function CraftingToolPage() {
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
  const [initialized, setInitialized] = useState(false);
  const [itemSelectOpen, setItemSelectOpen] = useState(false);
  const [upgradeItemSelectOpen, setUpgradeItemSelectOpen] = useState(false);
  const [upgradePotencyValue, setUpgradePotencyValue] = useState('');
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: codexSkills = [] } = useCodexSkills();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: userPowers = [] } = useUserPowers();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');
  const { data: enhancedItems = [] } = useEnhancedItems();

  useEffect(() => {
    if (sessionData && !initialized) {
      setSession(sessionData);
      setInitialized(true);
    }
  }, [sessionData, initialized]);

  const updateData = useCallback(
    (updates: Partial<CraftingSessionType['data']>) => {
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, data: { ...prev.data, ...updates } };
      });
    },
    []
  );

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

  // --- Derived values ---

  const item = session?.data.item ?? null;
  const customBaseItem = session?.data.customBaseItem ?? null;
  const upgradeOriginalItem = session?.data.upgradeOriginalItem ?? null;
  const isConsumable = session?.data.isConsumable ?? false;
  const quantity = session?.data.quantity ?? 1;
  const isEnhanced = session?.data.isEnhanced ?? false;
  const isUpgrade = session?.data.isUpgrade ?? false;
  const isCompleted = session?.data.status === 'completed';

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
    const toEnergyCost = (raw: Record<string, unknown>) => {
      const doc: PowerDocument = {
        name: String(raw.name ?? ''),
        description: String(raw.description ?? ''),
        parts: Array.isArray(raw.parts)
          ? (raw.parts as PowerDocument['parts'])
          : [],
        damage: Array.isArray(raw.damage)
          ? (raw.damage as PowerDocument['damage'])
          : undefined,
        actionType: typeof raw.actionType === 'string' ? raw.actionType : undefined,
        isReaction: typeof raw.isReaction === 'boolean' ? raw.isReaction : undefined,
        range: raw.range as PowerDocument['range'],
        area: raw.area as PowerDocument['area'],
        duration: raw.duration as PowerDocument['duration'],
      };
      return derivePowerDisplay(doc, powerPartsDb).energy;
    };

    userPowers.forEach((p) => {
      const id = String(p.id);
      map.set(id, {
        source: 'library',
        id,
        name: p.name,
        energyCost: toEnergyCost(p as unknown as Record<string, unknown>),
      });
    });

    (officialPowers as Array<Record<string, unknown>>).forEach((p) => {
      const id = String(p.id ?? '');
      if (!id || map.has(id)) return;
      map.set(id, {
        source: 'official',
        id,
        name: String(p.name ?? id),
        energyCost: toEnergyCost(p),
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [userPowers, officialPowers, powerPartsDb]);

  useEffect(() => {
    if (!session?.data.isEnhanced || !session.data.powerRef) return;
    const latest = powerOptions.find((p) => p.id === session.data.powerRef?.id);
    if (!latest) return;
    if (
      latest.energyCost !== session.data.powerRef.energyCost ||
      latest.name !== session.data.powerRef.name ||
      latest.source !== session.data.powerRef.source
    ) {
      updateData({
        powerRef: {
          ...session.data.powerRef,
          name: latest.name,
          source: latest.source,
          energyCost: latest.energyCost,
        },
      });
    }
  }, [session?.data.isEnhanced, session?.data.powerRef, powerOptions, updateData]);

  // Compute requirements from current session config + rules
  const requirements = useMemo((): CraftingRequirements | null => {
    if (!rulesData || (!item && !customBaseItem)) return null;
    let base: CraftingRequirements | null = null;

    if (isUpgrade && (item || customBaseItem) && upgradeOriginalItem) {
      const oldPrice = upgradeOriginalItem.marketPrice;
      const newPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
      if (!oldPrice || !newPrice) return null;
      const req = getUpgradeRequirements(oldPrice, newPrice, rulesData);
      if (!req) return null;
      base = req;
    } else if (isEnhanced && session?.data.powerRef) {
      const multiIdx = session?.data.multipleUseTableIndex ?? -1;
      const energyCost = session?.data.powerRef?.energyCost ?? 10;
      const effectiveEnergy = multiIdx >= 0
        ? getMultipleUseAdjustedEnergy(energyCost, multiIdx, rulesData)
        : energyCost;
      const enhancementReq = isConsumable
        ? getConsumableEnhancedRequirements(effectiveEnergy, rulesData)
        : getEnhancedCraftingRequirements(effectiveEnergy, rulesData);
      if (!enhancementReq) return null;

      if (session?.data.craftBaseItemAlso) {
        const baseItemMarketPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
        const baseItemReq = getCraftingRequirements(baseItemMarketPrice, false, rulesData);
        if (baseItemReq) {
          const dayHours = rulesData.craftingDayHours ?? 8;
          const toHours = (req: CraftingRequirements) =>
            req.timeUnit === 'days' ? req.timeValue * dayHours : req.timeValue;
          const combinedHours = toHours(baseItemReq) + toHours(enhancementReq);
          const combinedTimeUnit: 'hours' | 'days' =
            combinedHours >= dayHours ? 'days' : 'hours';
          const combinedTimeValue =
            combinedTimeUnit === 'days'
              ? Math.max(1, Math.ceil(combinedHours / dayHours))
              : Math.max(1, Math.ceil(combinedHours));

          base = {
            rarity: enhancementReq.rarity,
            difficultyScore: Math.max(baseItemReq.difficultyScore, enhancementReq.difficultyScore),
            requiredSuccesses: baseItemReq.requiredSuccesses + enhancementReq.requiredSuccesses,
            materialCost: baseItemReq.materialCost + enhancementReq.materialCost,
            timeValue: combinedTimeValue,
            timeUnit: combinedTimeUnit,
            sessionCount: baseItemReq.sessionCount + enhancementReq.sessionCount,
          };
        } else {
          base = enhancementReq;
        }
      } else {
        base = enhancementReq;
      }
    } else {
      const baseMarketPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
      if (!baseMarketPrice) return null;
      const req = getCraftingRequirements(baseMarketPrice, isConsumable, rulesData);
      if (!req) return null;
      base = req;
    }

    // Apply quantity / bulk
    const bulkItems = rulesData.bulkCraftCount ?? 4;
    const bulkMaterialCount = rulesData.bulkCraftMaterialCount ?? 3;
    const isBulkQuantity = quantity === bulkItems;
    const multiplier = isBulkQuantity ? bulkMaterialCount : quantity;
    if (multiplier > 1) {
      base = {
        ...base,
        requiredSuccesses: base.requiredSuccesses * multiplier,
        sessionCount: base.sessionCount * multiplier,
        materialCost: base.materialCost * multiplier,
        timeValue: base.timeValue * multiplier,
      };
    }

    // Apply optional modifiers
    let r = base;
    const mods = session?.data.optionalModifiers;
    const isCommonOrConsumableCommonToRare = r.rarity === 'Common' || (isConsumable && ['Common', 'Uncommon', 'Rare'].includes(r.rarity));
    if (mods?.reduceDifficultyByTime && typeof mods.reduceDifficultyByTime === 'number' && mods.reduceDifficultyByTime > 0) {
      for (let i = 0; i < mods.reduceDifficultyByTime; i++) {
        r = applyReduceDifficultyByTime(r, isCommonOrConsumableCommonToRare, rulesData);
      }
    }
    if ((mods?.reduceDifficultyByCostSteps ?? 0) > 0) {
      r = applyReduceDifficultyByCost(r, mods!.reduceDifficultyByCostSteps!, rulesData);
    }
    if ((mods?.reduceTimeByDifficultySteps ?? 0) > 0) {
      r = applyReduceTimeByDifficulty(r, mods!.reduceTimeByDifficultySteps!, rulesData);
    }
    if ((mods?.reduceTimeByCostSteps ?? 0) > 0) {
      r = applyReduceTimeByCost(r, mods!.reduceTimeByCostSteps!, rulesData);
    }
    return r;
  }, [item, customBaseItem, isConsumable, isEnhanced, session?.data.powerRef, session?.data.multipleUseTableIndex, session?.data.craftBaseItemAlso, session?.data.optionalModifiers, quantity, rulesData, isUpgrade, upgradeOriginalItem]);

  /** When enhanced + craft base item also: raw base vs enhancement phase for breakdown display (no quantity/modifiers). */
  const requirementsBreakdown = useMemo((): {
    baseItemReq: CraftingRequirements;
    enhancementReq: CraftingRequirements;
  } | null => {
    if (
      !rulesData ||
      !isEnhanced ||
      !session?.data.craftBaseItemAlso ||
      !session?.data.powerRef ||
      (!item && !customBaseItem)
    ) {
      return null;
    }
    const baseItemMarketPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
    const baseItemReq = getCraftingRequirements(baseItemMarketPrice, false, rulesData);
    const multiIdx = session.data.multipleUseTableIndex ?? -1;
    const energyCost = session.data.powerRef.energyCost ?? 10;
    const effectiveEnergy =
      multiIdx >= 0 ? getMultipleUseAdjustedEnergy(energyCost, multiIdx, rulesData) : energyCost;
    const enhancementReq = isConsumable
      ? getConsumableEnhancedRequirements(effectiveEnergy, rulesData)
      : getEnhancedCraftingRequirements(effectiveEnergy, rulesData);
    if (!baseItemReq || !enhancementReq) return null;
    return { baseItemReq, enhancementReq };
  }, [
    rulesData,
    isEnhanced,
    session?.data.craftBaseItemAlso,
    session?.data.powerRef,
    session?.data.multipleUseTableIndex,
    item,
    customBaseItem,
    isConsumable,
  ]);

  // Sync requirements -> session snapshot when requirements change and item is set
  useEffect(() => {
    if (!requirements || !session || (!item && !customBaseItem)) return;
    const needsSync =
      session.data.difficultyScore !== requirements.difficultyScore ||
      session.data.requiredSuccesses !== requirements.requiredSuccesses ||
      session.data.materialCost !== requirements.materialCost ||
      session.data.timeValue !== requirements.timeValue ||
      session.data.sessionCount !== requirements.sessionCount;
    if (!needsSync) return;

    const labels = getCraftingSessionLabels(requirements.timeValue, requirements.timeUnit, requirements.sessionCount);
    const existingSessions = session.data.sessions ?? [];
    const newSessions: CraftingRollSession[] = labels.map((label, i) => {
      if (i < existingSessions.length) {
        return { ...existingSessions[i], label };
      }
      return { label, roll: null, successes: 0, failures: 0 };
    });

    updateData({
      status: 'in_progress',
      difficultyScore: requirements.difficultyScore,
      requiredSuccesses: requirements.requiredSuccesses,
      materialCost: requirements.materialCost,
      enhancementMaterialCost: isEnhanced
        ? (session.data.powerRef?.energyCost != null && rulesData
            ? (isConsumable
                ? getConsumableEnhancedRequirements(
                    (session.data.multipleUseTableIndex ?? -1) >= 0
                      ? getMultipleUseAdjustedEnergy(
                          session.data.powerRef.energyCost,
                          session.data.multipleUseTableIndex ?? -1,
                          rulesData
                        )
                      : session.data.powerRef.energyCost,
                    rulesData
                  )?.materialCost
                : getEnhancedCraftingRequirements(
                    (session.data.multipleUseTableIndex ?? -1) >= 0
                      ? getMultipleUseAdjustedEnergy(
                          session.data.powerRef.energyCost,
                          session.data.multipleUseTableIndex ?? -1,
                          rulesData
                        )
                      : session.data.powerRef.energyCost,
                    rulesData
                  )?.materialCost)
            : undefined)
        : undefined,
      timeValue: requirements.timeValue,
      timeUnit: requirements.timeUnit,
      sessionCount: requirements.sessionCount,
      sessions: newSessions,
      isBulk: quantity === (rulesData?.bulkCraftCount ?? 4),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirements, customBaseItem, item, isEnhanced, isConsumable, quantity, rulesData, session?.data.powerRef, session?.data.multipleUseTableIndex]);

  const effectiveDS = (session?.data.difficultyScore ?? 0) + (session?.data.dsModifier ?? 0);

  const updateSessionRoll = useCallback(
    (index: number, roll: number | null) => {
      if (!session) return;
      const sessions = [...session.data.sessions];
      if (index < 0 || index >= sessions.length) return;
      const label = sessions[index].label;
      const { successes, failures } =
        roll != null
          ? computeSkillRollResult(roll, effectiveDS)
          : { successes: 0, failures: 0 };
      sessions[index] = { label, roll, successes, failures };
      updateData({ sessions });
    },
    [session, effectiveDS, updateData]
  );

  // Recompute all roll results when DS changes
  useEffect(() => {
    if (!session || !initialized) return;
    const sessions = session.data.sessions;
    if (!sessions?.length) return;
    let changed = false;
    const updated = sessions.map((s) => {
      if (s.roll == null) return s;
      const { successes, failures } = computeSkillRollResult(s.roll, effectiveDS);
      if (successes !== s.successes || failures !== s.failures) changed = true;
      return { ...s, successes, failures };
    });
    if (changed) updateData({ sessions: updated });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDS]);

  const totalSuccesses =
    (session?.data.sessions?.reduce((a, s) => a + s.successes, 0) ?? 0) +
    (session?.data.additionalSuccesses ?? 0);
  const totalFailures =
    (session?.data.sessions?.reduce((a, s) => a + s.failures, 0) ?? 0) +
    (session?.data.additionalFailures ?? 0);
  const required = session?.data.requiredSuccesses ?? 0;
  const netDelta = totalSuccesses - totalFailures - required;

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
  }, [rulesData, isEnhanced, item?.marketPrice, customBaseItem?.marketPrice, netDelta, session?.data.materialCost]);

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
    setSession((prev) => prev ? { ...prev, data: completedData } : prev);
    try {
      await saveMutation.mutateAsync({ id, data: completedData });
      showToast('Crafting complete!', 'success');
    } catch {
      showToast('Failed to save outcome', 'error');
    }
  }, [session, id, rulesData, isEnhanced, item, customBaseItem, netDelta, saveMutation, showToast]);

  // --- Handlers for item selection & options ---

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

  // --- Optional rules: compute valid options ---

  const maxReduceTimeByDifficultySteps = useMemo(() => {
    if (!rulesData?.optionalReduceTimeByDifficulty || !requirements) return 0;
    const opt = rulesData.optionalReduceTimeByDifficulty;
    const isShort = (requirements.timeUnit === 'days' && requirements.timeValue < 5) || requirements.timeUnit === 'hours';
    if (isShort) return opt.halfTimeWhenUnder5Days ? 1 : 0;
    const maxByTime = Math.floor((requirements.timeValue - 1) / opt.daysReductionPerStep);
    const maxBySuccesses = requirements.requiredSuccesses - 1;
    return Math.min(opt.maxSteps, maxByTime, maxBySuccesses);
  }, [rulesData, requirements]);

  const maxReduceTimeByCostSteps = useMemo(() => {
    if (!rulesData?.optionalReduceTimeByCost || !requirements) return 0;
    const opt = rulesData.optionalReduceTimeByCost;
    const isShort = (requirements.timeUnit === 'days' && requirements.timeValue < 5) || requirements.timeUnit === 'hours';
    if (isShort) return opt.halfTimeWhenUnder5Days ? 1 : 0;
    const maxByTime = Math.floor((requirements.timeValue - 1) / opt.daysReductionPerStep);
    const maxBySuccesses = requirements.requiredSuccesses - 1;
    return Math.min(opt.maxSteps, maxByTime, maxBySuccesses);
  }, [rulesData, requirements]);

  const maxReduceDifficultyByTimeSteps = useMemo(() => {
    if (!rulesData?.optionalReduceDifficultyByTime || !requirements) return 0;
    return Math.min(5, Math.max(0, Math.floor((requirements.difficultyScore - 1) / (rulesData.optionalReduceDifficultyByTime.dsReduction || 1))));
  }, [rulesData, requirements]);

  const maxReduceDifficultyByCostSteps = useMemo(() => {
    if (!rulesData?.optionalReduceDifficultyByCost) return 0;
    return rulesData.optionalReduceDifficultyByCost.maxSteps;
  }, [rulesData]);

  // --- Rendering ---

  if (isLoading || !initialized) {
    return <LoadingState message="Loading crafting session..." size="lg" />;
  }

  if (error || !session) {
    return (
      <Alert variant="danger" title="Session not found">
        {error?.message ?? 'This crafting session could not be loaded.'}
      </Alert>
    );
  }

  const sessions = session.data.sessions ?? [];
  const outcome = session.data.outcome;
  const displayName =
    item?.name ?? customBaseItem?.name ?? 'New Crafting Session';
  const mods = session.data.optionalModifiers ?? {};

  return (
    <CreatorLayout
      icon={<Hammer className="w-6 h-6" />}
      title={displayName}
      description={
        item || customBaseItem
          ? `${requirements?.rarity ?? ''} · DS ${effectiveDS} · ${required} success${required !== 1 ? 'es' : ''} required`
          : 'Select an item to begin crafting.'
      }
      actions={
        <Link href="/crafting">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Crafting
          </Button>
        </Link>
      }
      sidebar={
        <CreatorSummaryPanel
          title="Crafting Summary"
          costStats={
            requirements
              ? [
                  {
                    label: 'Difficulty Score',
                    value: effectiveDS,
                    color: 'energy',
                    icon: <Gauge className="w-5 h-5" />,
                  },
                  {
                    label: 'Material Cost',
                    value: `${Math.ceil(requirements.materialCost)} C`,
                    color: 'currency',
                    icon: <Coins className="w-5 h-5" />,
                  },
                  {
                    label: 'Time',
                    value: `${requirements.timeValue} ${requirements.timeUnit}`,
                    color: 'tp',
                    icon: <Clock className="w-5 h-5" />,
                  },
                ]
              : undefined
          }
          statRows={[
            ...(requirements
              ? [
                  { label: 'Rarity', value: requirements.rarity },
                  { label: 'Required Successes', value: requirements.requiredSuccesses },
                  { label: 'Roll Sessions', value: requirements.sessionCount },
                  { label: 'Quantity', value: quantity },
                  ...(isEnhanced && session.data.powerRef
                    ? [
                        {
                          label: 'Power Energy',
                          value: `${session.data.powerRef.energyCost} EN`,
                        },
                        {
                          label: 'Effective Energy',
                          value: `${Math.ceil(
                            getMultipleUseAdjustedEnergy(
                              session.data.powerRef.energyCost,
                              session.data.multipleUseTableIndex ?? -1,
                              rulesData!
                            )
                          )} EN`,
                        },
                        {
                          label: 'Base Craft Included',
                          value: session.data.craftBaseItemAlso ? 'Yes' : 'No',
                        },
                      ]
                    : []),
                ]
              : [{ label: 'Item', value: 'Not selected' }]),
            ...(item?.marketPrice || customBaseItem?.marketPrice
              ? [
                  {
                    label: 'Market Price',
                    value: `${item?.marketPrice ?? customBaseItem?.marketPrice} C`,
                  },
                ]
              : []),
            ...(liveOutcome
              ? [
                  {
                    label: 'Current Value',
                    value: `${Math.ceil(liveOutcome.itemWorth)} C`,
                    valueColor:
                      netDelta >= 0
                        ? 'text-success-700 dark:text-success-400'
                        : 'text-danger-700 dark:text-danger-400',
                  },
                ]
              : []),
          ]}
        >
          {requirementsBreakdown && (
            <div className="mb-4 pb-4 border-b border-border-light">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Requirements breakdown</h3>
              <p className="text-xs text-text-muted dark:text-text-secondary mb-3">
                Cost, time, and successes for each phase. Totals above are combined.
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-text-secondary dark:text-text-primary mb-1">Base item</div>
                  <div className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-text-primary">
                    <span className="font-semibold text-currency-text">{Math.ceil(requirementsBreakdown.baseItemReq.materialCost)} C</span>
                    {' · '}
                    {requirementsBreakdown.baseItemReq.timeValue} {requirementsBreakdown.baseItemReq.timeUnit}
                    {' · '}
                    {requirementsBreakdown.baseItemReq.requiredSuccesses} success{requirementsBreakdown.baseItemReq.requiredSuccesses !== 1 ? 'es' : ''}
                    {' · '}
                    DS {requirementsBreakdown.baseItemReq.difficultyScore}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-text-secondary dark:text-text-primary mb-1">Enhancement</div>
                  <div className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-text-primary">
                    <span className="font-semibold text-currency-text">{Math.ceil(requirementsBreakdown.enhancementReq.materialCost)} C</span>
                    {' · '}
                    {requirementsBreakdown.enhancementReq.timeValue} {requirementsBreakdown.enhancementReq.timeUnit}
                    {' · '}
                    {requirementsBreakdown.enhancementReq.requiredSuccesses} success{requirementsBreakdown.enhancementReq.requiredSuccesses !== 1 ? 'es' : ''}
                    {' · '}
                    DS {requirementsBreakdown.enhancementReq.difficultyScore}
                  </div>
                </div>
              </div>
            </div>
          )}
          {!isCompleted && sessions.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Successes</span>
                <span className="font-medium text-success-700 dark:text-success-400">
                  {totalSuccesses}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Failures</span>
                <span className="font-medium text-danger-700 dark:text-danger-400">
                  {totalFailures}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Net</span>
                <span
                  className={cn(
                    'font-bold',
                    netDelta >= 0
                      ? 'text-success-700 dark:text-success-400'
                      : 'text-danger-700 dark:text-danger-400'
                  )}
                >
                  {netDelta >= 0 ? `+${netDelta}` : netDelta}
                </span>
              </div>
              <div className="text-xs text-text-muted dark:text-text-secondary">
                Required successes: {required}
              </div>
              {liveOutcome && (
                <div className="mt-2 border-t border-border-light pt-2 space-y-1 text-xs text-text-secondary">
                  <div>
                    Projected net material cost: {Math.ceil(liveOutcome.finalMaterialCost)} C
                  </div>
                  <div>
                    Projected materials recovered: {Math.ceil(liveOutcome.materialsRetained)} C
                  </div>
                  <div>
                    Projected item value: {Math.ceil(liveOutcome.itemWorth)} C
                  </div>
                  {liveOutcome.extraItemCount > 0 && (
                    <div>Projected extra items: {liveOutcome.extraItemCount}</div>
                  )}
                  {liveOutcome.choiceExtraOrEnhance && (
                    <div className="text-text-primary dark:text-primary-400 font-medium">
                      Choice: extra item at 100% or enhance to 200%
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {isCompleted && outcome && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Final Value</span>
                <span className="font-medium text-text-primary">
                  {Math.ceil(outcome.itemWorth)} C
                </span>
              </div>
              {outcome.extraItemCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Extra Items</span>
                  <span className="font-medium text-text-primary">
                    {outcome.extraItemCount}
                  </span>
                </div>
              )}
            </div>
          )}
          {!isCompleted && (item || customBaseItem) && sessions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={handleComplete}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Completing...' : 'Complete Crafting'}
              </Button>
            </div>
          )}
          {saveMutation.isPending && (
            <p className="text-xs text-text-muted dark:text-text-secondary mt-2 text-center">
              Saving...
            </p>
          )}
        </CreatorSummaryPanel>
      }
      modals={
        <>
          <CraftingItemSelectModal
            isOpen={itemSelectOpen}
            onClose={() => setItemSelectOpen(false)}
            onSelect={handleItemSelect}
          />
          <CraftingItemSelectModal
            isOpen={upgradeItemSelectOpen}
            onClose={() => setUpgradeItemSelectOpen(false)}
            onSelect={handleUpgradeItemSelect}
          />
        </>
      }
    >
      {/* ───────── Main content (left 2/3) ───────── */}

          {/* Item + core options */}
          <CollapsibleSection
            title="Item & Options"
            defaultExpanded
            collapsedSummary={
              item
                ? `${item.name} · ${item.marketPrice} currency`
                : customBaseItem
                  ? `${customBaseItem.name} · ${customBaseItem.marketPrice} currency`
                  : 'No item selected'
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {item || customBaseItem ? (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border-light bg-surface-alt">
                    <span className="font-medium text-text-primary">
                      {item?.name ?? customBaseItem?.name}
                    </span>
                    {(item?.marketPrice ?? customBaseItem?.marketPrice) != null && (
                      <span className="text-sm text-text-muted dark:text-text-secondary">
                        {item?.marketPrice ?? customBaseItem?.marketPrice} currency
                      </span>
                    )}
                    {!isCompleted && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setItemSelectOpen(true)}
                          aria-label="Change item"
                        >
                          Change
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateData({
                              item: null,
                              customBaseItem: null,
                              isUpgrade: false,
                              upgradeOriginalItem: null,
                              sessions: [],
                              requiredSuccesses: 0,
                              materialCost: 0,
                              timeValue: 0,
                              sessionCount: 0,
                            })
                          }
                          aria-label="Remove item"
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  !isCompleted && (
                    <Button
                      onClick={() => setItemSelectOpen(true)}
                      aria-label="Select item to craft"
                    >
                      Select item to craft
                    </Button>
                  )
                )}
              </div>

              {/* Custom item entry */}
              {!isCompleted && (
                <div className="rounded-lg border border-border-light bg-surface-alt/60 p-3 space-y-2">
                  <p className="text-xs font-medium text-text-secondary">
                    Or define a custom base item (name + currency); rarity and crafting
                    requirements will be computed from its cost.
                  </p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Input
                      type="text"
                      placeholder="Custom item name"
                      value={customBaseItem?.name ?? ''}
                      onChange={(e) =>
                        updateData({
                          customBaseItem: {
                            name: e.target.value,
                            marketPrice: customBaseItem?.marketPrice ?? 0,
                          },
                          item: null,
                          isUpgrade: false,
                          upgradeOriginalItem: null,
                        })
                      }
                      className="min-w-[200px] max-w-xs"
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="Currency cost"
                      value={
                        customBaseItem?.marketPrice !== undefined
                          ? customBaseItem.marketPrice
                          : ''
                      }
                      onChange={(e) =>
                        updateData({
                          customBaseItem: {
                            name: customBaseItem?.name ?? '',
                            marketPrice: Number(e.target.value) || 0,
                          },
                          item: null,
                          isUpgrade: false,
                          upgradeOriginalItem: null,
                        })
                      }
                      className="w-32"
                    />
                  </div>
                </div>
              )}

              {/* Upgrade-from item selection */}
              {!isCompleted && (item || customBaseItem) && (
                <div className="rounded-lg border border-border-light bg-surface-alt/40 p-3 space-y-2">
                  <p className="text-xs font-medium text-text-secondary">
                    Upgrade an existing item into this one (cost/time based on price difference).
                  </p>
                  {upgradeOriginalItem ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-text-primary font-medium">
                        From:{' '}
                        <span className="font-semibold">
                          {upgradeOriginalItem.name}
                        </span>
                      </span>
                      <span className="text-xs text-text-muted dark:text-text-secondary">
                        {upgradeOriginalItem.marketPrice} currency
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setUpgradeItemSelectOpen(true)}
                      >
                        Change
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateData({
                            isUpgrade: false,
                            upgradeOriginalItem: null,
                          })
                        }
                      >
                        Clear upgrade
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setUpgradeItemSelectOpen(true)}
                    >
                      Select original item to upgrade from
                    </Button>
                  )}
                </div>
              )}

              {!isCompleted && (
                <div className="flex flex-wrap gap-6 items-start">
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={isConsumable}
                      onChange={(e) => updateData({ isConsumable: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-text-primary">Consumable</span>
                  </label>
                  {isConsumable && rulesData && (
                    <p className="text-xs text-text-muted dark:text-text-secondary max-w-xs self-center">
                      Crafting time is reduced to {Math.round(rulesData.consumableTimeMultiplier * 100)}% of normal.
                    </p>
                  )}

                  <div>
                    <span className="block text-sm font-medium text-text-secondary mb-1">
                      Quantity
                    </span>
                    <ValueStepper
                      value={quantity}
                      onChange={(v) => updateData({ quantity: Math.max(1, v) })}
                      min={1}
                      max={20}
                      step={1}
                      decrementTitle="Decrease quantity"
                      incrementTitle="Increase quantity"
                    />
                    <p className="text-xs text-text-muted dark:text-text-secondary mt-1 max-w-[200px]">
                      {quantity === (rulesData?.bulkCraftCount ?? 4)
                        ? `Bulk: pay for ${rulesData?.bulkCraftMaterialCount ?? 3}, receive ${rulesData?.bulkCraftCount ?? 4}.`
                        : `Crafting ${quantity} item${quantity !== 1 ? 's' : ''}.`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={isEnhanced}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateData({ isEnhanced: true, multipleUseTableIndex: -1, craftBaseItemAlso: false });
                          } else {
                            updateData({ isEnhanced: false, powerRef: null, multipleUseTableIndex: -1, craftBaseItemAlso: false });
                          }
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-text-primary">Enhanced</span>
                    </label>

                    {isEnhanced && (
                      <div className="pt-4 border-t border-border-light space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={!!session.data.craftBaseItemAlso}
                            onChange={(e) => updateData({ craftBaseItemAlso: e.target.checked })}
                            className="rounded border-border"
                          />
                          <span className="text-text-primary">Craft base item as well</span>
                        </label>
                        <p className="text-xs text-text-muted dark:text-text-secondary -mt-1">
                          Turn this on if you do not already have the base item. Requirements will include both
                          base crafting and enhancement.
                        </p>
                        <div>
                          <label
                            htmlFor="enhanced-power"
                            className="block text-sm font-medium text-text-secondary mb-1"
                          >
                            Power to imbue
                          </label>
                          <select
                            id="enhanced-power"
                            value={session.data.powerRef?.id ?? ''}
                            onChange={(e) => {
                              const pid = e.target.value;
                              const p = powerOptions.find((x) => x.id === pid);
                              if (p) {
                                const ref: CraftingPowerRef = {
                                  source: p.source,
                                  id: p.id,
                                  name: p.name,
                                  energyCost: p.energyCost,
                                };
                                updateData({ powerRef: ref });
                              } else {
                                updateData({ powerRef: null });
                              }
                            }}
                            className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                          >
                            <option value="">Select a power</option>
                            {powerOptions.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.energyCost} EN)
                              </option>
                            ))}
                          </select>
                        </div>
                        {session.data.powerRef && (
                          <div className="space-y-2">
                            <p className="text-xs text-text-muted dark:text-text-secondary">
                              Base power energy is calculated from power parts and cannot be manually overridden.
                            </p>
                            <div className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-sm text-text-primary inline-block">
                              Calculated Energy: <span className="font-semibold">{session.data.powerRef.energyCost} EN</span>
                            </div>
                          </div>
                        )}
                        {session.data.powerRef && rulesData?.multipleUseTable?.length ? (
                          <div>
                            <label
                              htmlFor="enhanced-uses"
                              className="block text-sm font-medium text-text-secondary mb-1"
                            >
                              Item uses / recovery
                            </label>
                            <select
                              id="enhanced-uses"
                              value={session.data.multipleUseTableIndex ?? -1}
                              onChange={(e) =>
                                updateData({
                                  multipleUseTableIndex: Number(e.target.value),
                                })
                              }
                              className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                            >
                              <option value={-1}>1 use per Full Recovery (100%)</option>
                              {rulesData.multipleUseTable.map((row, index) => {
                                const partial =
                                  row.partialRecovery === 'permanent'
                                    ? 'Permanent/Passive'
                                    : `${row.partialRecovery} Partial`;
                                const full =
                                  row.fullRecovery === 'permanent'
                                    ? 'Permanent/Passive'
                                    : `${row.fullRecovery} Full`;
                                return (
                                  <option key={`${partial}-${full}-${index}`} value={index}>
                                    {partial} / {full} ({row.adjustedEnergyPercent}%)
                                  </option>
                                );
                              })}
                            </select>
                            <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                              Effective crafting energy:{' '}
                              {Math.ceil(
                                getMultipleUseAdjustedEnergy(
                                  session.data.powerRef.energyCost,
                                  session.data.multipleUseTableIndex ?? -1,
                                  rulesData
                                )
                              )}{' '}
                              EN
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Modifiers: DS modifier + additional successes/failures */}
          {!isCompleted && (item || customBaseItem) && (
            <CollapsibleSection
              title="Modifiers"
              defaultExpanded
              collapsedSummary={`DS modifier ${session.data.dsModifier ?? 0}, bonus S/F`}
            >
              <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
                Adjust the effective DS or add bonus successes/failures (finer tools, help,
                environmental bonuses).
              </p>
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    DS modifier
                  </label>
                  <ValueStepper
                    value={session.data.dsModifier ?? 0}
                    onChange={(v) => updateData({ dsModifier: v })}
                    min={-10}
                    max={10}
                    step={1}
                    formatValue={(v) => (v >= 0 ? `+${v}` : `${v}`)}
                    colorValue
                    decrementTitle="Decrease DS modifier"
                    incrementTitle="Increase DS modifier"
                  />
                  <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                    Effective DS: {effectiveDS}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Additional successes
                  </label>
                  <ValueStepper
                    value={session.data.additionalSuccesses ?? 0}
                    onChange={(v) => updateData({ additionalSuccesses: v })}
                    min={0}
                    max={20}
                    step={1}
                    decrementTitle="Remove additional success"
                    incrementTitle="Add additional success"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Additional failures
                  </label>
                  <ValueStepper
                    value={session.data.additionalFailures ?? 0}
                    onChange={(v) => updateData({ additionalFailures: v })}
                    min={0}
                    max={20}
                    step={1}
                    decrementTitle="Remove additional failure"
                    incrementTitle="Add additional failure"
                  />
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Crafting rolls + skill */}
          {!isCompleted && sessions.length > 0 && (
            <CollapsibleSection
              title="Crafting Rolls"
              defaultExpanded
              collapsedSummary={`Net ${netDelta >= 0 ? `+${netDelta}` : netDelta}, ${totalSuccesses} S / ${totalFailures} F`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-sm text-text-muted dark:text-text-secondary">
                  Enter each roll total (d20 + modifiers). Results auto-calculate against DS{' '}
                  {effectiveDS}.
                </p>
                {craftSubSkills.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="craft-subskill"
                      className="block text-xs font-medium text-text-secondary"
                    >
                      Skill used
                    </label>
                    <select
                      id="craft-subskill"
                      value={session.data.item?.subSkillId ?? ''}
                      onChange={(e) => {
                        if (!session.data.item) return;
                        updateData({
                          item: { ...session.data.item, subSkillId: e.target.value || null },
                        });
                      }}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text-primary min-h-[36px] max-w-xs"
                      aria-label="Craft skill used for this project"
                    >
                      <option value="">None</option>
                      {craftSubSkills.map((s: { id: string; name: string }) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {sessions.map((s, i) => {
                  const hasRoll = s.roll != null;
                  const isSuccess = hasRoll && s.successes > 0;
                  const isFailure = hasRoll && s.failures > 0;
                  return (
                    <div
                      key={s.label}
                      className={cn(
                        'flex flex-wrap items-center gap-4 p-3 sm:p-4 rounded-xl border transition-colors',
                        hasRoll &&
                          isSuccess &&
                          'bg-green-50/50 dark:bg-green-900/10 border-l-4 border-l-green-500 border-border-light',
                        hasRoll &&
                          isFailure &&
                          'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500 border-border-light',
                        !hasRoll && 'border-border-light'
                      )}
                    >
                      <span className="font-medium text-text-primary w-28 shrink-0">
                        {s.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`roll-${id}-${i}`}>
                          Roll for {s.label}
                        </label>
                        <Input
                          id={`roll-${id}-${i}`}
                          type="number"
                          min={1}
                          max={100}
                          value={s.roll ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateSessionRoll(i, v === '' ? null : parseInt(v, 10));
                          }}
                          placeholder="Roll"
                          className="w-20 min-h-[44px]"
                        />
                      </div>
                      {hasRoll && (
                        <span className="text-sm flex items-center gap-1">
                          {isSuccess && (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-success-700 dark:text-success-400" />
                              <span className="text-success-700 dark:text-success-400 font-medium">
                                {s.successes} success{s.successes !== 1 ? 'es' : ''}
                              </span>
                            </>
                          )}
                          {isFailure && (
                            <>
                              <XCircle className="w-4 h-4 text-danger-700 dark:text-danger-400" />
                              <span className="text-danger-700 dark:text-danger-400 font-medium">
                                {s.failures} failure{s.failures !== 1 ? 's' : ''}
                              </span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* Optional rules: reduce time / reduce difficulty */}
          {!isCompleted && (item || customBaseItem) && requirements && rulesData && (
            <CollapsibleSection
              title="Crafting Adjustments"
              defaultExpanded={false}
              collapsedSummary="Trade time, DS, or cost"
            >
              <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
                Trade time for difficulty (or vice versa), or spend more resources to speed up or simplify crafting.
              </p>
              <div className="space-y-5">
                {/* Reduce Time by Increasing Difficulty */}
                {rulesData.optionalReduceTimeByDifficulty && maxReduceTimeByDifficultySteps > 0 && (
                  <div>
                    <label htmlFor="opt-rt-ds" className="block text-sm font-medium text-text-primary mb-1">
                      Reduce Time (increase DS)
                    </label>
                    <select
                      id="opt-rt-ds"
                      value={mods.reduceTimeByDifficultySteps ?? 0}
                      onChange={(e) => setOptionModifier('reduceTimeByDifficultySteps', Number(e.target.value))}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                      aria-label="Reduce time by increasing difficulty"
                    >
                      <option value={0}>No change</option>
                      {Array.from({ length: maxReduceTimeByDifficultySteps }, (_, i) => i + 1).map((n) => {
                        const opt = rulesData.optionalReduceTimeByDifficulty!;
                        const isShort = (requirements.timeUnit === 'days' && requirements.timeValue < 5) || requirements.timeUnit === 'hours';
                        if (isShort) {
                          return (
                            <option key={n} value={n}>
                              Halve time (+{opt.dsIncreasePerStep} DS)
                            </option>
                          );
                        }
                        return (
                          <option key={n} value={n}>
                            −{n * opt.daysReductionPerStep} days, −{n * opt.successesReductionPerStep} success{n * opt.successesReductionPerStep !== 1 ? 'es' : ''}, +{n * opt.dsIncreasePerStep} DS
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Reduce Time by Increasing Cost */}
                {rulesData.optionalReduceTimeByCost && maxReduceTimeByCostSteps > 0 && (
                  <div>
                    <label htmlFor="opt-rt-cost" className="block text-sm font-medium text-text-primary mb-1">
                      Reduce Time (increase cost)
                    </label>
                    <select
                      id="opt-rt-cost"
                      value={mods.reduceTimeByCostSteps ?? 0}
                      onChange={(e) => setOptionModifier('reduceTimeByCostSteps', Number(e.target.value))}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                      aria-label="Reduce time by increasing cost"
                    >
                      <option value={0}>No change</option>
                      {Array.from({ length: maxReduceTimeByCostSteps }, (_, i) => i + 1).map((n) => {
                        const opt = rulesData.optionalReduceTimeByCost!;
                        const isShort = (requirements.timeUnit === 'days' && requirements.timeValue < 5) || requirements.timeUnit === 'hours';
                        if (isShort) {
                          return (
                            <option key={n} value={n}>
                              Halve time (+50% cost)
                            </option>
                          );
                        }
                        return (
                          <option key={n} value={n}>
                            −{n * opt.daysReductionPerStep} days, −{n * opt.successesReductionPerStep} success{n * opt.successesReductionPerStep !== 1 ? 'es' : ''}, +{n * opt.costIncreasePercentPerStep}% cost
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Reduce Difficulty by Spending More Time */}
                {rulesData.optionalReduceDifficultyByTime && maxReduceDifficultyByTimeSteps > 0 && (
                  <div>
                    <label htmlFor="opt-rd-time" className="block text-sm font-medium text-text-primary mb-1">
                      Reduce DS (spend more time)
                    </label>
                    <select
                      id="opt-rd-time"
                      value={typeof mods.reduceDifficultyByTime === 'number' ? mods.reduceDifficultyByTime : (mods.reduceDifficultyByTime ? 1 : 0)}
                      onChange={(e) => setOptionModifier('reduceDifficultyByTime', Number(e.target.value))}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                      aria-label="Reduce difficulty by spending more time"
                    >
                      <option value={0}>No change</option>
                      {Array.from({ length: maxReduceDifficultyByTimeSteps }, (_, i) => i + 1).map((n) => {
                        const opt = rulesData.optionalReduceDifficultyByTime!;
                        const isCommon = requirements.rarity === 'Common' || (isConsumable && ['Common', 'Uncommon', 'Rare'].includes(requirements.rarity));
                        const extraDays = isCommon ? opt.additionalDaysCommon : opt.additionalDaysOther;
                        return (
                          <option key={n} value={n}>
                            −{n * opt.dsReduction} DS, +{n * extraDays} days, +{n * opt.successesIncrease} success{n * opt.successesIncrease !== 1 ? 'es' : ''} required
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Reduce Difficulty by Spending More Resources */}
                {rulesData.optionalReduceDifficultyByCost && maxReduceDifficultyByCostSteps > 0 && (
                  <div>
                    <label htmlFor="opt-rd-cost" className="block text-sm font-medium text-text-primary mb-1">
                      Reduce DS (spend more resources)
                    </label>
                    <select
                      id="opt-rd-cost"
                      value={mods.reduceDifficultyByCostSteps ?? 0}
                      onChange={(e) => setOptionModifier('reduceDifficultyByCostSteps', Number(e.target.value))}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                      aria-label="Reduce difficulty by spending more resources"
                    >
                      <option value={0}>No change</option>
                      {Array.from({ length: maxReduceDifficultyByCostSteps }, (_, i) => i + 1).map((n) => {
                        const opt = rulesData.optionalReduceDifficultyByCost!;
                        return (
                          <option key={n} value={n}>
                            −{n * opt.dsReduction} DS, +{n * opt.costIncreasePercent}% cost
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Completed outcome */}
          {isCompleted && outcome && (
            <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
              <SectionHeader title="Outcome" size="md" className="mb-3" />
              <p className="text-text-secondary whitespace-pre-wrap">{outcome.effectText}</p>
              {craftSubSkill && (craftSubSkill.craft_success_desc || craftSubSkill.craft_failure_desc) && (
                <div className="mt-3 pt-3 border-t border-border-light">
                  <p className="text-xs font-medium text-text-muted dark:text-text-secondary uppercase tracking-wide mb-1">
                    {craftSubSkill.name} — {netDelta >= 0 ? 'Success' : 'Failure'}
                  </p>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {netDelta >= 0
                      ? (craftSubSkill.craft_success_desc ?? '')
                      : (craftSubSkill.craft_failure_desc ?? '')}
                  </p>
                </div>
              )}
              <ul className="mt-3 text-sm text-text-secondary space-y-1">
                <li>Materials spent: {Math.ceil(outcome.finalMaterialCost)} currency</li>
                <li>Materials recovered: {Math.ceil(outcome.materialsRetained)} currency</li>
                <li>Item value: {Math.ceil(outcome.itemWorth)} currency</li>
                {outcome.extraItemCount > 0 && (
                  <li>Extra items: {outcome.extraItemCount}</li>
                )}
                {outcome.choiceExtraOrEnhance && (
                  <li>Your choice: one extra item at full value, or enhance to 200% value</li>
                )}
              </ul>
              {session.data.isEnhanced && session.data.powerRef && !session.data.isUpgradePotency && (
                <div className="mt-4 pt-4 border-t border-border-light">
                  <p className="text-sm text-text-secondary mb-2">Save this enhanced item to My Library.</p>
                  <Button
                    onClick={async () => {
                      try {
                        const baseItem = session.data.customBaseItem ?? session.data.item;
                        if (!baseItem || !session.data.powerRef) return;
                        const name = `${'name' in baseItem ? baseItem.name : 'Item'} (${session.data.powerRef.name})`;
                        const selectedUses =
                          (session.data.multipleUseTableIndex ?? -1) >= 0 && rulesData?.multipleUseTable
                            ? rulesData.multipleUseTable[session.data.multipleUseTableIndex ?? -1]
                            : null;
                        const usesType =
                          selectedUses?.fullRecovery === 'permanent' ||
                          selectedUses?.partialRecovery === 'permanent'
                            ? 'permanent'
                            : selectedUses
                              ? 'full'
                              : 'full';
                        const usesCount =
                          selectedUses?.fullRecovery === 'permanent'
                            ? undefined
                            : selectedUses?.fullRecovery ?? 1;
                        await createEnhanced.mutateAsync({
                          name,
                          baseItem,
                          powerRef: session.data.powerRef,
                          potency: typeof session.data.potency === 'number' ? session.data.potency : undefined,
                          usesType,
                          usesCount,
                        });
                        showToast('Saved to Enhanced Equipment in Library', 'success');
                      } catch (e) {
                        showToast((e as Error)?.message ?? 'Failed to save', 'error');
                      }
                    }}
                    disabled={createEnhanced.isPending}
                  >
                    {createEnhanced.isPending ? 'Saving...' : 'Save to Library'}
                  </Button>
                </div>
              )}
              {session.data.isUpgradePotency && session.data.upgradePotencyEnhancedItemId && (
                <div className="mt-4 pt-4 border-t border-border-light">
                  <p className="text-sm text-text-secondary mb-2">
                    Update the enhanced item&apos;s potency in your library.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="upgrade-potency-input" className="block text-sm font-medium text-text-secondary">New potency</label>
                    <Input
                      id="upgrade-potency-input"
                      type="number"
                      min={0}
                      max={100}
                      value={upgradePotencyValue}
                      onChange={(e) => setUpgradePotencyValue(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-24"
                      aria-label="New potency for enhanced item"
                    />
                    <Button
                      onClick={async () => {
                        const potency = parseInt(upgradePotencyValue, 10);
                        if (Number.isNaN(potency) || potency < 0) {
                          showToast('Enter a valid potency (0 or higher)', 'error');
                          return;
                        }
                        try {
                          await updateEnhanced.mutateAsync({
                            id: session.data.upgradePotencyEnhancedItemId!,
                            patch: { potency },
                          });
                          showToast('Potency updated', 'success');
                        } catch (e) {
                          showToast((e as Error)?.message ?? 'Failed to update', 'error');
                        }
                      }}
                      disabled={updateEnhanced.isPending}
                    >
                      {updateEnhanced.isPending ? 'Updating...' : 'Update Potency'}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}
    </CreatorLayout>
  );
}
