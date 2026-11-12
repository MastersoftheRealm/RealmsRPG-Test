'use client';

import { Button, Card, Checkbox } from '@/components/ui';
import { DecrementButton, IncrementButton, InfoTippy } from '@/components/patterns';
import { LargeStatBlock } from '@/components/character-sheet/sheet-large-stat-block';
import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import { AddItemDropdown } from './CreatureCreatorHelpers';
import {
  formatMovementPointCost,
  formatMovementSpeed,
  movementAfterBurrowLevel,
  movementAfterFlyLevel,
  movementAfterSwimLevel,
  movementAfterWalkLevel,
  movementDropdownFeats,
  movementSectionPointTotal,
  movementToggleFeats,
  movementTravelSpeed,
  nextSpeedType,
  readBurrowLevel,
  readFlyLevel,
  readSwimLevel,
  readWalkLevel,
  toggleMovementFeat,
  walkLevelCap,
} from './creature-movement';
import type { CreatureState } from './creature-creator-types';

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

function SpeedTypeBox({
  label,
  walkSpeed,
  level,
  onChange,
}: {
  label: string;
  walkSpeed: number;
  level: 0 | 1 | 2;
  onChange: (next: 0 | 1 | 2) => void;
}) {
  if (level === 0) return null;
  return (
    <LargeStatBlock
      label={label}
      value={formatMovementSpeed(movementTravelSpeed(walkSpeed, level === 1 ? 1 : 2))}
      footer={
        <LevelStepper
          label={label}
          value={level}
          min={0}
          max={2}
          text={level === 1 ? '1/2' : 'Full'}
          onChange={(next) => onChange(next <= 0 ? 0 : next >= 2 ? 2 : 1)}
        />
      }
    />
  );
}

export function CreatureCreatorMovementSection({
  creature,
  walkSpeed,
  catalog,
  updateCreature,
  onAddMovementFeat,
}: {
  creature: CreatureState;
  walkSpeed: number;
  catalog: readonly CodexCreatureFeat[];
  updateCreature: (updates: Partial<CreatureState>) => void;
  onAddMovementFeat: (featId: string) => void;
}) {
  const walk = readWalkLevel(creature.movementTypes);
  const fly = readFlyLevel(creature.movementTypes);
  const swim = readSwimLevel(creature.movementTypes);
  const burrow = readBurrowLevel(creature.movementTypes);
  const caps = walkLevelCap(catalog);
  const pointTotal = movementSectionPointTotal(creature, catalog);
  const toggles = movementToggleFeats(catalog);
  const dropdown = movementDropdownFeats(catalog);
  const selectedDropdown = new Set(creature.feats.map((feat) => String(feat.id)));
  const addable = dropdown.filter((feat) => !selectedDropdown.has(String(feat.id)));
  const nextType = nextSpeedType(creature.movementTypes);

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
        {fly > 0 && (
          <SpeedTypeBox
            label="Flying Speed"
            walkSpeed={walkSpeed}
            level={fly}
            onChange={(next) => updateCreature(movementAfterFlyLevel(creature, next, catalog))}
          />
        )}
        {swim > 0 && (
          <SpeedTypeBox
            label="Swimming Speed"
            walkSpeed={walkSpeed}
            level={swim}
            onChange={(next) => updateCreature(movementAfterSwimLevel(creature, next))}
          />
        )}
        {burrow > 0 && (
          <SpeedTypeBox
            label="Burrow Speed"
            walkSpeed={walkSpeed}
            level={burrow}
            onChange={(next) => updateCreature(movementAfterBurrowLevel(creature, next, catalog))}
          />
        )}
        {nextType && (
          <Button
            size="sm"
            variant="secondary"
            className="self-center"
            onClick={() =>
              updateCreature(
                nextType === 'fly'
                  ? movementAfterFlyLevel(creature, 1, catalog)
                  : movementAfterSwimLevel(creature, 1),
              )
            }
            title={nextType === 'fly' ? 'Add flying speed' : 'Add swimming speed'}
            aria-label={nextType === 'fly' ? 'Add flying speed' : 'Add swimming speed'}
          >
            +
          </Button>
        )}
      </div>
      {addable.length > 0 && (
        <div className="mt-4 max-w-sm">
          <AddItemDropdown
            options={addable.map((feat) => ({
              value: String(feat.id),
              label: feat.name,
              description: feat.description,
            }))}
            selectedItems={[]}
            onAdd={(id) => onAddMovementFeat(id)}
            placeholder="Add movement feat..."
          />
        </div>
      )}
      {toggles.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {toggles.map((feat) => {
            const on = creature.feats.some((row) => String(row.id) === String(feat.id));
            return (
              <div key={feat.id} className="flex items-center gap-2">
                <Checkbox
                  checked={on}
                  label={feat.name}
                  onChange={(event) =>
                    updateCreature({
                      feats: toggleMovementFeat(creature, feat, event.target.checked),
                    })
                  }
                />
                {feat.description ? (
                  <InfoTippy content={feat.description} label={`${feat.name} description`} />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
