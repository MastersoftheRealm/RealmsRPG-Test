/**
 * Feats Tab Component
 * ====================
 * Combined view of traits and feats for the library section
 * Mirrors vanilla feats.js organization with collapsible sections
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpeciesTraitCard } from '@/components/shared/species-trait-card';

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
  selectedFlaw?: string;
  selectedCharacteristic?: string;
}

interface FeatsTabProps {
  // Traits from ancestry
  ancestry?: CharacterAncestry;
  // Character's traits (legacy format)
  traits?: TraitData[];
  // RTDB traits for enrichment (max uses, descriptions)
  traitsDb?: RTDBTrait[];
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
}

// =============================================================================
// Collapsible Section Component
// =============================================================================

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  headerColor?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function CollapsibleSection({ 
  title, 
  count, 
  defaultOpen = true, 
  headerColor = 'bg-neutral-100',
  children,
  action,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-left transition-colors',
          headerColor
        )}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
          <span className="font-semibold text-sm text-text-secondary">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-text-muted">({count})</span>
          )}
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </button>
      
      {isOpen && (
        <div className="p-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Feat Card Component
// =============================================================================

interface FeatCardProps {
  feat: FeatData;
  onUsesChange?: (delta: number) => void;
  isEditMode?: boolean;
}

function FeatCard({ feat, onUsesChange, isEditMode }: FeatCardProps) {
  const [expanded, setExpanded] = useState(false);
  const currentUses = feat.currentUses ?? feat.maxUses ?? 0;
  const maxUses = feat.maxUses ?? 0;
  const hasLimitedUses = maxUses > 0;

  const handleUsesChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    onUsesChange?.(delta);
  };

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden transition-colors bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-50 text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
          <span className="font-medium text-text-primary">{feat.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Type as plain text subtext instead of colored badge */}
          {feat.type && (
            <span className="text-xs text-text-muted italic capitalize">
              {feat.type}
            </span>
          )}

          {/* Uses tracking */}
          {hasLimitedUses && (
            <div 
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => handleUsesChange(e, -1)}
                disabled={currentUses <= 0}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                  currentUses > 0
                    ? 'bg-neutral-200 hover:bg-neutral-300 text-text-secondary'
                    : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                )}
                title="Spend use"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className={cn(
                'min-w-[2rem] text-center text-sm font-medium',
                currentUses === 0 ? 'text-red-600' : 'text-text-secondary'
              )}>
                {currentUses}/{maxUses}
              </span>
              <button
                onClick={(e) => handleUsesChange(e, 1)}
                disabled={currentUses >= maxUses}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                  currentUses < maxUses
                    ? 'bg-neutral-200 hover:bg-neutral-300 text-text-secondary'
                    : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                )}
                title="Recover use"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-text-secondary mb-2">
            {feat.description || 'No description available.'}
          </p>
          
          {/* Recovery period display */}
          {hasLimitedUses && (
            <div className="text-xs text-text-muted">
              <span className="font-medium">Recovery:</span> {feat.recovery || 'Full Recovery'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function FeatsTab({
  ancestry,
  traits = [],
  traitsDb = [],
  traitUses = {},
  archetypeFeats = [],
  characterFeats = [],
  stateFeats = [],
  isEditMode = false,
  onFeatUsesChange,
  onTraitUsesChange,
  onAddArchetypeFeat,
  onAddCharacterFeat,
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
  
  // Collect all traits from ancestry
  const ancestryTraits = useMemo(() => {
    const result: { name: string; category: 'ancestry' | 'flaw' | 'characteristic' }[] = [];
    
    if (ancestry?.selectedTraits) {
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
    
    return result;
  }, [ancestry]);

  // Check if we have any traits
  const hasTraits = ancestryTraits.length > 0 || traits.length > 0;
  const hasArchetypeFeats = archetypeFeats.length > 0;
  const hasCharacterFeats = characterFeats.length > 0;
  const hasStateFeats = stateFeats.length > 0;

  // Total counts
  const totalTraits = ancestryTraits.length + traits.length;
  const totalArchetypeFeats = archetypeFeats.length;
  const totalCharacterFeats = characterFeats.length;
  const totalStateFeats = stateFeats.length;

  return (
    <div className="space-y-2">
      {/* Traits Section */}
      {hasTraits && (
        <CollapsibleSection 
          title="Traits" 
          count={totalTraits}
          headerColor="bg-gradient-to-r from-green-50 to-blue-50"
        >
          <div className="space-y-2">
            {/* Ancestry traits from character creator - enriched with RTDB data */}
            {ancestryTraits.map((trait, index) => {
              const enriched = enrichTrait(trait.name);
              return (
                <SpeciesTraitCard
                  key={`${trait.category}-${index}`}
                  trait={enriched}
                  category={trait.category}
                  compact
                  currentUses={traitUses[trait.name] ?? enriched.maxUses}
                  onUsesChange={enriched.maxUses > 0 && onTraitUsesChange 
                    ? (delta) => onTraitUsesChange(trait.name, delta) 
                    : undefined}
                />
              );
            })}
            
            {/* Legacy traits array - enriched with RTDB data */}
            {traits.map((trait, index) => {
              const enriched = enrichTrait(trait.name);
              return (
                <SpeciesTraitCard
                  key={`trait-${index}`}
                  trait={{ ...trait, ...enriched }}
                  category="species"
                  compact
                  currentUses={traitUses[trait.name] ?? enriched.maxUses}
                  onUsesChange={enriched.maxUses > 0 && onTraitUsesChange 
                    ? (delta) => onTraitUsesChange(trait.name, delta) 
                    : undefined}
                />
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Archetype Feats Section */}
      <CollapsibleSection 
        title="Archetype Feats" 
        count={totalArchetypeFeats}
        headerColor="bg-amber-50"
        action={isEditMode && onAddArchetypeFeat && (
          <button
            onClick={onAddArchetypeFeat}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      >
        {hasArchetypeFeats ? (
          <div className="space-y-2">
            {archetypeFeats.map((feat, index) => (
              <FeatCard
                key={feat.id || index}
                feat={{ ...feat, type: 'archetype' }}
                onUsesChange={onFeatUsesChange 
                  ? (delta) => onFeatUsesChange(String(feat.id || index), delta) 
                  : undefined
                }
                isEditMode={isEditMode}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic text-center py-2">
            No archetype feats selected
          </p>
        )}
      </CollapsibleSection>

      {/* Character Feats Section */}
      <CollapsibleSection 
        title="Character Feats" 
        count={totalCharacterFeats}
        headerColor="bg-neutral-50"
        action={isEditMode && onAddCharacterFeat && (
          <button
            onClick={onAddCharacterFeat}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-neutral-100 text-text-secondary rounded hover:bg-neutral-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      >
        {hasCharacterFeats ? (
          <div className="space-y-2">
            {characterFeats.map((feat, index) => (
              <FeatCard
                key={feat.id || index}
                feat={{ ...feat, type: 'character' }}
                onUsesChange={onFeatUsesChange 
                  ? (delta) => onFeatUsesChange(String(feat.id || index), delta) 
                  : undefined
                }
                isEditMode={isEditMode}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic text-center py-2">
            No character feats selected
          </p>
        )}
      </CollapsibleSection>

      {/* State Feats Section (only show if any exist) */}
      {hasStateFeats && (
        <CollapsibleSection 
          title="State Feats" 
          count={totalStateFeats}
          headerColor="bg-blue-50"
        >
          <div className="space-y-2">
            {stateFeats.map((feat, index) => (
              <FeatCard
                key={feat.id || index}
                feat={{ ...feat, type: 'state' }}
                onUsesChange={onFeatUsesChange 
                  ? (delta) => onFeatUsesChange(String(feat.id || index), delta) 
                  : undefined
                }
                isEditMode={isEditMode}
              />
            ))}
          </div>
        </CollapsibleSection>
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
                <button
                  onClick={onAddArchetypeFeat}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Archetype Feat
                </button>
              )}
              {onAddCharacterFeat && (
                <button
                  onClick={onAddCharacterFeat}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium bg-neutral-100 text-text-secondary rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Character Feat
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
