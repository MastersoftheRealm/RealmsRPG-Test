/**
 * CharacterFilter — pick one of the user's characters to filter list content
 * by that character's stats (level, abilities, skills, speed, prerequisites).
 *
 * Used in Codex feats/skills (and Library power/technique/armament filters).
 * Parent owns value + persistence.
 * Returns null when the user has no characters (after load) so parents need not call useCharacters.
 *
 * Collapsible subsection, collapsed by default (TASK-722). InfoTippy sits
 * immediately after the title so the expand control cannot push it to the
 * far right of the row (TASK-781).
 */

'use client';

import { useId, useState, type ReactNode } from 'react';
import { useCharacters } from '@/hooks';
import { ChevronDown, UserRound } from 'lucide-react';
import { InfoTippy } from '@/components/shared/info-tippy';
import { cn } from '@/lib/utils';
import { FilterNativeSelect } from './filter-native-select';

const CHARACTER_FILTER_NONE_LABEL = 'No character (show all)';

export interface CharacterFilterProps {
  /** Selected character id, or '' for no character (show all). */
  value: string;
  onChange: (characterId: string) => void;
  className?: string;
  /** Section label (default: Filter by character). */
  label?: string;
  /** Tooltip beside the label explaining qualification filtering. */
  helpContent?: string;
  /** Extra content under the select (only when characters exist). Shown when expanded. */
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
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
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

  const selectedLabel = value ? (options.find((o) => o.value === value)?.label ?? null) : null;

  return (
    <div className={cn('filter-group min-w-0', className)}>
      <div className="relative mb-1 flex min-h-[44px] items-center gap-1.5 md:min-h-5">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((v) => !v)}
          className="absolute inset-0 z-0 cursor-pointer rounded-sm"
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
        />
        <UserRound
          className="pointer-events-none relative z-10 h-4 w-4 shrink-0 text-text-muted"
          aria-hidden="true"
        />
        <span className="pointer-events-none relative z-10 text-sm font-medium text-text-secondary">
          {label}
        </span>
        {helpContent ? (
          <InfoTippy
            content={helpContent}
            label="Character filter help"
            size="inline"
            className="relative z-10"
          />
        ) : null}
        {!expanded && selectedLabel ? (
          <span className="pointer-events-none relative z-10 min-w-0 truncate text-xs text-text-muted">
            {selectedLabel}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            'duration-base pointer-events-none relative z-10 h-4 w-4 shrink-0 text-text-muted transition-transform ease-standard',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </div>
      <div id={panelId} hidden={!expanded}>
        <FilterNativeSelect
          id={selectId}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
        >
          {options.map((opt) => (
            <option key={opt.value || 'none'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterNativeSelect>
        {children}
      </div>
    </div>
  );
}
