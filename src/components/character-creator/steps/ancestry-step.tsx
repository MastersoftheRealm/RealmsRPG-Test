/**
 * Ancestry Step
 * ==============
 * Displays and confirms the selected species' ancestry traits
 * Shows species traits, ancestry traits, and characteristics
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useSpecies, useTraits, type Species, type Trait } from '@/hooks';
import { User, Ruler, Scale, Zap, Heart, Languages } from 'lucide-react';

export function AncestryStep() {
  const { draft, nextStep, prevStep, setStep } = useCharacterCreatorStore();
  const { data: allSpecies } = useSpecies();
  const { data: allTraits } = useTraits();

  // Find selected species
  const selectedSpecies = useMemo(() => {
    if (!allSpecies || !draft.ancestry?.id) return null;
    return allSpecies.find(s => s.id === draft.ancestry?.id);
  }, [allSpecies, draft.ancestry?.id]);

  // Get traits for selected species
  const speciesTraits = useMemo(() => {
    if (!allTraits || !selectedSpecies) return [];
    
    // Method 1: Check traits that list this species
    const traitsBySpecies = allTraits.filter(t => 
      t.species?.includes(selectedSpecies.id) || 
      t.species?.includes(selectedSpecies.name)
    );
    
    // Method 2: Check species.traits array for trait names
    const traitsByName = selectedSpecies.traits?.map(traitName => 
      allTraits.find(t => 
        t.name.toLowerCase() === traitName.toLowerCase() ||
        t.id === traitName
      )
    ).filter(Boolean) as Trait[] || [];
    
    // Combine and deduplicate
    const combined = [...traitsBySpecies];
    traitsByName.forEach(t => {
      if (!combined.some(existing => existing.id === t.id)) {
        combined.push(t);
      }
    });
    
    return combined;
  }, [allTraits, selectedSpecies]);

  // No species selected - prompt to go back
  if (!selectedSpecies) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Ancestry</h1>
        <p className="text-gray-600 mb-6">
          Review your species&apos; traits and characteristics.
        </p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <p className="text-amber-700 mb-4">
            <strong>No species selected!</strong> Please choose a species first.
          </p>
          <button
            onClick={() => setStep('species')}
            className="px-6 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700"
          >
            Go to Species Selection
          </button>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100"
          >
            ← Back
          </button>
          <button
            disabled
            className="px-8 py-3 rounded-xl font-bold bg-gray-200 text-gray-400 cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Ancestry</h1>
      <p className="text-gray-600 mb-6">
        Review your species&apos; traits and characteristics before continuing.
      </p>
      
      {/* Species Summary Card */}
      <div className="bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-1">{selectedSpecies.name}</h2>
            <p className="text-gray-600 max-w-xl">{selectedSpecies.description}</p>
          </div>
          <button
            onClick={() => setStep('species')}
            className="text-sm text-primary-600 hover:text-primary-800 underline"
          >
            Change Species
          </button>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <Ruler className="w-5 h-5 text-gray-400" />
            <div>
              <span className="text-xs text-gray-500 block">Size</span>
              <span className="font-medium capitalize">{selectedSpecies.sizes?.join(', ') || selectedSpecies.size}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <Zap className="w-5 h-5 text-gray-400" />
            <div>
              <span className="text-xs text-gray-500 block">Speed</span>
              <span className="font-medium">{selectedSpecies.speed} sq</span>
            </div>
          </div>
          {selectedSpecies.ave_height && (
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500 block">Avg Height</span>
                <span className="font-medium">
                  {selectedSpecies.ave_height} cm
                </span>
              </div>
            </div>
          )}
          {selectedSpecies.ave_weight && (
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
              <Scale className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500 block">Avg Weight</span>
                <span className="font-medium">
                  {selectedSpecies.ave_weight} kg
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Ability Bonuses */}
        {selectedSpecies.ability_bonuses && Object.keys(selectedSpecies.ability_bonuses).length > 0 && (
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-700 block mb-2">Ability Bonuses</span>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(selectedSpecies.ability_bonuses).map(([ability, bonus]) => (
                <span
                  key={ability}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {ability.charAt(0).toUpperCase() + ability.slice(1)} +{bonus}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Species Traits Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary-600" />
            Species Traits
            <span className="text-sm font-normal text-gray-500">
              ({speciesTraits.length} trait{speciesTraits.length !== 1 ? 's' : ''})
            </span>
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {speciesTraits.length > 0 ? (
            speciesTraits.map(trait => (
              <div key={trait.id} className="px-4 py-3 hover:bg-gray-50">
                <h4 className="font-medium text-gray-900">{trait.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{trait.description}</p>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              No specific traits defined for this species.
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <p className="text-blue-800 text-sm">
          <strong>Ready to continue?</strong> These traits will be automatically applied to your character.
          You can change your species at any time by going back.
        </p>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          className="px-8 py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
