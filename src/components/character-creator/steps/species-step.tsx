/**
 * Species Step
 * =============
 * Choose character species: single (from All / Public / My) or Mixed (two species).
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Chip, Button, Alert, Spinner } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useMergedSpecies, useUserSpecies, useTraits, type Species } from '@/hooks';
import { SpeciesModal } from '../species-modal';
import { MixedSpeciesModal } from '../MixedSpeciesModal';
import { GitMerge } from 'lucide-react';

type SourceFilterValue = 'all' | 'public' | 'my';

export function SpeciesStep() {
  const { draft, nextStep, prevStep, setSpecies, setMixedSpecies } = useCharacterCreatorStore();
  const { data: allSpecies = [], isLoading: speciesLoading } = useMergedSpecies();
  const { data: userSpeciesList = [] } = useUserSpecies();
  const { data: traits } = useTraits();
  const [source, setSource] = useState<SourceFilterValue>('all');
  const [selectedSpeciesForModal, setSelectedSpeciesForModal] = useState<Species | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMixedModal, setShowMixedModal] = useState(false);

  const userSpeciesIds = useMemo(() => new Set((userSpeciesList ?? []).map((s) => s.id)), [userSpeciesList]);

  const species = useMemo(() => {
    if (source === 'my') return allSpecies.filter((s) => userSpeciesIds.has(s.id));
    if (source === 'public') return allSpecies.filter((s) => !userSpeciesIds.has(s.id));
    return allSpecies;
  }, [allSpecies, source, userSpeciesIds]);

  const handleCardClick = (s: Species) => {
    setSelectedSpeciesForModal(s);
    setShowModal(true);
  };

  const handleSelect = (speciesId: string, speciesName: string) => {
    setSpecies(speciesId, speciesName);
    setShowModal(false);
  };

  const handleMixedConfirm = (a: { id: string; name: string }, b: { id: string; name: string }) => {
    setMixedSpecies(a, b);
    setShowMixedModal(false);
  };

  // Get sizes display - species can have multiple size options
  const getSizesDisplay = (s: Species): string => {
    if (Array.isArray(s.sizes) && s.sizes.length > 0) {
      return s.sizes.join('/');
    }
    return s.size || 'Medium';
  };

  const isMixedSelected = draft.ancestry?.mixed === true;
  const isSingleSelected = draft.ancestry?.id && !draft.ancestry?.mixed;
  const canContinue = !!(draft.ancestry?.id);

  if (speciesLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Choose Your Species</h1>
      <p className="text-text-secondary mb-4">
        Your species defines your character&apos;s physical traits and inherent abilities.
        Click a card to view details, or choose Mixed to combine two species.
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <span className="text-sm font-medium text-text-secondary">Source:</span>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-alt">
          {(['all', 'public', 'my'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSource(opt)}
              className={cn(
                'px-2 py-1 rounded text-sm font-medium transition-colors',
                source === opt ? 'bg-primary-600 text-white' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {opt === 'all' ? 'All sources' : opt === 'public' ? 'Public species' : 'My species'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Mixed species option */}
        <div
          onClick={() => setShowMixedModal(true)}
          className={cn(
            'selection-card flex flex-col items-center justify-center min-h-[140px] border-2 border-dashed',
            isMixedSelected ? 'selection-card--selected border-primary-500' : 'border-border hover:border-primary-400'
          )}
        >
          <GitMerge className="w-10 h-10 text-primary-600 mb-2" />
          <h3 className="font-bold text-text-primary">Mixed species</h3>
          <p className="text-sm text-text-secondary text-center mt-1">Combine two species</p>
          {isMixedSelected && (
            <span className="text-xs px-2 py-0.5 bg-primary-600 text-white rounded mt-2">✓ Selected</span>
          )}
        </div>

        {species?.map((s: Species) => {
          const isSelected = !draft.ancestry?.mixed && draft.ancestry?.id === s.id;
          
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
                    <Chip key={ability} variant="primary" size="sm">
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
      
      {source !== 'all' && (!species || species.length === 0) && (
        <Alert variant="warning" className="mb-8">
          No species in this source. Try &quot;All sources&quot; or create species in the Species Creator (My species).
        </Alert>
      )}
      
      <div className="flex justify-between">
        <Button variant="secondary" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep} disabled={!canContinue}>Continue →</Button>
      </div>

      <MixedSpeciesModal
        isOpen={showMixedModal}
        onClose={() => setShowMixedModal(false)}
        onConfirm={handleMixedConfirm}
        allSpecies={allSpecies}
        userSpeciesIds={userSpeciesIds}
      />

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
