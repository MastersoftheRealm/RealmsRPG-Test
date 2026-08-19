/**
 * PowerTechniqueFilters — Category / Energy / TP / Action / (power) Innate filters.
 * Composes ChipSelect, SelectFilter, CharacterFilter (TASK-673 / TASK-676).
 */

'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { InfoTippy } from '@/components/patterns/help/info-tippy';
import { useCharacter } from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { derivePowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import { ChipSelect } from './chip-select';
import { SelectFilter } from './select-filter';
import { CharacterFilter } from './character-filter';
import { FilterInput } from './filter-native-select';
import { ArchetypePathFilter, type ArchetypePathFilterProps } from './archetype-path-filter';
import {
  POWER_TECHNIQUE_ACTION_FILTER_OPTIONS,
  REACTION_FILTER_OPTIONS,
  withCharacterContextApplied,
  withInnateThresholdSelected,
  type PowerTechniqueFilterKind,
  type PowerTechniqueFilterState,
  type ReactionFilterMode,
} from '@/lib/library/power-technique-filters';
import {
  readInitialLibraryCharacterFilterId,
  writePersistedLibraryCharacterFilterId,
} from '@/lib/library/character-filter-persistence';
import { FILTER_CONTROL_ROW_CLASS, FILTER_LABEL_ROW_CLASS } from './filter-utils';
import { cn } from '@/lib/utils';

const INNATE_THRESHOLD_HELP =
  'Innate Threshold is the maximum Energy a power may cost to be Innate. Power characters start at 8 and rise to 14 with level (not a direct Power Proficiency table). Powered-Martial starts at 6; at milestones (every 3 levels from 4) choose Increase Innate Power (6→8, then +1; also +1 Innate Pool) or an Additional Feat. Selecting a threshold enables Innate Eligible. With a character selected, Innate Eligible uses that character’s threshold.';

const CHARACTER_FILTER_HELP =
  'Caps Max Energy to this character’s max Energy. When Innate Eligible is on (powers), locks Power Threshold to their Innate Threshold. Optionally keep only entries whose Training Points cost fits remaining TP (from owned proficiencies).';

const SET_BY_CHARACTER_HINT = 'Set by character';

export interface PowerTechniqueFiltersProps {
  kind: PowerTechniqueFilterKind;
  value: PowerTechniqueFilterState;
  onChange: (next: PowerTechniqueFilterState) => void;
  /** Category options derived from the current list. */
  categoryOptions: string[];
  /** Innate Threshold dropdown values from `listInnateThresholdFilterOptions`. */
  innateThresholdOptions?: number[];
  /** Notified when character context changes (for applyPowerTechniqueFilters). */
  onCharacterContextChange?: (ctx: PowerTechniqueCharacterContext | null) => void;
  /** Selected character id ('' when none). Used for add-to-character row actions. */
  onCharacterIdChange?: (characterId: string) => void;
  className?: string;
  showCharacterFilter?: boolean;
  /** Persist character pick (default true). USM/L3 pass false. */
  persistCharacter?: boolean;
  /** Archetype Path filter — last in the grid (TASK-752 / TASK-753). */
  pathFilter?: Pick<ArchetypePathFilterProps, 'options' | 'selectedPathIds' | 'onChange'> | null;
}

export function PowerTechniqueFilters({
  kind,
  value,
  onChange,
  categoryOptions,
  innateThresholdOptions = [],
  onCharacterContextChange,
  onCharacterIdChange,
  className,
  persistCharacter = true,
  showCharacterFilter = true,
  pathFilter,
}: PowerTechniqueFiltersProps) {
  const energyMaxId = useId();
  const tpMaxId = useId();
  const innateEligibleId = useId();
  const affordableTpId = useId();
  const { rules } = useGameRules();

  const [characterId, setCharacterId] = useState(() =>
    readInitialLibraryCharacterFilterId(persistCharacter),
  );

  const { data: characterResult } = useCharacter(characterId || undefined);
  const character = characterResult?.character ?? undefined;
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const syncedCharacterIdRef = useRef<string | null>(null);

  const characterContext = useMemo(() => {
    if (!characterId || !character) return null;
    return derivePowerTechniqueCharacterContext(character, rules);
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
        syncedCharacterIdRef.current = null;
        onChange(withCharacterContextApplied(valueRef.current, null));
      } else {
        // Force re-sync when switching characters (effect waits for loaded context).
        syncedCharacterIdRef.current = null;
      }
    },
    [onChange, persistCharacter],
  );

  // Sync Max Energy / innate threshold once per selected character load (not on every edit).
  useEffect(() => {
    if (!characterId) return;
    if (!characterContext) return;
    if (syncedCharacterIdRef.current === characterId) return;
    syncedCharacterIdRef.current = characterId;
    onChange(withCharacterContextApplied(valueRef.current, characterContext));
  }, [characterId, characterContext, onChange]);

  const hasCharacter = Boolean(characterId && characterContext);

  const set = (patch: Partial<PowerTechniqueFilterState>) => {
    onChange({ ...value, ...patch });
  };

  const handleInnateEligibleChange = (checked: boolean) => {
    if (!checked) {
      set({ innateEligibleOnly: false, innateThreshold: null });
      return;
    }
    if (characterContext && characterContext.innateThreshold > 0) {
      set({
        innateEligibleOnly: true,
        innateThreshold: characterContext.innateThreshold,
      });
      return;
    }
    set({ innateEligibleOnly: true });
  };

  const energyLockedByCharacter = hasCharacter;
  const thresholdLockedByCharacter = hasCharacter && value.innateEligibleOnly;

  const controls = (
    <>
      {showCharacterFilter ? (
        <CharacterFilter
          value={characterId}
          onChange={handleCharacterChange}
          className="mb-4 max-w-md border-b border-border-light pb-4"
          helpContent={CHARACTER_FILTER_HELP}
        >
          {hasCharacter && characterContext ? (
            <p className="mt-2 text-xs text-text-secondary">
              {character?.name}: max Energy {characterContext.maxEnergy}
              {kind === 'power' && characterContext.innateThreshold > 0
                ? ` · Innate Threshold ${characterContext.innateThreshold}`
                : ''}
              {` · TP ${characterContext.tpSpent}/${characterContext.tpTotal} (${characterContext.tpRemaining} remaining)`}
            </p>
          ) : null}
        </CharacterFilter>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ChipSelect
          label="Category"
          placeholder="Choose category"
          options={categoryOptions.map((c) => ({ value: c, label: c }))}
          selectedValues={value.categories}
          onSelect={(v) => set({ categories: [...value.categories, v] })}
          onRemove={(v) => set({ categories: value.categories.filter((c) => c !== v) })}
        />

        <div className={cn('filter-group min-w-0', energyLockedByCharacter && 'opacity-60')}>
          <div className={FILTER_LABEL_ROW_CLASS}>
            <label
              htmlFor={energyMaxId}
              className="text-sm leading-5 font-medium text-text-secondary"
            >
              Max Energy
            </label>
            {energyLockedByCharacter ? (
              <span className="text-xs text-text-muted">{SET_BY_CHARACTER_HINT}</span>
            ) : null}
          </div>
          <FilterInput
            id={energyMaxId}
            type="number"
            min={0}
            value={value.energyMax ?? ''}
            disabled={energyLockedByCharacter}
            onChange={(e) =>
              set({
                energyMax: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            placeholder={energyLockedByCharacter ? SET_BY_CHARACTER_HINT : 'No max'}
          />
        </div>

        <div className="filter-group min-w-0">
          <div className={FILTER_LABEL_ROW_CLASS}>
            <label htmlFor={tpMaxId} className="text-sm leading-5 font-medium text-text-secondary">
              Max TP
            </label>
          </div>
          <FilterInput
            id={tpMaxId}
            type="number"
            min={0}
            value={value.tpMax ?? ''}
            onChange={(e) =>
              set({
                tpMax: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            placeholder="No max"
          />
        </div>

        <ChipSelect
          label="Action Type"
          placeholder="Choose action type"
          options={POWER_TECHNIQUE_ACTION_FILTER_OPTIONS}
          selectedValues={value.actionTypes}
          onSelect={(v) => set({ actionTypes: [...value.actionTypes, v] })}
          onRemove={(v) => set({ actionTypes: value.actionTypes.filter((a) => a !== v) })}
        />

        <SelectFilter
          label="Action / Reaction"
          value={value.reactionMode}
          options={REACTION_FILTER_OPTIONS}
          onChange={(v) => set({ reactionMode: v as ReactionFilterMode })}
          placeholder={null}
        />

        {kind === 'power' ? (
          <>
            <SelectFilter
              label="Power Threshold (Innate)"
              value={value.innateThreshold != null ? String(value.innateThreshold) : ''}
              options={innateThresholdOptions.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              onChange={(v) => onChange(withInnateThresholdSelected(value, v))}
              placeholder={thresholdLockedByCharacter ? SET_BY_CHARACTER_HINT : 'Any'}
              disabled={thresholdLockedByCharacter}
              disabledHint={thresholdLockedByCharacter ? SET_BY_CHARACTER_HINT : undefined}
              labelAccessory={
                <InfoTippy
                  content={INNATE_THRESHOLD_HELP}
                  label="Innate threshold filter help"
                  size="inline"
                />
              }
            />

            <div className="filter-group min-w-0">
              <div className={FILTER_LABEL_ROW_CLASS}>
                <label
                  htmlFor={innateEligibleId}
                  className="text-sm leading-5 font-medium text-text-secondary"
                >
                  Innate Eligible
                </label>
              </div>
              <div className={FILTER_CONTROL_ROW_CLASS}>
                <input
                  id={innateEligibleId}
                  type="checkbox"
                  checked={value.innateEligibleOnly}
                  onChange={(e) => handleInnateEligibleChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border-light text-primary-fg focus:ring-primary-outline-border"
                />
                <span className="ml-2 text-sm text-text-primary">Only innate-eligible</span>
              </div>
            </div>
          </>
        ) : null}

        {hasCharacter ? (
          <div className="filter-group min-w-0">
            <div className={FILTER_LABEL_ROW_CLASS}>
              <label
                htmlFor={affordableTpId}
                className="text-sm leading-5 font-medium text-text-secondary"
              >
                Available TP
              </label>
            </div>
            <div className={cn(FILTER_CONTROL_ROW_CLASS)}>
              <input
                id={affordableTpId}
                type="checkbox"
                checked={value.affordableTpOnly}
                onChange={(e) => set({ affordableTpOnly: e.target.checked })}
                className="h-4 w-4 rounded border-border-light text-primary-fg focus:ring-primary-outline-border"
              />
              <span className="ml-2 text-sm text-text-primary">
                ≤ {characterContext?.tpRemaining ?? 0} remaining
              </span>
            </div>
          </div>
        ) : null}

        {pathFilter ? (
          <ArchetypePathFilter
            options={pathFilter.options}
            selectedPathIds={pathFilter.selectedPathIds}
            onChange={pathFilter.onChange}
          />
        ) : null}
      </div>
    </>
  );

  return <div className={cn('space-y-3', className)}>{controls}</div>;
}
