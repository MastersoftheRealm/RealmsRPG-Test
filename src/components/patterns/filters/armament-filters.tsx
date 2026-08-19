/**
 * ArmamentFilters — Filter by character + optional currency affordability (TASK-680).
 * Codex mixed equipment extras: min/max currency + rarity-by-level (TASK-723).
 * Composes CharacterFilter (panel body). Shared library character persistence.
 */

'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { useCharacter } from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { deriveArmamentCharacterContext } from '@/lib/library/armament-character-context';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import type { ArmamentFilterState } from '@/lib/library/armament-filters';
import { maxRarityForCharacterLevel } from '@/lib/game/creator-constants';
import {
  readInitialLibraryCharacterFilterId,
  writePersistedLibraryCharacterFilterId,
} from '@/lib/library/character-filter-persistence';
import { CharacterFilter } from './character-filter';
import { FilterInput } from './filter-native-select';
import { FILTER_CONTROL_ROW_CLASS, FILTER_LABEL_ROW_CLASS } from './filter-utils';
import { ArchetypePathFilter, type ArchetypePathFilterProps } from './archetype-path-filter';
import { cn } from '@/lib/utils';

const ARMAMENT_CHARACTER_FILTER_HELP =
  'Show only armaments this character can use: ability requirements and Armament Proficiency (max TP). Optionally keep only entries within their Currency.';

const EQUIPMENT_CHARACTER_FILTER_HELP =
  'Filter this mixed equipment list by a character. Optionally keep only rarities that level can access (Levels by Rarity) and items they can afford.';

function parseOptionalNumber(raw: string): number | null {
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function PathFilterLast(pathFilter: NonNullable<ArmamentFiltersProps['pathFilter']>) {
  return (
    <ArchetypePathFilter
      options={pathFilter.options}
      selectedPathIds={pathFilter.selectedPathIds}
      onChange={pathFilter.onChange}
    />
  );
}

export interface ArmamentFiltersProps {
  value: ArmamentFilterState;
  onChange: (next: ArmamentFilterState) => void;
  onCharacterContextChange?: (ctx: ArmamentCharacterContext | null) => void;
  /** Selected character id ('' when none). Used for add-to-character row actions. */
  onCharacterIdChange?: (characterId: string) => void;
  className?: string;
  /** Persist character pick (default true). USM/L3 pass false. */
  persistCharacter?: boolean;
  /**
   * Codex mixed equipment: min/max currency always, plus rarity-by-level when a
   * character is selected. Library weapons/armor/shields leave this off.
   */
  showEquipmentExtras?: boolean;
  /** Extra filter controls (e.g. Category / Rarity selects) in the panel body. */
  children?: ReactNode;
  /** Archetype Path filter — last in the grid (TASK-752 / TASK-753). */
  pathFilter?: Pick<ArchetypePathFilterProps, 'options' | 'selectedPathIds' | 'onChange'> | null;
}

export function ArmamentFilters({
  value,
  onChange,
  onCharacterContextChange,
  onCharacterIdChange,
  className,
  persistCharacter = true,
  showEquipmentExtras = false,
  children,
  pathFilter,
}: ArmamentFiltersProps) {
  const affordableId = useId();
  const rarityId = useId();
  const minCurrencyId = useId();
  const maxCurrencyId = useId();
  const { rules } = useGameRules();

  const [characterId, setCharacterId] = useState(() =>
    readInitialLibraryCharacterFilterId(persistCharacter),
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
        onChange({
          ...value,
          affordableCurrencyOnly: false,
          rarityAccessibleOnly: false,
        });
      }
    },
    [onChange, persistCharacter, value],
  );

  const hasCharacter = Boolean(characterId && characterContext);
  const maxAccessibleRarity = characterContext
    ? maxRarityForCharacterLevel(characterContext.level)
    : null;

  const controls = (
    <>
      <CharacterFilter
        value={characterId}
        onChange={handleCharacterChange}
        className="mb-4 max-w-md border-b border-border-light pb-4"
        helpContent={
          showEquipmentExtras ? EQUIPMENT_CHARACTER_FILTER_HELP : ARMAMENT_CHARACTER_FILTER_HELP
        }
      >
        {hasCharacter && characterContext ? (
          <p className="mt-2 text-xs text-text-secondary">
            {character?.name}:{' '}
            {showEquipmentExtras
              ? `Level ${characterContext.level} · Currency ${characterContext.currency}`
              : `Armament Proficiency ${characterContext.armamentMax} TP · Currency ${characterContext.currency}`}
          </p>
        ) : null}
      </CharacterFilter>

      {hasCharacter ? (
        <div className="mb-4 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="filter-group min-w-0">
            <div className="mb-1 text-sm font-medium text-text-secondary">Currency</div>
            <label
              htmlFor={affordableId}
              className={cn(FILTER_CONTROL_ROW_CLASS, 'cursor-pointer gap-2')}
            >
              <input
                id={affordableId}
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-border-light text-primary-fg focus:ring-primary-outline-border"
                checked={value.affordableCurrencyOnly}
                onChange={(e) => onChange({ ...value, affordableCurrencyOnly: e.target.checked })}
              />
              <span className="text-sm text-text-primary">
                Within currency (≤ {characterContext!.currency})
              </span>
            </label>
          </div>
          {showEquipmentExtras && maxAccessibleRarity ? (
            <div className="filter-group min-w-0">
              <div className="mb-1 text-sm font-medium text-text-secondary">Rarity</div>
              <label
                htmlFor={rarityId}
                className={cn(FILTER_CONTROL_ROW_CLASS, 'cursor-pointer gap-2')}
              >
                <input
                  id={rarityId}
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-border-light text-primary-fg focus:ring-primary-outline-border"
                  checked={value.rarityAccessibleOnly}
                  onChange={(e) => onChange({ ...value, rarityAccessibleOnly: e.target.checked })}
                />
                <span className="text-sm text-text-primary">
                  Rarity this level can access (≤ {maxAccessibleRarity})
                </span>
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {showEquipmentExtras ? (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
          <div className="filter-group min-w-0">
            <div className={FILTER_LABEL_ROW_CLASS}>
              <label
                htmlFor={minCurrencyId}
                className="text-sm leading-5 font-medium text-text-secondary"
              >
                Min currency
              </label>
            </div>
            <FilterInput
              id={minCurrencyId}
              type="number"
              min={0}
              value={value.minCurrency ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  minCurrency: parseOptionalNumber(e.target.value),
                })
              }
              placeholder="No min"
            />
          </div>
          <div className="filter-group min-w-0">
            <div className={FILTER_LABEL_ROW_CLASS}>
              <label
                htmlFor={maxCurrencyId}
                className="text-sm leading-5 font-medium text-text-secondary"
              >
                Max currency
              </label>
            </div>
            <FilterInput
              id={maxCurrencyId}
              type="number"
              min={0}
              value={value.maxCurrency ?? ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  maxCurrency: parseOptionalNumber(e.target.value),
                })
              }
              placeholder="No max"
            />
          </div>
          {pathFilter ? <PathFilterLast {...pathFilter} /> : null}
        </div>
      ) : (
        <>
          {children}
          {pathFilter ? (
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <PathFilterLast {...pathFilter} />
            </div>
          ) : null}
        </>
      )}
    </>
  );

  return <div className={cn('space-y-3', className)}>{controls}</div>;
}
