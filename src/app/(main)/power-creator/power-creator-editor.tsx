/**
 * Power Creator — editor section islands (TASK-381 Phase 1)
 * =========================================================
 * Presentational form sections for the power creator. State, cost math,
 * save/load, and CreatorPageShell stay in page.tsx.
 */

'use client';

import Link from 'next/link';
import { Plus, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PowerPart } from '@/hooks';
import { ValueStepper, SectionCostBadge, RealmsImageField } from '@/components/shared';
import {
  CollapsibleSection,
  PowerPartCard,
} from '@/components/creator';
import { Checkbox, Button, Input, Textarea, Card } from '@/components/ui';
import {
  formatAreaForDisplay,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import {
  ACTION_OPTIONS,
  POWER_DAMAGE_TYPES as DAMAGE_TYPES,
  DIE_SIZES,
  AREA_TYPES,
  DURATION_TYPES,
  DURATION_VALUES,
} from '@/lib/game/creator-constants';
import {
  ATTACK_MODE_SELECT_OPTIONS,
  attackModeColumnLabel,
  type AttackMode,
} from '@/lib/attack-mode';
import type { SelectedPart, AdvancedPart, DamageConfig, RangeConfig } from './power-creator-types';

type PowerSectionCostSlice = {
  energyRaw: number;
  totalTP: number;
};

type PowerSectionCosts = {
  action: PowerSectionCostSlice;
  weapon: PowerSectionCostSlice;
  range: PowerSectionCostSlice;
  area: PowerSectionCostSlice;
  duration: PowerSectionCostSlice;
  damage: PowerSectionCostSlice;
  powerParts: PowerSectionCostSlice;
  powerMechanics: PowerSectionCostSlice;
};

type PowerAreaPartInfo = {
  description: string;
  op1Desc?: string;
  op1Level: number;
} | null;

type PowerCreatorEditorProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;

  actionType: string;
  onActionTypeChange: (value: string) => void;
  isReaction: boolean;
  onIsReactionChange: (value: boolean) => void;
  actionTypeDisplay: string;

  attackMode: AttackMode;
  onAttackModeChange: (mode: AttackMode) => void;

  range: RangeConfig;
  onRangeChange: (updater: (prev: RangeConfig) => RangeConfig) => void;
  rangeSummary: string;

  area: AreaConfig;
  onAreaChange: (updater: (prev: AreaConfig) => AreaConfig) => void;
  areaPartInfo: PowerAreaPartInfo;

  duration: DurationConfig;
  onDurationChange: (next: DurationConfig | ((prev: DurationConfig) => DurationConfig)) => void;
  durationSummary: string;

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

  damages: DamageConfig[];
  onDamagesChange: (updater: (prev: DamageConfig[]) => DamageConfig[]) => void;
  damageSummary: string;

  sectionCosts: PowerSectionCosts;
};

export function PowerCreatorEditor({
  isAdmin,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  imageId,
  imageUrl,
  onImageChange,
  actionType,
  onActionTypeChange,
  isReaction,
  onIsReactionChange,
  actionTypeDisplay,
  attackMode,
  onAttackModeChange,
  range,
  onRangeChange,
  rangeSummary,
  area,
  onAreaChange,
  areaPartInfo,
  duration,
  onDurationChange,
  durationSummary,
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
  damages,
  onDamagesChange,
  damageSummary,
  sectionCosts,
}: PowerCreatorEditorProps) {
  return (
    <>
      <Card className="shadow-md p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-text-secondary">
              Building a hybrid? Use the dedicated empowered creator for combined power + technique rules.
            </p>
            <Link
              href="/empowered-technique-creator"
              className="inline-flex items-center rounded-lg border border-border-light bg-surface-alt px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface min-h-[44px]"
            >
              Open Empowered Creator
            </Link>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Power Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter power name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe what your power does..."
              rows={3}
            />
          </div>
          {isAdmin && (
            <RealmsImageField
              categories="power"
              imageId={imageId}
              imageUrl={imageUrl}
              onChange={onImageChange}
              entityName={name}
              label="Power card art"
              hint="Uploads are saved to the shared image bank."
            />
          )}
        </div>
      </Card>

      <CollapsibleSection
        title="Action Type"
        collapsedSummary={actionTypeDisplay}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.action.energyRaw} tp={sectionCosts.action.totalTP} />}
      >
        <div className="flex flex-wrap gap-4">
          <select
            aria-label="Action type"
            value={actionType}
            onChange={(e) => onActionTypeChange(e.target.value)}
            className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Checkbox
            checked={isReaction}
            onChange={(e) => onIsReactionChange(e.target.checked)}
            label="Reaction"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Attack"
        collapsedSummary={attackModeColumnLabel(attackMode)}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.weapon.energyRaw} tp={sectionCosts.weapon.totalTP} />}
      >
        <div>
          <label
            htmlFor="power-attack-mode"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Attack
          </label>
          <select
            id="power-attack-mode"
            value={attackMode}
            onChange={(e) => onAttackModeChange(e.target.value as AttackMode)}
            className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
            aria-label="Power attack mode"
          >
            {ATTACK_MODE_SELECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Weapon Attack adds the Add Weapon to Power mechanic (flat cost). No Weapon/Attack and Unarmed Attack add nothing.
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Range"
        collapsedSummary={rangeSummary}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.range.energyRaw} tp={sectionCosts.range.totalTP} />}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ValueStepper
            value={range.steps}
            onChange={(v) => onRangeChange((r) => ({ ...r, steps: v }))}
            label="Range:"
            min={0}
            max={10}
          />
          <span className="text-sm text-text-secondary">
            {range.steps === 0 ? '(1 Space / Melee)' : `(${range.steps * 3} spaces)`}
          </span>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Area of Effect"
        collapsedSummary={area.type === 'none' ? 'Single target' : formatAreaForDisplay(area.type, area.level)}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.area.energyRaw} tp={sectionCosts.area.totalTP} />}
      >
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            aria-label="Area of effect"
            value={area.type}
            onChange={(e) => onAreaChange((a) => ({ ...a, type: e.target.value as AreaConfig['type'] }))}
            className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
          >
            {AREA_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {area.type !== 'none' && (
            <ValueStepper
              value={area.level}
              onChange={(v) => onAreaChange((a) => ({ ...a, level: v }))}
              label="Level:"
              min={1}
              max={10}
            />
          )}
        </div>
        {area.type !== 'none' && (
          <div className="mt-4">
            <Checkbox
              checked={area.applyDuration ?? false}
              onChange={(e) => onAreaChange((a) => ({ ...a, applyDuration: e.target.checked }))}
              label="Apply duration"
            />
          </div>
        )}
        {areaPartInfo && (
          <div className="mt-4 p-4 rounded-lg bg-surface-alt border border-border-light">
            <p className="text-sm text-text-primary leading-relaxed">{areaPartInfo.description}</p>
            {areaPartInfo.op1Desc && areaPartInfo.op1Level > 0 && (
              <div className="mt-3 pt-3 border-t border-border-light">
                <p className="text-sm font-medium text-text-secondary dark:text-text-primary mb-1">
                  Option 1 (Level {areaPartInfo.op1Level + 1}):
                </p>
                <p className="text-sm text-text-primary">{areaPartInfo.op1Desc}</p>
              </div>
            )}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Duration"
        collapsedSummary={durationSummary}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.duration.energyRaw} tp={sectionCosts.duration.totalTP} />}
      >
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select
            aria-label="Duration type"
            value={duration.type}
            onChange={(e) => {
              const newType = e.target.value as DurationConfig['type'];
              const newValue = DURATION_VALUES[newType]?.[0]?.value || 1;
              const isShortDuration = newType === 'instant' || (newType === 'rounds' && newValue === 1);
              if (isShortDuration) {
                onDurationChange({
                  type: newType,
                  value: newValue,
                  applyDuration: false,
                  focus: false,
                  noHarm: false,
                  endsOnActivation: false,
                  sustain: 0,
                });
              } else {
                onDurationChange((d) => ({ ...d, type: newType, value: newValue }));
              }
            }}
            className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
          >
            {DURATION_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {duration.type !== 'instant' && duration.type !== 'permanent' && DURATION_VALUES[duration.type] && (
            <select
              aria-label="Duration value"
              value={duration.value}
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                if (duration.type === 'rounds' && newValue === 1) {
                  onDurationChange({
                    type: duration.type,
                    value: newValue,
                    applyDuration: duration.applyDuration ?? false,
                    focus: false,
                    noHarm: false,
                    endsOnActivation: false,
                    sustain: 0,
                  });
                } else {
                  onDurationChange((d) => ({ ...d, value: newValue }));
                }
              }}
              className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
            >
              {DURATION_VALUES[duration.type].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
        {(() => {
          const isShortDuration = duration.type === 'instant' || (duration.type === 'rounds' && duration.value === 1);
          return (
            <div
              className={cn(
                'flex flex-wrap items-center gap-4 pt-3 border-t border-border-light',
                isShortDuration && 'opacity-50',
              )}
            >
              <Checkbox
                checked={duration.focus || false}
                onChange={(e) => onDurationChange((d) => ({ ...d, focus: e.target.checked }))}
                label="Focus"
                disabled={isShortDuration}
              />
              <Checkbox
                checked={duration.noHarm || false}
                onChange={(e) => onDurationChange((d) => ({ ...d, noHarm: e.target.checked }))}
                label="No Harm or Adaptation Parts"
                disabled={isShortDuration}
              />
              <Checkbox
                checked={duration.endsOnActivation || false}
                onChange={(e) => onDurationChange((d) => ({ ...d, endsOnActivation: e.target.checked }))}
                label="Ends on Activation"
                disabled={isShortDuration}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">Sustain:</span>
                <select
                  aria-label="Sustain cost in action points"
                  value={duration.sustain || 0}
                  onChange={(e) => onDurationChange((d) => ({ ...d, sustain: parseInt(e.target.value) }))}
                  className="px-2 py-1 border border-border-light rounded text-sm text-text-primary bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isShortDuration}
                >
                  <option value={0}>None</option>
                  <option value={1}>1 AP</option>
                  <option value={2}>2 AP</option>
                  <option value={3}>3 AP</option>
                  <option value={4}>4 AP</option>
                </select>
              </div>
              {isShortDuration && (
                <span className="text-xs text-text-muted dark:text-text-secondary italic">
                  (Requires 2+ rounds)
                </span>
              )}
            </div>
          );
        })()}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Power Parts (${selectedParts.length})`}
        collapsedSummary={powerPartsSummary}
        defaultExpanded={true}
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
        defaultExpanded={true}
        rightSlot={
          <>
            <SectionCostBadge en={sectionCosts.powerMechanics.energyRaw} tp={sectionCosts.powerMechanics.totalTP} />
            <Button type="button" variant="primary" size="sm" className="flex items-center gap-1" onClick={onAddMechanicPart}>
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

      <CollapsibleSection
        title="Damage"
        collapsedSummary={damageSummary}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.damage.energyRaw} tp={sectionCosts.damage.totalTP} />}
      >
        {damages.map((d, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg bg-surface-alt border border-border-light"
          >
            {d.type !== 'none' && d.amount > 0 && (
              <Checkbox
                checked={d.applyDuration ?? false}
                onChange={(e) =>
                  onDamagesChange((prev) =>
                    prev.map((x, i) => (i === index ? { ...x, applyDuration: e.target.checked } : x)),
                  )
                }
                label="Apply duration"
              />
            )}
            <ValueStepper
              value={d.amount}
              onChange={(v) =>
                onDamagesChange((prev) => prev.map((x, i) => (i === index ? { ...x, amount: v } : x)))
              }
              label="Dice:"
              min={0}
              max={20}
            />
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg">d</span>
              <select
                aria-label={`Damage die size, row ${index + 1}`}
                value={d.size}
                onChange={(e) =>
                  onDamagesChange((prev) =>
                    prev.map((x, i) => (i === index ? { ...x, size: parseInt(e.target.value) } : x)),
                  )
                }
                className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              >
                {DIE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <select
              aria-label={`Damage type, row ${index + 1}`}
              value={d.type}
              onChange={(e) =>
                onDamagesChange((prev) =>
                  prev.map((x, i) => (i === index ? { ...x, type: e.target.value } : x)),
                )
              }
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
            >
              {DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'none' ? 'No damage' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            {damages.length > 1 && (
              <button
                type="button"
                onClick={() => onDamagesChange((prev) => prev.filter((_, i) => i !== index))}
                className="p-2 rounded-lg text-danger-fg hover:bg-danger-100 dark:hover:bg-danger-900/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Remove damage type row ${index + 1}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onDamagesChange((prev) => [...prev, { amount: 0, size: 6, type: 'none', applyDuration: false }])
          }
          className="mt-2 min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-1 inline" aria-hidden />
          Add damage type
        </Button>
        {damages.some((d) => d.type !== 'none' && d.amount > 0) && (
          <p className="mt-2 text-sm text-text-secondary">
            {damages
              .filter((d) => d.type !== 'none' && d.amount > 0)
              .map((d) => `${d.amount}d${d.size} ${d.type}`)
              .join(', ')}
          </p>
        )}
      </CollapsibleSection>
    </>
  );
}
