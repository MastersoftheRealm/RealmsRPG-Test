'use client';

import { Card, Checkbox } from '@/components/ui';
import { DecrementButton, IncrementButton, InfoTippy } from '@/components/patterns';
import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import type { CreatureState } from './creature-creator-types';
import {
  builtInSenseFamilies,
  formatSensesPointCost,
  readBuiltInSenseLevel,
  senseControlCreatorValue,
  senseControlDescription,
  senseFamilyCap,
  sensesAfterBuiltInHandler,
  sensesSectionPointTotal,
  sensesToggleFeats,
  toggleSenseFeat,
} from './creature-senses';

const ACTIVE_SENSE_STEPPER_MIN = 1;

function TierStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <DecrementButton
        size="sm"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        title={`Decrease ${label}`}
      />
      <span className="min-w-[2.5rem] text-center text-xs font-medium text-text-muted tabular-nums">
        {String(value)}
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

function SenseActiveRow({
  label,
  level,
  max,
  value,
  tooltip,
  onChange,
}: {
  label: string;
  level: number;
  max: number;
  value: string;
  tooltip: string;
  onChange: (next: number) => void;
}) {
  if (level === 0) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-surface-alt px-3 py-2">
      <span className="text-sm font-semibold text-text-secondary">{label}</span>
      {tooltip ? <InfoTippy content={tooltip} label={`${label} description`} /> : null}
      <span className="text-2xl font-bold text-text-primary tabular-nums">{value}</span>
      <TierStepper
        label={label}
        value={level}
        min={ACTIVE_SENSE_STEPPER_MIN}
        max={max}
        onChange={(next) => onChange(Math.max(ACTIVE_SENSE_STEPPER_MIN, Math.min(max, next)))}
      />
    </div>
  );
}

function catalogHasSenseFamily(catalog: readonly CodexCreatureFeat[], baseId: number): boolean {
  const base = String(baseId);
  return catalog.some(
    (feat) => String(feat.id) === base || String(feat.base_feat_id ?? '') === base,
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
  const senseFamilies = builtInSenseFamilies.filter((family) =>
    catalogHasSenseFamily(catalog, family.baseId),
  );

  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-4 text-lg font-bold text-text-primary">Senses</h2>
      {pointTotal !== 0 && (
        <p className="mb-3 text-sm text-text-secondary">
          Feat points {pointTotal > 0 ? '+' : ''}
          {formatSensesPointCost(pointTotal)}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {senseFamilies.map((family) => {
          const level = readBuiltInSenseLevel(creature.senses, family.kind);
          const max = senseFamilyCap(catalog, family.kind);
          const after = sensesAfterBuiltInHandler(family.kind);
          const tooltip = senseControlDescription(creature.senses, family.kind, catalog);
          return (
            <SenseActiveRow
              key={family.kind}
              label={family.label}
              level={level}
              max={max}
              value={senseControlCreatorValue(creature.senses, family.kind)}
              tooltip={tooltip}
              onChange={(next) => updateCreature(after(creature, next, catalog))}
            />
          );
        })}
      </div>
      {(senseFamilies.length > 0 || toggles.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {senseFamilies.map((family) => {
            const level = readBuiltInSenseLevel(creature.senses, family.kind);
            const after = sensesAfterBuiltInHandler(family.kind);
            return (
              <div key={family.kind} className="flex min-w-0 items-center gap-2">
                <Checkbox
                  checked={level > 0}
                  label={family.label}
                  onChange={(event) =>
                    updateCreature(after(creature, event.target.checked ? 1 : 0, catalog))
                  }
                />
              </div>
            );
          })}
          {toggles.map((feat) => {
            const on = creature.feats.some((row) => String(row.id) === String(feat.id));
            const description = feat.description?.trim();
            return (
              <div key={feat.id} className="flex min-w-0 items-center gap-2">
                <Checkbox
                  checked={on}
                  label={feat.name}
                  onChange={(event) =>
                    updateCreature({
                      feats: toggleSenseFeat(creature, feat, event.target.checked),
                    })
                  }
                />
                {description ? (
                  <InfoTippy content={description} label={`${feat.name} description`} />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
