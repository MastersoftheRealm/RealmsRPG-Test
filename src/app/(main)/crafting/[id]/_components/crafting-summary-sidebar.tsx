/**
 * Crafting session summary sidebar (TASK-607)
 */

'use client';

import { Gauge, Coins, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { CreatorSummaryPanel } from '@/components/creator';
import type { CraftingRequirements } from '@/lib/game/crafting-utils';
import type {
  CraftingSession as CraftingSessionType,
  CraftingPowerRef,
  CraftingItemRef,
  CraftingCustomBaseItem,
} from '@/types/crafting';
import type { CraftingRules } from '@/types/core-rules';
import type { RequirementsBreakdown, UsesType } from './crafting-tool-helpers';
import { resolveMultipleUseIndex, getEffectiveCraftingEnergy } from './crafting-tool-helpers';

type LiveOutcome = {
  finalMaterialCost: number;
  materialsRetained: number;
  itemWorth: number;
  extraItemCount: number;
  choiceExtraOrEnhance: boolean;
};

type Props = {
  requirements: CraftingRequirements | null;
  requirementsBreakdown: RequirementsBreakdown | null;
  effectiveDS: number;
  quantity: number;
  isEnhanced: boolean;
  isCompleted: boolean;
  resolvedPowerRef: CraftingPowerRef | null | undefined;
  rulesData: CraftingRules | undefined;
  usesType: UsesType;
  usesCount: number;
  session: CraftingSessionType;
  item: CraftingItemRef | null;
  customBaseItem: CraftingCustomBaseItem | null;
  liveOutcome: LiveOutcome | null;
  netDelta: number;
  sessionsLength: number;
  totalEnhSuccesses: number;
  totalEnhFailures: number;
  baseSessionSuccesses: number;
  baseSessionFailures: number;
  enhSessionSuccesses: number;
  enhSessionFailures: number;
  required: number;
  outcome: CraftingSessionType['data']['outcome'];
  baseOutcomeForDisplay: LiveOutcome | null;
  onComplete: () => void;
  isSaving: boolean;
};

export function CraftingSummarySidebar({
  requirements,
  requirementsBreakdown,
  effectiveDS,
  quantity,
  isEnhanced,
  isCompleted,
  resolvedPowerRef,
  rulesData,
  usesType,
  usesCount,
  session,
  item,
  customBaseItem,
  liveOutcome,
  netDelta,
  sessionsLength,
  totalEnhSuccesses,
  totalEnhFailures,
  baseSessionSuccesses,
  baseSessionFailures,
  enhSessionSuccesses,
  enhSessionFailures,
  required,
  outcome,
  baseOutcomeForDisplay,
  onComplete,
  isSaving,
}: Props) {
  return (
    <div className="lg:sticky lg:top-4">
      <CreatorSummaryPanel
        title="Crafting Summary"
        costStats={
          requirements
            ? [
                {
                  label: 'Difficulty Score',
                  value: effectiveDS,
                  color: 'energy',
                  icon: <Gauge className="h-5 w-5" />,
                },
                {
                  label: 'Material Cost',
                  value: `${Math.ceil(requirements.materialCost)} C`,
                  color: 'currency',
                  icon: <Coins className="h-5 w-5" />,
                },
                {
                  label: 'Time',
                  value: `${requirements.timeValue} ${requirements.timeUnit}`,
                  color: 'tp',
                  icon: <Clock className="h-5 w-5" />,
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
                ...(isEnhanced && resolvedPowerRef
                  ? [
                      {
                        label: 'Power Energy',
                        value: `${resolvedPowerRef.energyCost} EN`,
                      },
                      {
                        label: 'Effective Energy',
                        value: `${Math.ceil(
                          rulesData
                            ? getEffectiveCraftingEnergy(
                                resolvedPowerRef.energyCost,
                                resolveMultipleUseIndex(
                                  rulesData,
                                  usesType,
                                  usesCount,
                                  session.data.multipleUseTableIndex,
                                ),
                                rulesData,
                              )
                            : resolvedPowerRef.energyCost,
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
                  valueColor: netDelta >= 0 ? 'text-success-fg' : 'text-danger-fg',
                },
              ]
            : []),
        ]}
      >
        {requirementsBreakdown && (
          <div className="mb-4 border-b border-border-light pb-4">
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Requirements breakdown</h3>
            <p className="mb-3 text-xs text-text-muted">
              Cost, time, and successes for each phase. Totals above are combined.
            </p>
            <div className="space-y-3 text-sm">
              <div>
                <div className="mb-1 font-medium text-text-secondary dark:text-text-primary">
                  Base item
                </div>
                <div className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-text-primary">
                  <span className="font-semibold text-currency-text">
                    {Math.ceil(requirementsBreakdown.baseItemReq.materialCost)} C
                  </span>
                  {' · '}
                  {requirementsBreakdown.baseItemReq.timeValue}{' '}
                  {requirementsBreakdown.baseItemReq.timeUnit}
                  {' · '}
                  {requirementsBreakdown.baseItemReq.requiredSuccesses} success
                  {requirementsBreakdown.baseItemReq.requiredSuccesses !== 1 ? 'es' : ''}
                  {' · '}
                  DS {requirementsBreakdown.baseItemReq.difficultyScore}
                </div>
              </div>
              <div>
                <div className="mb-1 font-medium text-text-secondary dark:text-text-primary">
                  Enhancement
                </div>
                <div className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-text-primary">
                  <span className="font-semibold text-currency-text">
                    {Math.ceil(requirementsBreakdown.enhancementReq.materialCost)} C
                  </span>
                  {' · '}
                  {requirementsBreakdown.enhancementReq.timeValue}{' '}
                  {requirementsBreakdown.enhancementReq.timeUnit}
                  {' · '}
                  {requirementsBreakdown.enhancementReq.requiredSuccesses} success
                  {requirementsBreakdown.enhancementReq.requiredSuccesses !== 1 ? 'es' : ''}
                  {' · '}
                  DS {requirementsBreakdown.enhancementReq.difficultyScore}
                </div>
              </div>
            </div>
          </div>
        )}
        {!isCompleted && sessionsLength > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Successes (enhancement)</span>
              <span className="font-medium text-success-fg">{totalEnhSuccesses}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Failures (enhancement)</span>
              <span className="font-medium text-danger-fg">{totalEnhFailures}</span>
            </div>
            {isEnhanced && session.data.craftBaseItemAlso && (
              <div className="space-y-1 text-xs text-text-muted">
                <div>
                  Base item: {baseSessionSuccesses} S / {baseSessionFailures} F
                </div>
                <div>
                  Enhancement (sessions only): {enhSessionSuccesses} S / {enhSessionFailures} F
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Net</span>
              <span
                className={cn('font-bold', netDelta >= 0 ? 'text-success-fg' : 'text-danger-fg')}
              >
                {netDelta >= 0 ? `+${netDelta}` : netDelta}
              </span>
            </div>
            <div className="text-xs text-text-muted">Required successes: {required}</div>
            {liveOutcome && (
              <div className="mt-2 space-y-1 border-t border-border-light pt-2 text-xs text-text-secondary">
                <div>Projected net material cost: {Math.ceil(liveOutcome.finalMaterialCost)} C</div>
                <div>
                  Projected materials recovered: {Math.ceil(liveOutcome.materialsRetained)} C
                </div>
                <div>Projected item value: {Math.ceil(liveOutcome.itemWorth)} C</div>
                {liveOutcome.extraItemCount > 0 && (
                  <div>Projected extra items: {liveOutcome.extraItemCount}</div>
                )}
                {liveOutcome.choiceExtraOrEnhance && (
                  <div className="font-medium text-primary-fg">
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
              <span className="text-text-secondary">Final Value (enhancement)</span>
              <span className="font-medium text-text-primary">
                {Math.ceil(outcome.itemWorth)} C
              </span>
            </div>
            {outcome.extraItemCount > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Extra Items (enhancement)</span>
                <span className="font-medium text-text-primary">{outcome.extraItemCount}</span>
              </div>
            )}
            {isEnhanced && session.data.craftBaseItemAlso && baseOutcomeForDisplay && (
              <>
                <div className="mt-3 flex justify-between border-t border-border-light pt-3">
                  <span className="text-text-secondary">Base item value</span>
                  <span className="font-medium text-text-primary">
                    {Math.ceil(baseOutcomeForDisplay.itemWorth)} C
                  </span>
                </div>
              </>
            )}
          </div>
        )}
        {!isCompleted && (item || customBaseItem) && sessionsLength > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={onComplete} disabled={isSaving}>
              {isSaving ? 'Completing...' : 'Complete Crafting'}
            </Button>
          </div>
        )}
        {isSaving && <p className="mt-2 text-center text-xs text-text-muted">Saving...</p>}
      </CreatorSummaryPanel>
    </div>
  );
}
