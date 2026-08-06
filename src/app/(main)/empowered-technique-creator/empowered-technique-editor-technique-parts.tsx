'use client';

import { Plus, Info } from 'lucide-react';
import { ValueStepper, SectionCostBadge } from '@/components/shared';
import { CollapsibleSection, PowerPartCard } from '@/components/creator';
import { Button } from '@/components/ui';
import { DIE_SIZES } from '@/lib/game/creator-constants';
import type { SelectedTechniquePart } from './empowered-technique-bootstrap';
import type { EmpoweredTechniqueCreatorEditorProps } from './empowered-technique-editor-config';

export type EmpoweredTechniqueEditorTechniquePartsProps = Pick<
  EmpoweredTechniqueCreatorEditorProps,
  | 'selectedTechniqueParts'
  | 'nonMechanicTechniqueParts'
  | 'onAddTechniquePart'
  | 'onRemoveTechniquePart'
  | 'onUpdateTechniquePart'
  | 'techniqueDamage'
  | 'onTechniqueDamageChange'
  | 'techniqueDamageSummary'
  | 'sectionCosts'
>;

export function EmpoweredTechniqueEditorTechniqueParts({
  selectedTechniqueParts,
  nonMechanicTechniqueParts,
  onAddTechniquePart,
  onRemoveTechniquePart,
  onUpdateTechniquePart,
  techniqueDamage,
  onTechniqueDamageChange,
  techniqueDamageSummary,
  sectionCosts,
}: EmpoweredTechniqueEditorTechniquePartsProps) {
  const techniquePartsSummary =
    selectedTechniqueParts.length > 0
      ? `${selectedTechniqueParts
          .slice(0, 3)
          .map((row) => row.part.name)
          .join(', ')}${selectedTechniqueParts.length > 3 ? ` +${selectedTechniqueParts.length - 3} more` : ''}`
      : 'No parts';

  return (
    <>
      <CollapsibleSection
        title={`Technique Parts (${selectedTechniqueParts.length})`}
        collapsedSummary={techniquePartsSummary}
        rightSlot={
          <>
            <SectionCostBadge
              en={sectionCosts.techniqueParts.energyRaw}
              tp={sectionCosts.techniqueParts.totalTP}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex items-center gap-1 min-h-[44px]"
              onClick={onAddTechniquePart}
            >
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedTechniqueParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No technique parts added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedTechniqueParts.map((selected, index) => (
              <PowerPartCard
                key={`technique-part-${index}`}
                selectedPart={{ ...selected, applyDuration: false }}
                _index={index}
                onRemove={() => onRemoveTechniquePart(index)}
                onUpdate={(updates) =>
                  onUpdateTechniquePart(index, updates as Partial<SelectedTechniquePart>)
                }
                allParts={nonMechanicTechniqueParts}
                showApplyDuration={false}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Additional Damage (Technique)"
        collapsedSummary={techniqueDamageSummary}
        rightSlot={
          <SectionCostBadge
            en={sectionCosts.techniqueDamage.energyRaw}
            tp={sectionCosts.techniqueDamage.totalTP}
          />
        }
      >
        <p className="text-sm text-text-secondary mb-4">
          This is the technique additional-damage mechanic (separate from power Add Damage).
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <ValueStepper
            value={techniqueDamage.amount}
            onChange={(value) =>
              onTechniqueDamageChange((previous) => ({ ...previous, amount: value }))
            }
            label="Dice:"
            min={0}
            max={20}
          />
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg">d</span>
            <select
              value={techniqueDamage.size}
              onChange={(event) =>
                onTechniqueDamageChange((previous) => ({
                  ...previous,
                  size: Number(event.target.value),
                }))
              }
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
              aria-label="Technique additional damage die size"
            >
              {DIE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
