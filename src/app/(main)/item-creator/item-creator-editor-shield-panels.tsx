/**
 * Item Creator — shield block + shield damage sections (TASK-616)
 */

'use client';

import { ValueStepper, SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import { Checkbox } from '@/components/ui';
import { DIE_SIZES } from '@/lib/game/creator-constants';
import type { ItemSectionCosts } from './item-creator-cost-derivation';

type ItemCreatorEditorShieldPanelsProps = {
  shieldDR: { amount: number; size: number };
  onShieldDRChange: (
    updater: (prev: { amount: number; size: number }) => { amount: number; size: number },
  ) => void;
  shieldBlockSummary: string;
  hasShieldDamage: boolean;
  onHasShieldDamageChange: (value: boolean) => void;
  shieldDamage: { amount: number; size: number };
  onShieldDamageChange: (
    updater: (prev: { amount: number; size: number }) => { amount: number; size: number },
  ) => void;
  shieldDamageSummary: string;
  itemSectionCosts: ItemSectionCosts;
};

export function ItemCreatorEditorShieldPanels({
  shieldDR,
  onShieldDRChange,
  shieldBlockSummary,
  hasShieldDamage,
  onHasShieldDamageChange,
  shieldDamage,
  onShieldDamageChange,
  shieldDamageSummary,
  itemSectionCosts,
}: ItemCreatorEditorShieldPanelsProps) {
  return (
    <>
      <CollapsibleSection
        title="Shield Block (Damage Reduction)"
        collapsedSummary={shieldBlockSummary}
        rightSlot={
          <SectionCostBadge
            ip={itemSectionCosts.shieldDR.totalIP}
            tp={itemSectionCosts.shieldDR.totalTP}
            currency={itemSectionCosts.shieldDR.totalCurrency}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <ValueStepper
            value={shieldDR.amount}
            onChange={(v) => onShieldDRChange((d) => ({ ...d, amount: v }))}
            label="Dice:"
            min={1}
            max={10}
          />
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold">d</span>
            <select
              value={shieldDR.size}
              onChange={(e) => onShieldDRChange((d) => ({ ...d, size: parseInt(e.target.value) }))}
              className="rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
              aria-label="Shield damage reduction die size"
            >
              {DIE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <span className="text-sm text-text-secondary">
            ({shieldDR.amount}d{shieldDR.size} damage blocked)
          </span>
        </div>
        <p className="mt-2 text-xs text-text-muted">Damage blocked when using Shield reaction</p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Shield Damage"
        collapsedSummary={shieldDamageSummary}
        rightSlot={
          <SectionCostBadge
            ip={itemSectionCosts.shieldDamage.totalIP}
            tp={itemSectionCosts.shieldDamage.totalTP}
            currency={itemSectionCosts.shieldDamage.totalCurrency}
          />
        }
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <Checkbox
            id="hasShieldDamage"
            checked={hasShieldDamage}
            onChange={(e) => onHasShieldDamageChange(e.target.checked)}
            label="Shield Damage"
            className="text-lg font-bold"
          />
        </div>
        {hasShieldDamage && (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <ValueStepper
                value={shieldDamage.amount}
                onChange={(v) => onShieldDamageChange((d) => ({ ...d, amount: v }))}
                label="Dice:"
                min={1}
                max={10}
              />
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold">d</span>
                <select
                  value={shieldDamage.size}
                  onChange={(e) =>
                    onShieldDamageChange((d) => ({ ...d, size: parseInt(e.target.value) }))
                  }
                  className="rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
                  aria-label="Shield damage die size"
                >
                  {DIE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-sm text-text-secondary">Bludgeoning</span>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              This shield can deal {shieldDamage.amount}d{shieldDamage.size} bludgeoning damage as a
              melee weapon attack
            </p>
          </>
        )}
        {!hasShieldDamage && (
          <p className="text-sm text-text-muted">
            Enable to allow this shield to be used as a weapon
          </p>
        )}
      </CollapsibleSection>
    </>
  );
}
