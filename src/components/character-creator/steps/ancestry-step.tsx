/**
 * Ancestry Step
 * ==============
 * Select ancestry traits, characteristic, and optional flaw from species.
 * 
 * Selection Rules:
 * - 1 ancestry trait by default
 * - Selecting a flaw grants +1 extra ancestry trait (up to 2 total)
 * - 1 characteristic (optional)
 * - Species traits are automatic (not selectable)
 */

'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Chip, Button, Alert } from '@/components/ui';
import { SelectionToggle } from '@/components/shared';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useSpecies, useTraits, useRTDBSkills, resolveTraitIds, resolveSkillIdsToNames, type Trait } from '@/hooks';
import { Heart, AlertTriangle, Sparkles, Star } from 'lucide-react';

interface ResolvedTrait extends Trait {
  found: boolean;
}

export function AncestryStep() {
  const { draft, nextStep, prevStep, setStep, updateDraft } = useCharacterCreatorStore();
  const { data: allSpecies } = useSpecies();
  const { data: allTraits } = useTraits();
  const { data: allSkills } = useRTDBSkills();

  // Find selected species
  const selectedSpecies = useMemo(() => {
    if (!allSpecies || !draft.ancestry?.id) return null;
    return allSpecies.find(s => s.id === draft.ancestry?.id);
  }, [allSpecies, draft.ancestry?.id]);

  // Resolve species skill IDs to names
  const speciesSkillNames = useMemo(() => {
    if (!selectedSpecies?.skills || !allSkills) return [];
    return resolveSkillIdsToNames(selectedSpecies.skills, allSkills);
  }, [selectedSpecies?.skills, allSkills]);

  // Current selections from draft
  const selectedTraitIds = draft.ancestry?.selectedTraits || [];
  const selectedFlaw = draft.ancestry?.selectedFlaw || null;
  const selectedCharacteristic = draft.ancestry?.selectedCharacteristic || null;

  // Resolve trait categories from species
  const { speciesTraits, ancestryTraits, flaws, characteristics } = useMemo(() => {
    if (!selectedSpecies || !allTraits) {
      return { speciesTraits: [], ancestryTraits: [], flaws: [], characteristics: [] };
    }

    const resolve = (ids: (string | number)[]): ResolvedTrait[] => {
      return resolveTraitIds(ids, allTraits).map(t => ({
        ...t,
        found: t.id !== t.name,
      }));
    };

    return {
      speciesTraits: resolve(selectedSpecies.species_traits || []),
      ancestryTraits: resolve(selectedSpecies.ancestry_traits || []),
      flaws: resolve(selectedSpecies.flaws || []),
      characteristics: resolve(selectedSpecies.characteristics || []),
    };
  }, [selectedSpecies, allTraits]);

  // Calculate max ancestry traits based on flaw selection
  const maxAncestryTraits = selectedFlaw ? 2 : 1;

  // Toggle ancestry trait selection
  const toggleAncestryTrait = useCallback((traitId: string) => {
    const isSelected = selectedTraitIds.includes(traitId);
    let newTraits: string[];

    if (isSelected) {
      newTraits = selectedTraitIds.filter(id => id !== traitId);
    } else {
      if (selectedTraitIds.length >= maxAncestryTraits) {
        newTraits = [...selectedTraitIds.slice(1), traitId];
      } else {
        newTraits = [...selectedTraitIds, traitId];
      }
    }

    updateDraft({
      ancestry: {
        ...draft.ancestry,
        id: draft.ancestry?.id || '',
        name: draft.ancestry?.name || '',
        selectedTraits: newTraits,
      },
    });
  }, [selectedTraitIds, maxAncestryTraits, draft.ancestry, updateDraft]);

  // Toggle flaw selection
  const toggleFlaw = useCallback((flawId: string) => {
    const isSelected = selectedFlaw === flawId;
    const newFlaw = isSelected ? null : flawId;

    const currentTraits = selectedTraitIds;
    const newMaxTraits = newFlaw ? 2 : 1;
    const newTraits = currentTraits.length > newMaxTraits 
      ? currentTraits.slice(0, newMaxTraits)
      : currentTraits;

    updateDraft({
      ancestry: {
        ...draft.ancestry,
        id: draft.ancestry?.id || '',
        name: draft.ancestry?.name || '',
        selectedFlaw: newFlaw,
        selectedTraits: newTraits,
      },
    });
  }, [selectedFlaw, selectedTraitIds, draft.ancestry, updateDraft]);

  // Toggle characteristic selection
  const toggleCharacteristic = useCallback((charId: string) => {
    const isSelected = selectedCharacteristic === charId;
    updateDraft({
      ancestry: {
        ...draft.ancestry,
        id: draft.ancestry?.id || '',
        name: draft.ancestry?.name || '',
        selectedCharacteristic: isSelected ? null : charId,
      },
    });
  }, [selectedCharacteristic, draft.ancestry, updateDraft]);

  // Validation
  const canContinue = selectedTraitIds.length >= 1 || ancestryTraits.length === 0;

  // No species selected
  if (!selectedSpecies) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Choose Your Ancestry Traits</h1>
        <p className="text-text-secondary mb-6">
          Customize your character with ancestry traits and an optional flaw.
        </p>
        
        <Alert variant="warning" className="mb-8">
          <div className="text-center">
            <p className="mb-4">
              <strong>No species selected!</strong> Please choose a species first.
            </p>
            <Button
              onClick={() => setStep('species')}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Go to Species Selection
            </Button>
          </div>
        </Alert>
        
        <div className="flex justify-between">
          <Button variant="secondary" onClick={prevStep}>← Back</Button>
          <Button disabled>Continue →</Button>
        </div>
      </div>
    );
  }

  // Format sizes display
  const sizesDisplay = Array.isArray(selectedSpecies.sizes) && selectedSpecies.sizes.length > 0
    ? selectedSpecies.sizes.join(' / ')
    : selectedSpecies.size || 'Medium';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Choose Your Ancestry Traits</h1>
          <p className="text-text-secondary">
            As a <strong>{selectedSpecies.name}</strong>, customize your heritage with traits and abilities.
          </p>
        </div>
        <button
          onClick={() => setStep('species')}
          className="text-sm text-primary-600 hover:text-primary-800 underline"
        >
          Change Species
        </button>
      </div>

      {/* Species Info Summary */}
      <div className="bg-surface-alt rounded-xl p-4 mb-6 border border-border-light">
        {/* Species Description */}
        {selectedSpecies.description && (
          <p className="text-text-secondary text-sm mb-4 leading-relaxed">
            {selectedSpecies.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <span className="block text-xs text-text-muted uppercase">Size</span>
            <span className="font-bold text-text-primary capitalize">{sizesDisplay}</span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Type</span>
            <span className="font-bold text-text-primary capitalize">{selectedSpecies.type || 'Humanoid'}</span>
          </div>
          {selectedSpecies.ave_height && (
            <div>
              <span className="block text-xs text-text-muted uppercase">Avg Height</span>
              <span className="font-bold text-text-primary">{selectedSpecies.ave_height} cm</span>
            </div>
          )}
          {selectedSpecies.ave_weight && (
            <div>
              <span className="block text-xs text-text-muted uppercase">Avg Weight</span>
              <span className="font-bold text-text-primary">{selectedSpecies.ave_weight} kg</span>
            </div>
          )}
        </div>
        
        {/* Skills and Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border-light">
          {speciesSkillNames.length > 0 && (
            <div>
              <span className="text-xs text-text-muted uppercase">Species Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {speciesSkillNames.map(skillName => (
                  <Chip key={skillName} variant="default" size="sm">
                    {skillName}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {selectedSpecies.languages && selectedSpecies.languages.length > 0 && (
            <div>
              <span className="text-xs text-text-muted uppercase">Languages:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedSpecies.languages.map(lang => (
                  <Chip key={lang} variant="primary" size="sm">
                    {lang}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedTraitIds.length === maxAncestryTraits
            ? 'bg-green-50 border-green-300'
            : 'bg-amber-50 border-amber-300'
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Ancestry Traits</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedTraitIds.length === maxAncestryTraits
                ? 'bg-green-200 text-green-800'
                : 'bg-amber-200 text-amber-800'
            )}>
              {selectedTraitIds.length} / {maxAncestryTraits}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            {selectedFlaw ? 'Flaw grants +1 trait!' : 'Select a flaw for +1 trait'}
          </p>
        </div>

        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedCharacteristic
            ? 'bg-green-50 border-green-300'
            : 'bg-blue-50 border-blue-300'
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Characteristic</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedCharacteristic
                ? 'bg-green-200 text-green-800'
                : 'bg-blue-200 text-blue-800'
            )}>
              {selectedCharacteristic ? '1' : '0'} / 1
            </span>
          </div>
          <p className="text-xs text-text-secondary">Optional bonus trait</p>
        </div>

        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedFlaw
            ? 'bg-red-50 border-red-300'
            : 'bg-surface-alt border-border-light'
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Flaw</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedFlaw
                ? 'bg-red-200 text-red-800'
                : 'bg-surface text-text-secondary'
            )}>
              {selectedFlaw ? '1' : '0'} / 1
            </span>
          </div>
          <p className="text-xs text-text-secondary">Optional, grants +1 trait</p>
        </div>
      </div>

      {/* Species Traits (Automatic) */}
      {speciesTraits.length > 0 && (
        <TraitSection
          title="Species Traits"
          subtitle="These are automatically applied"
          icon={<Heart className="w-5 h-5 text-primary-600" />}
          traits={speciesTraits}
          selectable={false}
          selectedIds={[]}
          onToggle={() => {}}
        />
      )}

      {/* Ancestry Traits (Selectable) */}
      {ancestryTraits.length > 0 && (
        <TraitSection
          title="Ancestry Traits"
          subtitle={`Select ${maxAncestryTraits} trait${maxAncestryTraits > 1 ? 's' : ''}`}
          icon={<Star className="w-5 h-5 text-amber-600" />}
          traits={ancestryTraits}
          selectable
          selectedIds={selectedTraitIds}
          onToggle={toggleAncestryTrait}
          variant="ancestry"
        />
      )}

      {/* Characteristics (Selectable - 1) */}
      {characteristics.length > 0 && (
        <TraitSection
          title="Characteristics"
          subtitle="Select 1 characteristic (optional)"
          icon={<Sparkles className="w-5 h-5 text-blue-600" />}
          traits={characteristics}
          selectable
          selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
          onToggle={toggleCharacteristic}
          variant="characteristic"
        />
      )}

      {/* Flaws (Selectable - 1) */}
      {flaws.length > 0 && (
        <TraitSection
          title="Flaws"
          subtitle="Select 1 flaw to gain an extra ancestry trait (optional)"
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          traits={flaws}
          selectable
          selectedIds={selectedFlaw ? [selectedFlaw] : []}
          onToggle={toggleFlaw}
          variant="flaw"
        />
      )}

      {/* No traits message */}
      {ancestryTraits.length === 0 && speciesTraits.length === 0 && (
        <div className="bg-surface-alt border border-border-light rounded-xl p-6 mb-6 text-center">
          <p className="text-text-secondary">
            No specific ancestry traits defined for {selectedSpecies.name}.
            You may continue without selecting traits.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="secondary" onClick={prevStep}>← Back</Button>
        <Button
          onClick={nextStep}
          disabled={!canContinue}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// TraitSection Component
// =============================================================================

interface TraitSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  traits: ResolvedTrait[];
  selectable: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  variant?: 'default' | 'ancestry' | 'characteristic' | 'flaw';
}

function TraitSection({
  title,
  subtitle,
  icon,
  traits,
  selectable,
  selectedIds,
  onToggle,
  variant = 'default',
}: TraitSectionProps) {
  const variantStyles = {
    default: {
      border: 'border-border-light',
      header: 'bg-surface-alt',
      selected: 'border-primary-400 bg-primary-50',
    },
    ancestry: {
      border: 'border-amber-200',
      header: 'bg-amber-50',
      selected: 'border-amber-400 bg-amber-50',
    },
    characteristic: {
      border: 'border-blue-200',
      header: 'bg-blue-50',
      selected: 'border-blue-400 bg-blue-50',
    },
    flaw: {
      border: 'border-red-200',
      header: 'bg-red-50',
      selected: 'border-red-400 bg-red-50',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('border rounded-xl overflow-hidden mb-6', styles.border)}>
      <div className={cn('px-4 py-3 border-b flex items-center gap-2', styles.header, styles.border)}>
        {icon}
        <div>
          <h3 className="font-bold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      
      <div className="divide-y divide-border-subtle">
        {traits.map(trait => {
          const isSelected = selectedIds.includes(trait.id);
          
          return (
            <div
              key={trait.id}
              className={cn(
                'px-4 py-3 transition-colors',
                selectable && 'hover:bg-surface-alt',
                isSelected && styles.selected
              )}
            >
              <div className="flex items-start gap-3">
                {selectable && (
                  <div className="flex-shrink-0 self-center">
                    <SelectionToggle
                      isSelected={isSelected}
                      onToggle={() => onToggle(trait.id)}
                      size="lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary">{trait.name}</h4>
                  <p className="text-sm text-text-secondary mt-1">{trait.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
