/**
 * Edit Species Modal — species picker step (single + open mixed modal).
 */

'use client';

import type { KeyboardEvent } from 'react';
import { SelectionCard, SelectionCardSurface } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { CharacterAncestry } from '@/types';
import type { Species } from '@/hooks';
import { GitMerge } from 'lucide-react';

function activateOnEnterOrSpace(e: KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
}

export interface EditSpeciesSpeciesStepProps {
  allSpecies: Species[];
  draftAncestry: CharacterAncestry | null;
  isMixed: boolean;
  onOpenMixed: () => void;
  onSelectSingle: (s: Species) => void;
}

export function EditSpeciesSpeciesStep({
  allSpecies,
  draftAncestry,
  isMixed,
  onOpenMixed,
  onSelectSingle,
}: EditSpeciesSpeciesStepProps) {
  return (
    <>
      <p className="text-sm text-text-secondary">
        Choose a new species (or mixed). Then you&apos;ll set ancestry traits and, for mixed, choose
        2 species skills.
      </p>
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
        {allSpecies.map((s: Species) => {
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
    </>
  );
}
