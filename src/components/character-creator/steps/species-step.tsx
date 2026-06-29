/**
 * Species Step
 * =============
 * Choose character species: single (from All / Public / My) or Mixed (two species).
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Chip, Button, Alert, Spinner, SelectionCardSurface } from '@/components/ui';
import { SegmentedControl, InfoTippy } from '@/components/shared';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useMergedSpecies, useUserSpecies, useTraits, useCodexSkills, useCreatorPathData, resolveSkillIdsToNames, type Species } from '@/hooks';
import { SpeciesModal } from '../species-modal';
import { MixedSpeciesModal } from '../MixedSpeciesModal';
import { CreatorStepFooter } from '../creator-step-footer';
import { PathHelpCard, PathNotes } from '@/components/character-creator/PathHelpCard';
import { getStepCompletion } from '@/lib/character-creator-validation';
import { GitMerge } from 'lucide-react';
import { chooseYourSpecies } from '../../../../public/tooltip-text';

type SourceFilterValue = 'all' | 'public' | 'my' | 'make';

function activateOnEnterOrSpace(e: KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
}

export function SpeciesStep() {
  const {
    draft,
    nextStep,
    prevStep,
    setSpecies,
    setMixedSpecies,
    getStepLayer,
    expandLayer,
    collapseLayer,
  } = useCharacterCreatorStore();
  const { data: allSpecies = [], isLoading: speciesLoading } = useMergedSpecies();
  const { data: userSpeciesList = [] } = useUserSpecies();
  const { data: traits } = useTraits();
  const { data: codexSkills = [] } = useCodexSkills();
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

  const pathMode = draft.creationMode === 'path';
  const layer = getStepLayer('species');
  const showFullCatalog = !pathMode || layer >= 2;
  const pathData = useCreatorPathData();
  const recommendedSpeciesRefs = useMemo(
    () => new Set((pathData?.level1?.recommended_species ?? []).map((v) => String(v).toLowerCase().trim())),
    [pathData?.level1?.recommended_species]
  );
  const hasRecommendedSpecies = recommendedSpeciesRefs.size > 0;
  const matchesRecommended = useCallback(
    (s: Species) =>
      recommendedSpeciesRefs.has(String(s.id).toLowerCase()) ||
      recommendedSpeciesRefs.has(String(s.name ?? '').toLowerCase()),
    [recommendedSpeciesRefs]
  );
  const recommendedSpecies = useMemo(
    () => (hasRecommendedSpecies ? species.filter(matchesRecommended) : []),
    [species, hasRecommendedSpecies, matchesRecommended]
  );
  const speciesForGrid = useMemo(() => {
    if (pathMode && !showFullCatalog && recommendedSpecies.length > 0) {
      return recommendedSpecies;
    }
    return species;
  }, [pathMode, showFullCatalog, recommendedSpecies, species]);

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
  const completion = useMemo(
    () => getStepCompletion('species', draft, { allSpecies, codexSkills: codexSkills ?? null, allTraits: null }),
    [draft, allSpecies, codexSkills]
  );

  if (speciesLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-1 mb-2">
        <h2 className="text-2xl font-bold text-text-primary">Choose Your Species</h2>
        <InfoTippy content={chooseYourSpecies} allowHTML label="Species selection help" size="inline" />
      </div>
      <p className="text-text-secondary mb-4">
        Your species defines your character&apos;s physical traits and inherent abilities.
        Pick one straight from the grid, open details for the full breakdown, or choose Mixed to combine two species.
      </p>

      {pathMode && draft.archetype?.name && (
        <>
          <PathHelpCard pathName={draft.archetype.name}>
            {hasRecommendedSpecies
              ? 'These species fit your path — pick one, or browse all species below.'
              : 'Choose the species that fits your character, or browse the full list.'}
          </PathHelpCard>
          <PathNotes pathName={draft.archetype.name} notes={pathData?.level1?.notes} />
        </>
      )}

      {pathMode && !showFullCatalog && hasRecommendedSpecies && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => expandLayer('species')}
            className="min-h-11"
          >
            Browse all species
          </Button>
        </div>
      )}

      {pathMode && showFullCatalog && hasRecommendedSpecies && (
        <div className="mb-4">
          <Button variant="link" onClick={() => collapseLayer('species')} className="min-h-11 px-0">
            ← Back to path recommendations
          </Button>
        </div>
      )}

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
        <SelectionCardSurface
          role="button"
          tabIndex={0}
          selected={isMixedSelected}
          onClick={() => setShowMixedModal(true)}
          onKeyDown={(e) => activateOnEnterOrSpace(e, () => setShowMixedModal(true))}
          className={cn(
            'flex flex-col items-center justify-center min-h-35 border-dashed',
            isMixedSelected ? 'border-primary-outline-border' : 'border-border hover:border-primary-outline-border'
          )}
        >
          <GitMerge className="w-10 h-10 text-primary-link-fg mb-2" />
          <h3 className="font-bold text-text-primary">Mixed species</h3>
          <p className="text-sm text-text-secondary text-center mt-1">Combine two species</p>
          {isMixedSelected && (
            <span className="text-xs px-2 py-0.5 bg-primary-button text-white rounded mt-2">✓ Selected</span>
          )}
        </SelectionCardSurface>

        {speciesForGrid?.map((s: Species) => {
          const isSelected = !draft.ancestry?.mixed && draft.ancestry?.id === s.id;
          const traitCount = Array.isArray(s.species_traits) ? s.species_traits.length : 0;
          const skillNames = Array.isArray(s.skills) && s.skills.length > 0
            ? resolveSkillIdsToNames(s.skills, codexSkills).filter(Boolean)
            : [];

          return (
            <SelectionCardSurface
              key={s.id}
              role="button"
              tabIndex={0}
              selected={isSelected}
              onClick={() => handleCardClick(s)}
              onKeyDown={(e) => activateOnEnterOrSpace(e, () => handleCardClick(s))}
            >
              <div className="flex items-start gap-3 mb-2">
                {/* Image-forward avatar (species have no portrait field yet — stylized initial). */}
                <div
                  className="shrink-0 w-12 h-12 rounded-xl bg-primary-subtle-bg border border-primary-subtle-border flex items-center justify-center text-lg font-bold text-primary-fg"
                  aria-hidden
                >
                  {s.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-text-primary truncate">{s.name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 bg-surface-alt text-text-secondary rounded capitalize">
                        {getSizesDisplay(s)}
                      </span>
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 bg-primary-button text-white rounded">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2 mt-1">{s.description}</p>
                </div>
              </div>

              {s.ability_bonuses && Object.keys(s.ability_bonuses).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(s.ability_bonuses).map(([ability, bonus]) => (
                    <Chip key={ability} variant="primary" size="sm">
                      {ability.substring(0, 3).toUpperCase()} +{bonus}
                    </Chip>
                  ))}
                </div>
              )}

              {/* Inline at-a-glance summary so basics read without opening the modal. */}
              <p className="text-xs text-text-muted dark:text-text-secondary mt-2">
                {traitCount > 0 && <>{traitCount} species trait{traitCount !== 1 ? 's' : ''}</>}
                {traitCount > 0 && skillNames.length > 0 && ' · '}
                {skillNames.length > 0 && <>Skills: {skillNames.slice(0, 3).join(', ')}{skillNames.length > 3 ? '…' : ''}</>}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant={isSelected ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(s.id, s.name);
                  }}
                >
                  {isSelected ? '✓ Selected' : 'Select'}
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(s);
                  }}
                >
                  View details →
                </Button>
              </div>
            </SelectionCardSurface>
          );
        })}
      </div>
      
      {source !== 'all' && (!speciesForGrid || speciesForGrid.length === 0) && (
        <Alert variant="warning" className="mb-8">
          {pathMode && !showFullCatalog && hasRecommendedSpecies
            ? 'No recommended species matched this source filter. Browse all species or try another source.'
            : 'No species in this source. Try "All sources" or create species in the Species Creator (My species).'}
        </Alert>
      )}

      <CreatorStepFooter
        onBack={prevStep}
        onContinue={nextStep}
        continueDisabled={!canContinue}
        completionHint={draft.ancestry?.id ? <span>{completion.label}</span> : undefined}
      />

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
