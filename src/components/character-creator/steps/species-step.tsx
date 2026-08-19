/**
 * Species Step
 * =============
 * Choose character species: single (from All / Public / My) or Mixed (two species).
 */

'use client';

import { useState, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button, Alert, Spinner, SelectionCardSurface, DescriptorChip } from '@/components/ui';
import {
  SegmentedControl,
  InfoTippy,
  MixedSpeciesModal,
  PathHelpCard,
  PathNotes,
} from '@/components/patterns';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import {
  useMergedSpecies,
  useUserSpecies,
  useTraits,
  useCodexSkills,
  useCreatorPathData,
  resolveSkillIdsToNames,
  type Species,
} from '@/hooks';
import { SpeciesModal } from '../species-modal';
import { CreatorStepFooter } from '../creator-step-footer';
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

  const userSpeciesIds = useMemo(
    () => new Set((userSpeciesList ?? []).map((s) => s.id)),
    [userSpeciesList],
  );

  const species = useMemo(() => {
    if (source === 'my') return allSpecies.filter((s) => userSpeciesIds.has(s.id));
    if (source === 'public') return allSpecies.filter((s) => !userSpeciesIds.has(s.id));
    return allSpecies;
  }, [allSpecies, source, userSpeciesIds]);

  const pathMode = draft.creationMode === 'path';
  const layer = getStepLayer('species');
  const showFullCatalog = !pathMode || layer >= 2;
  const pathData = useCreatorPathData();
  /** Species curation uses `is_starter` only (TASK-517) — no path-recommended species. */
  const hasStarters = useMemo(
    () => species.some((s) => Boolean((s as Species).is_starter)),
    [species],
  );
  const starterSpecies = useMemo(
    () => (hasStarters ? species.filter((s) => Boolean((s as Species).is_starter)) : []),
    [species, hasStarters],
  );
  const speciesForGrid = useMemo(() => {
    if (pathMode && !showFullCatalog && starterSpecies.length > 0) {
      return starterSpecies;
    }
    return species;
  }, [pathMode, showFullCatalog, starterSpecies, species]);

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
  const canContinue = !!draft.ancestry?.id;
  const completion = useMemo(
    () =>
      getStepCompletion('species', draft, {
        allSpecies,
        codexSkills: codexSkills ?? null,
        allTraits: null,
      }),
    [draft, allSpecies, codexSkills],
  );

  if (speciesLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col">
      <div className="mb-2 flex items-center gap-1">
        <h2 className="text-2xl font-bold text-text-primary">Choose Your Species</h2>
        <InfoTippy
          content={chooseYourSpecies}
          allowHTML
          label="Species selection help"
          size="inline"
        />
      </div>
      <p className="mb-4 text-text-secondary">
        Your species defines your character&apos;s physical traits and inherent abilities. Pick one
        straight from the grid, open details for the full breakdown, or choose Mixed to combine two
        species.
      </p>

      {pathMode && draft.archetype?.name && (
        <>
          <PathHelpCard pathName={draft.archetype.name}>
            {hasStarters && !showFullCatalog
              ? 'Starter species for new characters. Pick one, or browse all species below.'
              : 'Choose the species that fits your character, or browse the full list.'}
          </PathHelpCard>
          <PathNotes pathName={draft.archetype.name} notes={pathData?.level1?.notes} />
        </>
      )}

      {pathMode && !showFullCatalog && hasStarters && (
        <div className="mb-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => expandLayer('species')} className="min-h-11">
            Browse all species
          </Button>
        </div>
      )}

      {pathMode && showFullCatalog && hasStarters && (
        <div className="mb-4">
          <Button variant="link" onClick={() => collapseLayer('species')} className="min-h-11 px-0">
            See starter species
          </Button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-4">
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
          className="min-w-0 flex-1 sm:flex-initial"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Mixed species option */}
        <SelectionCardSurface
          role="button"
          tabIndex={0}
          selected={isMixedSelected}
          onClick={() => setShowMixedModal(true)}
          onKeyDown={(e) => activateOnEnterOrSpace(e, () => setShowMixedModal(true))}
          className={cn(
            'flex min-h-35 flex-col items-center justify-center border-dashed',
            isMixedSelected
              ? 'border-primary-outline-border'
              : 'border-border hover:border-primary-outline-border',
          )}
        >
          <GitMerge className="mb-2 h-10 w-10 text-primary-link-fg" />
          <h3 className="font-bold text-text-primary">Mixed species</h3>
          <p className="mt-1 text-center text-sm text-text-secondary">Combine two species</p>
          {isMixedSelected && (
            <span className="mt-2 rounded bg-primary-button px-2 py-0.5 text-xs text-text-on-dark">
              ✓ Selected
            </span>
          )}
        </SelectionCardSurface>

        {speciesForGrid?.map((s: Species) => {
          const isSelected = !draft.ancestry?.mixed && draft.ancestry?.id === s.id;
          const traitCount = Array.isArray(s.species_traits) ? s.species_traits.length : 0;
          const skillNames =
            Array.isArray(s.skills) && s.skills.length > 0
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
              <div className="mb-2 flex items-start gap-3">
                {/* Image-forward avatar (species have no portrait field yet — stylized initial). */}
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-subtle-border bg-primary-subtle-bg text-lg font-bold text-primary-fg"
                  aria-hidden
                >
                  {s.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-bold text-text-primary">{s.name}</h3>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded bg-surface-alt px-2 py-0.5 text-xs text-text-secondary capitalize">
                        {getSizesDisplay(s)}
                      </span>
                      {isSelected && (
                        <span className="rounded bg-primary-button px-2 py-0.5 text-xs text-text-on-dark">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{s.description}</p>
                </div>
              </div>

              {s.ability_bonuses && Object.keys(s.ability_bonuses).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(s.ability_bonuses).map(([ability, bonus]) => (
                    <DescriptorChip key={ability} variant="primary" size="sm">
                      {ability.substring(0, 3).toUpperCase()} +{bonus}
                    </DescriptorChip>
                  ))}
                </div>
              )}

              {/* Inline at-a-glance summary so basics read without opening the modal. */}
              <p className="mt-2 text-xs text-text-muted">
                {traitCount > 0 && (
                  <>
                    {traitCount} species trait{traitCount !== 1 ? 's' : ''}
                  </>
                )}
                {traitCount > 0 && skillNames.length > 0 && ' · '}
                {skillNames.length > 0 && (
                  <>
                    Skills: {skillNames.slice(0, 3).join(', ')}
                    {skillNames.length > 3 ? '…' : ''}
                  </>
                )}
              </p>

              <div className="mt-3 flex items-center gap-2">
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
          {pathMode && !showFullCatalog && hasStarters
            ? 'No starter species matched this source filter. Browse all species or try another source.'
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
