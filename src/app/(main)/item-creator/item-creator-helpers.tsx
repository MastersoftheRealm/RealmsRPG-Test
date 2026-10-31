/**
 * Item Creator — helpers (TASK-381 Phase 1)
 * =========================================
 * Property card, rarity reference, and armament-type constants.
 */

'use client';

import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, Shield, Sword, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemProperty } from '@/hooks';
import { ValueStepper } from '@/components/patterns';
import { IconButton, Card, TableScroll, DescriptorChip } from '@/components/ui';
import { isGeneralProperty, isMechanicProperty } from '@/lib/calculators';
import { PROPERTY_IDS } from '@/lib/id-constants';
import { formatCost, WEAPON_RANGE_TYPES } from '@/lib/game/creator-constants';
import { formatWeaponRangeConfig, type WeaponRangeType } from '@/lib/calculators';
import { rarityChipVariant } from '@/lib/chip/rarity-chip-variant';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import type {
  ArmamentType,
  ItemSelectedProperty as SelectedProperty,
} from './item-creator-bootstrap';
import {
  propertyMatchesArmamentType,
  propertyOptionsForCard,
} from './item-creator-property-options';

export const ARMAMENT_TYPES: { value: ArmamentType; label: string; icon: typeof Sword }[] = [
  { value: 'Weapon', label: 'Weapon', icon: Sword },
  { value: 'Armor', label: 'Armor', icon: Shield },
  { value: 'Shield', label: 'Shield', icon: Shield },
];

export const WEAPON_ABILITY_REQUIREMENTS = [
  {
    id: PROPERTY_IDS.WEAPON_STRENGTH_REQUIREMENT,
    name: 'Weapon Strength Requirement',
    label: 'STR',
  },
  { id: PROPERTY_IDS.WEAPON_AGILITY_REQUIREMENT, name: 'Weapon Agility Requirement', label: 'AGI' },
  {
    id: PROPERTY_IDS.WEAPON_VITALITY_REQUIREMENT,
    name: 'Weapon Vitality Requirement',
    label: 'VIT',
  },
  { id: PROPERTY_IDS.WEAPON_ACUITY_REQUIREMENT, name: 'Weapon Acuity Requirement', label: 'ACU' },
  {
    id: PROPERTY_IDS.WEAPON_INTELLIGENCE_REQUIREMENT,
    name: 'Weapon Intelligence Requirement',
    label: 'INT',
  },
  {
    id: PROPERTY_IDS.WEAPON_CHARISMA_REQUIREMENT,
    name: 'Weapon Charisma Requirement',
    label: 'CHA',
  },
];

export const ARMOR_ABILITY_REQUIREMENTS = [
  { id: PROPERTY_IDS.ARMOR_STRENGTH_REQUIREMENT, name: 'Armor Strength Requirement', label: 'STR' },
  { id: PROPERTY_IDS.ARMOR_AGILITY_REQUIREMENT, name: 'Armor Agility Requirement', label: 'AGI' },
  { id: PROPERTY_IDS.ARMOR_VITALITY_REQUIREMENT, name: 'Armor Vitality Requirement', label: 'VIT' },
];

/**
 * Currency Range is the written band from GAME_RULES (Rarity & Currency).
 * IP Range stays the creator's existing display; those bands are not written there.
 */
export const RARITY_REFERENCE = [
  { name: 'Common', ipRange: '0 – 4', baseCost: 25, currencyRange: '0–99' },
  { name: 'Uncommon', ipRange: '4 – 6', baseCost: 100, currencyRange: '100–499' },
  { name: 'Rare', ipRange: '6 – 8', baseCost: 500, currencyRange: '500–1,499' },
  { name: 'Epic', ipRange: '8 – 11', baseCost: 1500, currencyRange: '1,500–9,999' },
  { name: 'Legendary', ipRange: '11 – 14', baseCost: 10000, currencyRange: '10,000–49,999' },
  { name: 'Mythic', ipRange: '14 – 16', baseCost: 50000, currencyRange: '50,000–99,999' },
  { name: 'Ascended', ipRange: '16+', baseCost: 100000, currencyRange: '100,000+' },
];

export type PropertyCostKind = 'IP' | 'TP' | 'C';

/** Missing values are 0. A real 0 stays 0. A negative stays negative. */
function finitePropertyCost(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function propertyPointTotal(base: unknown, perLevel: unknown, level: number): number {
  return finitePropertyCost(base) + finitePropertyCost(perLevel) * level;
}

/** base_tp of 0 falls through to legacy tp_cost, matching the previous card total. */
function propertyTrainingPointTotal(
  property: {
    base_tp?: number | null | undefined;
    tp_cost?: number | null | undefined;
    op_1_tp?: number | null | undefined;
  },
  level: number,
): number {
  const baseTp = finitePropertyCost(property.base_tp);
  const base = baseTp !== 0 ? baseTp : finitePropertyCost(property.tp_cost);
  return base + finitePropertyCost(property.op_1_tp) * level;
}

/** Header total. Zero is omitted so a negative-IP property does not show "TP: 0" or "C: 0". */
export function formatPropertyHeaderCost(kind: PropertyCostKind, value: number): string | null {
  if (value === 0) return null;
  return `${kind}: ${formatCost(value)}`;
}

/** Per-level cost. Zero is omitted. Positive keeps the existing "+" prefix. */
export function formatPropertyPerLevelCost(
  kind: PropertyCostKind,
  perLevel: unknown,
): string | null {
  const n = finitePropertyCost(perLevel);
  if (n === 0) return null;
  if (n > 0) return `${kind} +${formatCost(n)}/level`;
  return `${kind} ${formatCost(n)}/level`;
}

function propertyHeaderCostClass(kind: PropertyCostKind): string {
  if (kind === 'IP') return 'text-ip-text';
  if (kind === 'TP') return 'text-tp-text';
  return 'text-currency-text';
}

/** Melee already names its type. Reach, Ranged, and Thrown need the type beside the distance. */
export function formatItemCreatorRangeDisplay(type: WeaponRangeType, spaces: number): string {
  const distance = formatWeaponRangeConfig({ type, spaces });
  if (type === 'melee') return distance;
  const label = WEAPON_RANGE_TYPES.find((entry) => entry.value === type)?.label;
  return label ? `${label}, ${distance}` : distance;
}

/** Collapsed armor header. A zero Agility Reduction is omitted ("AGI -0"). */
export function formatArmorConfigCollapsedSummary(
  damageReduction: number,
  agilityReduction: number,
  criticalRangeIncrease: number,
): string {
  const parts = [`DR ${damageReduction}`];
  if (agilityReduction > 0) parts.push(`AGI -${agilityReduction}`);
  parts.push(`Crit +${criticalRangeIncrease}`);
  return parts.join(', ');
}

/** Route-local property row for the armament creator (not CodexPropertiesTab). */
export function PropertyCard({
  selectedProperty,
  onRemove,
  onUpdate,
  allProperties,
  armamentType,
  otherSelectedIds,
}: {
  selectedProperty: SelectedProperty;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedProperty>) => void;
  allProperties: ItemProperty[];
  armamentType: ArmamentType;
  otherSelectedIds: readonly (string | number)[];
}) {
  const [expanded, setExpanded] = useState(true);
  const { property } = selectedProperty;

  const selectableProperties = useMemo(() => {
    const forType = allProperties
      .filter((p) => {
        if (isGeneralProperty(p)) return false;
        if (isMechanicProperty(p)) return false;
        return propertyMatchesArmamentType(p.type, armamentType);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return propertyOptionsForCard(forType, property.id, otherSelectedIds);
  }, [allProperties, armamentType, property.id, otherSelectedIds]);

  const level = selectedProperty.op_1_lvl;
  const propIP = propertyPointTotal(property.base_ip, property.op_1_ip, level);
  const propTP = propertyTrainingPointTotal(property, level);
  const propC = propertyPointTotal(property.base_c, property.op_1_c, level);
  const headerCosts = (
    [
      ['IP', propIP],
      ['TP', propTP],
      ['C', propC],
    ] as const
  )
    .map(([kind, value]) => {
      const label = formatPropertyHeaderCost(kind, value);
      return label ? { kind, label } : null;
    })
    .filter((entry) => entry != null);
  const perLevelCosts = (
    [
      ['IP', property.op_1_ip],
      ['TP', property.op_1_tp],
      ['C', property.op_1_c],
    ] as const
  )
    .map(([kind, value]) => {
      const label = formatPropertyPerLevelCost(kind, value);
      return label ? { kind, label } : null;
    })
    .filter((entry) => entry != null);

  const hasOption = property.op_1_desc && property.op_1_desc.trim() !== '';

  return (
    <div className="overflow-hidden rounded-lg border border-border-light bg-surface shadow-sm">
      <div className="flex items-center justify-between bg-surface-alt px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="-ml-2 flex min-w-0 flex-1 items-center gap-2 rounded py-1 pl-2 text-left transition-colors hover:bg-surface-alt/80"
        >
          <span className="text-text-muted">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </span>
          <span className="truncate font-medium text-text-primary">{property.name}</span>
          {headerCosts.length > 0 && (
            <span className="flex flex-shrink-0 items-center gap-2 text-sm font-semibold">
              {headerCosts.map((cost) => (
                <span key={cost.kind} className={propertyHeaderCostClass(cost.kind)}>
                  {cost.label}
                </span>
              ))}
            </span>
          )}
        </button>
        <IconButton onClick={onRemove} label="Remove property" variant="danger" size="sm">
          <X className="h-5 w-5" />
        </IconButton>
      </div>

      {expanded && (
        <div className="space-y-4 px-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Property</label>
            <select
              value={selectableProperties.findIndex((p) => p.id === property.id)}
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                const newProp = selectableProperties[idx];
                if (newProp) {
                  onUpdate({ property: newProp, op_1_lvl: 0 });
                }
              }}
              className="touch-tier-standard w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary"
              aria-label="Property"
            >
              {selectableProperties.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-base leading-relaxed text-text-primary">{property.description}</p>

          {hasOption && (
            <div className={cn('rounded-lg p-3', statusPanel.warning)}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold whitespace-nowrap text-tp-text">
                    Option
                  </span>
                  {perLevelCosts.map((cost) => (
                    <span
                      key={cost.kind}
                      className={cn(
                        'text-sm font-medium whitespace-nowrap',
                        propertyHeaderCostClass(cost.kind),
                      )}
                    >
                      {cost.label}
                    </span>
                  ))}
                </div>
                <ValueStepper
                  className="shrink-0"
                  value={selectedProperty.op_1_lvl}
                  onChange={(v) => onUpdate({ op_1_lvl: v })}
                  label="Level:"
                  min={0}
                />
              </div>
              <p className="text-sm text-text-primary">{property.op_1_desc}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RarityReferenceTable({ currentIP }: { currentIP: number }) {
  const [expanded, setExpanded] = useState(false);

  const getCurrentRarity = () => {
    if (currentIP <= 4) return 'Common';
    if (currentIP <= 6) return 'Uncommon';
    if (currentIP <= 8) return 'Rare';
    if (currentIP <= 11) return 'Epic';
    if (currentIP <= 14) return 'Legendary';
    if (currentIP <= 16) return 'Mythic';
    return 'Ascended';
  };
  const currentRarity = getCurrentRarity();

  return (
    <Card className="overflow-hidden p-0 shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between bg-surface-alt px-4 py-3 text-text-primary transition-colors hover:bg-surface-alt/80"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-ip-text" />
          <span className="font-medium text-text-primary">Rarity Reference</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="p-4">
          <p className="mb-3 text-xs text-text-muted">
            Item Point (IP) determines rarity. Currency cost = Base Cost × (1 + 0.125 × C
            multiplier)
          </p>
          <TableScroll>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="py-1 text-left font-medium text-text-secondary">Rarity</th>
                  <th className="py-1 text-right font-medium text-text-secondary">IP Range</th>
                  <th className="py-1 text-right font-medium text-text-secondary">
                    Currency Range
                  </th>
                  <th className="py-1 text-right font-medium text-text-secondary">Base Currency</th>
                </tr>
              </thead>
              <tbody>
                {RARITY_REFERENCE.map((r) => (
                  <tr
                    key={r.name}
                    className={cn(
                      'border-b border-border-light last:border-0',
                      currentRarity === r.name && 'font-semibold',
                    )}
                  >
                    <td className="py-1.5">
                      <DescriptorChip variant={rarityChipVariant(r.name)} size="sm">
                        {r.name}
                      </DescriptorChip>
                      {currentRarity === r.name && (
                        <span className="ml-1 text-xs text-ip-text">← Current</span>
                      )}
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap text-text-secondary">
                      {r.ipRange}
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap text-text-secondary">
                      {r.currencyRange}
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap text-currency-text">
                      {r.baseCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </div>
      )}
    </Card>
  );
}
