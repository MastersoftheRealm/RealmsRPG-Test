/**
 * Item Creator — shield block + shield damage sections (TASK-616)
 */

'use client';

import { ValueStepper, SectionCostBadge } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import { Checkbox } from '@/components/ui';
import { DIE_SIZES } from '@/lib/game/creator-constants';
import type { ItemSectionCosts } from './item-creator-cost-derivation';

type ItemCreatorEditorShieldPanelsProps = {
  shieldDR: { amount: number; size: number };
  onShieldDRChange: (updater: (prev: { amount: number; size: number }) => { amount: number; size: number }) => void;
  shieldBlockSummary: string;
  hasShieldDamage: boolean;
  onHasShieldDamageChange: (value: boolean) => void;
  shieldDamage: { amount: number; size: number };
  onShieldDamageChange: (updater: (prev: { amount: number; size: number }) => { amount: number; size: number }) => void;
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
        defaultExpanded={true}
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
            <span className="font-bold text-lg">d</span>
            <select
              value={shieldDR.size}
              onChange={(e) => onShieldDRChange((d) => ({ ...d, size: parseInt(e.target.value) }))}
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
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
        <p className="text-xs text-text-muted dark:text-text-secondary mt-2">Damage blocked when using Shield reaction</p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Shield Damage"
        collapsedSummary={shieldDamageSummary}
        defaultExpanded={true}
        rightSlot={
          <SectionCostBadge
            ip={itemSectionCosts.shieldDamage.totalIP}
            tp={itemSectionCosts.shieldDamage.totalTP}
            currency={itemSectionCosts.shieldDamage.totalCurrency}
          />
        }
      >
        <div className="flex items-center justify-between gap-3 mb-4">
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
                <span className="font-bold text-lg">d</span>
                <select
                  value={shieldDamage.size}
                  onChange={(e) => onShieldDamageChange((d) => ({ ...d, size: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
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
            <p className="text-xs text-text-muted dark:text-text-secondary mt-2">
              This shield can deal {shieldDamage.amount}d{shieldDamage.size} bludgeoning damage as a melee weapon attack
            </p>
          </>
        )}
        {!hasShieldDamage && (
          <p className="text-sm text-text-muted dark:text-text-secondary">
            Enable to allow this shield to be used as a weapon
          </p>
        )}
      </CollapsibleSection>
    </>
  );
}
