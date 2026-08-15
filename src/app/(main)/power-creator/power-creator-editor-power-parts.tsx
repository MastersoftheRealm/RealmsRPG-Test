/**
 * Power Creator — parts + mechanics sections (TASK-616)
 */

'use client';

import { Plus, Info } from 'lucide-react';
import type { PowerPart } from '@/hooks';
import { SectionCostBadge } from '@/components/shared';
import { CollapsibleSection, PowerPartCard } from '@/components/creator';
import { Button } from '@/components/ui';
import type { SelectedPart, AdvancedPart } from './power-creator-types';
import type { PowerSectionCosts } from './power-creator-cost-derivation';
import { PowerCreatorHelp } from './power-creator-help';

type PowerCreatorEditorPowerPartsProps = {
  selectedParts: SelectedPart[];
  nonMechanicParts: PowerPart[];
  powerPartsSummary: string;
  onAddPart: () => void;
  onRemovePart: (index: number) => void;
  onUpdatePart: (index: number, updates: Partial<SelectedPart>) => void;
  selectedAdvancedParts: AdvancedPart[];
  mechanicPartsForList: PowerPart[];
  powerMechanicsSummary: string;
  onAddMechanicPart: () => void;
  onRemoveAdvancedPart: (index: number) => void;
  onUpdateAdvancedPart: (index: number, updates: Partial<AdvancedPart>) => void;
  sectionCosts: PowerSectionCosts;
};

export function PowerCreatorEditorPowerParts({
  selectedParts,
  nonMechanicParts,
  powerPartsSummary,
  onAddPart,
  onRemovePart,
  onUpdatePart,
  selectedAdvancedParts,
  mechanicPartsForList,
  powerMechanicsSummary,
  onAddMechanicPart,
  onRemoveAdvancedPart,
  onUpdateAdvancedPart,
  sectionCosts,
}: PowerCreatorEditorPowerPartsProps) {
  return (
    <>
      <CollapsibleSection
        title={`Power Parts (${selectedParts.length})`}
        collapsedSummary={powerPartsSummary}
        titleAddon={<PowerCreatorHelp topic="parts" />}
        rightSlot={
          <>
            <SectionCostBadge en={sectionCosts.powerParts.energyRaw} tp={sectionCosts.powerParts.totalTP} />
            <Button type="button" variant="primary" size="sm" className="flex items-center gap-1" onClick={onAddPart}>
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No parts added yet. Click &quot;Add Part&quot; to begin building your power.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedParts.map((sp, idx) => (
              <PowerPartCard
                key={idx}
                selectedPart={sp}
                _index={idx}
                onRemove={() => onRemovePart(idx)}
                onUpdate={(updates) => onUpdatePart(idx, updates as Partial<SelectedPart>)}
                allParts={nonMechanicParts}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Power Mechanics (${selectedAdvancedParts.length})`}
        collapsedSummary={powerMechanicsSummary}
        titleAddon={<PowerCreatorHelp topic="mechanics" />}
        rightSlot={
          <>
            <SectionCostBadge en={sectionCosts.powerMechanics.energyRaw} tp={sectionCosts.powerMechanics.totalTP} />
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex items-center gap-1"
              onClick={onAddMechanicPart}
            >
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedAdvancedParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>
              No mechanics added yet. Click &quot;Add Part&quot; to add range, area, duration adjustments, and other
              mechanic parts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedAdvancedParts.map((sp, idx) => (
              <PowerPartCard
                key={idx}
                selectedPart={sp}
                _index={idx}
                onRemove={() => onRemoveAdvancedPart(idx)}
                onUpdate={(updates) => onUpdateAdvancedPart(idx, updates as Partial<AdvancedPart>)}
                allParts={mechanicPartsForList}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>
    </>
  );
}
