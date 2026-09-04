/**
 * Item Creator — weapon/shield config + weapon base damage (TASK-616 / TASK-919 / TASK-920)
 */

'use client';

import { SegmentedControl, ValueStepper, SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import { WEAPON_DAMAGE_TYPES, DIE_SIZES, WEAPON_RANGE_TYPES } from '@/lib/game/creator-constants';
import { weaponRangeSpaceLadder, type WeaponRangeType } from '@/lib/calculators';
import {
  weaponAbilityUtilizedOptions,
  type WeaponAttackAbility,
} from '@/lib/game/weapon-attack-ability';
import type { ArmamentType, ItemDamageConfig as DamageConfig } from './item-creator-bootstrap';
import type { ItemSectionCosts } from './item-creator-cost-derivation';

type ItemCreatorEditorWeaponShieldProps = {
  armamentType: ArmamentType;
  isTwoHanded: boolean;
  onIsTwoHandedChange: (value: boolean) => void;
  rangeType: WeaponRangeType;
  onRangeTypeChange: (value: WeaponRangeType) => void;
  rangeSpaces: number;
  onRangeSpacesChange: (value: number) => void;
  attackAbility: WeaponAttackAbility;
  onAttackAbilityChange: (value: WeaponAttackAbility) => void;
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
  rangeType,
  onRangeTypeChange,
  rangeSpaces,
  onRangeSpacesChange,
  attackAbility,
  onAttackAbilityChange,
  weaponShieldConfigSummary,
  damage,
  onDamageChange,
  baseDamageSummary,
  itemSectionCosts,
}: ItemCreatorEditorWeaponShieldProps) {
  const spaceOptions = rangeType === 'melee' ? [] : weaponRangeSpaceLadder(rangeType);

  return (
    <>
      {(armamentType === 'Weapon' || armamentType === 'Shield') && (
        <CollapsibleSection
          title={armamentType === 'Weapon' ? 'Weapon Configuration' : 'Shield Configuration'}
          collapsedSummary={weaponShieldConfigSummary}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-6">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
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
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <label
                  htmlFor="weapon-range-type"
                  className="text-sm font-medium text-text-secondary"
                >
                  Range:
                </label>
                <SectionCostBadge
                  ip={itemSectionCosts.range.totalIP}
                  tp={itemSectionCosts.range.totalTP}
                  currency={itemSectionCosts.range.totalCurrency}
                />
                <select
                  id="weapon-range-type"
                  aria-label="Range type"
                  value={rangeType}
                  onChange={(e) => onRangeTypeChange(e.target.value as WeaponRangeType)}
                  className="touch-tier-standard rounded-lg border border-border-light bg-surface px-4 py-2 text-text-primary"
                >
                  {WEAPON_RANGE_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {rangeType !== 'melee' && (
                  <select
                    aria-label="Range spaces"
                    value={rangeSpaces}
                    onChange={(e) => onRangeSpacesChange(parseInt(e.target.value, 10))}
                    className="touch-tier-standard rounded-lg border border-border-light bg-surface px-4 py-2 text-text-primary"
                  >
                    {spaceOptions.map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'space' : 'spaces'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {armamentType === 'Weapon' && (
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <label
                  htmlFor="weapon-ability-utilized"
                  className="text-sm font-medium text-text-secondary"
                >
                  Ability utilized:
                </label>
                <SectionCostBadge
                  ip={itemSectionCosts.abilityUtilized.totalIP}
                  tp={itemSectionCosts.abilityUtilized.totalTP}
                  currency={itemSectionCosts.abilityUtilized.totalCurrency}
                />
                <select
                  id="weapon-ability-utilized"
                  aria-label="Ability utilized"
                  value={attackAbility}
                  onChange={(e) => onAttackAbilityChange(e.target.value as WeaponAttackAbility)}
                  className="touch-tier-standard rounded-lg border border-border-light bg-surface px-4 py-2 text-text-primary"
                >
                  {weaponAbilityUtilizedOptions(rangeType).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
