/**
 * Crafting Adjustments section — DS bonus + additional S/F (TASK-607)
 */

'use client';

import { ValueStepper } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import type {
  CraftingSession as CraftingSessionType,
  CraftingItemRef,
  CraftingCustomBaseItem,
} from '@/types/crafting';

type Props = {
  isCompleted: boolean;
  item: CraftingItemRef | null;
  customBaseItem: CraftingCustomBaseItem | null;
  session: CraftingSessionType;
  effectiveDS: number;
  updateData: (updates: Partial<CraftingSessionType['data']>) => void;
};

export function CraftingAdjustmentsSection({
  isCompleted,
  item,
  customBaseItem,
  session,
  effectiveDS,
  updateData,
}: Props) {
  if (isCompleted || (!item && !customBaseItem)) return null;
  // Strip outer conditional — keep CollapsibleSection only
  return (
    <CollapsibleSection
      title="Adjustments"
      collapsedSummary={`Difficulty Score Bonus ${session.data.dsModifier ?? 0}, bonus S/F`}
    >
      <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
        Adjust the effective Difficulty Score or add bonus successes/failures (finer tools, help,
        environmental Bonuses).
      </p>
      <div className="flex flex-wrap gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Difficulty Score Bonus
          </label>
          <ValueStepper
            value={session.data.dsModifier ?? 0}
            onChange={(v) => updateData({ dsModifier: v })}
            min={-10}
            max={10}
            step={1}
            formatValue={(v) => (v >= 0 ? `+${v}` : `${v}`)}
            colorValue
            decrementTitle="Decrease Difficulty Score Bonus"
            incrementTitle="Increase Difficulty Score Bonus"
          />
          <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
            Effective Difficulty Score: {effectiveDS}
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
  );
}
