'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button, Spinner } from '@/components/ui';
import { Check, ShoppingBag } from 'lucide-react';
import type { PathItemRecommendation } from '@/types/archetype';
import type {
  AdvancedEquipmentItem,
  AdvancedLoadoutPhase,
} from '@/lib/creator/advanced-equipment-catalog';

export interface PathLoadoutSectionProps {
  loadoutPhase: AdvancedLoadoutPhase;
  onLoadoutPhaseChange: (phase: AdvancedLoadoutPhase) => void;
  pathConfirmMode: boolean;
  pathRecommendedForPhase: Array<{ item: AdvancedEquipmentItem; quantity: number }>;
  pathRecommendedItems: Array<{ item: AdvancedEquipmentItem; quantity: number }>;
  pathArmamentRecommendations: PathItemRecommendation[];
  pathEquipmentRecommendations: PathItemRecommendation[];
  recommendedInInventory: Array<{ item: AdvancedEquipmentItem; quantity: number }>;
  publicItemsLoading: boolean;
  remainingCurrency: number;
  onAddAllRecommended: () => void;
  onAddItemWithQuantity: (item: AdvancedEquipmentItem, qty: number) => void;
  onExpandFullCatalog: () => void;
  /** Rendered between recommended list and expand/next actions (e.g. path Unarmed Prowess). */
  children?: ReactNode | undefined;
}

export function PathLoadoutSection({
  loadoutPhase,
  onLoadoutPhaseChange,
  pathConfirmMode,
  pathRecommendedForPhase,
  pathRecommendedItems,
  pathArmamentRecommendations,
  pathEquipmentRecommendations,
  recommendedInInventory,
  publicItemsLoading,
  remainingCurrency,
  onAddAllRecommended,
  onAddItemWithQuantity,
  onExpandFullCatalog,
  children,
}: PathLoadoutSectionProps) {
  const showRecommendedBlock =
    pathRecommendedForPhase.length > 0 ||
    pathArmamentRecommendations.length + pathEquipmentRecommendations.length > 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={loadoutPhase === 'weapon' ? 'primary' : 'secondary'}
          onClick={() => onLoadoutPhaseChange('weapon')}
          className="min-h-11"
        >
          1. Weapon
        </Button>
        <Button
          variant={loadoutPhase === 'armor' ? 'primary' : 'secondary'}
          onClick={() => onLoadoutPhaseChange('armor')}
          className="min-h-11"
        >
          2. Armor
        </Button>
      </div>

      {/* Path mode: recommended equipment = armaments + general equipment from path */}
      {showRecommendedBlock && (
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {loadoutPhase === 'weapon' ? 'Recommended weapons' : 'Recommended armor'}
              </h3>
              <p className="mt-0.5 text-sm text-text-secondary">
                {pathConfirmMode
                  ? 'Included in your path. Review your loadout below. Expand to swap Armaments or browse the full catalog.'
                  : pathRecommendedForPhase.length > 0
                    ? 'Included in your path. Click to add, or add all at once.'
                    : publicItemsLoading
                      ? 'Loading recommended equipment from the library…'
                      : 'Recommended items could not be found in the library.'}
              </p>
            </div>
            {pathConfirmMode ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-success-100 px-3 py-2 text-sm font-medium text-success-fg dark:bg-success-900/30">
                <Check className="h-4 w-4" aria-hidden />
                {recommendedInInventory.length} / {pathRecommendedItems.length} confirmed
              </span>
            ) : pathRecommendedItems.length > 0 ? (
              <Button
                onClick={onAddAllRecommended}
                className="inline-flex shrink-0 items-center gap-2"
                aria-label="Add all recommended equipment to inventory (replaces any previously added recommended items)"
              >
                <Check className="h-4 w-4" />
                Add Recommended Equipment
              </Button>
            ) : null}
          </div>
          {pathConfirmMode && pathRecommendedForPhase.length > 0 && (
            <ul className="mb-4 space-y-2">
              {pathRecommendedForPhase.map(({ item, quantity }) => {
                const inInventory = recommendedInInventory.some((r) => r.item.id === item.id);
                return (
                  <li
                    key={`${item.id}-${quantity}`}
                    className="flex min-h-11 items-center gap-2 text-sm text-text-primary"
                  >
                    <span
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        inInventory
                          ? 'bg-success-100 text-success-fg dark:bg-success-900/40'
                          : 'bg-surface-alt text-text-muted',
                      )}
                      aria-hidden
                    >
                      {inInventory ? '✓' : '·'}
                    </span>
                    {item.name}
                    {quantity > 1 ? ` ×${quantity}` : ''}
                  </li>
                );
              })}
            </ul>
          )}
          {publicItemsLoading && pathRecommendedItems.length === 0 && (
            <div className="flex items-center gap-2 py-4 text-text-secondary">
              <Spinner className="h-5 w-5" />
              <span>Loading recommended equipment…</span>
            </div>
          )}
          {!publicItemsLoading && pathRecommendedForPhase.length > 0 && !pathConfirmMode && (
            <div className="flex flex-wrap gap-2">
              {pathRecommendedForPhase.map(({ item, quantity }) => {
                const cost = item.gold_cost || item.currency || 0;
                const totalCost = cost * quantity;
                const canAfford = totalCost <= remainingCurrency;
                return (
                  <button
                    key={`${item.id}-${quantity}`}
                    type="button"
                    onClick={() => canAfford && onAddItemWithQuantity(item, quantity)}
                    disabled={!canAfford}
                    className={cn(
                      'inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      canAfford
                        ? 'border-primary-subtle-border bg-primary-subtle-bg text-primary-subtle-fg hover:bg-primary-subtle-bg-hover'
                        : 'cursor-not-allowed border-border-light bg-surface-alt text-text-muted',
                    )}
                  >
                    <span className="text-left">
                      {item.name}
                      {quantity > 1 ? ` ×${quantity}` : ''}
                    </span>
                    <span className="flex-shrink-0 text-xs text-text-secondary">{totalCost}c</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {children}

      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={onExpandFullCatalog}
          className="inline-flex min-h-11 items-center gap-2"
        >
          <ShoppingBag className="h-4 w-4" />
          See all equipment
        </Button>
        {loadoutPhase === 'weapon' ? (
          <Button
            variant="outline"
            onClick={() => onLoadoutPhaseChange('armor')}
            className="min-h-11"
          >
            Next: Choose armor →
          </Button>
        ) : null}
      </div>
    </>
  );
}
