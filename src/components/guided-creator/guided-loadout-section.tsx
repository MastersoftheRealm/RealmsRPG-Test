/**
 * Single loadout kit — feat-step section layout (title, why, GridListRow items, select control).
 */

'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { GuidedLoadoutItemTable } from './guided-loadout-item-table';
import type { ResolvedLoadoutItem } from '@/lib/guided-creator/resolve-loadout-items';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const sectionCopy = GUIDED_CREATOR_COPY.steps.loadout;

export interface GuidedLoadoutSectionProps {
  loadoutId: string;
  title: string;
  why?: string;
  items: ResolvedLoadoutItem[];
  selected: boolean;
  onSelect: () => void;
}

export function GuidedLoadoutSection({
  loadoutId,
  title,
  why,
  items,
  selected,
  onSelect,
}: GuidedLoadoutSectionProps) {
  return (
    <section id={`loadout-${loadoutId}`} aria-labelledby={`loadout-${loadoutId}-title`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            id={`loadout-${loadoutId}-title`}
            className="font-display text-lg font-semibold text-text-primary"
          >
            {title}
          </h3>
          {why ? (
            <p className="mt-1 font-nunito text-sm text-text-secondary">{why}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant={selected ? 'primary' : 'secondary'}
          onClick={onSelect}
          aria-pressed={selected}
          className="min-h-11 shrink-0"
        >
          {selected ? (
            <>
              <Check className="mr-1.5 h-4 w-4" aria-hidden />
              {sectionCopy.selectedKit}
            </>
          ) : (
            sectionCopy.selectKit
          )}
        </Button>
      </div>

      {items.length > 0 ? (
        <GuidedLoadoutItemTable items={items} className="mt-3" />
      ) : (
        <p className="mt-3 font-nunito text-sm text-text-muted">{sectionCopy.emptyKit}</p>
      )}
    </section>
  );
}
