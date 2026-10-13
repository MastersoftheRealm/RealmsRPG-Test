/**
 * Edit Species Modal — species picker step (single + open mixed modal).
 */

'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { EmptyState, SearchInput, SelectionCard, SelectionCardSurface } from '@/components/ui';
import { SegmentedControl, type SourceFilterValue } from '@/components/patterns';
import { cn } from '@/lib/utils';
import type { CharacterAncestry } from '@/types';
import type { Species } from '@/hooks';
import { GitMerge } from 'lucide-react';
import { filterSheetSpecies } from './edit-species-species-filter';

function activateOnEnterOrSpace(e: KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
}

export interface EditSpeciesSpeciesStepProps {
  allSpecies: Species[];
  userSpeciesIds: Set<string>;
  draftAncestry: CharacterAncestry | null;
  isMixed: boolean;
  onOpenMixed: () => void;
  onSelectSingle: (s: Species) => void;
}

export function EditSpeciesSpeciesStep({
  allSpecies,
  userSpeciesIds,
  draftAncestry,
  isMixed,
  onOpenMixed,
  onSelectSingle,
}: EditSpeciesSpeciesStepProps) {
  const [source, setSource] = useState<SourceFilterValue>('all');
  const [query, setQuery] = useState('');
  const visibleSpecies = useMemo(
    () => filterSheetSpecies(allSpecies, userSpeciesIds, source, query),
    [allSpecies, userSpeciesIds, source, query],
  );
  const mySourceEmpty =
    source === 'my' && allSpecies.filter((species) => userSpeciesIds.has(species.id)).length === 0;

  return (
    <>
      <p className="text-sm text-text-secondary">
        Choose a new species (or mixed). Then you&apos;ll set ancestry traits and, for mixed, choose
        2 species skills.
      </p>
      <SearchInput
        value={query}
        onChange={setQuery}
        size="sm"
        placeholder="Search species..."
        aria-label="Search species"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-text-secondary">Source:</span>
        <SegmentedControl
          value={source}
          onChange={setSource}
          options={
            [
              { value: 'all', label: 'All sources' },
              { value: 'public', label: 'Public species' },
              { value: 'my', label: 'My species' },
            ] satisfies { value: SourceFilterValue; label: string }[]
          }
          aria-label="Species list source"
          className="min-w-0 flex-1 sm:flex-initial"
        />
      </div>
      {mySourceEmpty ? (
        <EmptyState
          title="No custom species yet"
          description="Create one in the Species Creator, then return here to build a mixed species."
          size="sm"
          action={{
            label: 'Open Species Creator',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.open('/species-creator', '_blank', 'noopener,noreferrer');
              }
            },
          }}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectionCardSurface
          role="button"
          tabIndex={0}
          selected={isMixed}
          onClick={onOpenMixed}
          onKeyDown={(e) => activateOnEnterOrSpace(e, onOpenMixed)}
          className={cn(
            'flex min-h-[100px] flex-col items-center justify-center border-dashed',
            isMixed
              ? 'border-primary-outline-border'
              : 'border-border hover:border-primary-outline-border',
          )}
        >
          <GitMerge className="mb-1 h-8 w-8 text-primary-link-fg" />
          <span className="font-medium text-text-primary">Mixed species</span>
        </SelectionCardSurface>
        {mySourceEmpty
          ? null
          : visibleSpecies.map((s: Species) => {
              const isSelected =
                !isMixed && draftAncestry?.id && String(draftAncestry.id) === String(s.id);
              return (
                <SelectionCard
                  key={s.id}
                  selected={Boolean(isSelected)}
                  onClick={() => onSelectSingle(s)}
                  className="min-h-[100px] text-left"
                >
                  <span className="block font-medium text-text-primary">{s.name}</span>
                  <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{s.description}</p>
                </SelectionCard>
              );
            })}
      </div>
      {!mySourceEmpty && visibleSpecies.length === 0 ? (
        <EmptyState
          title={query.trim() ? 'No species match your search.' : 'No species match your filters.'}
          size="sm"
        />
      ) : null}
    </>
  );
}
