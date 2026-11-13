'use client';

import { Button, Card, Checkbox } from '@/components/ui';
import { DecrementButton, IncrementButton, InfoTippy } from '@/components/patterns';
import { LargeStatBlock } from '@/components/character-sheet/sheet-large-stat-block';
import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import type { CreatureState } from './creature-creator-types';
import {
  type BuiltInSenseKind,
  builtInSenseFamilies,
  formatSensesPointCost,
  nextBuiltInSenseType,
  readBuiltInSenseLevel,
  senseFamilyCap,
  senseControlDisplayValue,
  sensesAfterBuiltInHandler,
  sensesAfterBuiltInLevel,
  sensesSectionPointTotal,
  sensesToggleFeats,
  toggleSenseFeat,
} from './creature-senses';

function TierStepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-1">
      <DecrementButton
        size="sm"
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
        title={`Decrease ${label}`}
      />
      <span className="min-w-[2.5rem] text-center text-xs font-medium text-text-muted tabular-nums">
        {value > 0 ? String(value) : '0'}
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

function SenseControlBox({
  label,
  kind,
  level,
  max,
  creature,
  catalog,
  onChange,
}: {
  label: string;
  kind: BuiltInSenseKind;
  level: number;
  max: number;
  creature: CreatureState;
  catalog: readonly CodexCreatureFeat[];
  onChange: (next: number) => void;
}) {
  if (level === 0) return null;
  return (
    <LargeStatBlock
      label={label}
      value={senseControlDisplayValue(creature.senses, kind, catalog)}
      footer={<TierStepper label={label} value={level} max={max} onChange={onChange} />}
    />
  );
}

export function CreatureCreatorSensesSection({
  creature,
  catalog,
  updateCreature,
}: {
  creature: CreatureState;
  catalog: readonly CodexCreatureFeat[];
  updateCreature: (updates: Partial<CreatureState>) => void;
}) {
  const pointTotal = sensesSectionPointTotal(creature, catalog);
  const toggles = sensesToggleFeats(catalog);
  const nextType = nextBuiltInSenseType(creature.senses);

  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-4 text-lg font-bold text-text-primary">Senses</h2>
      {pointTotal !== 0 && (
        <p className="mb-3 text-sm text-text-secondary">
          Feat points {pointTotal > 0 ? '+' : ''}
          {formatSensesPointCost(pointTotal)}
        </p>
      )}
      <div className="flex flex-wrap items-stretch gap-3">
        {builtInSenseFamilies.map((family) => {
          const level = readBuiltInSenseLevel(creature.senses, family.kind);
          const max = senseFamilyCap(catalog, family.kind);
          const after = sensesAfterBuiltInHandler(family.kind);
          return (
            <SenseControlBox
              key={family.kind}
              label={family.label}
              kind={family.kind}
              level={level}
              max={max}
              creature={creature}
              catalog={catalog}
              onChange={(next) => updateCreature(after(creature, next, catalog))}
            />
          );
        })}
        {nextType && (
          <Button
            size="sm"
            variant="secondary"
            className="self-center"
            onClick={() =>
              updateCreature(sensesAfterBuiltInLevel(creature, nextType, 1, catalog))
            }
            title={`Add ${SENSE_FAMILY_BY_KIND_LABEL(nextType)}`}
            aria-label={`Add ${SENSE_FAMILY_BY_KIND_LABEL(nextType)}`}
          >
            +
          </Button>
        )}
      </div>
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
                      feats: toggleSenseFeat(creature, feat, event.target.checked),
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

function SENSE_FAMILY_BY_KIND_LABEL(kind: BuiltInSenseKind): string {
  return builtInSenseFamilies.find((family) => family.kind === kind)?.label ?? kind;
}
