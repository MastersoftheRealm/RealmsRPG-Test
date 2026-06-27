
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Modal, Chip, Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCodexSkills, resolveSkillIdsToNames } from '@/hooks';
import type { Species, Trait, Skill } from '@/hooks';
import { getChoiceOptionIds, resolveChoiceOptionTraits } from '@/lib/choice-trait';
import { ChevronDown } from 'lucide-react';

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
  optionTraits?: Array<Pick<Trait, 'id' | 'name' | 'description'>>;
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
        String(t.name ?? '').toLowerCase() === idStr.toLowerCase()
      );
    }
    
    if (trait) {
      const optionIds = getChoiceOptionIds(trait);
      const optionTraits = resolveChoiceOptionTraits(optionIds, allTraits);
      return { 
        id: trait.id, 
        name: trait.name, 
        description: trait.description || 'No description available.',
        found: true,
        optionTraits: optionTraits.map((t) => ({ id: t.id, name: t.name, description: t.description })),
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
      <h3 className="font-semibold text-sm uppercase tracking-wide mb-2 text-text-secondary">
        {title}
      </h3>
      <div className="space-y-2">
        {traits.map((trait, index) => {
          const optionTraits = trait.optionTraits ?? [];
          const hasOptions = optionTraits.length > 0;

          return (
            <div
              key={`${trait.id}-${index}`}
              className={cn(
                'rounded-lg border bg-surface-alt border-border-light',
                selectable && 'cursor-pointer hover:border-primary-outline-border hover:bg-primary-subtle-bg transition-colors',
                !trait.found && 'opacity-60'
              )}
            >
              {!hasOptions ? (
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-sm text-text-primary">{trait.name}</span>
                  </div>
                  <p className="text-xs mt-1 text-text-secondary">{trait.description}</p>
                </div>
              ) : (
                <details className="group">
                  <summary className="list-none cursor-pointer p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-text-primary">{trait.name}</span>
                        <Chip variant="info" size="sm">
                          {optionTraits.length} options
                        </Chip>
                      </div>
                      <p className="text-xs mt-1 text-text-secondary">{trait.description}</p>
                    </div>
                    <ChevronDown
                      className="w-4 h-4 text-text-muted dark:text-text-secondary shrink-0 mt-0.5 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-3 pb-3">
                    <div className="mt-2 rounded-lg border border-border-light bg-background/60">
                      <div className="px-3 py-2 border-b border-border-light">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                          Options
                        </p>
                      </div>
                      <div className="p-3 space-y-2">
                        {optionTraits.map((opt) => (
                          <div key={String(opt.id)} className="rounded-md border border-border-light bg-surface p-2">
                            <p className="text-sm font-medium text-text-primary">{opt.name}</p>
                            {opt.description ? (
                              <p className="text-xs text-text-secondary mt-1">{opt.description}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              )}
            </div>
          );
        })}
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
  // Fetch skills for ID → name resolution
  const { data: allSkills } = useCodexSkills();
  // State for showing skill description
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Clear skill description when viewing a different species or when modal closes (avoid carrying over)
  useEffect(() => {
    setSelectedSkill(null);
  }, [species?.id]);

  useEffect(() => {
    if (!isOpen) setSelectedSkill(null);
  }, [isOpen]);

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

  // Resolve species skill IDs to display: id "0" = "Any" (extra skill point), others = codex skill
  const speciesSkills = useMemo(() => {
    if (!species?.skills || !allSkills) return [] as Array<Skill & { displayName: string }>;
    return species.skills.map(skillId => {
      const idStr = String(skillId);
      if (idStr === '0') {
        return { id: '0', name: 'Any', displayName: 'Any' } as Skill & { displayName: string };
      }
      const found = allSkills.find((s: Skill) => s.id === idStr || String(s.name ?? '').toLowerCase() === idStr.toLowerCase());
      if (!found) return null;
      return { ...found, displayName: found.name ?? idStr };
    }).filter((s): s is Skill & { displayName: string } => s != null);
  }, [species?.skills, allSkills]);

  if (!species || !isOpen) return null;

  // Format sizes - species can have multiple size options
  const sizesDisplay = Array.isArray(species.sizes) && species.sizes.length > 0
    ? species.sizes.join(' / ')
    : species.size || 'Medium';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={species.name}
      fullScreenOnMobile
      flexLayout
      contentClassName="p-0"
      footer={
        <div className="shrink-0 border-t border-border-light p-4 flex justify-between gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1 min-h-[44px] min-w-[44px]">
            Nah...
          </Button>
          <Button onClick={onSelect} className="flex-1 min-h-[44px] min-w-[44px]">
            Pick Me!
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <p className="text-text-secondary">{species.description}</p>
        </div>

        {/* Stats Grid - NO SPEED (species don't have speed values) */}
        <Card className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface-alt mb-6 shadow-none">
          <div className="text-center">
            <span className="block text-xs text-text-muted dark:text-text-secondary uppercase tracking-wide">Size</span>
            <span className="font-bold text-text-primary capitalize">{sizesDisplay}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs text-text-muted dark:text-text-secondary uppercase tracking-wide">Type</span>
            <span className="font-bold text-text-primary capitalize">{species.type || 'Humanoid'}</span>
          </div>
          {species.ave_height && (
            <div className="text-center">
              <span className="block text-xs text-text-muted dark:text-text-secondary uppercase tracking-wide">Avg Height</span>
              <span className="font-bold text-text-primary">{species.ave_height} cm</span>
            </div>
          )}
          {species.ave_weight && (
            <div className="text-center">
              <span className="block text-xs text-text-muted dark:text-text-secondary uppercase tracking-wide">Avg Weight</span>
              <span className="font-bold text-text-primary">{species.ave_weight} kg</span>
            </div>
          )}
        </Card>

        {/* Ability Bonuses */}
        {species.ability_bonuses && Object.keys(species.ability_bonuses).length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-text-secondary mb-2">
              Ability Bonuses
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(species.ability_bonuses).map(([ability, bonus]) => (
                <Chip key={ability} variant="primary">
                  {ability.substring(0, 3).toUpperCase()} +{bonus}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Skills and Languages - Main Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Species Skills - Clickable to show description */}
          {speciesSkills.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-text-secondary mb-2">
                Species Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {speciesSkills.map(skill => (
                  <Chip 
                    key={String(skill.id)} 
                    variant="info"
                    className="cursor-pointer hover:ring-2 hover:ring-info-300 transition-all"
                    onClick={() => setSelectedSkill(selectedSkill?.id === skill.id ? null : skill)}
                  >
                    {(skill as { displayName?: string; name?: string }).displayName ?? (skill as { name?: string }).name ?? String(skill.id)}
                  </Chip>
                ))}
              </div>
              {/* Show selected skill description */}
              {selectedSkill && (
                <div className="mt-2 p-3 bg-info-50 border border-info-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-info-fg">{(selectedSkill as { displayName?: string; name?: string }).displayName ?? (selectedSkill as { name?: string }).name ?? 'Skill'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSkill(null)}
                      aria-label="Dismiss skill description"
                      className="text-info-fg hover:opacity-80 h-auto py-0 px-1 min-w-0"
                    >
                      ✕
                    </Button>
                  </div>
                  <p className="text-sm text-info-fg">
                    {String(selectedSkill.id) === '0'
                      ? 'Your choice: pick any one skill as your second species skill, or treat this as an extra skill point.'
                      : ((selectedSkill as { description?: string }).description || 'No description available.')}
                  </p>
                  {selectedSkill.ability && (
                    <p className="text-xs text-info-fg mt-1">
                      Ability: {selectedSkill.ability}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Languages */}
          {species.languages && species.languages.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wide text-text-secondary mb-2">
                Languages
              </h4>
              <div className="flex flex-wrap gap-2">
                {species.languages.map(lang => (
                  <Chip key={lang} variant="primary">
                    {lang}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trait Sections - Order: Species Traits, Ancestry, Characteristics, Flaws */}
        {resolvedTraits && (
          <>
            <TraitSection 
              title="Species Traits" 
              traits={resolvedTraits.speciesTraits} 
            />
            <TraitSection 
              title="Ancestry Traits" 
              traits={resolvedTraits.ancestryTraits}
            />
            <TraitSection 
              title="Characteristics" 
              traits={resolvedTraits.characteristics}
            />
            <TraitSection 
              title="Flaws" 
              traits={resolvedTraits.flaws}
              isFlaw
            />
          </>
        )}

      </div>
    </Modal>
  );
}
