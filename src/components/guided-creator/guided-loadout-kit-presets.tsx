'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PathLoadout } from '@/types/archetype';
import type { ResolvedLoadoutItem } from '@/lib/guided-creator/resolve-loadout-items';
import { groupResolvedItemsByCategory } from '@/lib/guided-creator/resolve-loadout-items';
import { GuidedChoiceCard } from './guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from './guided-choice-styles';
import { GUIDED_CHOICE_GRID_ITEM_CLASS } from './guided-choice-grid';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;
const stepCopy = GUIDED_CREATOR_COPY.steps.loadout;

export interface GuidedLoadoutKitPresetsProps {
  loadouts: PathLoadout[];
  resolvedByLoadoutId: Map<string, ResolvedLoadoutItem[]>;
  selectedLoadoutId: string | null;
  onSelect: (loadout: PathLoadout) => void;
}

function kitSummaryTags(items: ResolvedLoadoutItem[]): string[] {
  const groups = groupResolvedItemsByCategory(items);
  return groups.map((g) => {
    const count = g.items.reduce((sum, i) => sum + Math.max(1, i.quantity), 0);
    const label = g.id === 'weapons' ? stepCopy.weaponsLabel : g.id === 'armor' ? stepCopy.armorLabel : stepCopy.gearLabel;
    return count > 1 ? `${count} ${label.toLowerCase()}` : label;
  });
}

export function GuidedLoadoutKitPresets({
  loadouts,
  resolvedByLoadoutId,
  selectedLoadoutId,
  onSelect,
}: GuidedLoadoutKitPresetsProps) {
  const cards = useMemo(
    () =>
      loadouts.map((loadout) => ({
        loadout,
        items: resolvedByLoadoutId.get(loadout.id) ?? [],
      })),
    [loadouts, resolvedByLoadoutId]
  );

  if (loadouts.length < 2) return null;

  return (
    <section aria-labelledby="guided-quick-kits-title" className="space-y-3">
      <div>
        <h3
          id="guided-quick-kits-title"
          className="font-display text-base font-semibold text-text-primary"
        >
          {phaseCopy.quickKitsTitle}
        </h3>
        <p className="mt-1 font-nunito text-sm text-text-secondary">
          {phaseCopy.quickKitsDescription}
        </p>
      </div>
      <div
        className={GUIDED_CHOICE_COMPACT_GRID_CLASS}
        role="group"
        aria-label={stepCopy.loadoutGroupLabel}
      >
        {cards.map(({ loadout, items }) => (
          <div key={loadout.id} className={cn(GUIDED_CHOICE_GRID_ITEM_CLASS)} role="listitem">
            <GuidedChoiceCard
              density="compact"
              imageKind="equipment"
              title={loadout.title}
              tagline={loadout.why ?? stepCopy.defaultWhy}
              tags={kitSummaryTags(items)}
              selected={selectedLoadoutId === loadout.id}
              onSelect={() => onSelect(loadout)}
              selectAriaLabel={`${selectedLoadoutId === loadout.id ? 'Selected' : 'Apply'} kit ${loadout.title}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
