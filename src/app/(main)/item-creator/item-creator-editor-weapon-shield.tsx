/**
 * Item Creator — weapon/shield config + weapon base damage (TASK-616)
 */

'use client';

import { cn } from '@/lib/utils';
import { ValueStepper, SectionCostBadge } from '@/components/shared';
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
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-text-secondary">Handedness:</span>
              <SectionCostBadge
                ip={itemSectionCosts.handedness.totalIP}
                tp={itemSectionCosts.handedness.totalTP}
                currency={itemSectionCosts.handedness.totalCurrency}
              />
              <div className="flex rounded-lg border border-border-light overflow-hidden">
                <button
                  type="button"
                  onClick={() => onIsTwoHandedChange(false)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors min-h-[44px]',
                    !isTwoHanded
                      ? 'bg-warning-600 text-text-on-dark hover:bg-warning-700 dark:bg-warning-700 dark:text-text-on-dark dark:hover:bg-warning-600'
                      : 'bg-surface-alt dark:bg-surface text-text-primary hover:bg-surface',
                  )}
                >
                  One-Handed
                </button>
                <button
                  type="button"
                  onClick={() => onIsTwoHandedChange(true)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors min-h-[44px]',
                    isTwoHanded
                      ? 'bg-warning-600 text-text-on-dark hover:bg-warning-700 dark:bg-warning-700 dark:text-text-on-dark dark:hover:bg-warning-600'
                      : 'bg-surface-alt dark:bg-surface text-text-primary hover:bg-surface',
                  )}
                >
                  Two-Handed
                </button>
              </div>
            </div>

            {armamentType === 'Weapon' && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-text-secondary">Range:</span>
                <span className="font-medium text-tp-text min-w-[80px]">{rangeDisplay}</span>
                <SectionCostBadge
                  ip={itemSectionCosts.range.totalIP}
                  tp={itemSectionCosts.range.totalTP}
                  currency={itemSectionCosts.range.totalCurrency}
                />
                <ValueStepper value={rangeLevel} onChange={onRangeLevelChange} min={0} max={20} size="sm" />
                {rangeLevel > 0 && (
                  <span className="text-xs text-text-muted dark:text-text-secondary">(8 spaces per level)</span>
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
              <span className="font-bold text-lg">d</span>
              <select
                value={damage.size}
                onChange={(e) => onDamageChange((d) => ({ ...d, size: parseInt(e.target.value) }))}
                className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
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
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
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
