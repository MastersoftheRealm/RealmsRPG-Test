/**
 * CharacterFilter — pick one of the user's characters to filter list content
 * by that character's stats (level, abilities, skills, speed, prerequisites).
 *
 * Used in Codex feats (and Library power/technique filters). Parent owns value + persistence.
 * Returns null when the user has no characters (after load) so parents need not call useCharacters.
 */

'use client';

import { useId, type ReactNode } from 'react';
import { useCharacters } from '@/hooks';
import { UserRound } from 'lucide-react';
import { Select } from '@/components/ui';
import { InfoTippy } from '@/components/shared/info-tippy';
import { cn } from '@/lib/utils';

export const CHARACTER_FILTER_NONE_LABEL = 'No character (show all)';

export interface CharacterFilterProps {
  /** Selected character id, or '' for no character (show all). */
  value: string;
  onChange: (characterId: string) => void;
  className?: string;
  /** Section label (default: Filter by character). */
  label?: string;
  /** Tooltip beside the label explaining qualification filtering. */
  helpContent?: string;
  /** Extra content under the select (only when characters exist). */
  children?: ReactNode;
}

export function CharacterFilter({
  value,
  onChange,
  className,
  label = 'Filter by character',
  helpContent = 'Show only entries this character qualifies for. Level and ability requirements use the character\u2019s stats instead of manual filters.',
  children,
}: CharacterFilterProps) {
  const selectId = useId();
  const { data: characters = [], isLoading } = useCharacters();

  if (!isLoading && characters.length === 0) return null;

  const options = [
    { value: '', label: CHARACTER_FILTER_NONE_LABEL },
    ...[...characters]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        value: c.id,
        label: c.level ? `${c.name} · Lv ${c.level}` : c.name,
      })),
  ];

  return (
    <div className={cn('filter-group min-w-0', className)}>
      <div className="mb-1 flex items-center gap-1.5">
        <UserRound className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
        <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
        {helpContent ? (
          <InfoTippy content={helpContent} label="Character filter help" size="inline" />
        ) : null}
      </div>
      <Select
        id={selectId}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        disabled={isLoading}
        className="h-11"
      />
      {children}
    </div>
  );
}
