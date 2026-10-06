/**
 * Overlay tabs (Choice / Modify / Randomize / Reverse) show Shared mechanics
 * as inherited until the author presses Override.
 */

'use client';

import { Button } from '@/components/ui';
import { formatAreaForDisplay } from '@/lib/calculators';
import { ACTION_OPTIONS } from '@/lib/game/creator-constants';
import { attackModeColumnLabel } from '@/lib/attack-mode';
import { formatDurationFromTypeAndValue } from '@/lib/utils/duration';
import { emptyTabForm, type PowerTabForm } from './power-creator-composition';
import type { DamageConfig } from './power-creator-types';

export type InheritedField = {
  label: string;
  overridden: boolean;
  onOverride: () => void;
  onUseShared: () => void;
  /** Action type on Modify, Choice, and Reverse. Shown from Shared, with no Override. */
  locked?: boolean | undefined;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function rangeIsOverride(form: PowerTabForm): boolean {
  return !same(form.range, emptyTabForm().range);
}
export function areaIsOverride(form: PowerTabForm): boolean {
  return !same(form.area, emptyTabForm().area);
}
export function durationIsOverride(form: PowerTabForm): boolean {
  return !same(form.duration, emptyTabForm().duration);
}
export function actionIsOverride(form: PowerTabForm): boolean {
  const empty = emptyTabForm();
  return form.actionType !== empty.actionType || form.isReaction !== empty.isReaction;
}
export function attackIsOverride(form: PowerTabForm): boolean {
  return form.attackMode !== emptyTabForm().attackMode;
}
export function damageIsOverride(damages: DamageConfig[]): boolean {
  return damages.some((d) => d.type !== 'none' && d.amount > 0);
}

export function sharedRangeLabel(form: PowerTabForm): string {
  return form.range.steps === 0 ? '1 space / melee' : `${form.range.steps * 3} spaces`;
}
export function sharedAreaLabel(form: PowerTabForm): string {
  return form.area.type === 'none'
    ? 'Single target'
    : formatAreaForDisplay(form.area.type, form.area.level);
}
export function sharedDurationLabel(form: PowerTabForm): string {
  return formatDurationFromTypeAndValue(form.duration.type, form.duration.value);
}
export function sharedActionLabel(form: PowerTabForm): string {
  const name = ACTION_OPTIONS.find((o) => o.value === form.actionType)?.label ?? form.actionType;
  return form.isReaction ? `${name}, reaction` : name;
}
export function sharedAttackLabel(form: PowerTabForm): string {
  return attackModeColumnLabel(form.attackMode);
}
export function sharedDamageLabel(form: PowerTabForm): string {
  const rows = form.damages.filter((d) => d.type !== 'none' && d.amount > 0);
  if (rows.length === 0) return 'None';
  return rows.map((d) => `${d.amount}d${d.size} ${d.type}`).join(', ');
}

export function FromSharedNotice({
  label,
  overridden,
  onOverride,
  onUseShared,
  locked = false,
}: InheritedField) {
  if (locked) {
    return (
      <div className="mb-3 rounded-lg border border-border-light bg-surface-alt px-3 py-2">
        <p className="min-w-0 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">From Shared:</span> {label}. Action type
          stays on Shared for this tab.
        </p>
      </div>
    );
  }
  if (overridden) {
    return (
      <div className="mb-3">
        <Button type="button" size="sm" variant="outline" onClick={onUseShared}>
          Use Shared
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-light bg-surface-alt px-3 py-2">
      <p className="min-w-0 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">From Shared:</span> {label}
      </p>
      <Button type="button" size="sm" variant="outline" onClick={onOverride}>
        Override
      </Button>
    </div>
  );
}

export function FromSharedParts({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <ul className="mb-4 space-y-1">
      {names.map((name, index) => (
        <li key={`${name}-${index}`} className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">From Shared:</span> {name}
        </li>
      ))}
    </ul>
  );
}
