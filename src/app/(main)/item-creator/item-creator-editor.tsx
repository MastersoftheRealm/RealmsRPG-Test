/**
 * Item Creator — editor section islands (TASK-381 Phase 1)
 * ========================================================
 * Presentational form sections for the armament creator. State, cost math,
 * save/load, and CreatorPageShell stay in page.tsx.
 */

'use client';

import { Plus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemProperty } from '@/hooks';
import { ValueStepper, SectionCostBadge, RealmsImageField } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import { Checkbox, Button, Card } from '@/components/ui';
import { WEAPON_DAMAGE_TYPES, DIE_SIZES } from '@/lib/game/creator-constants';
import type {
  ArmamentType,
  ItemSelectedProperty as SelectedProperty,
  ItemDamageConfig as DamageConfig,
} from './item-creator-bootstrap';
import {
  ARMAMENT_TYPES,
  WEAPON_ABILITY_REQUIREMENTS,
  ARMOR_ABILITY_REQUIREMENTS,
  PropertyCard,
} from './item-creator-helpers';

type ItemSectionCostSlice = {
  totalIP: number;
  totalTP: number;
  totalCurrency: number;
};

type ItemSectionCosts = {
  handedness: ItemSectionCostSlice;
  range: ItemSectionCostSlice;
  damage: ItemSectionCostSlice;
  damageReduction: ItemSectionCostSlice;
  agilityReduction: ItemSectionCostSlice;
  criticalRange: ItemSectionCostSlice;
  shieldDR: ItemSectionCostSlice;
  shieldDamage: ItemSectionCostSlice;
  abilityReq: ItemSectionCostSlice;
};

type ItemCreatorEditorProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;
  imageCategory: 'weapon' | 'armor' | 'shield';

  armamentType: ArmamentType;
  onArmamentTypeChange: (type: ArmamentType) => void;

  isTwoHanded: boolean;
  onIsTwoHandedChange: (value: boolean) => void;
  rangeLevel: number;
  onRangeLevelChange: (value: number) => void;
  rangeDisplay: string;
  weaponShieldConfigSummary: string;

  damage: DamageConfig;
  onDamageChange: (updater: (prev: DamageConfig) => DamageConfig) => void;
  baseDamageSummary: string;

  damageReduction: number;
  onDamageReductionChange: (value: number) => void;
  agilityReduction: number;
  onAgilityReductionChange: (value: number) => void;
  criticalRangeIncrease: number;
  onCriticalRangeIncreaseChange: (value: number) => void;
  armorConfigSummary: string;

  shieldDR: { amount: number; size: number };
  onShieldDRChange: (updater: (prev: { amount: number; size: number }) => { amount: number; size: number }) => void;
  shieldBlockSummary: string;
  hasShieldDamage: boolean;
  onHasShieldDamageChange: (value: boolean) => void;
  shieldDamage: { amount: number; size: number };
  onShieldDamageChange: (updater: (prev: { amount: number; size: number }) => { amount: number; size: number }) => void;
  shieldDamageSummary: string;

  abilityRequirement: { id: number; name: string; level: number } | null;
  onAbilityRequirementChange: (
    next:
      | { id: number; name: string; level: number }
      | null
      | ((prev: { id: number; name: string; level: number } | null) => { id: number; name: string; level: number } | null),
  ) => void;
  abilityReqSummary: string;

  selectedProperties: SelectedProperty[];
  itemProperties: ItemProperty[];
  propertiesSummary: string;
  onAddProperty: () => void;
  onRemoveProperty: (index: number) => void;
  onUpdateProperty: (index: number, updates: Partial<SelectedProperty>) => void;

  itemSectionCosts: ItemSectionCosts;
};

export function ItemCreatorEditor({
  isAdmin,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  imageId,
  imageUrl,
  onImageChange,
  imageCategory,
  armamentType,
  onArmamentTypeChange,
  isTwoHanded,
  onIsTwoHandedChange,
  rangeLevel,
  onRangeLevelChange,
  rangeDisplay,
  weaponShieldConfigSummary,
  damage,
  onDamageChange,
  baseDamageSummary,
  damageReduction,
  onDamageReductionChange,
  agilityReduction,
  onAgilityReductionChange,
  criticalRangeIncrease,
  onCriticalRangeIncreaseChange,
  armorConfigSummary,
  shieldDR,
  onShieldDRChange,
  shieldBlockSummary,
  hasShieldDamage,
  onHasShieldDamageChange,
  shieldDamage,
  onShieldDamageChange,
  shieldDamageSummary,
  abilityRequirement,
  onAbilityRequirementChange,
  abilityReqSummary,
  selectedProperties,
  itemProperties,
  propertiesSummary,
  onAddProperty,
  onRemoveProperty,
  onUpdateProperty,
  itemSectionCosts,
}: ItemCreatorEditorProps) {
  return (
    <>
      <Card className="shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter item name..."
              className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500"
            />
          </div>

          {isAdmin && (
            <RealmsImageField
              categories={imageCategory}
              imageId={imageId}
              imageUrl={imageUrl}
              onChange={onImageChange}
              entityName={name}
              label="Armament card art"
              hint="Shown on guided creator loadout cards. Uploads are saved to the shared image bank."
            />
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Item Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ARMAMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onArmamentTypeChange(type.value)}
                  className={cn(
                    'py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1 min-h-[44px]',
                    armamentType === type.value
                      ? 'bg-warning-600 text-text-on-dark hover:bg-warning-700 dark:bg-warning-700 dark:text-text-on-dark dark:hover:bg-warning-600'
                      : 'bg-surface-alt dark:bg-surface hover:bg-surface text-text-primary',
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe your item..."
              rows={2}
              className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500"
            />
          </div>
        </div>
      </Card>

      {(armamentType === 'Weapon' || armamentType === 'Shield') && (
        <CollapsibleSection
          title={armamentType === 'Weapon' ? 'Weapon Configuration' : 'Shield Configuration'}
          collapsedSummary={weaponShieldConfigSummary}
          defaultExpanded={true}
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
                <ValueStepper
                  value={rangeLevel}
                  onChange={onRangeLevelChange}
                  min={0}
                  max={20}
                  size="sm"
                />
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
          defaultExpanded={true}
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

      {armamentType === 'Armor' && (
        <CollapsibleSection
          title="Armor Configuration"
          collapsedSummary={armorConfigSummary}
          defaultExpanded={true}
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium text-text-secondary">
                  Damage Reduction
                </label>
                <SectionCostBadge
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
              />
              <p className="text-xs text-text-muted dark:text-text-secondary mt-1">Reduces physical damage taken</p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium text-text-secondary">
                  Agility Reduction
                </label>
                <SectionCostBadge
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
              />
              <p className="text-xs text-text-muted dark:text-text-secondary mt-1">Reduces Agility for wearing this armor</p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium text-text-secondary">
                  Critical Range Increase
                </label>
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
      )}

      {armamentType === 'Shield' && (
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
                  This shield can deal {shieldDamage.amount}d{shieldDamage.size} bludgeoning damage as a melee weapon
                  attack
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
      )}

      <CollapsibleSection
        title="Ability Requirement"
        collapsedSummary={abilityReqSummary}
        defaultExpanded={true}
        rightSlot={
          <SectionCostBadge
            ip={itemSectionCosts.abilityReq.totalIP}
            tp={itemSectionCosts.abilityReq.totalTP}
            currency={itemSectionCosts.abilityReq.totalCurrency}
          />
        }
      >
        <p className="text-sm text-text-secondary mb-4">
          Require a minimum Ability to use this {armamentType.toLowerCase()} effectively.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <select
              value={abilityRequirement?.id || ''}
              onChange={(e) => {
                if (!e.target.value) {
                  onAbilityRequirementChange(null);
                } else {
                  const reqs = armamentType === 'Armor' ? ARMOR_ABILITY_REQUIREMENTS : WEAPON_ABILITY_REQUIREMENTS;
                  const req = reqs.find((r) => r.id === parseInt(e.target.value));
                  if (req) {
                    onAbilityRequirementChange({ id: req.id, name: req.name, level: 1 });
                  }
                }
              }}
              className="w-full px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              aria-label="Ability requirement"
            >
              <option value="">None</option>
              {(armamentType === 'Armor' ? ARMOR_ABILITY_REQUIREMENTS : WEAPON_ABILITY_REQUIREMENTS).map((req) => (
                <option key={req.id} value={req.id}>
                  {req.label} ({req.name.replace(/Weapon |Armor /g, '').replace(' Requirement', '')})
                </option>
              ))}
            </select>
          </div>
          {abilityRequirement && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">Level:</span>
              <ValueStepper
                value={abilityRequirement.level}
                onChange={(v) => onAbilityRequirementChange((prev) => (prev ? { ...prev, level: v } : null))}
                min={1}
                max={6}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={`Properties (${selectedProperties.length})`}
        collapsedSummary={propertiesSummary}
        defaultExpanded={true}
        rightSlot={
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="flex items-center gap-1 bg-warning-600 hover:bg-warning-700 dark:bg-warning-700 dark:hover:bg-warning-600 text-text-on-dark"
            onClick={onAddProperty}
          >
            <Plus className="w-4 h-4" />
            Add Property
          </Button>
        }
      >
        {selectedProperties.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No properties added yet. Click &quot;Add Property&quot; to enhance your item.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedProperties.map((sp, idx) => (
              <PropertyCard
                key={idx}
                selectedProperty={sp}
                onRemove={() => onRemoveProperty(idx)}
                onUpdate={(updates) => onUpdateProperty(idx, updates)}
                allProperties={itemProperties}
                armamentType={armamentType}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>
    </>
  );
}
