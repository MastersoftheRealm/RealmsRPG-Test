/**
 * New Crafting Session Page
 * ==========================
 * Select item (codex equipment or library item), set Consumable/Bulk, then Start -> create session and redirect to /crafting/[id].
 * Supports mode=upgrade (original + upgraded item) and optional crafting mechanics (reduce time/difficulty).
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageContainer, PageHeader, Button, LoadingState, Alert, Input } from '@/components/ui';
import { SectionHeader } from '@/components/shared';
import { useUserPowers, useCreateCraftingSession, useCodexSkills, useEnhancedItems } from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { CraftingItemSelectModal, type CraftingSelectedItem } from '@/components/crafting/CraftingItemSelectModal';
import {
  getCraftingRequirements,
  getCraftingSessionLabels,
  getEnhancedCraftingRequirements,
  getConsumableEnhancedRequirements,
  getMultipleUseAdjustedEnergy,
  getUpgradeRequirements,
  getUpgradePotencyRequirements,
  applyReduceTimeByDifficulty,
  applyReduceTimeByCost,
  applyReduceDifficultyByTime,
  applyReduceDifficultyByCost,
  type CraftingRequirements,
} from '@/lib/game/crafting-utils';
import type { CraftingItemRef, CraftingRollSession, CraftingPowerRef, CraftingCustomBaseItem, UserEnhancedItem } from '@/types/crafting';

function toCraftingItemRef(c: CraftingSelectedItem): CraftingItemRef {
  return {
    source: c.source === 'library' ? 'library' : 'codex',
    id: c.id,
    name: c.name,
    marketPrice: c.marketPrice,
  };
}

export default function NewCraftingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeUpgrade = searchParams.get('mode') === 'upgrade';
  const modeUpgradePotency = searchParams.get('mode') === 'upgrade-potency';

  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: enhancedItems = [], isLoading: enhancedLoading } = useEnhancedItems();
  const { rules, isLoading: rulesLoading } = useGameRules();
  const createSession = useCreateCraftingSession();

  const [itemSelectModalOpen, setItemSelectModalOpen] = useState(false);
  const [itemSelectModalPurpose, setItemSelectModalPurpose] = useState<'main' | 'upgrade-original' | 'upgrade-target' | null>(null);

  const [selectedItem, setSelectedItem] = useState<CraftingItemRef | null>(null);
  const [upgradeOriginalItem, setUpgradeOriginalItem] = useState<CraftingItemRef | null>(null);
  const [selectedEnhancedForPotency, setSelectedEnhancedForPotency] = useState<UserEnhancedItem | null>(null);
  const [isConsumable, setIsConsumable] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [selectedPower, setSelectedPower] = useState<{ id: string; name: string } | null>(null);
  const [energyCost, setEnergyCost] = useState<number>(10);
  const [customBaseName, setCustomBaseName] = useState('');
  const [customBasePrice, setCustomBasePrice] = useState<number>(0);
  const [useCustomBase, setUseCustomBase] = useState(false);
  const [potency, setPotency] = useState<number | 'creator'>('creator');
  const [multipleUseIndex, setMultipleUseIndex] = useState<number>(-1);

  const [reduceTimeByDifficultySteps, setReduceTimeByDifficultySteps] = useState(0);
  const [reduceTimeByCostSteps, setReduceTimeByCostSteps] = useState(0);
  const [reduceDifficultyByTime, setReduceDifficultyByTime] = useState(false);
  const [reduceDifficultyByCostSteps, setReduceDifficultyByCostSteps] = useState(0);
  const [craftSubSkillId, setCraftSubSkillId] = useState<string>('');

  const { data: codexSkills = [] } = useCodexSkills();
  /** Craft base skill id per codex (sub-skills have base_skill_id === this). Fallback to any skill with craft desc if none match. */
  const CRAFT_BASE_SKILL_ID = 13;
  const craftSubSkills = useMemo(
    () => {
      const withCraftDesc = codexSkills.filter(
        (s: { base_skill_id?: number; craft_success_desc?: string; craft_failure_desc?: string }) =>
          s.craft_success_desc || s.craft_failure_desc
      );
      const craftSubs = withCraftDesc.filter(
        (s: { base_skill_id?: number }) => s.base_skill_id === CRAFT_BASE_SKILL_ID
      );
      return craftSubs.length > 0 ? craftSubs : withCraftDesc;
    },
    [codexSkills]
  );

  const rulesData = rules?.CRAFTING;

  const handleCraftingItemSelect = (item: CraftingSelectedItem) => {
    const ref = toCraftingItemRef(item);
    if (itemSelectModalPurpose === 'upgrade-original') {
      setUpgradeOriginalItem(ref);
    } else if (itemSelectModalPurpose === 'upgrade-target') {
      setSelectedItem(ref);
    } else {
      setSelectedItem(ref);
    }
    setItemSelectModalPurpose(null);
  };
  const requirements = useMemo((): CraftingRequirements | null => {
    if (!rulesData) return null;
    let base: CraftingRequirements | null = null;

    if (modeUpgradePotency && selectedEnhancedForPotency) {
      base = getUpgradePotencyRequirements(selectedEnhancedForPotency.powerRef.energyCost, rulesData);
    } else if (modeUpgrade && upgradeOriginalItem && selectedItem && selectedItem.marketPrice > upgradeOriginalItem.marketPrice) {
      base = getUpgradeRequirements(upgradeOriginalItem.marketPrice, selectedItem.marketPrice, rulesData);
    } else if (isEnhanced && selectedPower) {
      const effectiveEnergy = multipleUseIndex >= 0
        ? getMultipleUseAdjustedEnergy(energyCost, multipleUseIndex, rulesData)
        : energyCost;
      const req = isConsumable
        ? getConsumableEnhancedRequirements(effectiveEnergy, rulesData)
        : getEnhancedCraftingRequirements(effectiveEnergy, rulesData);
      if (!req) return null;
      base = req;
      if (isBulk) {
        const bulkCount = rulesData.bulkCraftMaterialCount ?? 3;
        base = {
          ...base,
          requiredSuccesses: base.requiredSuccesses * bulkCount,
          sessionCount: base.sessionCount * bulkCount,
          materialCost: base.materialCost * bulkCount,
          timeValue: base.timeValue * bulkCount,
        };
      }
    } else if (selectedItem && !modeUpgrade) {
      const req = getCraftingRequirements(
        selectedItem.marketPrice,
        isConsumable,
        rulesData
      );
      if (!req) return null;
      base = req;
      if (isBulk) {
        const bulkCount = rulesData.bulkCraftMaterialCount ?? 3;
        base = {
          ...base,
          requiredSuccesses: base.requiredSuccesses * bulkCount,
          sessionCount: base.sessionCount * bulkCount,
          materialCost: base.materialCost * bulkCount,
          timeValue: base.timeValue * bulkCount,
        };
      }
    }

    if (!base) return null;

    // Apply optional modifiers in order: reduce difficulty (time then cost), then reduce time (difficulty then cost)
    let r = base;
    const isCommonOrConsumableCommonToRare = r.rarity === 'Common' || (isConsumable && ['Common', 'Uncommon', 'Rare'].includes(r.rarity));
    if (reduceDifficultyByTime) {
      r = applyReduceDifficultyByTime(r, isCommonOrConsumableCommonToRare, rulesData);
    }
    if (reduceDifficultyByCostSteps > 0) {
      r = applyReduceDifficultyByCost(r, reduceDifficultyByCostSteps, rulesData);
    }
    if (reduceTimeByDifficultySteps > 0) {
      r = applyReduceTimeByDifficulty(r, reduceTimeByDifficultySteps, rulesData);
    }
    if (reduceTimeByCostSteps > 0) {
      r = applyReduceTimeByCost(r, reduceTimeByCostSteps, rulesData);
    }
    return r;
  }, [
    selectedItem,
    upgradeOriginalItem,
    selectedEnhancedForPotency,
    modeUpgrade,
    modeUpgradePotency,
    isConsumable,
    isBulk,
    isEnhanced,
    rulesData,
    selectedPower,
    energyCost,
    multipleUseIndex,
    reduceTimeByDifficultySteps,
    reduceTimeByCostSteps,
    reduceDifficultyByTime,
    reduceDifficultyByCostSteps,
  ]);

  const handleStart = async () => {
    if (!rulesData || !requirements) return;
    const labels = getCraftingSessionLabels(
      requirements.timeValue,
      requirements.timeUnit,
      requirements.sessionCount
    );
    const sessions: CraftingRollSession[] = labels.map((label) => ({
      label,
      roll: null,
      successes: 0,
      failures: 0,
    }));

    const optionalModifiers =
      reduceTimeByDifficultySteps > 0 ||
      reduceTimeByCostSteps > 0 ||
      reduceDifficultyByTime ||
      reduceDifficultyByCostSteps > 0
        ? {
            reduceTimeByDifficultySteps: reduceTimeByDifficultySteps || undefined,
            reduceTimeByCostSteps: reduceTimeByCostSteps || undefined,
            reduceDifficultyByTime: reduceDifficultyByTime || undefined,
            reduceDifficultyByCostSteps: reduceDifficultyByCostSteps || undefined,
          }
        : undefined;

    if (modeUpgrade && upgradeOriginalItem && selectedItem && selectedItem.marketPrice > upgradeOriginalItem.marketPrice) {
      try {
        const itemWithSubSkill = craftSubSkillId
          ? { ...selectedItem, subSkillId: craftSubSkillId }
          : selectedItem;
        const id = await createSession.mutateAsync({
          status: 'in_progress',
          item: itemWithSubSkill,
          isConsumable: false,
          isBulk: false,
          isUpgrade: true,
          upgradeOriginalItem,
          optionalModifiers,
          dsModifier: 0,
          additionalSuccesses: 0,
          additionalFailures: 0,
          requiredSuccesses: requirements.requiredSuccesses,
          difficultyScore: requirements.difficultyScore,
          materialCost: requirements.materialCost,
          timeValue: requirements.timeValue,
          timeUnit: requirements.timeUnit,
          sessionCount: requirements.sessionCount,
          sessions,
        });
        router.push(`/crafting/${id}`);
      } catch (err) {
        console.error('Failed to create upgrade session:', err);
      }
      return;
    }

    if (modeUpgradePotency && selectedEnhancedForPotency && requirements) {
      const syntheticItem: CraftingItemRef = {
        source: 'library',
        id: selectedEnhancedForPotency.id,
        name: selectedEnhancedForPotency.name ?? 'Enhanced item',
        marketPrice: 0,
      };
      try {
        const id = await createSession.mutateAsync({
          status: 'in_progress',
          item: syntheticItem,
          isConsumable: false,
          isBulk: false,
          isEnhanced: true,
          isUpgradePotency: true,
          upgradePotencyEnhancedItemId: selectedEnhancedForPotency.id,
          dsModifier: 0,
          additionalSuccesses: 0,
          additionalFailures: 0,
          requiredSuccesses: requirements.requiredSuccesses,
          difficultyScore: requirements.difficultyScore,
          materialCost: requirements.materialCost,
          timeValue: requirements.timeValue,
          timeUnit: requirements.timeUnit,
          sessionCount: requirements.sessionCount,
          sessions,
        });
        router.push(`/crafting/${id}`);
      } catch (err) {
        console.error('Failed to create upgrade potency session:', err);
      }
      return;
    }

    if (isEnhanced && selectedPower) {
      const baseItem = useCustomBase
        ? ({ name: customBaseName || 'Custom base', marketPrice: customBasePrice } as CraftingCustomBaseItem)
        : selectedItem;
      const powerRef: CraftingPowerRef = {
        source: 'library',
        id: selectedPower.id,
        name: selectedPower.name,
        energyCost,
      };
      if (!baseItem) return;
      try {
        const itemWithSubSkill =
          selectedItem && craftSubSkillId
            ? { ...selectedItem, subSkillId: craftSubSkillId }
            : selectedItem;
        const id = await createSession.mutateAsync({
          status: 'in_progress',
          item: useCustomBase ? null : itemWithSubSkill,
          customBaseItem: useCustomBase ? { name: customBaseName || 'Custom', marketPrice: customBasePrice } : null,
          isConsumable,
          isBulk,
          isEnhanced: true,
          powerRef,
          potency,
          multipleUseTableIndex: multipleUseIndex >= 0 ? multipleUseIndex : undefined,
          optionalModifiers,
          dsModifier: 0,
          additionalSuccesses: 0,
          additionalFailures: 0,
          requiredSuccesses: requirements.requiredSuccesses,
          difficultyScore: requirements.difficultyScore,
          materialCost: requirements.materialCost,
          timeValue: requirements.timeValue,
          timeUnit: requirements.timeUnit,
          sessionCount: requirements.sessionCount,
          sessions,
        });
        router.push(`/crafting/${id}`);
      } catch (err) {
        console.error('Failed to create crafting session:', err);
      }
      return;
    }

    if (!selectedItem) return;
    try {
      const itemWithSubSkill = craftSubSkillId
        ? { ...selectedItem, subSkillId: craftSubSkillId }
        : selectedItem;
      const id = await createSession.mutateAsync({
        status: 'in_progress',
        item: itemWithSubSkill,
        isConsumable,
        isBulk,
        optionalModifiers,
        dsModifier: 0,
        additionalSuccesses: 0,
        additionalFailures: 0,
        requiredSuccesses: requirements.requiredSuccesses,
        difficultyScore: requirements.difficultyScore,
        materialCost: requirements.materialCost,
        timeValue: requirements.timeValue,
        timeUnit: requirements.timeUnit,
        sessionCount: requirements.sessionCount,
        sessions,
      });
      router.push(`/crafting/${id}`);
    } catch (err) {
      console.error('Failed to create crafting session:', err);
    }
  };

  const isLoading = rulesLoading || powersLoading || (modeUpgradePotency && enhancedLoading);
  const canStartUpgrade = modeUpgrade && upgradeOriginalItem && selectedItem && selectedItem.marketPrice > upgradeOriginalItem.marketPrice && requirements;
  const canStartUpgradePotency = modeUpgradePotency && selectedEnhancedForPotency && requirements;
  const canStartGeneral = !modeUpgrade && !modeUpgradePotency && selectedItem && requirements && !isEnhanced;
  const canStartEnhanced = !modeUpgradePotency && isEnhanced && (useCustomBase ? (customBaseName.trim() && customBasePrice >= 0) : selectedItem) && selectedPower && requirements;
  const canStart = modeUpgrade ? canStartUpgrade : modeUpgradePotency ? canStartUpgradePotency : isEnhanced ? canStartEnhanced : canStartGeneral;

  return (
    <PageContainer size="xl">
      <div className="mb-4">
        <Link
          href="/crafting"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Crafting
        </Link>
      </div>
      <PageHeader
        title={modeUpgradePotency ? 'Upgrade potency' : modeUpgrade ? 'Upgrade item' : 'Start Crafting'}
        description={
          modeUpgradePotency
            ? 'Choose an enhanced item from your library. Requirements: 25% of original time, material cost, and successes; same Difficulty Score.'
            : modeUpgrade
            ? 'Choose the original item and the upgraded target (higher market price). Requirements use upgrade rules: 75% of price difference, time and success difference.'
            : 'Choose an item to craft from Codex or your Library. Set options and start the session.'
        }
      />

      {isLoading ? (
        <LoadingState message="Loading items and rules..." />
      ) : !rulesData ? (
        <Alert variant="danger" title="Rules unavailable">
          Crafting rules could not be loaded. Check admin core rules for CRAFTING.
        </Alert>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {modeUpgradePotency ? (
            <>
              <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
                <SectionHeader title="Select enhanced item" size="md" className="mb-2" />
                <p className="text-sm text-text-muted dark:text-text-secondary mb-3">
                  Choose an enhanced item from your library to upgrade its potency. You will spend 25% of the original crafting time, material cost, and required successes; the Difficulty Score stays the same.
                </p>
                {enhancedItems.length === 0 ? (
                  <p className="text-sm text-text-muted dark:text-text-secondary p-4 rounded-lg border border-border-light">
                    You have no enhanced items. Create one via Start Crafting (Enhanced) and save it to your library first.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto rounded-lg border border-border-light p-2">
                    {enhancedItems.map((item) => {
                      const isSelected = selectedEnhancedForPotency?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedEnhancedForPotency(item)}
                          className={cn(
                            'text-left p-3 rounded-lg border-2 transition-colors min-h-[44px]',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-border-light hover:border-primary-300'
                          )}
                          aria-label={isSelected ? `Selected: ${item.name ?? 'Enhanced item'}` : `Select ${item.name ?? 'Enhanced item'} for upgrade potency`}
                          aria-pressed={isSelected}
                        >
                          <span className="font-medium text-text-primary">{item.name ?? 'Enhanced item'}</span>
                          <span className="block text-sm text-text-muted dark:text-text-secondary">
                            {item.powerRef?.name ?? 'Power'}
                            {item.potency != null ? ` · Potency ${item.potency}` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
              {requirements && (
                <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
                  <SectionHeader title="Requirements (25% of original)" size="md" className="mb-2" />
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>Difficulty Score: {requirements.difficultyScore}</li>
                    <li>Required successes: {requirements.requiredSuccesses}</li>
                    <li>Material cost: {Math.ceil(requirements.materialCost)} currency</li>
                    <li>Time: {requirements.timeValue} {requirements.timeUnit}</li>
                    <li>Roll sessions: {requirements.sessionCount}</li>
                  </ul>
                </section>
              )}
              <div className="flex gap-3">
                <Link href="/crafting">
                  <Button variant="ghost">
                    <ChevronLeft className="w-4 h-4" />
                    Cancel
                  </Button>
                </Link>
                <Button
                  onClick={handleStart}
                  disabled={!canStart || createSession.isPending}
                >
                  {createSession.isPending ? 'Starting...' : 'Start upgrade potency'}
                </Button>
              </div>
            </>
          ) : modeUpgrade ? (
            <>
              <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
                <SectionHeader title="Original item" size="md" className="mb-2" />
                <p className="text-sm text-text-muted dark:text-text-secondary mb-3">
                  The equipment or armament you are upgrading (lower market price).
                </p>
                {upgradeOriginalItem ? (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border-light bg-surface-alt">
                    <span className="font-medium text-text-primary">{upgradeOriginalItem.name}</span>
                    <span className="text-sm text-text-muted dark:text-text-secondary">{upgradeOriginalItem.marketPrice} currency</span>
                    <Button variant="secondary" size="sm" onClick={() => { setItemSelectModalPurpose('upgrade-original'); setItemSelectModalOpen(true); }} aria-label="Change original item">
                      Change item
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => { setItemSelectModalPurpose('upgrade-original'); setItemSelectModalOpen(true); }} aria-label="Select original item to upgrade">
                    Select original item
                  </Button>
                )}
              </section>
              <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
                <SectionHeader title="Upgraded item" size="md" className="mb-2" />
                <p className="text-sm text-text-muted dark:text-text-secondary mb-3">
                  The target item (must have a higher market price than the original).
                </p>
                {selectedItem ? (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border-light bg-surface-alt">
                    <span className="font-medium text-text-primary">{selectedItem.name}</span>
                    <span className="text-sm text-text-muted dark:text-text-secondary">{selectedItem.marketPrice} currency</span>
                    <Button variant="secondary" size="sm" onClick={() => { setItemSelectModalPurpose('upgrade-target'); setItemSelectModalOpen(true); }} aria-label="Change upgraded item">
                      Change item
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => { setItemSelectModalPurpose('upgrade-target'); setItemSelectModalOpen(true); }} aria-label="Select upgraded item">
                    Select upgraded item
                  </Button>
                )}
                {upgradeOriginalItem && selectedItem && selectedItem.marketPrice <= upgradeOriginalItem.marketPrice && (
                  <p className="text-sm text-danger-700 dark:text-danger-400 mt-2">Upgraded item must have a higher market price than the original.</p>
                )}
              </section>
            </>
          ) : (
          <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
            <SectionHeader title="Select item" size="md" className="mb-2" />
            <p className="text-sm text-text-muted dark:text-text-secondary mb-3">
              Choose an item to craft from Armaments or Equipment. Use the modal to pick from Realms Library or My Library.
            </p>
            {selectedItem ? (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border-light bg-surface-alt">
                <span className="font-medium text-text-primary">{selectedItem.name}</span>
                <span className="text-sm text-text-muted dark:text-text-secondary">{selectedItem.marketPrice} currency</span>
                <Button variant="secondary" size="sm" onClick={() => { setItemSelectModalPurpose('main'); setItemSelectModalOpen(true); }} aria-label="Change selected item">
                  Change item
                </Button>
              </div>
            ) : (
              <Button onClick={() => { setItemSelectModalPurpose('main'); setItemSelectModalOpen(true); }} aria-label="Open modal to select item to craft">
                Select item to craft
              </Button>
            )}
          </section>
          )}

          {!modeUpgrade && !modeUpgradePotency && (
            <>
          <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
            <SectionHeader title="Options" size="md" className="mb-2" />
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={isConsumable}
                  onChange={(e) => setIsConsumable(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-text-primary">Consumable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={isBulk}
                  onChange={(e) => setIsBulk(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-text-primary">Bulk (3× cost/time → 4 items)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={isEnhanced}
                  onChange={(e) => {
                    setIsEnhanced(e.target.checked);
                    if (!e.target.checked) setSelectedPower(null);
                  }}
                  className="rounded border-border"
                />
                <span className="text-text-primary">Enhanced (imbue power)</span>
              </label>
            </div>
            {craftSubSkills.length > 0 && (
              <div className="mt-3">
                <label htmlFor="craft-subskill" className="block text-sm font-medium text-text-secondary mb-1">
                  Craft sub-skill (optional)
                </label>
                <select
                  id="craft-subskill"
                  value={craftSubSkillId}
                  onChange={(e) => setCraftSubSkillId(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px] max-w-md"
                  aria-label="Craft sub-skill for flavor text"
                >
                  <option value="">None</option>
                  {craftSubSkills.map((s: { id: string; name: string }) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                  Used for success/failure flavor text on the session page.
                </p>
              </div>
            )}
          </section>

          {isEnhanced && (
            <section className="p-4 sm:p-6 rounded-xl border border-border-light bg-surface">
              <SectionHeader title="Enhanced crafting" size="md" className="mb-3" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Base item</label>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={useCustomBase}
                      onChange={(e) => setUseCustomBase(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-text-primary">Use custom base (name + price)</span>
                  </label>
                  {useCustomBase ? (
                    <div className="flex flex-wrap gap-3">
                      <Input
                        value={customBaseName}
                        onChange={(e) => setCustomBaseName(e.target.value)}
                        placeholder="Base item name (e.g. Ring)"
                        className="max-w-xs"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={customBasePrice}
                        onChange={(e) => setCustomBasePrice(Number(e.target.value) || 0)}
                        placeholder="Market price"
                        className="w-28"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted dark:text-text-secondary">
                      Use the item selected above as the base.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="enhanced-power" className="block text-sm font-medium text-text-secondary mb-1">Power to imbue</label>
                  <select
                    id="enhanced-power"
                    value={selectedPower?.id ?? ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      const p = userPowers.find((x) => x.id === id);
                      setSelectedPower(p ? { id: p.id, name: p.name } : null);
                    }}
                    className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                  >
                    <option value="">Select a power</option>
                    {userPowers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="energy-cost" className="block text-sm font-medium text-text-secondary mb-1">Power energy cost (for table lookup)</label>
                  <Input
                    id="energy-cost"
                    type="number"
                    min={0}
                    max={200}
                    value={energyCost}
                    onChange={(e) => setEnergyCost(Number(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Potency</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="potency"
                        checked={potency === 'creator'}
                        onChange={() => setPotency('creator')}
                        className="rounded border-border"
                      />
                      <span className="text-text-primary">Use creator&apos;s at craft time</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="potency"
                        checked={typeof potency === 'number'}
                        onChange={() => setPotency(25)}
                        className="rounded border-border"
                      />
                      <span className="text-text-primary">Manual</span>
                    </label>
                    {typeof potency === 'number' && (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={potency}
                        onChange={(e) => setPotency(Number(e.target.value) || 0)}
                        className="w-20"
                      />
                    )}
                  </div>
                </div>
                {!isConsumable && rulesData?.multipleUseTable && rulesData.multipleUseTable.length > 0 && (
                  <div>
                    <label htmlFor="multiple-use" className="block text-sm font-medium text-text-secondary mb-1">Multiple use (optional)</label>
                    <select
                      id="multiple-use"
                      value={multipleUseIndex}
                      onChange={(e) => setMultipleUseIndex(Number(e.target.value))}
                      className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                    >
                      <option value={-1}>Single use per full recovery</option>
                      {rulesData.multipleUseTable.map((row, i) => (
                        <option key={i} value={i}>
                          Partial: {String(row.partialRecovery)} / Full: {String(row.fullRecovery)} — {row.adjustedEnergyPercent}%
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>
          )}
          </>
          )}

          {/* Optional crafting mechanics: reduce time or difficulty */}
          <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
            <SectionHeader title="Optional rules" size="md" className="mb-2" />
            <p className="text-sm text-text-muted dark:text-text-secondary mb-3">
              Optional rules to reduce crafting time (at higher difficulty or cost) or reduce difficulty (with more time or resources).
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="opt-reduce-time-ds" className="block text-sm font-medium text-text-secondary mb-1">Reduce time: +2 Difficulty Score per step (−5 days, −1 success), max 5 steps</label>
                <select
                  id="opt-reduce-time-ds"
                  value={reduceTimeByDifficultySteps}
                  onChange={(e) => setReduceTimeByDifficultySteps(Number(e.target.value))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                  aria-label="Reduce time by increasing difficulty (0–5 steps)"
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} steps</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="opt-reduce-time-cost" className="block text-sm font-medium text-text-secondary mb-1">Reduce time: +50% cost per step (−5 days, −1 success), max 5 steps</label>
                <select
                  id="opt-reduce-time-cost"
                  value={reduceTimeByCostSteps}
                  onChange={(e) => setReduceTimeByCostSteps(Number(e.target.value))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                  aria-label="Reduce time by increasing cost (0–5 steps)"
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} steps</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={reduceDifficultyByTime}
                    onChange={(e) => setReduceDifficultyByTime(e.target.checked)}
                    className="rounded border-border"
                    aria-describedby="opt-diff-time-desc"
                  />
                  <span className="text-text-primary">Reduce difficulty: +1 day (common) or +5 days (other), −1 DS, +1 success</span>
                </label>
                <p id="opt-diff-time-desc" className="text-xs text-text-muted dark:text-text-secondary mt-1 ml-6">Spend more time for lower difficulty.</p>
              </div>
              <div>
                <label htmlFor="opt-reduce-diff-cost" className="block text-sm font-medium text-text-secondary mb-1">Reduce difficulty: +25% cost per step (−2 Difficulty Score), max 4 steps</label>
                <select
                  id="opt-reduce-diff-cost"
                  value={reduceDifficultyByCostSteps}
                  onChange={(e) => setReduceDifficultyByCostSteps(Number(e.target.value))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-text-primary min-h-[44px]"
                  aria-label="Reduce difficulty by spending more resources (0–4 steps)"
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>{n} steps</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {requirements && (
            <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
              <SectionHeader title="Requirements" size="md" className="mb-2" />
              <ul className="text-sm text-text-secondary space-y-1">
                <li>Rarity: {requirements.rarity}</li>
                <li>Difficulty Score: {requirements.difficultyScore}</li>
                <li>Required successes: {requirements.requiredSuccesses}</li>
                <li>Material cost: {Math.ceil(requirements.materialCost)} currency</li>
                <li>Time: {requirements.timeValue} {requirements.timeUnit}</li>
                <li>Roll sessions: {requirements.sessionCount}</li>
              </ul>
            </section>
          )}

          <div className="flex gap-3">
            <Link href="/crafting">
              <Button variant="ghost">
                <ChevronLeft className="w-4 h-4" />
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleStart}
              disabled={!canStart || createSession.isPending}
            >
              {createSession.isPending ? 'Starting...' : modeUpgrade ? 'Start upgrade' : 'Start crafting'}
            </Button>
          </div>
        </div>
      )}

      <CraftingItemSelectModal
        isOpen={itemSelectModalOpen}
        onClose={() => { setItemSelectModalOpen(false); setItemSelectModalPurpose(null); }}
        onSelect={handleCraftingItemSelect}
      />
    </PageContainer>
  );
}
