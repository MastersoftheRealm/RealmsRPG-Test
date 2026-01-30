/**
 * Species Step
 * =============
 * Choose character species with real data from Firebase RTDB
 * Phase 1 fix: Added modal popup, removed speed display, fixed size handling
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Chip, Button, Alert } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useSpecies, useTraits, type Species } from '@/hooks';
import { SpeciesModal } from '../species-modal';

export function SpeciesStep() {
  const { draft, nextStep, prevStep, setSpecies } = useCharacterCreatorStore();
  const { data: species, isLoading: speciesLoading } = useSpecies();
  const { data: traits } = useTraits();
  const [selectedSpeciesForModal, setSelectedSpeciesForModal] = useState<Species | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleCardClick = (s: Species) => {
    setSelectedSpeciesForModal(s);
    setShowModal(true);
  };

  const handleSelect = (speciesId: string, speciesName: string) => {
    setSpecies(speciesId, speciesName);
    setShowModal(false);
  };

  // Get sizes display - species can have multiple size options
  const getSizesDisplay = (s: Species): string => {
    if (Array.isArray(s.sizes) && s.sizes.length > 0) {
      return s.sizes.join('/');
    }
    return s.size || 'Medium';
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
      <h1 className="text-2xl font-bold text-text-primary mb-2">Choose Your Species</h1>
      <p className="text-text-secondary mb-6">
        Your species defines your character&apos;s physical traits and inherent abilities.
        Click on a species card to view full details.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {species?.map((s) => {
          const isSelected = draft.ancestry?.id === s.id;
          
          return (
            <div
              key={s.id}
              onClick={() => handleCardClick(s)}
              className={cn(
                'selection-card',
                isSelected && 'selection-card--selected'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-text-primary">{s.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-surface-alt text-text-secondary rounded capitalize">
                    {getSizesDisplay(s)}
                  </span>
                  {/* NO SPEED - species don't have speed values in RTDB */}
                  {isSelected && (
                    <span className="text-xs px-2 py-0.5 bg-primary-600 text-white rounded">
                      ✓ Selected
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2">{s.description}</p>
              
              {s.ability_bonuses && Object.keys(s.ability_bonuses).length > 0 && (
                <div className="flex gap-1 mt-2">
                  {Object.entries(s.ability_bonuses).map(([ability, bonus]) => (
                    <Chip key={ability} variant="success" size="sm">
                      {ability.substring(0, 3).toUpperCase()} +{bonus}
                    </Chip>
                  ))}
                </div>
              )}
              
              <Button 
                variant="link"
                size="sm"
                className="mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(s);
                }}
              >
                View Details →
              </Button>
            </div>
          );
        })}
      </div>
      
      {(!species || species.length === 0) && (
        <Alert variant="warning" className="mb-8">
          No species data available. Please check Firebase connection.
        </Alert>
      )}
      
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!draft.ancestry?.id}
        >
          Continue →
        </Button>
      </div>

      {/* Species Details Modal */}
      <SpeciesModal
        species={selectedSpeciesForModal}
        traits={traits || []}
        isOpen={showModal}
        onSelect={() => {
          if (selectedSpeciesForModal) {
            handleSelect(selectedSpeciesForModal.id, selectedSpeciesForModal.name);
          }
        }}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
