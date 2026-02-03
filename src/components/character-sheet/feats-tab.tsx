/**
 * Feats Tab Component
 * ====================
 * Combined view of traits and feats for the library section
 * Uses GridListRow for consistent library-style display unified with site-wide patterns
 */

'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button, Collapsible } from '@/components/ui';
import { GridListRow } from '@/components/shared';

// =============================================================================
// Types
// =============================================================================

interface TraitData {
  name: string;
  description?: string;
  maxUses?: number;
  recoveryPeriod?: string;
}

/** RTDB trait data for enrichment */
interface RTDBTrait {
  id: string;
  name: string;
  description?: string;
  uses_per_rec?: number;
  rec_period?: string;
}

/** RTDB feat data for enrichment */
interface RTDBFeat {
  id: string;
  name: string;
  description?: string;
  effect?: string;
  max_uses?: number;
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

/** Legacy vanilla site trait fields (stored at top level) */
interface VanillaTraitFields {
  ancestryTraits?: string[];
  flawTrait?: string | null;
  characteristicTrait?: string | null;
  speciesTraits?: string[];
}

interface FeatsTabProps {
  // Traits from ancestry (new format)
  ancestry?: CharacterAncestry;
  // Legacy vanilla trait fields (stored at top level on character)
  vanillaTraits?: VanillaTraitFields;
  // Species traits from RTDB (automatically granted based on character's species)
  speciesTraitsFromRTDB?: string[];
  // Character's traits (legacy format)
  traits?: TraitData[];
  // RTDB traits for enrichment (max uses, descriptions)
  traitsDb?: RTDBTrait[];
  // RTDB feats for enrichment (descriptions, uses)
  featsDb?: RTDBFeat[];
  // Current trait uses (trait name -> uses remaining)
  traitUses?: Record<string, number>;
  // Feats by category
  archetypeFeats?: FeatData[];
  characterFeats?: FeatData[];
  stateFeats?: FeatData[]; // Temporary condition-based feats
  // Edit mode
  isEditMode?: boolean;
  // Callbacks
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
  onRemoveFeat?: (featId: string) => void;
}

// =============================================================================
// Main Component
// =============================================================================

export function FeatsTab({
  ancestry,
  vanillaTraits,
  speciesTraitsFromRTDB = [],
  traits = [],
  traitsDb = [],
  featsDb = [],
  traitUses = {},
  archetypeFeats = [],
  characterFeats = [],
  stateFeats = [],
  isEditMode = false,
  onFeatUsesChange,
  onTraitUsesChange,
  onAddArchetypeFeat,
  onAddCharacterFeat,
  onRemoveFeat,
}: FeatsTabProps) {
  // Helper to find trait in RTDB and enrich with uses data
  // Supports lookup by name OR by ID (in case traits are stored as IDs)
  const enrichTrait = (traitNameOrId: string) => {
    // Try to find by name first
    let dbTrait = traitsDb.find(t => t.name.toLowerCase() === traitNameOrId.toLowerCase());
    
    // If not found by name, try by ID
    if (!dbTrait) {
      dbTrait = traitsDb.find(t => t.id === traitNameOrId);
    }
    
    return {
      name: dbTrait?.name || traitNameOrId, // Use enriched name if found, otherwise original
      description: dbTrait?.description,
      maxUses: dbTrait?.uses_per_rec ?? 0,
      recoveryPeriod: dbTrait?.rec_period,
    };
  };
  
  // Helper to enrich feat with RTDB data
  const enrichFeat = (feat: FeatData) => {
    // Try to find by ID first, then by name
    let dbFeat = featsDb.find(f => f.id === String(feat.id));
    if (!dbFeat) {
      dbFeat = featsDb.find(f => f.name.toLowerCase() === feat.name.toLowerCase());
    }
    
    return {
      ...feat,
      description: feat.description || dbFeat?.description || dbFeat?.effect,
      maxUses: feat.maxUses ?? dbFeat?.max_uses ?? 0,
      recovery: feat.recovery || dbFeat?.rec_period,
    };
  };
  
  // Category label formatting
  const getCategoryLabel = (category: string) => {
    if (category === 'species') return ''; // No label for species traits
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  // Collect all traits:
  // 1. Species traits from RTDB are ALWAYS included (automatic based on species)
  // 2. Selected traits (ancestry, flaw, characteristic) come from ancestry object OR vanilla format
  const allTraitsWithCategories = useMemo(() => {
    const result: { name: string; category: 'ancestry' | 'flaw' | 'characteristic' | 'species' }[] = [];
    
    // 1. Species traits are always included (automatic, not selectable)
    // First try RTDB species traits (preferred source)
    if (speciesTraitsFromRTDB?.length) {
      speciesTraitsFromRTDB.forEach(name => {
        result.push({ name, category: 'species' });
      });
    } else if (vanillaTraits?.speciesTraits?.length) {
      // Fallback to vanilla format if RTDB not available
      vanillaTraits.speciesTraits.forEach(name => {
        result.push({ name, category: 'species' });
      });
    }
    
    // 2. Selected traits from new format (ancestry object)
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
    
    // 3. If no new format selected traits, try vanilla format (only for selected traits, not species)
    const hasNewFormatSelectedTraits = 
      (ancestry?.selectedTraits?.length ?? 0) > 0 ||
      ancestry?.selectedFlaw ||
      ancestry?.selectedCharacteristic;
    
    if (!hasNewFormatSelectedTraits && vanillaTraits) {
      // Add flaw first (like vanilla)
      if (vanillaTraits.flawTrait) {
        result.push({ name: vanillaTraits.flawTrait, category: 'flaw' });
      }
      
      // Add characteristic
      if (vanillaTraits.characteristicTrait) {
        result.push({ name: vanillaTraits.characteristicTrait, category: 'characteristic' });
      }
      
      // Add ancestry traits
      if (vanillaTraits.ancestryTraits?.length) {
        vanillaTraits.ancestryTraits.forEach(name => {
          result.push({ name, category: 'ancestry' });
        });
      }
    }
    
    return result;
  }, [ancestry, vanillaTraits, speciesTraitsFromRTDB]);

  // Check if we have any traits
  const hasTraits = allTraitsWithCategories.length > 0 || traits.length > 0;
  const hasArchetypeFeats = archetypeFeats.length > 0;
  const hasCharacterFeats = characterFeats.length > 0;
  const hasStateFeats = stateFeats.length > 0;

  // Total counts
  const totalTraits = allTraitsWithCategories.length + traits.length;
  const totalArchetypeFeats = archetypeFeats.length;
  const totalCharacterFeats = characterFeats.length;
  const totalStateFeats = stateFeats.length;

  return (
    <div className="space-y-2">
      {/* Traits Section */}
      {hasTraits && (
        <Collapsible 
          title="Traits" 
          count={totalTraits}
          defaultOpen
          headerClassName="bg-gradient-to-r from-green-50 to-blue-50"
          className="mb-3"
        >
          <div className="space-y-2">
            {/* All traits (species + selected) - enriched with RTDB data */}
            {allTraitsWithCategories.map((trait, index) => {
              const enriched = enrichTrait(trait.name);
              const badges = trait.category ? [{ label: getCategoryLabel(trait.category), color: 'gray' as const }] : undefined;
              const uses = enriched.maxUses > 0 ? { 
                current: traitUses[trait.name] ?? enriched.maxUses, 
                max: enriched.maxUses 
              } : undefined;
              
              return (
                <GridListRow
                  key={`${trait.category}-${index}`}
                  id={`${trait.category}-${index}`}
                  name={enriched.name}
                  description={enriched.description}
                  badges={badges}
                  uses={uses}
                  onQuantityChange={enriched.maxUses > 0 && onTraitUsesChange 
                    ? (delta) => onTraitUsesChange(trait.name, delta) 
                    : undefined}
                  requirements={enriched.recoveryPeriod ? (
                    <span className="text-xs text-text-muted italic">Recovers: {enriched.recoveryPeriod}</span>
                  ) : undefined}
                  compact
                />
              );
            })}
            
            {/* Legacy traits array - enriched with RTDB data */}
            {traits.map((trait, index) => {
              const enriched = enrichTrait(trait.name);
              const uses = enriched.maxUses > 0 ? { 
                current: traitUses[trait.name] ?? enriched.maxUses, 
                max: enriched.maxUses 
              } : undefined;
              const recoveryText = enriched.recoveryPeriod || trait.recoveryPeriod;
              
              return (
                <GridListRow
                  key={`trait-${index}`}
                  id={`trait-${index}`}
                  name={enriched.name}
                  description={enriched.description || trait.description}
                  uses={uses}
                  onQuantityChange={enriched.maxUses > 0 && onTraitUsesChange 
                    ? (delta) => onTraitUsesChange(trait.name, delta) 
                    : undefined}
                  requirements={recoveryText ? (
                    <span className="text-xs text-text-muted italic">Recovers: {recoveryText}</span>
                  ) : undefined}
                  compact
                />
              );
            })}
          </div>
        </Collapsible>
      )}

      {/* Archetype Feats Section */}
      <Collapsible 
        title="Archetype Feats" 
        count={totalArchetypeFeats}
        defaultOpen
        headerClassName="bg-amber-50"
        className="mb-3"
        action={isEditMode && onAddArchetypeFeat && (
          <Button
            size="sm"
            onClick={onAddArchetypeFeat}
            className="bg-amber-100 text-amber-700 hover:bg-amber-200"
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        )}
      >
        {hasArchetypeFeats ? (
          <div className="space-y-2">
            {archetypeFeats.map((feat, index) => {
              const enriched = enrichFeat(feat);
              const uses = enriched.maxUses > 0 ? { 
                current: enriched.currentUses ?? enriched.maxUses, 
                max: enriched.maxUses 
              } : undefined;
              
              return (
                <GridListRow
                  key={feat.id || index}
                  id={String(feat.id || index)}
                  name={enriched.name}
                  description={enriched.description}
                  uses={uses}
                  onQuantityChange={onFeatUsesChange 
                    ? (delta) => onFeatUsesChange(String(feat.id || index), delta) 
                    : undefined}
                  requirements={enriched.recovery ? (
                    <span className="text-xs text-text-muted italic">Recovers: {enriched.recovery}</span>
                  ) : undefined}
                  compact
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic text-center py-2">
            No archetype feats selected
          </p>
        )}
      </Collapsible>

      {/* Character Feats Section */}
      <Collapsible 
        title="Character Feats" 
        count={totalCharacterFeats}
        defaultOpen
        headerClassName="bg-surface-alt"
        className="mb-3"
        action={isEditMode && onAddCharacterFeat && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddCharacterFeat}
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        )}
      >
        {hasCharacterFeats ? (
          <div className="space-y-2">
            {characterFeats.map((feat, index) => {
              const enriched = enrichFeat(feat);
              const uses = enriched.maxUses > 0 ? { 
                current: enriched.currentUses ?? enriched.maxUses, 
                max: enriched.maxUses 
              } : undefined;
              
              return (
                <GridListRow
                  key={feat.id || index}
                  id={String(feat.id || index)}
                  name={enriched.name}
                  description={enriched.description}
                  uses={uses}
                  onQuantityChange={onFeatUsesChange 
                    ? (delta) => onFeatUsesChange(String(feat.id || index), delta) 
                    : undefined}
                  requirements={enriched.recovery ? (
                    <span className="text-xs text-text-muted italic">Recovers: {enriched.recovery}</span>
                  ) : undefined}
                  compact
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic text-center py-2">
            No character feats selected
          </p>
        )}
      </Collapsible>

      {/* State Feats Section (only show if any exist) */}
      {hasStateFeats && (
        <Collapsible 
          title="State Feats" 
          count={totalStateFeats}
          defaultOpen
          headerClassName="bg-blue-50"
          className="mb-3"
        >
          <div className="space-y-2">
            {stateFeats.map((feat, index) => {
              const enriched = enrichFeat(feat);
              const uses = enriched.maxUses > 0 ? { 
                current: enriched.currentUses ?? enriched.maxUses, 
                max: enriched.maxUses 
              } : undefined;
              
              return (
                <GridListRow
                  key={feat.id || index}
                  id={String(feat.id || index)}
                  name={enriched.name}
                  description={enriched.description}
                  badges={[{ label: 'State', color: 'blue' }]}
                  uses={uses}
                  onQuantityChange={onFeatUsesChange 
                    ? (delta) => onFeatUsesChange(String(feat.id || index), delta) 
                    : undefined}
                  requirements={enriched.recovery ? (
                    <span className="text-xs text-text-muted italic">Recovers: {enriched.recovery}</span>
                  ) : undefined}
                  compact
                />
              );
            })}
          </div>
        </Collapsible>
      )}

      {/* Empty state */}
      {!hasTraits && !hasArchetypeFeats && !hasCharacterFeats && !hasStateFeats && (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm italic">
            No traits or feats to display
          </p>
          {isEditMode && (onAddArchetypeFeat || onAddCharacterFeat) && (
            <div className="flex justify-center gap-2 mt-4">
              {onAddArchetypeFeat && (
                <Button
                  onClick={onAddArchetypeFeat}
                  className="bg-amber-100 text-amber-700 hover:bg-amber-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Archetype Feat
                </Button>
              )}
              {onAddCharacterFeat && (
                <Button
                  variant="secondary"
                  onClick={onAddCharacterFeat}
                >
                  <Plus className="w-4 h-4" />
                  Add Character Feat
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
