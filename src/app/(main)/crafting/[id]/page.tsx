/**
 * Crafting Session Page
 * ======================
 * View/edit a crafting session: item, DS modifier, additional successes/failures, roll sessions. Complete -> outcome.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PageContainer,
  PageHeader,
  Button,
  LoadingState,
  Alert,
  Input,
} from '@/components/ui';
import { ValueStepper, SectionHeader } from '@/components/shared';
import { useCraftingSession, useSaveCraftingSession, useCreateEnhancedItem, useUpdateEnhancedItem, useCodexSkills } from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { useToast } from '@/components/ui';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import { calculateCraftingOutcome } from '@/lib/game/crafting-utils';
import type { CraftingSession as CraftingSessionType, CraftingRollSession } from '@/types/crafting';

export default function CraftingSessionPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const { data: sessionData, isLoading, error } = useCraftingSession(id);
  const saveMutation = useSaveCraftingSession();
  const createEnhanced = useCreateEnhancedItem();
  const updateEnhanced = useUpdateEnhancedItem();
  const { showToast } = useToast();
  const { rules } = useGameRules();

  const [session, setSession] = useState<CraftingSessionType | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [upgradePotencyValue, setUpgradePotencyValue] = useState<string>('');

  useEffect(() => {
    if (sessionData && !initialized) {
      setSession(sessionData);
      setInitialized(true);
    }
  }, [sessionData, initialized]);

  const rulesData = rules?.CRAFTING;
  const { data: codexSkills = [] } = useCodexSkills();
  const craftSubSkill = session?.data.item?.subSkillId
    ? codexSkills.find((s: { id: string }) => String(s.id) === String(session.data.item?.subSkillId))
    : null;
  const effectiveDS = (session?.data.difficultyScore ?? 0) + (session?.data.dsModifier ?? 0);

  const updateData = useCallback(
    (updates: Partial<CraftingSessionType['data']>) => {
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, data: { ...prev.data, ...updates } };
      });
    },
    []
  );

  const updateSessionRoll = useCallback(
    (index: number, roll: number | null) => {
      if (!session || !rulesData) return;
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
    [session, effectiveDS, rulesData, updateData]
  );

  const totalSuccesses =
    (session?.data.sessions?.reduce((a, s) => a + s.successes, 0) ?? 0) +
    (session?.data.additionalSuccesses ?? 0);
  const totalFailures =
    (session?.data.sessions?.reduce((a, s) => a + s.failures, 0) ?? 0) +
    (session?.data.additionalFailures ?? 0);
  const required = session?.data.requiredSuccesses ?? 0;
  const netDelta = totalSuccesses - totalFailures - required;
  const isCompleted = session?.data.status === 'completed';

  const handleSave = useCallback(async () => {
    if (!session || !id) return;
    await saveMutation.mutateAsync({
      id,
      data: {
        status: session.data.status,
        dsModifier: session.data.dsModifier,
        additionalSuccesses: session.data.additionalSuccesses,
        additionalFailures: session.data.additionalFailures,
        sessions: session.data.sessions,
        netDelta: session.data.netDelta,
        outcome: session.data.outcome,
      },
    });
  }, [id, session, saveMutation]);

  const handleComplete = useCallback(async () => {
    if (!session || !id || !rulesData || !session.data.item) return;
    const materialCost = session.data.materialCost ?? 0;
    const marketPrice = session.data.item.marketPrice ?? 0;
    const outcome = calculateCraftingOutcome(
      netDelta,
      materialCost,
      marketPrice,
      rulesData.successesTable
    );
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          status: 'completed',
          netDelta,
          outcome: {
            finalMaterialCost: outcome.finalMaterialCost,
            materialsRetained: outcome.materialsRetained,
            itemWorth: outcome.itemWorth,
            extraItemCount: outcome.extraItemCount,
            choiceExtraOrEnhance: outcome.choiceExtraOrEnhance,
            effectText: outcome.effectText,
          },
        },
      };
    });
    // Save after state update
    setTimeout(async () => {
      await saveMutation.mutateAsync({
        id,
        data: {
          status: 'completed',
          netDelta,
          outcome: {
            finalMaterialCost: outcome.finalMaterialCost,
            materialsRetained: outcome.materialsRetained,
            itemWorth: outcome.itemWorth,
            extraItemCount: outcome.extraItemCount,
            choiceExtraOrEnhance: outcome.choiceExtraOrEnhance,
            effectText: outcome.effectText,
          },
        },
      });
    }, 0);
  }, [session, id, rulesData, netDelta, saveMutation]);

  if (isLoading || !initialized) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading session..." size="lg" />
      </PageContainer>
    );
  }

  if (error || !session) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger" title="Session not found">
          {error?.message ?? 'This crafting session could not be loaded.'}
        </Alert>
        <Link href="/crafting">
          <Button variant="ghost" className="mt-4">
            <ChevronLeft className="w-4 h-4" />
            Back to Crafting
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const item = session.data.item;
  const sessions = session.data.sessions ?? [];
  const outcome = session.data.outcome;
  const isUpgrade = session.data.isUpgrade === true;
  const upgradeOriginal = session.data.upgradeOriginalItem;
  const optionalModifiers = session.data.optionalModifiers;
  const displayName =
    item?.name ??
    (session.data.isEnhanced ? session.data.customBaseItem?.name : null) ??
    (isUpgrade && upgradeOriginal && 'name' in upgradeOriginal ? upgradeOriginal.name : null) ??
    'Crafting session';
  const upgradeLabel = isUpgrade && upgradeOriginal && item
    ? `${'name' in upgradeOriginal ? upgradeOriginal.name : 'Original'} → ${item.name}`
    : null;
  const isUpgradePotency = session.data.isUpgradePotency === true;
  const upgradePotencyLabel = isUpgradePotency && item ? `Upgrade potency: ${item.name}` : null;

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
        title={upgradePotencyLabel ?? upgradeLabel ?? displayName}
        description={
          item
            ? `Difficulty Score ${effectiveDS} (base ${session.data.difficultyScore}${session.data.dsModifier ? ` + ${session.data.dsModifier} modifier` : ''}) · ${session.data.requiredSuccesses} success${session.data.requiredSuccesses !== 1 ? 'es' : ''} required${isUpgrade ? ' · Upgrade' : ''}${isUpgradePotency ? ' · Upgrade potency' : ''}`
            : undefined
        }
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Summary */}
        <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
          <SectionHeader title="Summary" size="md" className="mb-3" />
          <ul className="text-sm text-text-secondary space-y-1.5">
            {isUpgradePotency && (
              <li>Upgrade potency: 25% of original time, cost, and successes; same Difficulty Score</li>
            )}
            {isUpgrade && upgradeOriginal && (
              <li>Upgrade: {'name' in upgradeOriginal ? upgradeOriginal.name : 'Original'} ({'marketPrice' in upgradeOriginal ? upgradeOriginal.marketPrice : 0} → {item?.marketPrice ?? 0} currency)</li>
            )}
            <li>Material cost: {session.data.materialCost ?? 0} currency</li>
            <li>Time: {session.data.timeValue} {session.data.timeUnit}</li>
            <li>Consumable: {session.data.isConsumable ? 'Yes' : 'No'}</li>
            <li>Bulk: {session.data.isBulk ? 'Yes (4 items)' : 'No'}</li>
            {optionalModifiers && (optionalModifiers.reduceTimeByDifficultySteps ?? optionalModifiers.reduceTimeByCostSteps ?? optionalModifiers.reduceDifficultyByTime ?? (optionalModifiers.reduceDifficultyByCostSteps ?? 0) > 0) && (
              <li>Optional rules: Reduce time by difficulty {optionalModifiers.reduceTimeByDifficultySteps ?? 0} steps, by cost {optionalModifiers.reduceTimeByCostSteps ?? 0} steps; Reduce difficulty by time {optionalModifiers.reduceDifficultyByTime ? 'yes' : 'no'}, by cost {optionalModifiers.reduceDifficultyByCostSteps ?? 0} steps</li>
            )}
          </ul>
        </section>

        {!isCompleted && (
          <>
            {/* Difficulty modifier & additional successes/failures */}
            <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
              <SectionHeader title="Modifiers" size="md" className="mb-3" />
              <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
                Adjust the effective Difficulty Score or add bonus successes/failures (e.g. from tools or help).
              </p>
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Difficulty modifier
                  </label>
                  <ValueStepper
                    value={session.data.dsModifier ?? 0}
                    onChange={(v) => updateData({ dsModifier: v })}
                    min={-10}
                    max={10}
                    step={1}
                    decrementTitle="Decrease difficulty modifier"
                    incrementTitle="Increase difficulty modifier"
                  />
                  <p className="text-xs text-text-muted dark:text-text-secondary mt-1">Effective Difficulty Score: {effectiveDS}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Bonus successes
                  </label>
                  <ValueStepper
                    value={session.data.additionalSuccesses ?? 0}
                    onChange={(v) => updateData({ additionalSuccesses: v })}
                    min={0}
                    max={20}
                    step={1}
                    decrementTitle="Decrease bonus successes"
                    incrementTitle="Increase bonus successes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Bonus failures
                  </label>
                  <ValueStepper
                    value={session.data.additionalFailures ?? 0}
                    onChange={(v) => updateData({ additionalFailures: v })}
                    min={0}
                    max={20}
                    step={1}
                    decrementTitle="Decrease bonus failures"
                    incrementTitle="Increase bonus failures"
                  />
                </div>
              </div>
            </section>

            {/* Roll sessions */}
            <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
              <SectionHeader title="Crafting rolls" size="md" className="mb-2" />
              <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
                Enter the total of each roll (d20 + modifiers) for the period. Successes and failures are calculated from your effective Difficulty Score ({effectiveDS}).
              </p>
              <div className="space-y-3">
                {sessions.map((s, i) => {
                  const hasRoll = s.roll != null;
                  const isSuccess = hasRoll && s.successes > 0;
                  const isFailure = hasRoll && s.failures > 0;
                  return (
                  <div
                    key={s.label}
                    className={cn(
                      'flex flex-wrap items-center gap-4 p-3 sm:p-4 rounded-xl border border-border-light transition-colors',
                      hasRoll && isSuccess && 'bg-green-50/50 dark:bg-green-900/10 border-l-4 border-l-green-500',
                      hasRoll && isFailure && 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500',
                      hasRoll && !isSuccess && !isFailure && 'bg-surface-alt border-l-4 border-l-border-light'
                    )}
                  >
                    <span className="font-medium text-text-primary w-28 shrink-0">{s.label}</span>
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
                        placeholder="Roll total"
                        className="w-20 min-h-[44px]"
                      />
                    </div>
                    {s.roll != null && (
                      <span className="text-sm">
                        <span className="text-success-700 dark:text-success-400 font-medium">
                          +{s.successes} success{s.successes !== 1 ? 'es' : ''}
                        </span>
                        {s.failures > 0 && (
                          <>
                            {' '}
                            <span className="text-danger-700 dark:text-danger-400 font-medium">
                              −{s.failures} failure{s.failures !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  );
                })}
              </div>
            </section>

            {/* Result: successes vs required */}
            <section className="bg-surface rounded-xl border border-border-light p-4 sm:p-6">
              <SectionHeader title="Result" size="md" className="mb-2" />
              <p className="text-sm text-text-secondary mb-2">
                Total successes: <strong className="text-text-primary">{totalSuccesses}</strong> · Total failures: <strong className="text-text-primary">{totalFailures}</strong> · Required: <strong className="text-text-primary">{required}</strong>
              </p>
              <p className={cn(
                'mt-2 font-semibold',
                netDelta >= 0 ? 'text-success-700 dark:text-success-400' : 'text-danger-700 dark:text-danger-400'
              )}>
                {netDelta >= 0
                  ? `${netDelta} over target — success`
                  : `${Math.abs(netDelta)} under target — shortfall`}
              </p>
            </section>

            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save progress'}
              </Button>
              <Button
                onClick={handleComplete}
                disabled={saveMutation.isPending}
              >
                Complete crafting
              </Button>
            </div>
          </>
        )}

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
                <li>Extra items gained: {outcome.extraItemCount}</li>
              )}
              {outcome.choiceExtraOrEnhance && (
                <li>Your choice: one extra item at full value, or enhance this item to 200% value</li>
              )}
            </ul>
            {session.data.isEnhanced && session.data.powerRef && !session.data.isUpgradePotency && (
              <div className="mt-4 pt-4 border-t border-border-light">
                <p className="text-sm text-text-secondary mb-2">Save this enhanced item to My Library to reuse it.</p>
                <Button
                  onClick={async () => {
                    try {
                      const baseItem = session.data.customBaseItem ?? session.data.item;
                      if (!baseItem || !session.data.powerRef) return;
                      const name = `${'name' in baseItem ? baseItem.name : session.data.item?.name ?? 'Item'} (${session.data.powerRef.name})`;
                      await createEnhanced.mutateAsync({
                        name,
                        baseItem,
                        powerRef: session.data.powerRef,
                        potency: typeof session.data.potency === 'number' ? session.data.potency : undefined,
                        usesType: session.data.multipleUseTableIndex != null && session.data.multipleUseTableIndex >= 0 ? 'multiple' : undefined,
                        usesCount: session.data.multipleUseTableIndex != null && session.data.multipleUseTableIndex >= 0 ? undefined : undefined,
                      });
                      showToast('Saved to Enhanced Equipment in Library', 'success');
                    } catch (e) {
                      showToast((e as Error)?.message ?? 'Failed to save to library', 'error');
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
                  Update the enhanced item&apos;s potency in your library to the upgrader&apos;s new potency.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="upgrade-potency-input" className="block text-sm font-medium text-text-secondary">
                    New potency
                  </label>
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
                        showToast('Potency updated in library', 'success');
                      } catch (e) {
                        showToast((e as Error)?.message ?? 'Failed to update potency', 'error');
                      }
                    }}
                    disabled={updateEnhanced.isPending}
                  >
                    {updateEnhanced.isPending ? 'Updating...' : 'Update potency in library'}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </PageContainer>
  );
}
