/**
 * Feats Tab Component - Refactored
 * =================================
 * Combined view of traits and feats for the character sheet.
 * Uses unified components: SectionHeader, ListHeader, GridListRow
 * 
 * Sections:
 * - Traits (no + button - species/ancestry granted)
 * - Archetype Feats (+)
 * - Character Feats (+)
 * - State Feats (+) - only shown if character has any
 * 
 * List Headers: Name, Description (truncated), Uses, Recovery
 */

'use client';

import { useMemo, useState, useCallback } from 'react';
import { SectionHeader, ListHeader, GridListRow, DecrementButton, IncrementButton } from '@/components/shared';
import type { SortState, ListColumn } from '@/components/shared';
import { toggleSort, sortByColumn } from '@/hooks/use-sort';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface TraitData {
  name: string;
  description?: string;
  maxUses?: number;
  recoveryPeriod?: string;
}

/** Codex trait shape for FeatsTab */
interface CodexTrait {
  id: string;
  name: string;
  description?: string;
  uses_per_rec?: number;
  rec_period?: string;
}

/** Codex feat shape for FeatsTab */
interface CodexFeat {
  id: string;
  name: string;
  description?: string;
  effect?: string;
  max_uses?: number;
  uses_per_rec?: number; // Canonical field from API
  rec_period?: string;
  category?: string;
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
  isEditMode?: boolean;
  /** When true, show add/remove and current/max; when false, hide add/remove (library not in edit) */
  showEditControls?: boolean;
  maxArchetypeFeats?: number;
  maxCharacterFeats?: number;
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
  onAddStateFeat?: () => void;
  onRemoveFeat?: (featId: string, featName?: string) => void;
}

// =============================================================================
// Column Definitions
// =============================================================================

const TRAIT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(140px, 1.6fr)' },
  { key: 'description', label: 'Description', width: '2.5fr', sortable: false },
  { key: 'uses', label: 'Uses', width: '5rem', align: 'center' },
];

const TRAIT_GRID = 'minmax(140px, 1.6fr) 2.5fr 5rem';

const FEAT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: 'minmax(140px, 1.6fr)' },
  { key: 'description', label: 'Description', width: '2.5fr', sortable: false },
  { key: 'uses', label: 'Uses', width: '5rem', align: 'center' },
];

const FEAT_GRID = 'minmax(140px, 1.6fr) 2.5fr 5rem';

// =============================================================================
// Helper: Truncate description for collapsed view
// =============================================================================

function truncateText(text: string | undefined, maxLength: number = 80): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// =============================================================================
// Helper: Format recovery period abbreviation (PR = Partial, FR = Full)
// =============================================================================

function formatRecoveryAbbrev(recovery: string | undefined): string {
  if (!recovery) return '';
  const lower = recovery.toLowerCase();
  if (lower.includes('partial')) return 'PR';
  if (lower.includes('full')) return 'FR';
  if (lower.includes('short')) return 'SR';
  if (lower.includes('long')) return 'LR';
  return '';
}

// Helper: Format uses with recovery suffix (e.g., "2/3 PR" or empty if no uses)
function formatUsesWithRecovery(
  uses: { current: number; max: number } | undefined,
  recovery: string | undefined
): string {
  if (!uses || uses.max === 0) return '';
  const recAbbrev = formatRecoveryAbbrev(recovery);
  return recAbbrev ? `${uses.current}/${uses.max} ${recAbbrev}` : `${uses.current}/${uses.max}`;
}

// =============================================================================
// Main Component
// =============================================================================

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
  isEditMode = false,
  showEditControls = false,
  maxArchetypeFeats,
  maxCharacterFeats,
  onFeatUsesChange,
  onTraitUsesChange,
  onAddArchetypeFeat,
  onAddCharacterFeat,
  onAddStateFeat,
  onRemoveFeat,
}: FeatsTabProps) {
  const archetypeCount = archetypeFeats.length;
  const characterCount = characterFeats.length;
  const archetypeOver = maxArchetypeFeats !== undefined && archetypeCount > maxArchetypeFeats;
  const characterOver = maxCharacterFeats !== undefined && characterCount > maxCharacterFeats;
  // Sort state for each section
  const [traitSort, setTraitSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [archetypeFeatSort, setArchetypeFeatSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [characterFeatSort, setCharacterFeatSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [stateFeatSort, setStateFeatSort] = useState<SortState>({ col: 'name', dir: 1 });

  // Enrich trait with RTDB data
  const enrichTrait = useCallback((traitNameOrId: string) => {
    let dbTrait = traitsDb.find(t => String(t.name ?? '').toLowerCase() === String(traitNameOrId ?? '').toLowerCase());
    if (!dbTrait) {
      dbTrait = traitsDb.find(t => t.id === traitNameOrId);
    }
    return {
      name: dbTrait?.name || traitNameOrId,
      description: dbTrait?.description,
      maxUses: dbTrait?.uses_per_rec ?? 0,
      recoveryPeriod: dbTrait?.rec_period,
    };
  }, [traitsDb]);

  // Enrich feat with codex data — derive name/description/maxUses/recovery when not on character
  const enrichFeat = useCallback((feat: FeatData) => {
    let dbFeat = featsDb.find(f => f.id === String(feat.id));
    if (!dbFeat) {
      dbFeat = featsDb.find(f => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase());
    }
    return {
      ...feat,
      name: feat.name || dbFeat?.name || String(feat.id),
      description: feat.description || dbFeat?.description || dbFeat?.effect,
      maxUses: feat.maxUses ?? dbFeat?.uses_per_rec ?? dbFeat?.max_uses ?? 0,
      recovery: feat.recovery || dbFeat?.rec_period,
    };
  }, [featsDb]);

  // Category label for traits
  const getCategoryLabel = (category: string) => {
    if (category === 'species') return '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Collect all traits with categories
  const allTraitsWithCategories = useMemo(() => {
    const result: { name: string; category: 'ancestry' | 'flaw' | 'characteristic' | 'species' }[] = [];
    
    // Species traits
    if (speciesTraitsFromCodex?.length) {
      speciesTraitsFromCodex.forEach(name => {
        result.push({ name, category: 'species' });
      });
    } else if (vanillaTraits?.speciesTraits?.length) {
      vanillaTraits.speciesTraits.forEach(name => {
        result.push({ name, category: 'species' });
      });
    }
    
    // Selected traits from new format
    if (ancestry?.selectedTraits?.length) {
      ancestry.selectedTraits.forEach(name => {
        result.push({ name, category: 'ancestry' });
      });
    }
    if (ancestry?.selectedFlaw) {
      result.push({ name: ancestry.selectedFlaw, category: 'flaw' });
    }
    if (ancestry?.selectedCharacteristic) {
      result.push({ name: ancestry.selectedCharacteristic, category: 'characteristic' });
    }
    
    // Vanilla format fallback
    const hasNewFormat = 
      (ancestry?.selectedTraits?.length ?? 0) > 0 ||
      ancestry?.selectedFlaw ||
      ancestry?.selectedCharacteristic;
    
    if (!hasNewFormat && vanillaTraits) {
      if (vanillaTraits.flawTrait) {
        result.push({ name: vanillaTraits.flawTrait, category: 'flaw' });
      }
      if (vanillaTraits.characteristicTrait) {
        result.push({ name: vanillaTraits.characteristicTrait, category: 'characteristic' });
      }
      if (vanillaTraits.ancestryTraits?.length) {
        vanillaTraits.ancestryTraits.forEach(name => {
          result.push({ name, category: 'ancestry' });
        });
      }
    }
    
    return result;
  }, [ancestry, vanillaTraits, speciesTraitsFromCodex]);

  // Process and sort traits
  const processedTraits = useMemo(() => {
    const enriched = allTraitsWithCategories.map(t => ({
      ...t,
      ...enrichTrait(t.name),
    }));
    
    // Add legacy traits
    traits.forEach(trait => {
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

  // Process and sort archetype feats
  const processedArchetypeFeats = useMemo(() => {
    const enriched = archetypeFeats.map(enrichFeat);
    return sortByColumn(enriched, archetypeFeatSort);
  }, [archetypeFeats, enrichFeat, archetypeFeatSort]);

  // Process and sort character feats
  const processedCharacterFeats = useMemo(() => {
    const enriched = characterFeats.map(enrichFeat);
    return sortByColumn(enriched, characterFeatSort);
  }, [characterFeats, enrichFeat, characterFeatSort]);

  // Process and sort state feats
  const processedStateFeats = useMemo(() => {
    const enriched = stateFeats.map(f => ({
      ...enrichFeat(f),
      stateType: f.type || 'character',
    }));
    return sortByColumn(enriched, stateFeatSort);
  }, [stateFeats, enrichFeat, stateFeatSort]);

  const hasTraits = processedTraits.length > 0;
  const hasArchetypeFeats = processedArchetypeFeats.length > 0;
  const hasCharacterFeats = processedCharacterFeats.length > 0;
  const hasStateFeats = processedStateFeats.length > 0;

  return (
    <div className="space-y-6">
      {/* Traits Section */}
      <div>
        <SectionHeader title="Traits" />
        {hasTraits && (
          <ListHeader
            columns={TRAIT_COLUMNS}
            gridColumns={TRAIT_GRID}
            sortState={traitSort}
            onSort={(col) => setTraitSort(toggleSort(traitSort, col))}
          />
        )}
        {hasTraits ? (
          <div className="space-y-1">
            {processedTraits.map((trait, index) => {
              const uses = trait.maxUses > 0 ? {
                current: traitUses[trait.name] ?? trait.maxUses,
                max: trait.maxUses,
              } : undefined;
              const categoryLabel = trait.category ? getCategoryLabel(trait.category) : undefined;
              const usesStepper = uses && onTraitUsesChange ? (
                <div className="flex items-center justify-center gap-1">
                  <DecrementButton
                    onClick={() => onTraitUsesChange(trait.name, -1)}
                    disabled={uses.current <= 0}
                    size="sm"
                  />
                  <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
                    {uses.current}/{uses.max}
                  </span>
                  <IncrementButton
                    onClick={() => onTraitUsesChange(trait.name, 1)}
                    disabled={uses.current >= uses.max}
                    size="sm"
                  />
                </div>
              ) : uses ? (
                <span className="text-sm text-text-secondary">{uses.current}/{uses.max}</span>
              ) : null;
              return (
                <GridListRow
                  key={`${trait.category}-${index}`}
                  id={`${trait.category}-${index}`}
                  name={trait.name}
                  description={trait.description}
                  gridColumns={TRAIT_GRID}
                  columns={[
                    { key: 'description', value: truncateText(trait.description, uses ? 60 : 100), hideOnMobile: true },
                    { key: 'uses', value: usesStepper ?? '-', align: 'center' },
                  ]}
                  badges={categoryLabel ? [{ label: categoryLabel, color: 'gray' }] : undefined}
                  uses={uses}
                  hideUsesInName={!!(uses && onTraitUsesChange)}
                  onQuantityChange={undefined}
                  compact
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic text-center py-4">
            No traits
          </p>
        )}
      </div>

      {/* Archetype Feats Section */}
      <div>
        <SectionHeader 
          title="Archetype Feats" 
          onAdd={showEditControls ? onAddArchetypeFeat : undefined}
          addLabel="Add archetype feat"
          rightContent={showEditControls && maxArchetypeFeats !== undefined ? (
            <span className={cn('tabular-nums text-sm font-medium', archetypeOver && 'text-danger-600')}>
              {archetypeCount}/{maxArchetypeFeats}
            </span>
          ) : undefined}
          addButtonClassName={archetypeOver ? 'text-danger-600 hover:text-danger-700 hover:bg-danger-50' : undefined}
        />
        {hasArchetypeFeats && (
          <ListHeader
            columns={FEAT_COLUMNS}
            gridColumns={FEAT_GRID}
            sortState={archetypeFeatSort}
            onSort={(col) => setArchetypeFeatSort(toggleSort(archetypeFeatSort, col))}
          />
        )}
        {hasArchetypeFeats ? (
          <div className="space-y-1">
            {processedArchetypeFeats.map((feat, index) => {
              const uses = feat.maxUses > 0 ? {
                current: feat.currentUses ?? feat.maxUses,
                max: feat.maxUses,
              } : undefined;
              const featId = String(feat.id || index);
              const usesStepper = uses && onFeatUsesChange ? (
                <div className="flex items-center justify-center gap-1">
                  <DecrementButton
                    onClick={() => onFeatUsesChange(featId, -1)}
                    disabled={uses.current <= 0}
                    size="sm"
                  />
                  <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
                    {uses.current}/{uses.max}
                  </span>
                  <IncrementButton
                    onClick={() => onFeatUsesChange(featId, 1)}
                    disabled={uses.current >= uses.max}
                    size="sm"
                  />
                </div>
              ) : uses ? (
                <span className="text-sm text-text-secondary">{uses.current}/{uses.max}</span>
              ) : null;
              return (
                <GridListRow
                  key={feat.id || index}
                  id={featId}
                  name={feat.name}
                  description={feat.description}
                  gridColumns={FEAT_GRID}
                  columns={[
                    { key: 'description', value: truncateText(feat.description, uses ? 60 : 100), hideOnMobile: true },
                    { key: 'uses', value: usesStepper ?? '-', align: 'center' },
                  ]}
                  uses={uses}
                  hideUsesInName={!!(uses && onFeatUsesChange)}
                  onQuantityChange={undefined}
                  onDelete={showEditControls && onRemoveFeat 
                    ? () => onRemoveFeat(featId, feat.name) 
                    : undefined}
                  compact
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic text-center py-4">
            No archetype feats selected
          </p>
        )}
      </div>

      {/* Character Feats Section */}
      <div>
        <SectionHeader 
          title="Character Feats" 
          onAdd={showEditControls ? onAddCharacterFeat : undefined}
          addLabel="Add character feat"
          rightContent={showEditControls && maxCharacterFeats !== undefined ? (
            <span className={cn('tabular-nums text-sm font-medium', characterOver && 'text-danger-600')}>
              {characterCount}/{maxCharacterFeats}
            </span>
          ) : undefined}
          addButtonClassName={characterOver ? 'text-danger-600 hover:text-danger-700 hover:bg-danger-50' : undefined}
        />
        {hasCharacterFeats && (
          <ListHeader
            columns={FEAT_COLUMNS}
            gridColumns={FEAT_GRID}
            sortState={characterFeatSort}
            onSort={(col) => setCharacterFeatSort(toggleSort(characterFeatSort, col))}
          />
        )}
        {hasCharacterFeats ? (
          <div className="space-y-1">
            {processedCharacterFeats.map((feat, index) => {
              const uses = feat.maxUses > 0 ? {
                current: feat.currentUses ?? feat.maxUses,
                max: feat.maxUses,
              } : undefined;
              const featId = String(feat.id || index);
              const usesStepper = uses && onFeatUsesChange ? (
                <div className="flex items-center justify-center gap-1">
                  <DecrementButton
                    onClick={() => onFeatUsesChange(featId, -1)}
                    disabled={uses.current <= 0}
                    size="sm"
                  />
                  <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
                    {uses.current}/{uses.max}
                  </span>
                  <IncrementButton
                    onClick={() => onFeatUsesChange(featId, 1)}
                    disabled={uses.current >= uses.max}
                    size="sm"
                  />
                </div>
              ) : uses ? (
                <span className="text-sm text-text-secondary">{uses.current}/{uses.max}</span>
              ) : null;
              return (
                <GridListRow
                  key={feat.id || index}
                  id={featId}
                  name={feat.name}
                  description={feat.description}
                  gridColumns={FEAT_GRID}
                  columns={[
                    { key: 'description', value: truncateText(feat.description, uses ? 60 : 100), hideOnMobile: true },
                    { key: 'uses', value: usesStepper ?? '-', align: 'center' },
                  ]}
                  uses={uses}
                  hideUsesInName={!!(uses && onFeatUsesChange)}
                  onQuantityChange={undefined}
                  onDelete={showEditControls && onRemoveFeat 
                    ? () => onRemoveFeat(featId, feat.name) 
                    : undefined}
                  compact
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic text-center py-4">
            No character feats selected
          </p>
        )}
      </div>

      {/* State Feats Section - only show if any exist */}
      {hasStateFeats && (
        <div>
          <SectionHeader 
            title="State Feats" 
            onAdd={showEditControls ? onAddStateFeat : undefined}
            addLabel="Add state feat"
          />
          <ListHeader
            columns={FEAT_COLUMNS}
            gridColumns={FEAT_GRID}
            sortState={stateFeatSort}
            onSort={(col) => setStateFeatSort(toggleSort(stateFeatSort, col))}
          />
          <div className="space-y-1">
            {processedStateFeats.map((feat, index) => {
              const uses = feat.maxUses > 0 ? {
                current: feat.currentUses ?? feat.maxUses,
                max: feat.maxUses,
              } : undefined;
              const featId = String(feat.id || index);
              const typeLabel = feat.stateType === 'archetype' ? 'Archetype' : 'Character';
              const usesStepper = uses && onFeatUsesChange ? (
                <div className="flex items-center justify-center gap-1">
                  <DecrementButton
                    onClick={() => onFeatUsesChange(featId, -1)}
                    disabled={uses.current <= 0}
                    size="sm"
                  />
                  <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
                    {uses.current}/{uses.max}
                  </span>
                  <IncrementButton
                    onClick={() => onFeatUsesChange(featId, 1)}
                    disabled={uses.current >= uses.max}
                    size="sm"
                  />
                </div>
              ) : uses ? (
                <span className="text-sm text-text-secondary">{uses.current}/{uses.max}</span>
              ) : null;
              return (
                <GridListRow
                  key={feat.id || index}
                  id={featId}
                  name={feat.name}
                  description={feat.description}
                  gridColumns={FEAT_GRID}
                  columns={[
                    { key: 'description', value: truncateText(feat.description, uses ? 60 : 100), hideOnMobile: true },
                    { key: 'uses', value: usesStepper ?? '-', align: 'center' },
                  ]}
                  badges={[{ label: typeLabel, color: 'blue' }]}
                  uses={uses}
                  hideUsesInName={!!(uses && onFeatUsesChange)}
                  onQuantityChange={undefined}
                  onDelete={showEditControls && onRemoveFeat 
                    ? () => onRemoveFeat(featId, feat.name) 
                    : undefined}
                  compact
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasTraits && !hasArchetypeFeats && !hasCharacterFeats && !hasStateFeats && (
        <div className="text-center py-8 text-text-muted">
          <p className="text-sm italic">No traits or feats to display</p>
        </div>
      )}
    </div>
  );
}

export default FeatsTab;
