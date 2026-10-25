/**
 * Item Creator — armor configuration section (TASK-616)
 */

'use client';

import { ValueStepper, SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import {
  combineItemSectionCosts,
  type ItemSectionCosts,
} from './item-creator-cost-derivation';

/** One track per field once the column can hold the label and its cost badge. */
export const ARMOR_FIELD_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-6';

type ItemCreatorEditorArmorProps = {
  damageReduction: number;
  onDamageReductionChange: (value: number) => void;
  agilityReduction: number;
  onAgilityReductionChange: (value: number) => void;
  criticalRangeIncrease: number;
  onCriticalRangeIncreaseChange: (value: number) => void;
  armorConfigSummary: string;
  itemSectionCosts: ItemSectionCosts;
};

export function ItemCreatorEditorArmor({
  damageReduction,
  onDamageReductionChange,
  agilityReduction,
  onAgilityReductionChange,
  criticalRangeIncrease,
  onCriticalRangeIncreaseChange,
  armorConfigSummary,
  itemSectionCosts,
}: ItemCreatorEditorArmorProps) {
  const sectionCost = combineItemSectionCosts(
    itemSectionCosts.damageReduction,
    itemSectionCosts.agilityReduction,
    itemSectionCosts.criticalRange,
  );
  return (
    <CollapsibleSection
      title="Armor Configuration"
      collapsedSummary={armorConfigSummary}
      rightSlot={
        <SectionCostBadge
          className="whitespace-nowrap"
          ip={sectionCost.totalIP}
          tp={sectionCost.totalTP}
          currency={sectionCost.totalCurrency}
        />
      }
    >
      <div className={ARMOR_FIELD_GRID_CLASS}>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <label className="text-sm font-medium whitespace-nowrap text-text-secondary">
              Damage Reduction
            </label>
            <SectionCostBadge
              className="whitespace-nowrap"
              ip={itemSectionCosts.damageReduction.totalIP}
              tp={itemSectionCosts.damageReduction.totalTP}
              currency={itemSectionCosts.damageReduction.totalCurrency}
            />
          </div>
          <ValueStepper
            value={damageReduction}
            onChange={onDamageReductionChange}
            min={0}
            max={10}
            size="lg"
            label="Damage reduction"
          />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <label className="text-sm font-medium whitespace-nowrap text-text-secondary">
              Agility Reduction
            </label>
            <SectionCostBadge
              className="whitespace-nowrap"
              ip={itemSectionCosts.agilityReduction.totalIP}
              tp={itemSectionCosts.agilityReduction.totalTP}
              currency={itemSectionCosts.agilityReduction.totalCurrency}
            />
          </div>
          <ValueStepper
            value={agilityReduction}
            onChange={onAgilityReductionChange}
            min={0}
            max={6}
            size="lg"
            label="Agility reduction"
          />
          <p className="mt-1 text-xs text-text-muted">Reduces Agility for wearing this armor</p>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <label className="text-sm font-medium whitespace-nowrap text-text-secondary">
              Critical Range Increase
            </label>
            <SectionCostBadge
              className="whitespace-nowrap"
              ip={itemSectionCosts.criticalRange.totalIP}
              tp={itemSectionCosts.criticalRange.totalTP}
              currency={itemSectionCosts.criticalRange.totalCurrency}
            />
          </div>
          <ValueStepper
            value={criticalRangeIncrease}
            onChange={onCriticalRangeIncreaseChange}
            min={0}
            max={6}
            size="lg"
            label="Critical range increase"
          />
          <p className="mt-1 text-xs text-text-muted">Increases critical hit range</p>
        </div>
      </div>
    </CollapsibleSection>
  );
}
