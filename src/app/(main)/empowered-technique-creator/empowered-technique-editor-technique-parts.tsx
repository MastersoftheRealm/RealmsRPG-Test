'use client';

import { Plus, Info } from 'lucide-react';
import { ValueStepper, SectionCostBadge } from '@/components/patterns';
import { CollapsibleSection, PowerPartCard } from '@/components/creator';
import { Button } from '@/components/ui';
import { DIE_SIZES } from '@/lib/game/creator-constants';
import { formatAttackModeCanTargetHint } from '@/lib/game/targeted-defenses';
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
  | 'attackMode'
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
  attackMode,
}: EmpoweredTechniqueEditorTechniquePartsProps) {
  const extraDamageTargetHint = formatAttackModeCanTargetHint(attackMode);
  const techniquePartsSummary =
    selectedTechniqueParts.length > 0
      ? `${selectedTechniqueParts
          .slice(0, 3)
          .map((row) => row.part.name)
          .join(
            ', ',
          )}${selectedTechniqueParts.length > 3 ? ` +${selectedTechniqueParts.length - 3} more` : ''}`
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
            <Button type="button" variant="primary" size="sm" onClick={onAddTechniquePart}>
              <Plus className="h-4 w-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedTechniqueParts.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            <Info className="mx-auto mb-2 h-12 w-12 opacity-50" />
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
        <p className="mb-4 text-sm text-text-secondary">
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
            <span className="text-lg font-bold">d</span>
            <select
              value={techniqueDamage.size}
              onChange={(event) =>
                onTechniqueDamageChange((previous) => ({
                  ...previous,
                  size: Number(event.target.value),
                }))
              }
              className="touch-tier-standard rounded-lg border border-border-light bg-surface px-3 py-2 text-text-primary"
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
        {extraDamageTargetHint ? (
          <p className="mt-2 text-sm text-text-muted">{extraDamageTargetHint}</p>
        ) : null}
      </CollapsibleSection>
    </>
  );
}
