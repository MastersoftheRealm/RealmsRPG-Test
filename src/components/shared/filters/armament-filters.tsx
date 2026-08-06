/**
 * ArmamentFilters — Filter by character + optional currency affordability (TASK-680).
 * Composes CharacterFilter + FilterSection. Shared library character persistence.
 */

'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useCharacter } from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { deriveArmamentCharacterContext } from '@/lib/library/armament-character-context';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import {
  countActiveArmamentFilters,
  EMPTY_ARMAMENT_FILTERS,
  type ArmamentFilterState,
} from '@/lib/library/armament-filters';
import {
  readInitialLibraryCharacterFilterId,
  writePersistedLibraryCharacterFilterId,
} from '@/lib/library/character-filter-persistence';
import { CharacterFilter } from './character-filter';
import { FilterSection } from './filter-section';
import { FILTER_CONTROL_ROW_CLASS } from './filter-utils';
import { cn } from '@/lib/utils';

const CHARACTER_FILTER_HELP =
  'Show only armaments this character can use: ability requirements and Armament Proficiency (max TP). Optionally keep only entries within their Currency.';

export interface ArmamentFiltersProps {
  value: ArmamentFilterState;
  onChange: (next: ArmamentFilterState) => void;
  onCharacterContextChange?: (ctx: ArmamentCharacterContext | null) => void;
  /** Selected character id ('' when none). Used for add-to-character row actions. */
  onCharacterIdChange?: (characterId: string) => void;
  variant?: 'page' | 'compact';
  defaultExpanded?: boolean;
  className?: string;
  persistCharacter?: boolean;
}

export function ArmamentFilters({
  value,
  onChange,
  onCharacterContextChange,
  onCharacterIdChange,
  variant = 'page',
  defaultExpanded,
  className,
  persistCharacter = variant === 'page',
}: ArmamentFiltersProps) {
  const affordableId = useId();
  const { rules } = useGameRules();

  const [characterId, setCharacterId] = useState(() =>
    readInitialLibraryCharacterFilterId(persistCharacter)
  );

  const { data: characterResult } = useCharacter(characterId || undefined);
  const character = characterResult?.character ?? undefined;

  const characterContext = useMemo(() => {
    if (!characterId || !character) return null;
    return deriveArmamentCharacterContext(character, rules);
  }, [characterId, character, rules]);

  useEffect(() => {
    onCharacterContextChange?.(characterContext);
  }, [characterContext, onCharacterContextChange]);

  useEffect(() => {
    onCharacterIdChange?.(characterId);
  }, [characterId, onCharacterIdChange]);

  const handleCharacterChange = useCallback(
    (id: string) => {
      setCharacterId(id);
      if (persistCharacter) writePersistedLibraryCharacterFilterId(id);
      if (!id) {
        onChange({ ...EMPTY_ARMAMENT_FILTERS });
      }
    },
    [onChange, persistCharacter]
  );

  const hasCharacter = Boolean(characterId && characterContext);
  const activeCount = countActiveArmamentFilters(value, hasCharacter);

  return (
    <FilterSection
      variant={variant}
      defaultExpanded={defaultExpanded}
      activeCount={activeCount}
      className={className}
    >
      <CharacterFilter
        value={characterId}
        onChange={handleCharacterChange}
        className="mb-4 max-w-md border-b border-border-light pb-4"
        helpContent={CHARACTER_FILTER_HELP}
      >
        {hasCharacter && characterContext ? (
          <p className="mt-2 text-xs text-text-secondary dark:text-text-secondary">
            {character?.name}: Armament Proficiency {characterContext.armamentMax} TP
            {` · Currency ${characterContext.currency}`}
          </p>
        ) : null}
      </CharacterFilter>

      {hasCharacter ? (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="filter-group min-w-0">
            <div className="mb-1 text-sm font-medium text-text-secondary">Currency</div>
            <label
              htmlFor={affordableId}
              className={cn(FILTER_CONTROL_ROW_CLASS, 'cursor-pointer gap-2')}
            >
              <input
                id={affordableId}
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                checked={value.affordableCurrencyOnly}
                onChange={(e) =>
                  onChange({ ...value, affordableCurrencyOnly: e.target.checked })
                }
              />
              <span className="text-sm text-text-primary">
                Within currency (≤ {characterContext!.currency})
              </span>
            </label>
          </div>
        </div>
      ) : null}
    </FilterSection>
  );
}
