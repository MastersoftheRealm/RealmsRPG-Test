/**
 * Item Creator — armor configuration section (TASK-616)
 */

'use client';

import { ValueStepper, SectionCostBadge } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import type { ItemSectionCosts } from './item-creator-cost-derivation';

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
  return (
    <CollapsibleSection
      title="Armor Configuration"
      collapsedSummary={armorConfigSummary}
      defaultExpanded={true}
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-sm font-medium text-text-secondary">Damage Reduction</label>
            <SectionCostBadge
              ip={itemSectionCosts.damageReduction.totalIP}
              tp={itemSectionCosts.damageReduction.totalTP}
              currency={itemSectionCosts.damageReduction.totalCurrency}
            />
          </div>
          <ValueStepper value={damageReduction} onChange={onDamageReductionChange} min={0} max={10} size="lg" />
          <p className="text-xs text-text-muted dark:text-text-secondary mt-1">Reduces physical damage taken</p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-sm font-medium text-text-secondary">Agility Reduction</label>
            <SectionCostBadge
              ip={itemSectionCosts.agilityReduction.totalIP}
              tp={itemSectionCosts.agilityReduction.totalTP}
              currency={itemSectionCosts.agilityReduction.totalCurrency}
            />
          </div>
          <ValueStepper value={agilityReduction} onChange={onAgilityReductionChange} min={0} max={6} size="lg" />
          <p className="text-xs text-text-muted dark:text-text-secondary mt-1">Reduces Agility for wearing this armor</p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-sm font-medium text-text-secondary">Critical Range Increase</label>
            <SectionCostBadge
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
          />
          <p className="text-xs text-text-muted dark:text-text-secondary mt-1">Increases critical hit range</p>
        </div>
      </div>
    </CollapsibleSection>
  );
}
