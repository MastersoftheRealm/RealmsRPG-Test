
'use client';

import { useMemo } from 'react';
import { Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Species, Trait } from '@/hooks';

interface SpeciesModalProps {
  species: Species | null;
  traits: Trait[];
  isOpen: boolean;
  onSelect: () => void;
  onClose: () => void;
}

interface ResolvedTrait {
  id: string;
  name: string;
  description: string;
  found: boolean;
}

/**
 * Resolve trait IDs to full trait objects using findByIdOrName pattern.
 */
function resolveTraits(traitIds: (string | number)[], allTraits: Trait[]): ResolvedTrait[] {
  if (!traitIds || !allTraits) return [];
  
  return traitIds.map(id => {
    const idStr = String(id);
    
    // Try numeric ID match first
    let trait = allTraits.find(t => t.id === idStr);
    
    // Try name match (case-insensitive)
    if (!trait) {
      trait = allTraits.find(t => 
        t.name.toLowerCase() === idStr.toLowerCase()
      );
    }
    
    if (trait) {
      return { 
        id: trait.id, 
        name: trait.name, 
        description: trait.description || 'No description available.',
        found: true 
      };
    }
    
    // Return placeholder for unresolved traits
    return { 
      id: idStr, 
      name: idStr, 
      description: 'Trait details not found in database.',
      found: false 
    };
  });
}

interface TraitSectionProps {
  title: string;
  traits: ResolvedTrait[];
  isFlaw?: boolean;
  selectable?: boolean;
}

function TraitSection({ title, traits, isFlaw = false, selectable = false }: TraitSectionProps) {
  if (!traits || traits.length === 0) return null;
  
  return (
    <div className="mb-4">
      <h4 className={cn(
        'font-semibold text-sm uppercase tracking-wide mb-2',
        isFlaw ? 'text-red-700' : 'text-gray-700'
      )}>
        {title}
      </h4>
      <div className="space-y-2">
        {traits.map((trait, index) => (
          <div 
            key={`${trait.id}-${index}`}
            className={cn(
              'p-3 rounded-lg border',
              isFlaw 
                ? 'bg-red-50 border-red-200' 
                : 'bg-gray-50 border-gray-200',
              selectable && 'cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors',
              !trait.found && 'opacity-60'
            )}
          >
            <div className="flex items-start gap-2">
              <span className={cn(
                'font-medium text-sm',
                isFlaw ? 'text-red-800' : 'text-gray-900'
              )}>
                {trait.name}
              </span>
              {selectable && (
                <span className="ml-auto text-xs text-primary-600 font-medium">
                  (selectable)
                </span>
              )}
            </div>
            <p className={cn(
              'text-xs mt-1',
              isFlaw ? 'text-red-600' : 'text-gray-600'
            )}>
              {trait.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpeciesModal({ 
  species, 
  traits, 
  isOpen, 
  onSelect, 
  onClose 
}: SpeciesModalProps) {
  // Resolve all trait categories
  const resolvedTraits = useMemo(() => {
    if (!species || !traits) return null;
    
    return {
      speciesTraits: resolveTraits(species.species_traits || [], traits),
      ancestryTraits: resolveTraits(species.ancestry_traits || [], traits),
      flaws: resolveTraits(species.flaws || [], traits),
      characteristics: resolveTraits(species.characteristics || [], traits),
    };
  }, [species, traits]);

  if (!species || !isOpen) return null;

  // Format sizes - species can have multiple size options
  const sizesDisplay = Array.isArray(species.sizes) && species.sizes.length > 0
    ? species.sizes.join(' / ')
    : species.size || 'Medium';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={species.name}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{species.name}</h2>
          <p className="text-gray-600 mt-1">{species.description}</p>
        </div>

        {/* Stats Grid - NO SPEED (species don't have speed in RTDB) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl mb-6">
          <div className="text-center">
            <span className="block text-xs text-gray-500 uppercase tracking-wide">Size</span>
            <span className="font-bold text-gray-900 capitalize">{sizesDisplay}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs text-gray-500 uppercase tracking-wide">Type</span>
            <span className="font-bold text-gray-900 capitalize">{species.type || 'Humanoid'}</span>
          </div>
          {species.ave_height && (
            <div className="text-center">
              <span className="block text-xs text-gray-500 uppercase tracking-wide">Avg Height</span>
              <span className="font-bold text-gray-900">{species.ave_height} cm</span>
            </div>
          )}
          {species.ave_weight && (
            <div className="text-center">
              <span className="block text-xs text-gray-500 uppercase tracking-wide">Avg Weight</span>
              <span className="font-bold text-gray-900">{species.ave_weight} kg</span>
            </div>
          )}
        </div>

        {/* Ability Bonuses */}
        {species.ability_bonuses && Object.keys(species.ability_bonuses).length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-700 mb-2">
              Ability Bonuses
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(species.ability_bonuses).map(([ability, bonus]) => (
                <span
                  key={ability}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                >
                  {ability.substring(0, 3).toUpperCase()} +{bonus}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trait Sections */}
        {resolvedTraits && (
          <>
            <TraitSection 
              title="Species Traits" 
              traits={resolvedTraits.speciesTraits} 
            />
            <TraitSection 
              title="Ancestry Traits" 
              traits={resolvedTraits.ancestryTraits}
              selectable
            />
            <TraitSection 
              title="Flaws" 
              traits={resolvedTraits.flaws}
              isFlaw
              selectable
            />
            <TraitSection 
              title="Characteristics" 
              traits={resolvedTraits.characteristics}
              selectable
            />
          </>
        )}

        {/* Languages */}
        {species.languages && species.languages.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-700 mb-2">
              Languages
            </h4>
            <div className="flex flex-wrap gap-2">
              {species.languages.map(lang => (
                <span 
                  key={lang}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 pt-4 border-t border-gray-200">
          <button 
            onClick={onSelect} 
            className="btn-continue flex-1"
          >
            Pick Me!
          </button>
          <button 
            onClick={onClose} 
            className="btn-back flex-1"
          >
            Nah...
          </button>
        </div>
      </div>
    </Modal>
  );
}
