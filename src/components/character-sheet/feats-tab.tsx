/**
 * Feats Tab Component
 * ===================
 * Combined view of traits and feats for the character sheet.
 * List rendering via FeatsTraitsListSection (entity-library-sections).
 */

'use client';

import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { FeatsTraitsListSection } from '@/components/patterns';
import type { ChipData } from '@/components/patterns/list/grid-list-row';
import type { SortState } from '@/components/patterns';
import { DecrementButton, IncrementButton } from '@/components/patterns';
import { toggleSort, sortByColumn } from '@/hooks/use-sort';
import { useCodexSkills } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  buildFeatLevelChips,
  getFeatFamilyId,
  getFeatLevel,
  formatFeatName,
} from '@/lib/leveled-feats';
import {
  checkFeatRequirements,
  getMaxQualifiedFeatLevel,
  type CharacterForFeatRequirement,
} from '@/lib/game/feat-requirements';
import {
  mapTraitRows,
  mapFeatRows,
  resolveTraitCustomizationKey,
  type FeatRowContext,
} from './library-feat-rows';
import { collectSheetTraits } from '@/lib/character/collect-sheet-traits';
import { dedupeEntityRefs } from '@/lib/game/dedupe-saved-parts';
import type { FeatTraitCustomization } from '@/types/feats';

interface TraitData {
  name: string;
  description?: string | undefined;
  maxUses?: number | undefined;
  recoveryPeriod?: string | undefined;
}

interface CodexTrait {
  id: string;
  name: string;
  description?: string | undefined;
  uses_per_rec?: number | undefined;
  rec_period?: string | undefined;
}

interface CodexFeat {
  id: string;
  name: string;
  description?: string | undefined;
  effect?: string | undefined;
  max_uses?: number | undefined;
  uses_per_rec?: number | undefined;
  rec_period?: string | undefined;
  category?: string | undefined;
  ability?: string | string[] | undefined;
  lvl_req?: number | undefined;
  feat_lvl?: number | undefined;
  base_feat_id?: string | undefined;
}

interface FeatData {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  maxUses?: number | undefined;
  currentUses?: number | undefined;
  recovery?: string | undefined;
  type?: 'archetype' | 'character' | 'state' | undefined;
  customName?: string | undefined;
  note?: string | undefined;
}

interface CharacterAncestry {
  selectedTraits?: string[] | undefined;
  selectedFlaw?: string | null | undefined;
  selectedCharacteristic?: string | null | undefined;
}

interface VanillaTraitFields {
  ancestryTraits?: string[] | undefined;
  flawTrait?: string | null | undefined;
  characteristicTrait?: string | null | undefined;
  speciesTraits?: string[] | undefined;
}

interface FeatsTabProps {
  ancestry?: CharacterAncestry | undefined;
  vanillaTraits?: VanillaTraitFields | undefined;
  speciesTraitsFromCodex?: string[] | undefined;
  traits?: TraitData[] | undefined;
  traitsDb?: CodexTrait[] | undefined;
  featsDb?: CodexFeat[] | undefined;
  traitUses?: Record<string, number> | undefined;
  archetypeFeats?: FeatData[] | undefined;
  characterFeats?: FeatData[] | undefined;
  stateFeats?: FeatData[] | undefined;
  stateUsesCurrent?: number | undefined;
  stateUsesMax?: number | undefined;
  onStateUsesChange?: ((delta: number) => void) | undefined;
  onEnterState?: (() => void) | undefined;
  isEditMode?: boolean | undefined;
  showEditControls?: boolean | undefined;
  maxArchetypeFeats?: number | undefined;
  maxCharacterFeats?: number | undefined;
  onFeatUsesChange?: ((featId: string, delta: number) => void) | undefined;
  onFeatLevelChange?:
    | ((featId: string, targetLevel: number, listType: 'archetype' | 'character') => void)
    | undefined;
  featRequirementCharacter?: CharacterForFeatRequirement | undefined;
  onTraitUsesChange?: ((traitName: string, delta: number) => void) | undefined;
  onAddArchetypeFeat?: (() => void) | undefined;
  onAddCharacterFeat?: (() => void) | undefined;
  onAddStateFeat?: (() => void) | undefined;
  onRemoveFeat?: ((featId: string, featName?: string) => void) | undefined;
  traitCustomizations?: Record<string, FeatTraitCustomization> | undefined;
  onFeatCustomizationChange?:
    | ((
        featId: string,
        listType: 'archetype' | 'character',
        updates: Partial<FeatTraitCustomization>,
      ) => void)
    | undefined;
  onTraitCustomizationChange?:
    | ((traitKey: string, updates: Partial<FeatTraitCustomization>) => void)
    | undefined;
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
  traitCustomizations = {},
  onFeatCustomizationChange,
  onTraitCustomizationChange,
}: FeatsTabProps) {
  const { data: codexSkills = [] } = useCodexSkills();

  const getFeatLevelForCharacter = useCallback(
    (feat: FeatData): number => {
      const dbFeat = featsDb.find((f) => String(f.id) === String(feat.id));
      return dbFeat?.feat_lvl != null && dbFeat.feat_lvl > 0 ? dbFeat.feat_lvl : 1;
    },
    [featsDb],
  );
  const usedArchetypeSlots = useMemo(
    () => archetypeFeats.reduce((sum, feat) => sum + getFeatLevelForCharacter(feat), 0),
    [archetypeFeats, getFeatLevelForCharacter],
  );
  const usedCharacterSlots = useMemo(
    () => characterFeats.reduce((sum, feat) => sum + getFeatLevelForCharacter(feat), 0),
    [characterFeats, getFeatLevelForCharacter],
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

  const getFeatLevelDetailSections = useCallback(
    (featId: string | number, listType: 'archetype' | 'character') => {
      const feat = featsDb.find((f) => String(f.id) === String(featId));
      if (!feat) return undefined;
      const family = featLevelsByFamily.get(getFeatFamilyId(feat)) || [];
      if (family.length <= 1) return undefined;
      const canSelect = Boolean(showEditControls && onFeatLevelChange && featRequirementCharacter);
      const maxQualified = canSelect
        ? getMaxQualifiedFeatLevel(featRequirementCharacter!, family, codexSkills, featsDb)
        : 0;
      const chips = buildFeatLevelChips(family, feat.id, {
        includeCurrent: true,
        select: canSelect
          ? {
              featName: feat.name ?? String(featId),
              maxQualified,
              onSelectLevel: (level) => onFeatLevelChange!(String(featId), level, listType),
              unmetReasonFor: (candidate) => {
                const { met, reason } = checkFeatRequirements(
                  candidate,
                  featRequirementCharacter!,
                  codexSkills,
                  featsDb,
                );
                return met ? undefined : reason;
              },
            }
          : undefined,
      });
      if (chips.length === 0) return undefined;
      return [{ label: 'Feat Levels', chips }] as Array<{
        label: string;
        chips: ChipData[];
        hideLabelIfSingle?: boolean | undefined;
      }>;
    },
    [
      featsDb,
      featLevelsByFamily,
      showEditControls,
      onFeatLevelChange,
      featRequirementCharacter,
      codexSkills,
    ],
  );

  const [traitSort, setTraitSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [archetypeFeatSort, setArchetypeFeatSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [characterFeatSort, setCharacterFeatSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [stateFeatSort, setStateFeatSort] = useState<SortState>({ col: 'name', dir: 1 });

  const enrichTrait = useCallback(
    (traitNameOrId: string) => {
      let dbTrait = traitsDb.find(
        (t) => String(t.name ?? '').toLowerCase() === String(traitNameOrId ?? '').toLowerCase(),
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
    [traitsDb],
  );

  const enrichFeat = useCallback(
    (feat: FeatData) => {
      let dbFeat = featsDb.find((f) => f.id === String(feat.id));
      if (!dbFeat) {
        dbFeat = featsDb.find(
          (f) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase(),
        );
      }
      const featLvl = dbFeat?.feat_lvl;
      // Prefer codex name: guided saves historically stored id as name.
      const storedName = feat.name?.trim();
      const name =
        dbFeat?.name ||
        (storedName && storedName !== String(feat.id) ? storedName : undefined) ||
        String(feat.id);
      const codexName =
        featLvl != null && featLvl > 1
          ? formatFeatName({ id: String(feat.id ?? name), name, feat_lvl: featLvl })
          : name;
      return {
        ...feat,
        codexName,
        name: feat.customName?.trim() || codexName,
        description: feat.description || dbFeat?.description || dbFeat?.effect,
        maxUses: feat.maxUses ?? dbFeat?.uses_per_rec ?? dbFeat?.max_uses ?? 0,
        recovery: feat.recovery || dbFeat?.rec_period,
        category: dbFeat?.category,
        ability: dbFeat?.ability,
        reqLevel: dbFeat?.lvl_req,
      };
    },
    [featsDb],
  );

  const allTraitsWithCategories = useMemo(
    () =>
      collectSheetTraits({
        speciesTraitsFromCodex,
        ancestry,
        vanillaTraits,
        legacyTraits: traits,
      }),
    [ancestry, vanillaTraits, speciesTraitsFromCodex, traits],
  );

  const processedTraits = useMemo(() => {
    const enriched = allTraitsWithCategories.map((t) => {
      const base = enrichTrait(t.name);
      const traitKey = resolveTraitCustomizationKey(t.name, traitsDb);
      const custom = traitCustomizations[traitKey];
      return {
        ...base,
        traitKey,
        codexName: base.name,
        customName: custom?.customName,
        note: custom?.note,
        name: custom?.customName?.trim() || base.name,
        category: t.category,
      };
    });
    return sortByColumn(enriched, traitSort);
  }, [allTraitsWithCategories, enrichTrait, traitSort, traitsDb, traitCustomizations]);

  const processedArchetypeFeats = useMemo(
    () => sortByColumn(dedupeEntityRefs(archetypeFeats).map(enrichFeat), archetypeFeatSort),
    [archetypeFeats, enrichFeat, archetypeFeatSort],
  );
  const processedCharacterFeats = useMemo(
    () => sortByColumn(dedupeEntityRefs(characterFeats).map(enrichFeat), characterFeatSort),
    [characterFeats, enrichFeat, characterFeatSort],
  );
  const processedStateFeats = useMemo(
    () =>
      sortByColumn(
        dedupeEntityRefs(stateFeats).map((f) => ({
          ...enrichFeat(f),
          stateType: f.type || 'character',
        })),
        stateFeatSort,
      ),
    [stateFeats, enrichFeat, stateFeatSort],
  );

  const featRowContext = useMemo<FeatRowContext>(
    () => ({
      showEditControls,
      traitUses,
      onTraitUsesChange,
      onFeatUsesChange,
      onRemoveFeat,
      getFeatLevelDetailSections,
      onFeatCustomizationChange,
      onTraitCustomizationChange,
    }),
    [
      showEditControls,
      traitUses,
      onTraitUsesChange,
      onFeatUsesChange,
      onRemoveFeat,
      getFeatLevelDetailSections,
      onFeatCustomizationChange,
      onTraitCustomizationChange,
    ],
  );

  const archetypeFeatRowContext = useMemo<FeatRowContext>(
    () => ({
      ...featRowContext,
      featListType: 'archetype',
    }),
    [featRowContext],
  );

  const characterFeatRowContext = useMemo<FeatRowContext>(
    () => ({
      ...featRowContext,
      featListType: 'character',
    }),
    [featRowContext],
  );

  const traitRows = useMemo(
    () => mapTraitRows(processedTraits, featRowContext),
    [processedTraits, featRowContext],
  );
  const archetypeFeatRows = useMemo(
    () => mapFeatRows(processedArchetypeFeats, archetypeFeatRowContext),
    [processedArchetypeFeats, archetypeFeatRowContext],
  );
  const characterFeatRows = useMemo(
    () => mapFeatRows(processedCharacterFeats, characterFeatRowContext),
    [processedCharacterFeats, characterFeatRowContext],
  );
  const stateFeatRows = useMemo(
    () =>
      mapFeatRows(
        processedStateFeats.map(({ stateType, ...feat }) => ({
          ...feat,
          listType: stateType === 'archetype' ? ('archetype' as const) : ('character' as const),
        })),
        featRowContext,
      ).map((row, index) => ({
        ...row,
        badges: [
          {
            label:
              processedStateFeats[index]?.stateType === 'archetype' ? 'Archetype' : 'Character',
            color: 'blue' as const,
          },
        ],
      })),
    [processedStateFeats, featRowContext],
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
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              (stateUsesCurrent ?? stateUsesMax) > 0
                ? 'bg-primary-button text-text-on-dark hover:bg-primary-button-hover'
                : 'cursor-not-allowed bg-surface-alt text-text-muted',
            )}
          >
            Enter State
          </button>
        )}
      </div>
    ) : undefined;

  return (
    <div className="space-y-2">
      <FeatsTraitsListSection
        title="Traits"
        items={traitRows}
        sortState={traitSort}
        onSort={(col) => setTraitSort(toggleSort(traitSort, col))}
        emptyMessage="No traits"
        collapsible
      />

      <FeatsTraitsListSection
        title="Archetype Feats"
        items={archetypeFeatRows}
        onAdd={showEditControls ? onAddArchetypeFeat : undefined}
        addLabel="Add archetype feat"
        headerRightContent={
          showEditControls && maxArchetypeFeats !== undefined ? (
            <span
              className={cn('text-sm font-medium tabular-nums', archetypeOver && 'text-danger-fg')}
            >
              {usedArchetypeSlots}/{maxArchetypeFeats}
            </span>
          ) : undefined
        }
        addButtonClassName={
          archetypeOver
            ? 'text-danger-fg hover:opacity-80 hover:bg-danger-50 dark:hover:bg-danger-900/30'
            : undefined
        }
        sortState={archetypeFeatSort}
        onSort={(col) => setArchetypeFeatSort(toggleSort(archetypeFeatSort, col))}
        rowChrome={{ delete: !!(showEditControls && onRemoveFeat) }}
        emptyMessage="No archetype feats selected"
        collapsible
      />

      <FeatsTraitsListSection
        title="Character Feats"
        items={characterFeatRows}
        onAdd={showEditControls ? onAddCharacterFeat : undefined}
        addLabel="Add character feat"
        headerRightContent={
          showEditControls && maxCharacterFeats !== undefined ? (
            <span
              className={cn('text-sm font-medium tabular-nums', characterOver && 'text-danger-fg')}
            >
              {usedCharacterSlots}/{maxCharacterFeats}
            </span>
          ) : undefined
        }
        addButtonClassName={
          characterOver
            ? 'text-danger-fg hover:opacity-80 hover:bg-danger-50 dark:hover:bg-danger-900/30'
            : undefined
        }
        sortState={characterFeatSort}
        onSort={(col) => setCharacterFeatSort(toggleSort(characterFeatSort, col))}
        rowChrome={{ delete: !!(showEditControls && onRemoveFeat) }}
        emptyMessage="No character feats selected"
        collapsible
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
          collapsible
        />
      )}

      {!hasTraits && !hasArchetypeFeats && !hasCharacterFeats && !hasStateFeats && (
        <div className="py-8 text-center text-text-muted">
          <p className="text-sm italic">No traits or feats to display</p>
        </div>
      )}
    </div>
  );
}
