/**
 * Crafting Item & Options section (TASK-607)
 */

'use client';

import { Button, Input } from '@/components/ui';
import { ValueStepper } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import type { CraftingRules } from '@/types/core-rules';
import type {
  CraftingSession as CraftingSessionType,
  CraftingItemRef,
  CraftingCustomBaseItem,
  CraftingPowerRef,
} from '@/types/crafting';
import {
  type PowerOption,
  type UsesType,
  findMultipleUseIndexForConfig,
  resolveMultipleUseIndex,
  getEffectiveCraftingEnergy,
  getUsesCountOptions,
} from './crafting-tool-helpers';

type Props = {
  session: CraftingSessionType;
  item: CraftingItemRef | null;
  customBaseItem: CraftingCustomBaseItem | null;
  upgradeOriginalItem: CraftingItemRef | CraftingCustomBaseItem | null;
  isCompleted: boolean;
  isConsumable: boolean;
  quantity: number;
  isEnhanced: boolean;
  usesType: UsesType;
  usesCount: number;
  rulesData: CraftingRules | undefined;
  powerOptions: PowerOption[];
  resolvedPowerRef: CraftingPowerRef | null | undefined;
  updateData: (updates: Partial<CraftingSessionType['data']>) => void;
  onOpenItemSelect: () => void;
  onOpenUpgradeItemSelect: () => void;
};

export function CraftingItemOptionsSection({
  session,
  item,
  customBaseItem,
  upgradeOriginalItem,
  isCompleted,
  isConsumable,
  quantity,
  isEnhanced,
  usesType,
  usesCount,
  rulesData,
  powerOptions,
  resolvedPowerRef,
  updateData,
  onOpenItemSelect,
  onOpenUpgradeItemSelect,
}: Props) {
  return (
    <CollapsibleSection
      title="Item & Options"
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
            <div className="flex min-w-[260px] flex-wrap items-center gap-3 rounded-lg border border-border-light bg-surface-alt p-3">
              <div className="flex flex-col">
                <span className="font-medium text-text-primary">
                  {item?.name ?? customBaseItem?.name}
                </span>
                {(item?.marketPrice ?? customBaseItem?.marketPrice) != null && (
                  <span className="text-sm text-text-muted">
                    {item?.marketPrice ?? customBaseItem?.marketPrice ?? 0} currency
                  </span>
                )}
              </div>
              {!isCompleted && (
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!item && customBaseItem) {
                        updateData({ isEditingCustomBaseItem: true });
                      } else {
                        onOpenItemSelect();
                      }
                    }}
                    aria-label={item ? 'Change item' : 'Edit custom item'}
                  >
                    {item ? 'Change' : 'Edit'}
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
                        isEditingCustomBaseItem: false,
                      })
                    }
                    aria-label="Remove item"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ) : (
            !isCompleted && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onOpenItemSelect()} aria-label="Select item to craft">
                  Select item to craft
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    updateData({
                      customBaseItem: { name: '', marketPrice: 0 },
                      item: null,
                      isUpgrade: false,
                      upgradeOriginalItem: null,
                      isEditingCustomBaseItem: true,
                    })
                  }
                  aria-label="Create custom item"
                >
                  Create custom item
                </Button>
              </div>
            )
          )}
        </div>

        {/* Custom item entry (only visible when creating/editing a custom base item) */}
        {!isCompleted && customBaseItem && !item && session.data.isEditingCustomBaseItem && (
          <div className="mt-3 space-y-3 rounded-lg border border-border-light bg-surface-alt/60 p-3">
            <p className="text-xs font-medium text-text-secondary">
              Define a custom base item. Rarity and crafting requirements are computed from its
              cost.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="text"
                placeholder="Custom item name"
                value={customBaseItem.name}
                onChange={(e) =>
                  updateData({
                    customBaseItem: {
                      ...customBaseItem,
                      name: e.target.value,
                    },
                  })
                }
                className="max-w-xs min-w-[160px]"
                aria-label="Custom item name"
              />
              <Input
                type="number"
                min={0}
                placeholder="Currency cost"
                value={
                  Number.isFinite(customBaseItem.marketPrice) ? customBaseItem.marketPrice : ''
                }
                onChange={(e) =>
                  updateData({
                    customBaseItem: {
                      ...customBaseItem,
                      marketPrice: Number(e.target.value) || 0,
                    },
                  })
                }
                className="w-32"
                aria-label="Custom item currency cost"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateData({ isEditingCustomBaseItem: false })}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateData({
                    customBaseItem: null,
                    isEditingCustomBaseItem: false,
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Upgrade-from item selection */}
        {!isCompleted && (item || customBaseItem) && (
          <div className="space-y-2 rounded-lg border border-border-light bg-surface-alt/40 p-3">
            <p className="text-xs font-medium text-text-secondary">
              Upgrade an existing item into this one (cost/time based on price difference).
            </p>
            {upgradeOriginalItem ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-text-primary">
                  From: <span className="font-semibold">{upgradeOriginalItem.name}</span>
                </span>
                <span className="text-xs text-text-muted">
                  {upgradeOriginalItem.marketPrice} currency
                </span>
                <Button variant="secondary" size="sm" onClick={() => onOpenUpgradeItemSelect()}>
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
              <Button variant="secondary" size="sm" onClick={() => onOpenUpgradeItemSelect()}>
                Select original item to upgrade from
              </Button>
            )}
          </div>
        )}

        {!isCompleted && (
          <div className="flex flex-wrap items-start gap-6">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isConsumable}
                onChange={(e) => updateData({ isConsumable: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-text-primary">Consumable</span>
            </label>
            {isConsumable && rulesData && (
              <p className="max-w-xs self-center text-xs text-text-muted">
                Crafting time is reduced to {Math.round(rulesData.consumableTimeMultiplier * 100)}%
                of normal.
              </p>
            )}

            <div>
              <span className="mb-1 block text-sm font-medium text-text-secondary">Quantity</span>
              <ValueStepper
                value={quantity}
                onChange={(v) => updateData({ quantity: Math.max(1, v) })}
                min={1}
                max={20}
                step={1}
                decrementTitle="Decrease quantity"
                incrementTitle="Increase quantity"
              />
              <p className="mt-1 max-w-[200px] text-xs text-text-muted">
                {quantity === (rulesData?.bulkCraftCount ?? 4)
                  ? `Bulk: pay for ${rulesData?.bulkCraftMaterialCount ?? 3}, receive ${rulesData?.bulkCraftCount ?? 4}.`
                  : `Crafting ${quantity} item${quantity !== 1 ? 's' : ''}.`}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isEnhanced}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const defaultUsesType: UsesType = 'full';
                      const defaultUsesCount = 1;
                      const idxFromConfig = findMultipleUseIndexForConfig(
                        rulesData,
                        defaultUsesType,
                        defaultUsesCount,
                      );
                      updateData({
                        isEnhanced: true,
                        multipleUseTableIndex: idxFromConfig,
                        craftBaseItemAlso: false,
                        usesType: defaultUsesType,
                        usesCount: defaultUsesCount,
                      });
                    } else {
                      updateData({
                        isEnhanced: false,
                        powerRef: null,
                        multipleUseTableIndex: -1,
                        craftBaseItemAlso: false,
                        usesType: undefined,
                        usesCount: undefined,
                      });
                    }
                  }}
                  className="rounded border-border"
                />
                <span className="text-text-primary">Enhanced</span>
              </label>

              {isEnhanced && (
                <div className="space-y-3 border-t border-border-light pt-4">
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!session.data.craftBaseItemAlso}
                      onChange={(e) => updateData({ craftBaseItemAlso: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-text-primary">Craft base item as well</span>
                  </label>
                  <p className="-mt-1 text-xs text-text-muted">
                    Turn this on if you do not already have the base item. Requirements will include
                    both base crafting and enhancement.
                  </p>
                  <div>
                    <label
                      htmlFor="enhanced-power"
                      className="mb-1 block text-sm font-medium text-text-secondary"
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
                      className="min-h-[44px] w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                    >
                      <option value="">Select a power</option>
                      {powerOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.energyCost} EN)
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Energy cost helper is omitted here because the power picker already shows energy in parentheses */}
                  {resolvedPowerRef && rulesData?.multipleUseTable?.length ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label
                            htmlFor="enhanced-uses-recovery"
                            className="mb-1 block text-sm font-medium text-text-secondary"
                          >
                            Recovery type
                          </label>
                          <select
                            id="enhanced-uses-recovery"
                            value={usesType}
                            onChange={(e) => {
                              const nextType = e.target.value as UsesType;
                              if (nextType === 'permanent') {
                                updateData({
                                  usesType: 'permanent',
                                  usesCount: undefined,
                                  multipleUseTableIndex: resolveMultipleUseIndex(
                                    rulesData,
                                    'permanent',
                                    undefined,
                                    session.data.multipleUseTableIndex,
                                  ),
                                });
                                return;
                              }
                              const defaultCount = getUsesCountOptions(rulesData, nextType)[0] ?? 1;
                              updateData({
                                usesType: nextType,
                                usesCount: defaultCount,
                                multipleUseTableIndex: resolveMultipleUseIndex(
                                  rulesData,
                                  nextType,
                                  defaultCount,
                                  session.data.multipleUseTableIndex,
                                ),
                              });
                            }}
                            className="min-h-[44px] w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                          >
                            <option value="full">Full Recovery</option>
                            <option value="partial">Partial Recovery</option>
                            <option value="permanent">Permanent / Passive</option>
                          </select>
                        </div>
                        {usesType !== 'permanent' && (
                          <div>
                            <label
                              htmlFor="enhanced-uses-count"
                              className="mb-1 block text-sm font-medium text-text-secondary"
                            >
                              Uses per {usesType === 'full' ? 'Full' : 'Partial'} Recovery
                            </label>
                            <select
                              id="enhanced-uses-count"
                              value={usesCount}
                              onChange={(e) => {
                                const nextCount = Number(e.target.value) || 1;
                                updateData({
                                  usesCount: nextCount,
                                  multipleUseTableIndex: resolveMultipleUseIndex(
                                    rulesData,
                                    usesType,
                                    nextCount,
                                    session.data.multipleUseTableIndex,
                                  ),
                                });
                              }}
                              className="min-h-[44px] w-full max-w-[120px] rounded-lg border border-border bg-background px-3 py-2 text-text-primary"
                            >
                              {getUsesCountOptions(rulesData, usesType).map((count) => (
                                <option key={count} value={count}>
                                  {count}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        Effective crafting energy:{' '}
                        {!rulesData || !resolvedPowerRef
                          ? `${resolvedPowerRef?.energyCost ?? 0} EN`
                          : `${Math.ceil(
                              getEffectiveCraftingEnergy(
                                resolvedPowerRef.energyCost,
                                resolveMultipleUseIndex(
                                  rulesData,
                                  usesType,
                                  usesCount,
                                  session.data.multipleUseTableIndex,
                                ),
                                rulesData,
                              ),
                            )} EN`}
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
  );
}
