/**
 * Crafting optional rules (trade time/DS/cost) (TASK-607)
 */

'use client';

import { CollapsibleSection } from '@/components/creator';
import type { CraftingRequirements } from '@/lib/game/crafting-utils';
import type { CraftingRules } from '@/types/core-rules';
import type {
  CraftingItemRef,
  CraftingCustomBaseItem,
  CraftingSessionData,
} from '@/types/crafting';

type Props = {
  isCompleted: boolean;
  item: CraftingItemRef | null;
  customBaseItem: CraftingCustomBaseItem | null;
  requirements: CraftingRequirements | null;
  rulesData: CraftingRules | undefined;
  isConsumable: boolean;
  mods: NonNullable<CraftingSessionData['optionalModifiers']>;
  maxReduceTimeByDifficultySteps: number;
  maxReduceTimeByCostSteps: number;
  maxReduceDifficultyByTimeSteps: number;
  maxReduceDifficultyByCostSteps: number;
  setOptionModifier: (key: string, value: number) => void;
};

export function CraftingOptionalRulesSection({
  isCompleted,
  item,
  customBaseItem,
  requirements,
  rulesData,
  isConsumable,
  mods,
  maxReduceTimeByDifficultySteps,
  maxReduceTimeByCostSteps,
  maxReduceDifficultyByTimeSteps,
  maxReduceDifficultyByCostSteps,
  setOptionModifier,
}: Props) {
  if (isCompleted || (!item && !customBaseItem) || !requirements || !rulesData) return null;
  return (
    <CollapsibleSection
      title="Crafting Adjustments"
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
  );
}
