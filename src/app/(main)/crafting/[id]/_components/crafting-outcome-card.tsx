/**
 * Crafting completed outcome card (TASK-607)
 */

'use client';

import { Button, Input, Card } from '@/components/ui';
import { SectionHeader } from '@/components/shared';
import { useCreateEnhancedItem, useUpdateEnhancedItem } from '@/hooks';
import { getEnhancedMarketPrice } from '@/lib/game/crafting-utils';
import type { CraftingRequirements } from '@/lib/game/crafting-utils';
import type { CraftingRules } from '@/types/core-rules';
import type { CraftingSession as CraftingSessionType, CraftingPowerRef } from '@/types/crafting';
import type { RequirementsBreakdown } from './crafting-tool-helpers';

type CraftSubSkill = {
  name: string;
  craft_success_desc?: string;
  craft_failure_desc?: string;
};

type Props = {
  isCompleted: boolean;
  outcome: CraftingSessionType['data']['outcome'];
  session: CraftingSessionType;
  craftSubSkill: CraftSubSkill | null | undefined;
  netDelta: number;
  resolvedPowerRef: CraftingPowerRef | null | undefined;
  rulesData: CraftingRules | undefined;
  isEnhanced: boolean;
  requirements: CraftingRequirements | null;
  requirementsBreakdown: RequirementsBreakdown | null;
  upgradePotencyValue: string;
  setUpgradePotencyValue: (v: string) => void;
  createEnhanced: ReturnType<typeof useCreateEnhancedItem>;
  updateEnhanced: ReturnType<typeof useUpdateEnhancedItem>;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
};

export function CraftingOutcomeCard({
  isCompleted,
  outcome,
  session,
  craftSubSkill,
  netDelta,
  resolvedPowerRef,
  rulesData,
  isEnhanced,
  requirements,
  requirementsBreakdown,
  upgradePotencyValue,
  setUpgradePotencyValue,
  createEnhanced,
  updateEnhanced,
  showToast,
}: Props) {
  if (!isCompleted || !outcome) return null;
  return (
    <Card className="p-4 sm:p-6">
      <SectionHeader title="Outcome" size="md" className="mb-3" />
      <p className="whitespace-pre-wrap text-text-secondary">{outcome.effectText}</p>
      {craftSubSkill && (craftSubSkill.craft_success_desc || craftSubSkill.craft_failure_desc) && (
        <div className="mt-3 border-t border-border-light pt-3">
          <p className="mb-1 text-xs font-medium tracking-wide text-text-muted uppercase">
            {craftSubSkill.name}: {netDelta >= 0 ? 'Success' : 'Failure'}
          </p>
          <p className="text-sm whitespace-pre-wrap text-text-secondary">
            {netDelta >= 0
              ? (craftSubSkill.craft_success_desc ?? '')
              : (craftSubSkill.craft_failure_desc ?? '')}
          </p>
        </div>
      )}
      <ul className="mt-3 space-y-1 text-sm text-text-secondary">
        <li>Materials spent: {Math.ceil(outcome.finalMaterialCost)} currency</li>
        <li>Materials recovered: {Math.ceil(outcome.materialsRetained)} currency</li>
        <li>Item value: {Math.ceil(outcome.itemWorth)} currency</li>
        {outcome.extraItemCount > 0 && <li>Extra items: {outcome.extraItemCount}</li>}
        {outcome.choiceExtraOrEnhance && (
          <li>Your choice: one extra item at full value, or enhance to 200% value</li>
        )}
      </ul>
      {session.data.isEnhanced && resolvedPowerRef && !session.data.isUpgradePotency && (
        <div className="mt-4 border-t border-border-light pt-4">
          <p className="mb-2 text-sm text-text-secondary">Save this enhanced item to My Library.</p>
          <Button
            onClick={async () => {
              try {
                const baseItem = session.data.customBaseItem ?? session.data.item;
                if (!baseItem || !resolvedPowerRef) return;
                const name = `${'name' in baseItem ? baseItem.name : 'Item'} (${resolvedPowerRef.name})`;
                const usesTypeToSave = session.data.usesType ?? 'full';
                const usesCountToSave =
                  usesTypeToSave === 'permanent' ? undefined : (session.data.usesCount ?? 1);
                const materialCost = session.data.materialCost ?? 0;
                const currencyCost =
                  rulesData && isEnhanced
                    ? getEnhancedMarketPrice(materialCost, rulesData)
                    : materialCost;
                const rarityToSave =
                  requirements?.rarity ?? requirementsBreakdown?.enhancementReq.rarity ?? undefined;
                await createEnhanced.mutateAsync({
                  name,
                  baseItem,
                  powerRef: resolvedPowerRef,
                  potency:
                    typeof session.data.potency === 'number' ? session.data.potency : undefined,
                  currencyCost: currencyCost || undefined,
                  rarity: rarityToSave,
                  usesType: usesTypeToSave,
                  usesCount: usesCountToSave,
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
        <div className="mt-4 border-t border-border-light pt-4">
          <p className="mb-2 text-sm text-text-secondary">
            Update the enhanced item&apos;s potency in your library.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="upgrade-potency-input"
              className="block text-sm font-medium text-text-secondary"
            >
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
    </Card>
  );
}
