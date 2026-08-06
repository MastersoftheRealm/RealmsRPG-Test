/**
 * Item Creator — ability requirement + properties sections (TASK-616)
 */

'use client';

import { Plus, Info } from 'lucide-react';
import type { ItemProperty } from '@/hooks';
import { ValueStepper, SectionCostBadge } from '@/components/shared';
import { CollapsibleSection } from '@/components/creator';
import { Button } from '@/components/ui';
import type { ArmamentType, ItemSelectedProperty as SelectedProperty } from './item-creator-bootstrap';
import {
  WEAPON_ABILITY_REQUIREMENTS,
  ARMOR_ABILITY_REQUIREMENTS,
  PropertyCard,
} from './item-creator-helpers';
import type { ItemSectionCosts } from './item-creator-cost-derivation';

type ItemCreatorEditorAbilityPropertiesProps = {
  armamentType: ArmamentType;
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

export function ItemCreatorEditorAbilityProperties({
  armamentType,
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
}: ItemCreatorEditorAbilityPropertiesProps) {
  return (
    <>
      <CollapsibleSection
        title="Ability Requirement"
        collapsedSummary={abilityReqSummary}
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
