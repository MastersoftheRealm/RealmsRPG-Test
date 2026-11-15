'use client';

import { Card, Checkbox } from '@/components/ui';
import { DecrementButton, IncrementButton, InfoTippy } from '@/components/patterns';
import { LargeStatBlock } from '@/components/character-sheet/sheet-large-stat-block';
import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import {
  formatMovementPointCost,
  formatMovementSpeed,
  movementAfterBuiltInMode,
  movementAfterWalkLevel,
  movementCheckboxFeats,
  movementModeCap,
  movementModeDescription,
  movementModeStepperLabel,
  movementModesInCatalog,
  movementPlainToggleFeats,
  movementSectionPointTotal,
  movementTravelSpeedCreatorDisplay,
  readBuiltInMovementLevel,
  readWalkLevel,
  toggleMovementFeat,
  walkLevelCap,
} from './creature-movement';
import type { CreatureState } from './creature-creator-types';

const ACTIVE_MODE_STEPPER_MIN = 1;

function LevelStepper({
  label,
  value,
  min,
  max,
  text,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  text: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-1">
      <DecrementButton
        size="sm"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        title={`Decrease ${label}`}
      />
      <span className="min-w-[2.5rem] text-center text-xs font-medium text-text-muted tabular-nums">
        {text}
      </span>
      <IncrementButton
        size="sm"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        title={`Increase ${label}`}
      />
    </div>
  );
}

function ModeControlBox({
  label,
  walkSpeed,
  level,
  max,
  kind,
  stepperText,
  tooltip,
  onChange,
}: {
  label: string;
  walkSpeed: number;
  level: number;
  max: number;
  kind: 'fly' | 'swim' | 'burrow' | 'jump';
  stepperText: string;
  tooltip: string;
  onChange: (next: number) => void;
}) {
  if (level === 0) return null;
  const displayValue =
    kind === 'jump'
      ? String(level)
      : formatMovementSpeed(movementTravelSpeedCreatorDisplay(walkSpeed, level));
  return (
    <LargeStatBlock
      label={label}
      labelAccessory={
        tooltip ? <InfoTippy content={tooltip} label={`${label} description`} /> : null
      }
      value={displayValue}
      footer={
        <LevelStepper
          label={label}
          value={level}
          min={ACTIVE_MODE_STEPPER_MIN}
          max={max}
          text={stepperText}
          onChange={(next) => onChange(Math.max(ACTIVE_MODE_STEPPER_MIN, Math.min(max, next)))}
        />
      }
    />
  );
}

function MovementSectionToggle({
  feat,
  checked,
  onChange,
}: {
  feat: CodexCreatureFeat;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  const description = feat.description?.trim();
  return (
    <div className="flex max-w-full min-w-0 items-center gap-2">
      <Checkbox
        checked={checked}
        label={feat.name}
        onChange={(event) => onChange(event.target.checked)}
      />
      {description ? <InfoTippy content={description} label={`${feat.name} description`} /> : null}
    </div>
  );
}

export function CreatureCreatorMovementSection({
  creature,
  walkSpeed,
  catalog,
  updateCreature,
}: {
  creature: CreatureState;
  walkSpeed: number;
  catalog: readonly CodexCreatureFeat[];
  updateCreature: (updates: Partial<CreatureState>) => void;
}) {
  const walk = readWalkLevel(creature.movementTypes);
  const caps = walkLevelCap(catalog);
  const pointTotal = movementSectionPointTotal(creature, catalog);
  const movementModes = movementModesInCatalog(catalog);
  const plainToggles = movementPlainToggleFeats(catalog);
  const checkboxToggles = movementCheckboxFeats(catalog);

  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-4 text-lg font-bold text-text-primary">Movement</h2>
      {pointTotal !== 0 && (
        <p className="mb-3 text-sm text-text-secondary">
          Feat points {pointTotal > 0 ? '+' : ''}
          {formatMovementPointCost(pointTotal)}
        </p>
      )}
      <div className="flex flex-wrap items-stretch gap-3">
        <LargeStatBlock
          label="Speed"
          value={formatMovementSpeed(walkSpeed)}
          footer={
            <LevelStepper
              label="Speed"
              value={walk}
              min={-caps.down}
              max={caps.up}
              text={walk > 0 ? `+${walk}` : String(walk)}
              onChange={(next) => updateCreature(movementAfterWalkLevel(creature, next, catalog))}
            />
          }
        />
        {movementModes.map((mode) => {
          const level = readBuiltInMovementLevel(creature.movementTypes, mode.kind);
          const max = movementModeCap(catalog, mode.kind);
          const tooltip = movementModeDescription(catalog, mode.baseId, level, mode.knownIds);
          return (
            <ModeControlBox
              key={mode.kind}
              label={mode.speedLabel}
              kind={mode.kind}
              walkSpeed={walkSpeed}
              level={level}
              max={max}
              stepperText={movementModeStepperLabel(catalog, mode.baseId, level)}
              tooltip={tooltip}
              onChange={(next) =>
                updateCreature(movementAfterBuiltInMode(creature, mode.kind, next, catalog))
              }
            />
          );
        })}
      </div>
      {(movementModes.length > 0 || plainToggles.length > 0 || checkboxToggles.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {movementModes.map((mode) => {
            const level = readBuiltInMovementLevel(creature.movementTypes, mode.kind);
            return (
              <div key={mode.kind} className="flex min-w-0 items-center gap-2">
                <Checkbox
                  checked={level > 0}
                  label={mode.label}
                  onChange={(event) =>
                    updateCreature(
                      movementAfterBuiltInMode(
                        creature,
                        mode.kind,
                        event.target.checked ? 1 : 0,
                        catalog,
                      ),
                    )
                  }
                />
              </div>
            );
          })}
          {plainToggles.map((feat) => {
            const on = creature.feats.some((row) => String(row.id) === String(feat.id));
            return (
              <MovementSectionToggle
                key={feat.id}
                feat={feat}
                checked={on}
                onChange={(next) =>
                  updateCreature({
                    feats: toggleMovementFeat(creature, feat, next),
                  })
                }
              />
            );
          })}
          {checkboxToggles.map((feat) => {
            const on = creature.feats.some((row) => String(row.id) === String(feat.id));
            return (
              <MovementSectionToggle
                key={feat.id}
                feat={feat}
                checked={on}
                onChange={(next) =>
                  updateCreature({
                    feats: toggleMovementFeat(creature, feat, next),
                  })
                }
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}
