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
import { isGeneralProperty } from '@/lib/calculators';
import { PROPERTY_IDS } from '@/lib/id-constants';
import { formatCost } from '@/lib/game/creator-constants';
import { rarityChipVariant } from '@/lib/chip/rarity-chip-variant';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import type {
  ArmamentType,
  ItemSelectedProperty as SelectedProperty,
} from './item-creator-bootstrap';

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

const RARITY_REFERENCE = [
  { name: 'Common', ipRange: '0 – 4', baseCost: 25 },
  { name: 'Uncommon', ipRange: '4 – 6', baseCost: 100 },
  { name: 'Rare', ipRange: '6 – 8', baseCost: 500 },
  { name: 'Epic', ipRange: '8 – 11', baseCost: 2500 },
  { name: 'Legendary', ipRange: '11 – 14', baseCost: 10000 },
  { name: 'Mythic', ipRange: '14 – 16', baseCost: 50000 },
  { name: 'Ascended', ipRange: '16+', baseCost: 100000 },
];

/** Route-local property row for the armament creator (not CodexPropertiesTab). */
export function PropertyCard({
  selectedProperty,
  onRemove,
  onUpdate,
  allProperties,
  armamentType,
}: {
  selectedProperty: SelectedProperty;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedProperty>) => void;
  allProperties: ItemProperty[];
  armamentType: ArmamentType;
}) {
  const [expanded, setExpanded] = useState(true);
  const { property } = selectedProperty;

  const selectableProperties = useMemo(() => {
    const armamentTypeLower = armamentType.toLowerCase();
    return allProperties
      .filter((p) => {
        if (isGeneralProperty(p)) return false;
        const propType = (p.type || '').toLowerCase();
        if (!propType || propType === 'general') return true;
        return propType === armamentTypeLower;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allProperties, armamentType]);

  const propIP =
    ((property.base_ip as number | undefined) || 0) +
    ((property.op_1_ip as number | undefined) || 0) * selectedProperty.op_1_lvl;
  const propTP =
    (property.base_tp || property.tp_cost || 0) +
    (property.op_1_tp || 0) * selectedProperty.op_1_lvl;

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
          <span className="flex flex-shrink-0 items-center gap-2 text-sm font-semibold">
            {propIP > 0 && <span className="text-ip-text">IP: {formatCost(propIP)}</span>}
            {propTP > 0 && <span className="text-tp-text">TP: {formatCost(propTP)}</span>}
            {(property.base_c || (property.op_1_c && selectedProperty.op_1_lvl > 0)) && (
              <span className="text-currency-text">
                C:{' '}
                {formatCost(
                  (property.base_c || 0) + (property.op_1_c || 0) * selectedProperty.op_1_lvl,
                )}
              </span>
            )}
          </span>
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
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-text-primary"
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
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-tp-text">Option</span>
                  {property.op_1_tp && (
                    <span className="text-sm font-medium text-tp-text">
                      TP +{formatCost(property.op_1_tp)}/level
                    </span>
                  )}
                  {property.op_1_c && (
                    <span className="text-sm font-medium text-currency-text">
                      C +{formatCost(property.op_1_c)}/level
                    </span>
                  )}
                </div>
                <ValueStepper
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
            IP (Item Power) determines rarity. Currency cost = Base Cost × (1 + 0.125 × C
            multiplier)
          </p>
          <TableScroll>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="py-1 text-left font-medium text-text-secondary">Rarity</th>
                  <th className="py-1 text-right font-medium text-text-secondary">IP Range</th>
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
                    <td className="py-1.5 text-right text-text-secondary">{r.ipRange}</td>
                    <td className="py-1.5 text-right text-currency-text">
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
