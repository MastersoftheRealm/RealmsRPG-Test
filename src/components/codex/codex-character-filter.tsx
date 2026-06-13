/**
 * Codex Character Filter
 * =======================
 * Lets the user pick one of their characters to view the Codex "through" that
 * character. Tabs that support it (currently Feats) use the selection to
 * auto-filter content by the character's stats (level, abilities, skills,
 * speed, etc.) — the same qualification logic the character creator uses.
 *
 * Selection lives at the Codex page level and persists across tabs. Renders
 * nothing when the user has no characters to filter by.
 */

'use client';

import { useId } from 'react';
import { useCharacters } from '@/hooks';
import { UserRound } from 'lucide-react';
import { Select } from '@/components/ui';
import { cn } from '@/lib/utils';

interface CodexCharacterFilterProps {
  /** Selected character id, or '' for no character (show all). */
  value: string;
  onChange: (characterId: string) => void;
  className?: string;
}

export function CodexCharacterFilter({ value, onChange, className }: CodexCharacterFilterProps) {
  const labelId = useId();
  const { data: characters = [], isLoading } = useCharacters();

  // Nothing to filter by — don't render the control at all.
  if (!isLoading && characters.length === 0) return null;

  const options = [
    { value: '', label: 'No character (show all)' },
    ...[...characters]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        value: c.id,
        label: c.level ? `${c.name} · Lv ${c.level}` : c.name,
      })),
  ];

  return (
    <div className={cn('flex items-end gap-2 min-w-0', className)}>
      <UserRound className="w-4 h-4 mb-3 text-text-muted flex-shrink-0" aria-hidden="true" />
      <div className="min-w-[12rem] max-w-xs flex-1">
        <Select
          id={labelId}
          label="View as character"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          options={options}
          disabled={isLoading}
          className="h-11"
        />
      </div>
    </div>
  );
}
