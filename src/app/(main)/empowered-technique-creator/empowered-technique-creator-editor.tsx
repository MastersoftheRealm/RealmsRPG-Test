/**
 * Empowered Technique Creator — editor section islands (TASK-381 Phase 4)
 * =======================================================================
 * Presentational form sections. State, cost math, save/load, and
 * CreatorPageShell stay in page.tsx.
 */

'use client';

import { Plus, Info } from 'lucide-react';
import type { PowerPart, TechniquePart } from '@/hooks';
import { ValueStepper, SectionCostBadge, RealmsImageField } from '@/components/shared';
import {
  CollapsibleSection,
  PowerPartCard,
} from '@/components/creator';
import { Button, Checkbox, Input, Textarea, Card } from '@/components/ui';
import {
  formatAreaForDisplay,
  formatDurationFromTypeAndValue,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import {
  ACTION_OPTIONS,
  AREA_TYPES,
  DIE_SIZES,
  DURATION_TYPES,
  DURATION_VALUES,
  POWER_DAMAGE_TYPES,
} from '@/lib/game/creator-constants';
import { ATTACK_MODE_SELECT_OPTIONS, attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';
import type {
  EmpoweredDamageConfig as DamageConfig,
  EmpoweredRangeConfig as RangeConfig,
  SelectedPowerPart,
  SelectedTechniquePart,
} from './empowered-technique-bootstrap';

type SectionCostSlice = {
  energyRaw: number;
  totalTP: number;
};

type EmpoweredSectionCosts = {
  action: SectionCostSlice;
  weapon: SectionCostSlice;
  range: SectionCostSlice;
  area: SectionCostSlice;
  duration: SectionCostSlice;
  powerDamage: SectionCostSlice;
  powerParts: SectionCostSlice;
  powerMechanics: SectionCostSlice;
  techniqueParts: SectionCostSlice;
  techniqueDamage: SectionCostSlice;
};

type EmpoweredTechniqueCreatorEditorProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;

  actionDisplay: string;
  actionType: string;
  onActionTypeChange: (value: string) => void;
  isReaction: boolean;
  onIsReactionChange: (value: boolean) => void;
  attackMode: AttackMode;
  onAttackModeChange: (mode: AttackMode) => void;

  rangeDisplay: string;
  range: RangeConfig;
  onRangeStepsChange: (steps: number) => void;
  area: AreaConfig;
  onAreaChange: (updater: (prev: AreaConfig) => AreaConfig) => void;
  duration: DurationConfig;
  onDurationChange: (updater: (prev: DurationConfig) => DurationConfig) => void;
  onDurationTypeChange: (nextType: DurationConfig['type']) => void;

  powerDamages: DamageConfig[];
  onPowerDamagesChange: (updater: (prev: DamageConfig[]) => DamageConfig[]) => void;
  powerDamageSummary: string;

  selectedPowerParts: SelectedPowerPart[];
  nonMechanicPowerParts: PowerPart[];
  onAddPowerPart: () => void;
  onRemovePowerPart: (index: number) => void;
  onUpdatePowerPart: (index: number, updates: Partial<SelectedPowerPart>) => void;

  selectedPowerAdvancedParts: SelectedPowerPart[];
  powerMechanicsForList: PowerPart[];
  onAddPowerMechanicPart: () => void;
  onRemovePowerAdvancedPart: (index: number) => void;
  onUpdatePowerAdvancedPart: (index: number, updates: Partial<SelectedPowerPart>) => void;

  selectedTechniqueParts: SelectedTechniquePart[];
  nonMechanicTechniqueParts: TechniquePart[];
  onAddTechniquePart: () => void;
  onRemoveTechniquePart: (index: number) => void;
  onUpdateTechniquePart: (index: number, updates: Partial<SelectedTechniquePart>) => void;

  techniqueDamage: { amount: number; size: number };
  onTechniqueDamageChange: (updater: (prev: { amount: number; size: number }) => { amount: number; size: number }) => void;
  techniqueDamageSummary: string;

  sectionCosts: EmpoweredSectionCosts;
};

export function EmpoweredTechniqueCreatorEditor({
  isAdmin,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  imageId,
  imageUrl,
  onImageChange,
  actionDisplay,
  actionType,
  onActionTypeChange,
  isReaction,
  onIsReactionChange,
  attackMode,
  onAttackModeChange,
  rangeDisplay,
  range,
  onRangeStepsChange,
  area,
  onAreaChange,
  duration,
  onDurationChange,
  onDurationTypeChange,
  powerDamages,
  onPowerDamagesChange,
  powerDamageSummary,
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
  selectedTechniqueParts,
  nonMechanicTechniqueParts,
  onAddTechniquePart,
  onRemoveTechniquePart,
  onUpdateTechniquePart,
  techniqueDamage,
  onTechniqueDamageChange,
  techniqueDamageSummary,
  sectionCosts,
}: EmpoweredTechniqueCreatorEditorProps) {
  const powerConfigSummary = `${rangeDisplay} • ${area.type === 'none' ? 'Single target' : formatAreaForDisplay(area.type, area.level)} • ${duration.type === 'instant' ? 'Instant' : formatDurationFromTypeAndValue(duration.type, duration.value)}`;
  const powerPartsSummary =
    selectedPowerParts.length > 0
      ? `${selectedPowerParts
          .slice(0, 3)
          .map((row) => row.part.name)
          .join(', ')}${selectedPowerParts.length > 3 ? ` +${selectedPowerParts.length - 3} more` : ''}`
      : 'No parts';
  const powerMechanicsSummary =
    selectedPowerAdvancedParts.length > 0
      ? `${selectedPowerAdvancedParts
          .slice(0, 3)
          .map((row) => row.part.name)
          .join(', ')}${selectedPowerAdvancedParts.length > 3 ? ` +${selectedPowerAdvancedParts.length - 3} more` : ''}`
      : 'No mechanics';
  const techniquePartsSummary =
    selectedTechniqueParts.length > 0
      ? `${selectedTechniqueParts
          .slice(0, 3)
          .map((row) => row.part.name)
          .join(', ')}${selectedTechniqueParts.length > 3 ? ` +${selectedTechniqueParts.length - 3} more` : ''}`
      : 'No parts';

  return (
    <>
      <Card className="shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Empowered Technique Name *
          </label>
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Enter empowered technique name..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={3}
            placeholder="Describe your empowered technique..."
          />
        </div>
        {isAdmin && (
          <RealmsImageField
            categories="empowered-technique"
            imageId={imageId}
            imageUrl={imageUrl}
            onChange={onImageChange}
            entityName={name}
            label="Empowered technique card art"
            hint="Uploads are tagged for both power and technique browsing."
          />
        )}
      </Card>

      <CollapsibleSection
        title="Shared Action Profile"
        collapsedSummary={`${actionDisplay} • ${attackModeColumnLabel(attackMode)}`}
        defaultExpanded={true}
        rightSlot={
          <>
            <SectionCostBadge en={sectionCosts.action.energyRaw} tp={sectionCosts.action.totalTP} />
            <SectionCostBadge en={sectionCosts.weapon.energyRaw} tp={sectionCosts.weapon.totalTP} />
          </>
        }
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Action Type</label>
            <select
              value={actionType}
              onChange={(event) => onActionTypeChange(event.target.value)}
              className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
              aria-label="Empowered technique action type"
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="empowered-attack-mode"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Attack
            </label>
            <select
              id="empowered-attack-mode"
              value={attackMode}
              onChange={(event) => onAttackModeChange(event.target.value as AttackMode)}
              className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
              aria-label="Empowered technique attack mode"
            >
              {ATTACK_MODE_SELECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Checkbox
            checked={isReaction}
            onChange={(event) => onIsReactionChange(event.target.checked)}
            label="Can be used as a Reaction"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Power Configuration"
        collapsedSummary={powerConfigSummary}
        defaultExpanded={true}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <SectionCostBadge en={sectionCosts.range.energyRaw} tp={sectionCosts.range.totalTP} />
            <ValueStepper
              value={range.steps}
              onChange={onRangeStepsChange}
              label="Range:"
              min={0}
              max={10}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <SectionCostBadge en={sectionCosts.area.energyRaw} tp={sectionCosts.area.totalTP} />
            <select
              value={area.type}
              onChange={(event) =>
                onAreaChange((previous) => ({
                  ...previous,
                  type: event.target.value as AreaConfig['type'],
                }))
              }
              className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
              aria-label="Empowered technique area type"
            >
              {AREA_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {area.type !== 'none' && (
              <>
                <ValueStepper
                  value={area.level}
                  onChange={(value) => onAreaChange((previous) => ({ ...previous, level: value }))}
                  label="Area Level:"
                  min={1}
                  max={10}
                />
                <Checkbox
                  checked={area.applyDuration ?? false}
                  onChange={(event) =>
                    onAreaChange((previous) => ({
                      ...previous,
                      applyDuration: event.target.checked,
                    }))
                  }
                  label="Apply duration"
                />
              </>
            )}
          </div>
          <div className="space-y-3 pt-2 border-t border-border-light">
            <div className="flex flex-wrap items-center gap-4">
              <SectionCostBadge en={sectionCosts.duration.energyRaw} tp={sectionCosts.duration.totalTP} />
              <select
                value={duration.type}
                onChange={(event) =>
                  onDurationTypeChange(event.target.value as DurationConfig['type'])
                }
                className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
                aria-label="Empowered technique duration type"
              >
                {DURATION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {duration.type !== 'instant' &&
                duration.type !== 'permanent' &&
                DURATION_VALUES[duration.type] && (
                  <select
                    value={duration.value}
                    onChange={(event) =>
                      onDurationChange((previous) => ({
                        ...previous,
                        value: Number(event.target.value),
                      }))
                    }
                    className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
                    aria-label="Empowered technique duration value"
                  >
                    {DURATION_VALUES[duration.type].map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
            </div>
            {duration.type !== 'instant' && (
              <div className="flex flex-wrap items-center gap-4">
                <Checkbox
                  checked={duration.focus || false}
                  onChange={(event) =>
                    onDurationChange((previous) => ({
                      ...previous,
                      focus: event.target.checked,
                    }))
                  }
                  label="Focus"
                />
                <Checkbox
                  checked={duration.noHarm || false}
                  onChange={(event) =>
                    onDurationChange((previous) => ({
                      ...previous,
                      noHarm: event.target.checked,
                    }))
                  }
                  label="No Harm or Adaptation Parts"
                />
                <Checkbox
                  checked={duration.endsOnActivation || false}
                  onChange={(event) =>
                    onDurationChange((previous) => ({
                      ...previous,
                      endsOnActivation: event.target.checked,
                    }))
                  }
                  label="Ends on Activation"
                />
                <select
                  value={duration.sustain || 0}
                  onChange={(event) =>
                    onDurationChange((previous) => ({
                      ...previous,
                      sustain: Number(event.target.value),
                    }))
                  }
                  className="px-2 py-1 border border-border-light rounded text-sm text-text-primary bg-surface min-h-[44px]"
                  aria-label="Empowered technique sustain action points"
                >
                  <option value={0}>Sustain: None</option>
                  <option value={1}>Sustain: 1 AP</option>
                  <option value={2}>Sustain: 2 AP</option>
                  <option value={3}>Sustain: 3 AP</option>
                  <option value={4}>Sustain: 4 AP</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Power Damage (Add Damage)"
        collapsedSummary={powerDamageSummary}
        defaultExpanded={true}
        rightSlot={
          <SectionCostBadge
            en={sectionCosts.powerDamage.energyRaw}
            tp={sectionCosts.powerDamage.totalTP}
          />
        }
      >
        {powerDamages.map((damage, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg bg-surface-alt border border-border-light"
          >
            {damage.type !== 'none' && damage.amount > 0 && (
              <Checkbox
                checked={damage.applyDuration ?? false}
                onChange={(event) =>
                  onPowerDamagesChange((previous) =>
                    previous.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, applyDuration: event.target.checked } : row,
                    ),
                  )
                }
                label="Apply duration"
              />
            )}
            <ValueStepper
              value={damage.amount}
              onChange={(value) =>
                onPowerDamagesChange((previous) =>
                  previous.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, amount: value } : row,
                  ),
                )
              }
              label="Dice:"
              min={0}
              max={20}
            />
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg">d</span>
              <select
                value={damage.size}
                onChange={(event) =>
                  onPowerDamagesChange((previous) =>
                    previous.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, size: Number(event.target.value) } : row,
                    ),
                  )
                }
                className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
                aria-label={`Power damage die size row ${index + 1}`}
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
              onChange={(event) =>
                onPowerDamagesChange((previous) =>
                  previous.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, type: event.target.value } : row,
                  ),
                )
              }
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
              aria-label={`Power damage type row ${index + 1}`}
            >
              {POWER_DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'none' ? 'No damage' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            {powerDamages.length > 1 && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="min-h-[44px]"
                onClick={() =>
                  onPowerDamagesChange((previous) =>
                    previous.filter((_, rowIndex) => rowIndex !== index),
                  )
                }
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onPowerDamagesChange((previous) => [
              ...previous,
              { amount: 0, size: 6, type: 'none', applyDuration: false },
            ])
          }
          className="min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-1 inline" aria-hidden />
          Add damage type
        </Button>
      </CollapsibleSection>

      <CollapsibleSection
        title={`Power Parts (${selectedPowerParts.length})`}
        collapsedSummary={powerPartsSummary}
        defaultExpanded={true}
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
              className="flex items-center gap-1 min-h-[44px]"
              onClick={onAddPowerPart}
            >
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedPowerParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
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
        defaultExpanded={true}
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
              className="flex items-center gap-1 min-h-[44px]"
              onClick={onAddPowerMechanicPart}
            >
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedPowerAdvancedParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
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

      <CollapsibleSection
        title={`Technique Parts (${selectedTechniqueParts.length})`}
        collapsedSummary={techniquePartsSummary}
        defaultExpanded={true}
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
        defaultExpanded={true}
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
