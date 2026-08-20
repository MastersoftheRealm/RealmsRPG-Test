/**
 * Item Creator — weapon/shield config + weapon base damage (TASK-616)
 */

'use client';

import { SegmentedControl, ValueStepper, SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import { WEAPON_DAMAGE_TYPES, DIE_SIZES } from '@/lib/game/creator-constants';
import type { ArmamentType, ItemDamageConfig as DamageConfig } from './item-creator-bootstrap';
import type { ItemSectionCosts } from './item-creator-cost-derivation';

type ItemCreatorEditorWeaponShieldProps = {
  armamentType: ArmamentType;
  isTwoHanded: boolean;
  onIsTwoHandedChange: (value: boolean) => void;
  rangeLevel: number;
  onRangeLevelChange: (value: number) => void;
  rangeDisplay: string;
  weaponShieldConfigSummary: string;
  damage: DamageConfig;
  onDamageChange: (updater: (prev: DamageConfig) => DamageConfig) => void;
  baseDamageSummary: string;
  itemSectionCosts: ItemSectionCosts;
};

export function ItemCreatorEditorWeaponShield({
  armamentType,
  isTwoHanded,
  onIsTwoHandedChange,
  rangeLevel,
  onRangeLevelChange,
  rangeDisplay,
  weaponShieldConfigSummary,
  damage,
  onDamageChange,
  baseDamageSummary,
  itemSectionCosts,
}: ItemCreatorEditorWeaponShieldProps) {
  return (
    <>
      {(armamentType === 'Weapon' || armamentType === 'Shield') && (
        <CollapsibleSection
          title={armamentType === 'Weapon' ? 'Weapon Configuration' : 'Shield Configuration'}
          collapsedSummary={weaponShieldConfigSummary}
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-text-secondary">Handedness:</span>
              <SectionCostBadge
                ip={itemSectionCosts.handedness.totalIP}
                tp={itemSectionCosts.handedness.totalTP}
                currency={itemSectionCosts.handedness.totalCurrency}
              />
              <SegmentedControl
                value={isTwoHanded ? 'two' : 'one'}
                onChange={(value) => onIsTwoHandedChange(value === 'two')}
                aria-label="Handedness"
                options={[
                  { value: 'one', label: 'One-Handed' },
                  { value: 'two', label: 'Two-Handed' },
                ]}
              />
            </div>

            {armamentType === 'Weapon' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-text-secondary">Range:</span>
                <span className="min-w-[80px] font-medium text-tp-text">{rangeDisplay}</span>
                <SectionCostBadge
                  ip={itemSectionCosts.range.totalIP}
                  tp={itemSectionCosts.range.totalTP}
                  currency={itemSectionCosts.range.totalCurrency}
                />
                <ValueStepper
                  value={rangeLevel}
                  onChange={onRangeLevelChange}
                  min={0}
                  max={20}
                  size="sm"
                />
                {rangeLevel > 0 && (
                  <span className="text-xs text-text-muted">(8 spaces per level)</span>
                )}
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {armamentType === 'Weapon' && (
        <CollapsibleSection
          title="Base Damage"
          collapsedSummary={baseDamageSummary}
          rightSlot={
            <SectionCostBadge
              ip={itemSectionCosts.damage.totalIP}
              tp={itemSectionCosts.damage.totalTP}
              currency={itemSectionCosts.damage.totalCurrency}
            />
          }
        >
          <div className="flex flex-wrap items-center gap-4">
            <ValueStepper
              value={damage.amount}
              onChange={(v) => onDamageChange((d) => ({ ...d, amount: v }))}
              label="Dice:"
              min={1}
              max={10}
            />
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">d</span>
              <select
                value={damage.size}
                onChange={(e) => onDamageChange((d) => ({ ...d, size: parseInt(e.target.value) }))}
                className="touch-tier-standard rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
                aria-label="Damage die size"
              >
                {DIE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={damage.type}
              onChange={(e) => onDamageChange((d) => ({ ...d, type: e.target.value }))}
              className="touch-tier-standard rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
              aria-label="Damage type"
            >
              {WEAPON_DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CollapsibleSection>
      )}
    </>
  );
}
