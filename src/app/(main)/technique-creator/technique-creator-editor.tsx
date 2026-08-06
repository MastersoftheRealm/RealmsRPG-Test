/**
 * Technique Creator — editor section islands (TASK-381 Phase 3)
 * =============================================================
 * Presentational form sections. State, cost math, save/load, and
 * CreatorPageShell stay in page.tsx.
 */

'use client';

import { Plus, Info } from 'lucide-react';
import type { TechniquePart } from '@/hooks';
import { ValueStepper, SectionCostBadge, RealmsImageField } from '@/components/shared';
import {
  CollapsibleSection,
  PowerPartCard,
} from '@/components/creator';
import { Checkbox, Button, Input, Textarea, Card } from '@/components/ui';
import { ACTION_OPTIONS, DIE_SIZES } from '@/lib/game/creator-constants';
import { ATTACK_MODE_SELECT_OPTIONS, type AttackMode } from '@/lib/attack-mode';
import type { TechniqueSelectedPart as SelectedPart, TechniqueDamageConfig as DamageConfig } from './technique-creator-bootstrap';

type SectionCostSlice = {
  energyRaw: number;
  totalTP: number;
};

type TechniqueCreatorEditorProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;

  combatConfigSummary: string;
  combatConfigCost: SectionCostSlice;
  attackMode: AttackMode;
  onAttackModeChange: (mode: AttackMode) => void;
  weaponCost: SectionCostSlice;

  actionType: string;
  onActionTypeChange: (value: string) => void;
  actionTypeCost: SectionCostSlice;
  isReaction: boolean;
  onIsReactionChange: (value: boolean) => void;
  reactionCost: SectionCostSlice;

  selectedParts: SelectedPart[];
  techniqueParts: TechniquePart[];
  techniquePartsSummary: string;
  onAddPart: () => void;
  onRemovePart: (index: number) => void;
  onUpdatePart: (index: number, updates: Partial<SelectedPart>) => void;

  damage: DamageConfig;
  onDamageChange: (updater: (prev: DamageConfig) => DamageConfig) => void;
  damageSummary: string;
  damageSectionCost: SectionCostSlice;
};

export function TechniqueCreatorEditor({
  isAdmin,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  imageId,
  imageUrl,
  onImageChange,
  combatConfigSummary,
  combatConfigCost,
  attackMode,
  onAttackModeChange,
  weaponCost,
  actionType,
  onActionTypeChange,
  actionTypeCost,
  isReaction,
  onIsReactionChange,
  reactionCost,
  selectedParts,
  techniqueParts,
  techniquePartsSummary,
  onAddPart,
  onRemovePart,
  onUpdatePart,
  damage,
  onDamageChange,
  damageSummary,
  damageSectionCost,
}: TechniqueCreatorEditorProps) {
  return (
    <>
      <Card className="shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Technique Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter technique name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe what your technique does..."
              rows={3}
            />
          </div>
          {isAdmin && (
            <RealmsImageField
              categories="technique"
              imageId={imageId}
              imageUrl={imageUrl}
              onChange={onImageChange}
              entityName={name}
              label="Technique card art"
              hint="Uploads are saved to the shared image bank."
            />
          )}
        </div>
      </Card>

      <CollapsibleSection
        title="Combat Configuration"
        collapsedSummary={combatConfigSummary}
        rightSlot={<SectionCostBadge en={combatConfigCost.energyRaw} tp={combatConfigCost.totalTP} />}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                htmlFor="technique-attack-mode"
                className="block text-sm font-medium text-text-secondary"
              >
                Attack
              </label>
              <SectionCostBadge en={weaponCost.energyRaw} tp={weaponCost.totalTP} />
            </div>
            <select
              id="technique-attack-mode"
              value={attackMode}
              onChange={(e) => onAttackModeChange(e.target.value as AttackMode)}
              className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
              aria-label="Attack mode"
            >
              {ATTACK_MODE_SELECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Action Type
              </label>
              <SectionCostBadge en={actionTypeCost.energyRaw} tp={actionTypeCost.totalTP} />
            </div>
            <select
              value={actionType}
              onChange={(e) => onActionTypeChange(e.target.value)}
              className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              aria-label="Action type"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <Checkbox
              checked={isReaction}
              onChange={(e) => onIsReactionChange(e.target.checked)}
              label="Can be used as a Reaction"
            />
            {isReaction && (
              <SectionCostBadge en={reactionCost.energyRaw} tp={reactionCost.totalTP} />
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={`Technique Parts (${selectedParts.length})`}
        collapsedSummary={techniquePartsSummary}
        rightSlot={
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="flex items-center gap-1 min-h-[44px]"
            onClick={onAddPart}
          >
            <Plus className="w-4 h-4" />
            Add Part
          </Button>
        }
      >
        {selectedParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No parts added yet. Click &quot;Add Part&quot; to begin building your technique.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedParts.map((sp, idx) => (
              <PowerPartCard
                key={idx}
                selectedPart={sp}
                _index={idx}
                onRemove={() => onRemovePart(idx)}
                onUpdate={(updates) => onUpdatePart(idx, updates)}
                allParts={techniqueParts}
                showApplyDuration={false}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Additional Damage"
        collapsedSummary={damageSummary}
        rightSlot={<SectionCostBadge en={damageSectionCost.energyRaw} tp={damageSectionCost.totalTP} />}
      >
        <p className="text-sm text-text-secondary mb-4">
          Add extra damage dice to your technique. The damage type matches the weapon&apos;s damage type.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <ValueStepper
            value={damage.amount}
            onChange={(v) => onDamageChange((d) => ({ ...d, amount: v }))}
            label="Dice:"
            min={0}
            max={20}
          />
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg">d</span>
            <select
              value={damage.size}
              onChange={(e) =>
                onDamageChange((d) => ({ ...d, size: parseInt(e.target.value, 10) }))
              }
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface min-h-[44px]"
              aria-label="Damage die size"
            >
              {DIE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        {damage.amount > 0 && (
          <p className="mt-2 text-sm text-text-secondary">
            Additional Damage:{' '}
            <strong>
              +{damage.amount}d{damage.size}
            </strong>
          </p>
        )}
      </CollapsibleSection>
    </>
  );
}
