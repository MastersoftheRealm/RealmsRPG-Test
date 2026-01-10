/**
 * Species Step
 * =============
 * Choose character species with real data from Firebase RTDB
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useSpecies, useTraits, type Species, type Trait } from '@/hooks';

export function SpeciesStep() {
  const { draft, nextStep, prevStep, setSpecies } = useCharacterCreatorStore();
  const { data: species, isLoading: speciesLoading } = useSpecies();
  const { data: traits } = useTraits();
  const [expandedSpecies, setExpandedSpecies] = useState<string | null>(null);

  const handleSelect = (speciesId: string, speciesName: string) => {
    setSpecies(speciesId, speciesName);
  };

  const getTraitsForSpecies = (speciesId: string): Trait[] => {
    if (!traits) return [];
    return traits.filter(t => t.species?.includes(speciesId));
  };

  if (speciesLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Species</h1>
      <p className="text-gray-600 mb-6">
        Your species defines your character&apos;s physical traits and inherent abilities.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {species?.map((s) => {
          const isSelected = draft.ancestry?.id === s.id;
          const isExpanded = expandedSpecies === s.id;
          const speciesTraits = getTraitsForSpecies(s.id);
          
          return (
            <div
              key={s.id}
              className={cn(
                'rounded-xl border-2 overflow-hidden transition-all',
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <button
                onClick={() => handleSelect(s.id, s.name)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{s.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">
                      {s.size}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                      Speed {s.speed}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                
                {s.ability_bonuses && Object.keys(s.ability_bonuses).length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {Object.entries(s.ability_bonuses).map(([ability, bonus]) => (
                      <span
                        key={ability}
                        className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded"
                      >
                        {ability.substring(0, 3).toUpperCase()} +{bonus}
                      </span>
                    ))}
                  </div>
                )}
              </button>
              
              {speciesTraits.length > 0 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSpecies(isExpanded ? null : s.id);
                    }}
                    className="w-full px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 border-t border-gray-200"
                  >
                    {isExpanded ? 'Hide Traits ▲' : `Show ${speciesTraits.length} Traits ▼`}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                      <div className="space-y-2 mt-3">
                        {speciesTraits.map(trait => (
                          <div key={trait.id} className="p-2 bg-white rounded border border-gray-100">
                            <span className="font-medium text-sm">{trait.name}</span>
                            <p className="text-xs text-gray-600">{trait.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {(!species || species.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <p className="text-amber-700 text-center">
            No species data available. Please check Firebase connection.
          </p>
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          disabled={!draft.ancestry?.id}
          className={cn(
            'px-8 py-3 rounded-xl font-bold transition-colors',
            draft.ancestry?.id
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
