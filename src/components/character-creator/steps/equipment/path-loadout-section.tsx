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
  children?: ReactNode;
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
      <div className="flex flex-wrap gap-2 mb-4">
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {loadoutPhase === 'weapon' ? 'Recommended weapons' : 'Recommended armor'}
              </h3>
              <p className="text-sm text-text-secondary mt-0.5">
                {pathConfirmMode
                  ? 'Included in your path. Review your loadout below. Expand to swap gear or browse the full catalog.'
                  : pathRecommendedForPhase.length > 0
                    ? 'Included in your path. Click to add, or add all at once.'
                    : publicItemsLoading
                      ? 'Loading recommended equipment from the library…'
                      : 'Recommended items could not be found in the library.'}
              </p>
            </div>
            {pathConfirmMode ? (
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 text-sm font-medium min-h-11">
                <Check className="w-4 h-4" aria-hidden />
                {recommendedInInventory.length} / {pathRecommendedItems.length} confirmed
              </span>
            ) : pathRecommendedItems.length > 0 ? (
              <Button
                onClick={onAddAllRecommended}
                className="inline-flex items-center gap-2 shrink-0"
                aria-label="Add all recommended equipment to inventory (replaces any previously added recommended items)"
              >
                <Check className="w-4 h-4" />
                Add Recommended Equipment
              </Button>
            ) : null}
          </div>
          {pathConfirmMode && pathRecommendedForPhase.length > 0 && (
            <ul className="space-y-2 mb-4">
              {pathRecommendedForPhase.map(({ item, quantity }) => {
                const inInventory = recommendedInInventory.some((r) => r.item.id === item.id);
                return (
                  <li
                    key={`${item.id}-${quantity}`}
                    className="flex items-center gap-2 text-sm text-text-primary min-h-11"
                  >
                    <span
                      className={cn(
                        'inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold',
                        inInventory
                          ? 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-400'
                          : 'bg-surface-alt text-text-muted'
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
              <Spinner className="w-5 h-5" />
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
                      'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px]',
                      canAfford
                        ? 'bg-primary-subtle-bg border-primary-subtle-border text-primary-subtle-fg hover:bg-primary-subtle-bg-hover'
                        : 'bg-surface-alt border-border-light text-text-muted dark:text-text-secondary cursor-not-allowed'
                    )}
                  >
                    <span className="text-left">
                      {item.name}
                      {quantity > 1 ? ` ×${quantity}` : ''}
                    </span>
                    <span className="text-xs text-text-secondary flex-shrink-0">
                      {totalCost}c
                    </span>
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
          className="inline-flex items-center gap-2 min-h-11"
        >
          <ShoppingBag className="w-4 h-4" />
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
