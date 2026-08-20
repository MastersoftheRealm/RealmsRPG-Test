/**
 * Item Creator — ability requirement + properties sections (TASK-616)
 */

'use client';

import { Plus, Info } from 'lucide-react';
import type { ItemProperty } from '@/hooks';
import { ValueStepper, SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection } from '@/components/creator';
import { Button } from '@/components/ui';
import type {
  ArmamentType,
  ItemSelectedProperty as SelectedProperty,
} from './item-creator-bootstrap';
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
      | ((
          prev: { id: number; name: string; level: number } | null,
        ) => { id: number; name: string; level: number } | null),
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
        <p className="mb-4 text-sm text-text-secondary">
          Require a minimum Ability to use this {armamentType.toLowerCase()} effectively.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[200px] flex-1">
            <select
              value={abilityRequirement?.id || ''}
              onChange={(e) => {
                if (!e.target.value) {
                  onAbilityRequirementChange(null);
                } else {
                  const reqs =
                    armamentType === 'Armor'
                      ? ARMOR_ABILITY_REQUIREMENTS
                      : WEAPON_ABILITY_REQUIREMENTS;
                  const req = reqs.find((r) => r.id === parseInt(e.target.value));
                  if (req) {
                    onAbilityRequirementChange({ id: req.id, name: req.name, level: 1 });
                  }
                }
              }}
              className="touch-tier-standard w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
              aria-label="Ability requirement"
            >
              <option value="">None</option>
              {(armamentType === 'Armor'
                ? ARMOR_ABILITY_REQUIREMENTS
                : WEAPON_ABILITY_REQUIREMENTS
              ).map((req) => (
                <option key={req.id} value={req.id}>
                  {req.label} ({req.name.replace(/Weapon |Armor /g, '').replace(' Requirement', '')}
                  )
                </option>
              ))}
            </select>
          </div>
          {abilityRequirement && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">Level:</span>
              <ValueStepper
                value={abilityRequirement.level}
                onChange={(v) =>
                  onAbilityRequirementChange((prev) => (prev ? { ...prev, level: v } : null))
                }
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
            className="flex items-center gap-1 bg-warning-600 text-text-on-dark hover:bg-warning-700 dark:bg-warning-700 dark:hover:bg-warning-600"
            onClick={onAddProperty}
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        }
      >
        {selectedProperties.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            <Info className="mx-auto mb-2 h-12 w-12 opacity-50" />
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
