/**
 * Species Step
 * =============
 * Choose character species: single (from All / Public / My) or Mixed (two species).
 */

'use client';

import { useState, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Chip, Button, Alert, Spinner } from '@/components/ui';
import { SegmentedControl } from '@/components/shared';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useMergedSpecies, useUserSpecies, useTraits, type Species } from '@/hooks';
import { SpeciesModal } from '../species-modal';
import { MixedSpeciesModal } from '../MixedSpeciesModal';
import { CreatorStepFooter } from '../creator-step-footer';
import { GitMerge, Info } from 'lucide-react';
import Tippy from '@tippyjs/react';
import { chooseYourSpecies } from '../../../../public/tooltip-text';

type SourceFilterValue = 'all' | 'public' | 'my' | 'make';

function activateOnEnterOrSpace(e: KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
}

export function SpeciesStep() {
  const { draft, nextStep, prevStep, setSpecies, setMixedSpecies } = useCharacterCreatorStore();
  const { data: allSpecies = [], isLoading: speciesLoading } = useMergedSpecies();
  const { data: userSpeciesList = [] } = useUserSpecies();
  const { data: traits } = useTraits();
  const [source, setSource] = useState<SourceFilterValue>('public');
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
      <div className="flex items-center gap-1 mb-2">
        <h2 className="text-2xl font-bold text-text-primary">Choose Your Species</h2>
        <Tippy content={chooseYourSpecies} allowHTML={true}>
          <Info className="w-4 h-4 text-primary-700" aria-hidden />
        </Tippy>
      </div>
      <p className="text-text-secondary mb-4">
        Your species defines your character&apos;s physical traits and inherent abilities.
        Click a card to view details, or choose Mixed to combine two species.
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <span className="text-sm font-medium text-text-secondary">Source:</span>
        <SegmentedControl
          value={source}
          onChange={(next) => {
            if (next === 'make') {
              if (typeof window !== 'undefined') {
                window.open('/species-creator', '_blank', 'noopener,noreferrer');
              }
              setSource('my');
              return;
            }
            setSource(next);
          }}
          options={[
            { value: 'all', label: 'All sources' },
            { value: 'public', label: 'Public species' },
            { value: 'my', label: 'My species' },
            { value: 'make', label: 'Make a Species' },
          ]}
          aria-label="Species list source"
          className="flex-1 min-w-0 sm:flex-initial"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Mixed species option */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowMixedModal(true)}
          onKeyDown={(e) => activateOnEnterOrSpace(e, () => setShowMixedModal(true))}
          className={cn(
            'selection-card flex flex-col items-center justify-center min-h-35 border-2 border-dashed',
            isMixedSelected ? 'selection-card--selected border-primary-500' : 'border-border hover:border-primary-400'
          )}
        >
          <GitMerge className="w-10 h-10 text-primary-600 mb-2" />
          <h3 className="font-bold text-text-primary">Mixed species</h3>
          <p className="text-sm text-text-secondary text-center mt-1">Combine two species</p>
          {isMixedSelected && (
            <span className="text-xs px-2 py-0.5 bg-primary-600 text-white dark:bg-primary-100 dark:text-white rounded mt-2">✓ Selected</span>
          )}
        </div>

        {species?.map((s: Species) => {
          const isSelected = !draft.ancestry?.mixed && draft.ancestry?.id === s.id;
          
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(s)}
              onKeyDown={(e) => activateOnEnterOrSpace(e, () => handleCardClick(s))}
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
                  {/* NO SPEED - species don't have speed values */}
                  {isSelected && (
                    <span className="text-xs px-2 py-0.5 bg-primary-600 text-white dark:bg-primary-100 dark:text-white rounded">
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

      <CreatorStepFooter onBack={prevStep} onContinue={nextStep} continueDisabled={!canContinue} />

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
