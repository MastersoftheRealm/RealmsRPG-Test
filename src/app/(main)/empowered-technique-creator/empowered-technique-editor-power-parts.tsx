'use client';

import { Plus, Info } from 'lucide-react';
import { SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection, PowerPartCard } from '@/components/creator';
import { Button } from '@/components/ui';
import type { SelectedPowerPart } from './empowered-technique-bootstrap';
import type { EmpoweredTechniqueCreatorEditorProps } from './empowered-technique-editor-config';

export type EmpoweredTechniqueEditorPowerPartsProps = Pick<
  EmpoweredTechniqueCreatorEditorProps,
  | 'selectedPowerParts'
  | 'nonMechanicPowerParts'
  | 'onAddPowerPart'
  | 'onRemovePowerPart'
  | 'onUpdatePowerPart'
  | 'selectedPowerAdvancedParts'
  | 'powerMechanicsForList'
  | 'onAddPowerMechanicPart'
  | 'onRemovePowerAdvancedPart'
  | 'onUpdatePowerAdvancedPart'
  | 'sectionCosts'
>;

export function EmpoweredTechniqueEditorPowerParts({
  selectedPowerParts,
  nonMechanicPowerParts,
  onAddPowerPart,
  onRemovePowerPart,
  onUpdatePowerPart,
  selectedPowerAdvancedParts,
  powerMechanicsForList,
  onAddPowerMechanicPart,
  onRemovePowerAdvancedPart,
  onUpdatePowerAdvancedPart,
  sectionCosts,
}: EmpoweredTechniqueEditorPowerPartsProps) {
  const powerPartsSummary =
    selectedPowerParts.length > 0
      ? `${selectedPowerParts
          .slice(0, 3)
          .map((row) => row.part.name)
          .join(
            ', ',
          )}${selectedPowerParts.length > 3 ? ` +${selectedPowerParts.length - 3} more` : ''}`
      : 'No parts';
  const powerMechanicsSummary =
    selectedPowerAdvancedParts.length > 0
      ? `${selectedPowerAdvancedParts
          .slice(0, 3)
          .map((row) => row.part.name)
          .join(
            ', ',
          )}${selectedPowerAdvancedParts.length > 3 ? ` +${selectedPowerAdvancedParts.length - 3} more` : ''}`
      : 'No mechanics';

  return (
    <>
      <CollapsibleSection
        title={`Power Parts (${selectedPowerParts.length})`}
        collapsedSummary={powerPartsSummary}
        rightSlot={
          <>
            <SectionCostBadge
              en={sectionCosts.powerParts.energyRaw}
              tp={sectionCosts.powerParts.totalTP}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex min-h-[44px] items-center gap-1"
              onClick={onAddPowerPart}
            >
              <Plus className="h-4 w-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedPowerParts.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            <Info className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No power parts added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedPowerParts.map((selected, index) => (
              <PowerPartCard
                key={`power-part-${index}`}
                selectedPart={selected}
                _index={index}
                onRemove={() => onRemovePowerPart(index)}
                onUpdate={(updates) =>
                  onUpdatePowerPart(index, updates as Partial<SelectedPowerPart>)
                }
                allParts={nonMechanicPowerParts}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Power Mechanics (${selectedPowerAdvancedParts.length})`}
        collapsedSummary={powerMechanicsSummary}
        rightSlot={
          <>
            <SectionCostBadge
              en={sectionCosts.powerMechanics.energyRaw}
              tp={sectionCosts.powerMechanics.totalTP}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex min-h-[44px] items-center gap-1"
              onClick={onAddPowerMechanicPart}
            >
              <Plus className="h-4 w-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedPowerAdvancedParts.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            <Info className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No additional power mechanics added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedPowerAdvancedParts.map((selected, index) => (
              <PowerPartCard
                key={`power-mechanic-${index}`}
                selectedPart={selected}
                _index={index}
                onRemove={() => onRemovePowerAdvancedPart(index)}
                onUpdate={(updates) =>
                  onUpdatePowerAdvancedPart(index, updates as Partial<SelectedPowerPart>)
                }
                allParts={powerMechanicsForList}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>
    </>
  );
}
