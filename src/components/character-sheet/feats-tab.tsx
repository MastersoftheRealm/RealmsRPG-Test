/**
 * Feats Tab Component
 * ===================
 * Combined view of traits and feats for the character sheet.
 * List rendering via FeatsTraitsListSection (entity-library-sections).
 */

'use client';

import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { FeatsTraitsListSection } from '@/components/shared';
import type { ChipData } from '@/components/shared/grid-list-row';
import type { SortState } from '@/components/shared';
import { DecrementButton, IncrementButton } from '@/components/shared';
import { toggleSort, sortByColumn } from '@/hooks/use-sort';
import { useCodexSkills } from '@/hooks';
import { cn } from '@/lib/utils';
import { buildFeatLevelChips, getFeatFamilyId, getFeatLevel, formatFeatName } from '@/lib/leveled-feats';
import {
  getMaxQualifiedFeatLevel,
  type CharacterForFeatRequirement,
} from '@/lib/game/feat-requirements';
import { mapTraitRows, mapFeatRows, type FeatRowContext, type FeatLevelMeta } from './library-feat-rows';

interface TraitData {
  name: string;
  description?: string;
  maxUses?: number;
  recoveryPeriod?: string;
}

interface CodexTrait {
  id: string;
  name: string;
  description?: string;
  uses_per_rec?: number;
  rec_period?: string;
}

interface CodexFeat {
  id: string;
  name: string;
  description?: string;
  effect?: string;
  max_uses?: number;
  uses_per_rec?: number;
  rec_period?: string;
  category?: string;
  feat_lvl?: number;
  base_feat_id?: string;
}

interface FeatData {
  id?: string | number;
  name: string;
  description?: string;
  maxUses?: number;
  currentUses?: number;
  recovery?: string;
  type?: 'archetype' | 'character' | 'state';
}

interface CharacterAncestry {
  selectedTraits?: string[];
  selectedFlaw?: string | null;
  selectedCharacteristic?: string | null;
}

interface VanillaTraitFields {
  ancestryTraits?: string[];
  flawTrait?: string | null;
  characteristicTrait?: string | null;
  speciesTraits?: string[];
}

interface FeatsTabProps {
  ancestry?: CharacterAncestry;
  vanillaTraits?: VanillaTraitFields;
  speciesTraitsFromCodex?: string[];
  traits?: TraitData[];
  traitsDb?: CodexTrait[];
  featsDb?: CodexFeat[];
  traitUses?: Record<string, number>;
  archetypeFeats?: FeatData[];
  characterFeats?: FeatData[];
  stateFeats?: FeatData[];
  stateUsesCurrent?: number;
  stateUsesMax?: number;
  onStateUsesChange?: (delta: number) => void;
  onEnterState?: () => void;
  isEditMode?: boolean;
  showEditControls?: boolean;
  maxArchetypeFeats?: number;
  maxCharacterFeats?: number;
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onFeatLevelChange?: (featId: string, targetLevel: number, listType: 'archetype' | 'character') => void;
  featRequirementCharacter?: CharacterForFeatRequirement;
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
  onAddStateFeat?: () => void;
  onRemoveFeat?: (featId: string, featName?: string) => void;
}

export function FeatsTab({
  ancestry,
  vanillaTraits,
  speciesTraitsFromCodex = [],
  traits = [],
  traitsDb = [],
  featsDb = [],
  traitUses = {},
  archetypeFeats = [],
  characterFeats = [],
  stateFeats = [],
  stateUsesCurrent,
  stateUsesMax = 0,
  onStateUsesChange,
  onEnterState,
  isEditMode: _isEditMode = false,
  showEditControls = false,
  maxArchetypeFeats,
  maxCharacterFeats,
  onFeatUsesChange,
  onFeatLevelChange,
  featRequirementCharacter,
  onTraitUsesChange,
  onAddArchetypeFeat,
  onAddCharacterFeat,
  onAddStateFeat,
  onRemoveFeat,
}: FeatsTabProps) {
  const { data: codexSkills = [] } = useCodexSkills();

  const getFeatLevelForCharacter = useCallback(
    (feat: FeatData): number => {
      const dbFeat = featsDb.find((f) => String(f.id) === String(feat.id));
      return dbFeat?.feat_lvl != null && dbFeat.feat_lvl > 0 ? dbFeat.feat_lvl : 1;
    },
    [featsDb]
  );
  const usedArchetypeSlots = useMemo(
    () => archetypeFeats.reduce((sum, feat) => sum + getFeatLevelForCharacter(feat), 0),
    [archetypeFeats, getFeatLevelForCharacter]
  );
  const usedCharacterSlots = useMemo(
    () => characterFeats.reduce((sum, feat) => sum + getFeatLevelForCharacter(feat), 0),
    [characterFeats, getFeatLevelForCharacter]
  );
  const archetypeOver = maxArchetypeFeats !== undefined && usedArchetypeSlots > maxArchetypeFeats;
  const characterOver = maxCharacterFeats !== undefined && usedCharacterSlots > maxCharacterFeats;

  const featLevelsByFamily = useMemo(() => {
    const map = new Map<string, CodexFeat[]>();
    featsDb.forEach((feat) => {
      const family = getFeatFamilyId(feat);
      if (!map.has(family)) map.set(family, []);
      map.get(family)!.push(feat);
    });
    map.forEach((levels) => levels.sort((a, b) => getFeatLevel(a) - getFeatLevel(b)));
    return map;
  }, [featsDb]);

  const getFeatLevelMeta = useCallback(
    (featId: string | number): FeatLevelMeta | undefined => {
      if (!showEditControls || !featRequirementCharacter) return undefined;
      const feat = featsDb.find((f) => String(f.id) === String(featId));
      if (!feat) return undefined;
      const family = featLevelsByFamily.get(getFeatFamilyId(feat)) ?? [];
      if (family.length <= 1) return undefined;
      return {
        currentLevel: getFeatLevel(feat),
        minLevel: getFeatLevel(family[0]),
        maxQualified: getMaxQualifiedFeatLevel(
          featRequirementCharacter,
          family,
          codexSkills,
          featsDb
        ),
        featName: feat.name ?? String(featId),
      };
    },
    [showEditControls, featRequirementCharacter, featsDb, featLevelsByFamily, codexSkills]
  );

  const includeLevelColumn = useMemo(
    () =>
      showEditControls &&
      [...archetypeFeats, ...characterFeats].some((f) => getFeatLevelMeta(f.id ?? f.name) != null),
    [showEditControls, archetypeFeats, characterFeats, getFeatLevelMeta]
  );

  const getFeatLevelDetailSections = useCallback(
    (featId: string | number) => {
      const feat = featsDb.find((f) => String(f.id) === String(featId));
      if (!feat) return undefined;
      const family = featLevelsByFamily.get(getFeatFamilyId(feat)) || [];
      const chips = buildFeatLevelChips(family, feat.id);
      if (chips.length === 0) return undefined;
      return [{ label: 'Feat Levels', chips }] as Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }>;
    },
    [featsDb, featLevelsByFamily]
  );

  const [traitSort, setTraitSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [archetypeFeatSort, setArchetypeFeatSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [characterFeatSort, setCharacterFeatSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [stateFeatSort, setStateFeatSort] = useState<SortState>({ col: 'name', dir: 1 });

  const enrichTrait = useCallback(
    (traitNameOrId: string) => {
      let dbTrait = traitsDb.find(
        (t) => String(t.name ?? '').toLowerCase() === String(traitNameOrId ?? '').toLowerCase()
      );
      if (!dbTrait) {
        dbTrait = traitsDb.find((t) => t.id === traitNameOrId);
      }
      return {
        name: dbTrait?.name || traitNameOrId,
        description: dbTrait?.description,
        maxUses: dbTrait?.uses_per_rec ?? 0,
        recoveryPeriod: dbTrait?.rec_period,
      };
    },
    [traitsDb]
  );

  const enrichFeat = useCallback(
    (feat: FeatData) => {
      let dbFeat = featsDb.find((f) => f.id === String(feat.id));
      if (!dbFeat) {
        dbFeat = featsDb.find((f) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase());
      }
      const featLvl = dbFeat?.feat_lvl;
      const name = feat.name || dbFeat?.name || String(feat.id);
      const displayName =
        featLvl != null && featLvl > 1
          ? formatFeatName({ id: String(feat.id ?? name), name, feat_lvl: featLvl })
          : name;
      return {
        ...feat,
        name: displayName,
        description: feat.description || dbFeat?.description || dbFeat?.effect,
        maxUses: feat.maxUses ?? dbFeat?.uses_per_rec ?? dbFeat?.max_uses ?? 0,
        recovery: feat.recovery || dbFeat?.rec_period,
      };
    },
    [featsDb]
  );

  const allTraitsWithCategories = useMemo(() => {
    const result: { name: string; category: 'ancestry' | 'flaw' | 'characteristic' | 'species' }[] = [];

    if (speciesTraitsFromCodex?.length) {
      speciesTraitsFromCodex.forEach((name) => result.push({ name, category: 'species' }));
    } else if (vanillaTraits?.speciesTraits?.length) {
      vanillaTraits.speciesTraits.forEach((name) => result.push({ name, category: 'species' }));
    }

    if (ancestry?.selectedTraits?.length) {
      ancestry.selectedTraits.forEach((name) => result.push({ name, category: 'ancestry' }));
    }
    if (ancestry?.selectedFlaw) result.push({ name: ancestry.selectedFlaw, category: 'flaw' });
    if (ancestry?.selectedCharacteristic) {
      result.push({ name: ancestry.selectedCharacteristic, category: 'characteristic' });
    }

    const hasNewFormat =
      (ancestry?.selectedTraits?.length ?? 0) > 0 || ancestry?.selectedFlaw || ancestry?.selectedCharacteristic;

    if (!hasNewFormat && vanillaTraits) {
      if (vanillaTraits.flawTrait) result.push({ name: vanillaTraits.flawTrait, category: 'flaw' });
      if (vanillaTraits.characteristicTrait) {
        result.push({ name: vanillaTraits.characteristicTrait, category: 'characteristic' });
      }
      if (vanillaTraits.ancestryTraits?.length) {
        vanillaTraits.ancestryTraits.forEach((name) => result.push({ name, category: 'ancestry' }));
      }
    }

    return result;
  }, [ancestry, vanillaTraits, speciesTraitsFromCodex]);

  const processedTraits = useMemo(() => {
    const enriched = allTraitsWithCategories.map((t) => ({
      ...t,
      ...enrichTrait(t.name),
    }));
    traits.forEach((trait) => {
      const e = enrichTrait(trait.name);
      enriched.push({
        name: e.name,
        description: e.description || trait.description,
        maxUses: e.maxUses || trait.maxUses || 0,
        recoveryPeriod: e.recoveryPeriod || trait.recoveryPeriod,
        category: 'species' as const,
      });
    });
    return sortByColumn(enriched, traitSort);
  }, [allTraitsWithCategories, traits, enrichTrait, traitSort]);

  const processedArchetypeFeats = useMemo(
    () => sortByColumn(archetypeFeats.map(enrichFeat), archetypeFeatSort),
    [archetypeFeats, enrichFeat, archetypeFeatSort]
  );
  const processedCharacterFeats = useMemo(
    () => sortByColumn(characterFeats.map(enrichFeat), characterFeatSort),
    [characterFeats, enrichFeat, characterFeatSort]
  );
  const processedStateFeats = useMemo(
    () =>
      sortByColumn(
        stateFeats.map((f) => ({ ...enrichFeat(f), stateType: f.type || 'character' })),
        stateFeatSort
      ),
    [stateFeats, enrichFeat, stateFeatSort]
  );

  const featRowContext = useMemo<FeatRowContext>(
    () => ({
      showEditControls,
      traitUses,
      onTraitUsesChange,
      onFeatUsesChange,
      onRemoveFeat,
      getFeatLevelDetailSections,
      getFeatLevelMeta,
    }),
    [
      showEditControls,
      traitUses,
      onTraitUsesChange,
      onFeatUsesChange,
      onRemoveFeat,
      getFeatLevelDetailSections,
      getFeatLevelMeta,
    ]
  );

  const archetypeFeatRowContext = useMemo<FeatRowContext>(
    () => ({
      ...featRowContext,
      onFeatLevelChange: onFeatLevelChange
        ? (featId, targetLevel) => onFeatLevelChange(featId, targetLevel, 'archetype')
        : undefined,
    }),
    [featRowContext, onFeatLevelChange]
  );

  const characterFeatRowContext = useMemo<FeatRowContext>(
    () => ({
      ...featRowContext,
      onFeatLevelChange: onFeatLevelChange
        ? (featId, targetLevel) => onFeatLevelChange(featId, targetLevel, 'character')
        : undefined,
    }),
    [featRowContext, onFeatLevelChange]
  );

  const traitRows = useMemo(() => mapTraitRows(processedTraits, featRowContext), [processedTraits, featRowContext]);
  const archetypeFeatRows = useMemo(
    () => mapFeatRows(processedArchetypeFeats, archetypeFeatRowContext),
    [processedArchetypeFeats, archetypeFeatRowContext]
  );
  const characterFeatRows = useMemo(
    () => mapFeatRows(processedCharacterFeats, characterFeatRowContext),
    [processedCharacterFeats, characterFeatRowContext]
  );
  const stateFeatRows = useMemo(
    () =>
      mapFeatRows(
        processedStateFeats.map(({ stateType, ...feat }) => feat),
        featRowContext
      ).map((row, index) => ({
        ...row,
        badges: [
          {
            label: processedStateFeats[index]?.stateType === 'archetype' ? 'Archetype' : 'Character',
            color: 'blue' as const,
          },
        ],
      })),
    [processedStateFeats, featRowContext]
  );

  const hasTraits = traitRows.length > 0;
  const hasArchetypeFeats = archetypeFeatRows.length > 0;
  const hasCharacterFeats = characterFeatRows.length > 0;
  const hasStateFeats = stateFeatRows.length > 0;

  const stateHeaderRight: ReactNode =
    stateUsesMax > 0 ? (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {onStateUsesChange ? (
            <>
              <DecrementButton
                onClick={() => onStateUsesChange(-1)}
                disabled={(stateUsesCurrent ?? stateUsesMax) <= 0}
                size="sm"
              />
              <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
                {stateUsesCurrent ?? stateUsesMax}/{stateUsesMax}
              </span>
              <IncrementButton
                onClick={() => onStateUsesChange(1)}
                disabled={(stateUsesCurrent ?? stateUsesMax) >= stateUsesMax}
                size="sm"
              />
            </>
          ) : (
            <span className="text-sm font-medium tabular-nums">
              {stateUsesCurrent ?? stateUsesMax}/{stateUsesMax}
            </span>
          )}
        </div>
        {onEnterState && (
          <button
            type="button"
            onClick={onEnterState}
            disabled={(stateUsesCurrent ?? stateUsesMax) <= 0}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              (stateUsesCurrent ?? stateUsesMax) > 0
                ? 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-100 dark:text-white dark:hover:bg-primary-50'
                : 'bg-surface-alt text-text-muted dark:text-text-secondary cursor-not-allowed'
            )}
          >
            Enter State
          </button>
        )}
      </div>
    ) : undefined;

  return (
    <div className="space-y-6">
      <FeatsTraitsListSection
        title="Traits"
        items={traitRows}
        sortState={traitSort}
        onSort={(col) => setTraitSort(toggleSort(traitSort, col))}
        emptyMessage="No traits"
      />

      <FeatsTraitsListSection
        title="Archetype Feats"
        items={archetypeFeatRows}
        includeLevelColumn={includeLevelColumn}
        onAdd={showEditControls ? onAddArchetypeFeat : undefined}
        addLabel="Add archetype feat"
        headerRightContent={
          showEditControls && maxArchetypeFeats !== undefined ? (
            <span
              className={cn(
                'tabular-nums text-sm font-medium',
                archetypeOver && 'text-danger-600 dark:text-danger-400'
              )}
            >
              {usedArchetypeSlots}/{maxArchetypeFeats}
            </span>
          ) : undefined
        }
        addButtonClassName={
          archetypeOver
            ? 'text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300 hover:bg-danger-50 dark:hover:bg-danger-900/30'
            : undefined
        }
        sortState={archetypeFeatSort}
        onSort={(col) => setArchetypeFeatSort(toggleSort(archetypeFeatSort, col))}
        rowChrome={{ delete: !!(showEditControls && onRemoveFeat) }}
        emptyMessage="No archetype feats selected"
      />

      <FeatsTraitsListSection
        title="Character Feats"
        items={characterFeatRows}
        includeLevelColumn={includeLevelColumn}
        onAdd={showEditControls ? onAddCharacterFeat : undefined}
        addLabel="Add character feat"
        headerRightContent={
          showEditControls && maxCharacterFeats !== undefined ? (
            <span
              className={cn(
                'tabular-nums text-sm font-medium',
                characterOver && 'text-danger-600 dark:text-danger-400'
              )}
            >
              {usedCharacterSlots}/{maxCharacterFeats}
            </span>
          ) : undefined
        }
        addButtonClassName={
          characterOver
            ? 'text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300 hover:bg-danger-50 dark:hover:bg-danger-900/30'
            : undefined
        }
        sortState={characterFeatSort}
        onSort={(col) => setCharacterFeatSort(toggleSort(characterFeatSort, col))}
        rowChrome={{ delete: !!(showEditControls && onRemoveFeat) }}
        emptyMessage="No character feats selected"
      />

      {hasStateFeats && (
        <FeatsTraitsListSection
          title="State Feats"
          items={stateFeatRows}
          onAdd={showEditControls ? onAddStateFeat : undefined}
          addLabel="Add state feat"
          headerRightContent={stateHeaderRight}
          sortState={stateFeatSort}
          onSort={(col) => setStateFeatSort(toggleSort(stateFeatSort, col))}
          rowChrome={{ delete: !!(showEditControls && onRemoveFeat) }}
        />
      )}

      {!hasTraits && !hasArchetypeFeats && !hasCharacterFeats && !hasStateFeats && (
        <div className="text-center py-8 text-text-muted dark:text-text-secondary">
          <p className="text-sm italic">No traits or feats to display</p>
        </div>
      )}
    </div>
  );
}

export default FeatsTab;
