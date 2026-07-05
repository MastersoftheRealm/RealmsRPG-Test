/**
 * Optional Unarmed Prowess pick when the path recommends it (plain section, no card chrome).
 */

'use client';

import { Button } from '@/components/ui';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const copy = GUIDED_CREATOR_COPY.steps.loadout.unarmed;

export interface GuidedUnarmedProwessPanelProps {
  level: number;
  onChange: (level: number) => void;
}

export function GuidedUnarmedProwessPanel({ level, onChange }: GuidedUnarmedProwessPanelProps) {
  const selected = level > 0;

  return (
    <section aria-labelledby="guided-unarmed-prowess-heading">
      <h3
        id="guided-unarmed-prowess-heading"
        className="font-display text-lg font-semibold text-text-primary"
      >
        {copy.title}
      </h3>
      <p className="mt-1 font-nunito text-sm text-text-secondary">{copy.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={selected ? 'primary' : 'secondary'}
          onClick={() => onChange(selected ? 0 : 1)}
          className="min-h-11"
          aria-pressed={selected}
        >
          {selected ? copy.remove : copy.add}
        </Button>
        {selected ? (
          <span className="font-nunito text-sm text-success-700 dark:text-success-400">
            {copy.addedHint}
          </span>
        ) : null}
      </div>
    </section>
  );
}
