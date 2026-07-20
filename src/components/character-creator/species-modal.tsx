
'use client';

import { useMemo } from 'react';
import { Modal, Button, Card, DescriptorChip } from '@/components/ui';
import { DetailOptionList, SummaryChipList, type DetailOptionItem } from '@/components/shared';
import { speciesSkillToSummaryChipItem } from '@/lib/chip/species-skill-chips';
import { traitToDetailOption } from '@/lib/detail-option';
import { useCodexSkills } from '@/hooks';
import type { Species, Trait } from '@/hooks';
import { getChoiceOptionIds, resolveChoiceOptionTraits } from '@/lib/choice-trait';

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
  uses_per_rec?: number | null;
  rec_period?: string | null;
  optionTraits?: Array<Pick<Trait, 'id' | 'name' | 'description' | 'uses_per_rec' | 'rec_period'>>;
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
        uses_per_rec: trait.uses_per_rec,
        rec_period: trait.rec_period,
        optionTraits: optionTraits.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          uses_per_rec: t.uses_per_rec,
          rec_period: t.rec_period,
        })),
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
}

function resolvedToDetailItem(trait: ResolvedTrait): DetailOptionItem {
  if (!trait.found) {
    return {
      id: String(trait.id),
      name: trait.name,
      description: trait.description,
      disabled: true,
    };
  }
  return traitToDetailOption({
    id: trait.id,
    name: trait.name,
    description: trait.description,
    uses_per_rec: trait.uses_per_rec,
    rec_period: trait.rec_period,
  });
}

function TraitSection({ title, traits }: TraitSectionProps) {
  if (!traits || traits.length === 0) return null;

  const plainItems: DetailOptionItem[] = [];
  const choiceGroups: Array<{ parent: ResolvedTrait; options: DetailOptionItem[] }> = [];

  for (const trait of traits) {
    const optionTraits = trait.optionTraits ?? [];
    if (optionTraits.length > 0) {
      choiceGroups.push({
        parent: trait,
        options: optionTraits.map((opt) =>
          traitToDetailOption({
            id: opt.id,
            name: opt.name,
            description: opt.description,
            uses_per_rec: opt.uses_per_rec,
            rec_period: opt.rec_period,
          })
        ),
      });
    } else {
      plainItems.push(resolvedToDetailItem(trait));
    }
  }

  return (
    <div className="mb-5 space-y-4">
      <div className="font-nunito text-sm font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </div>
      {plainItems.length > 0 ? (
        <DetailOptionList items={plainItems} showColumnHeaders={false} />
      ) : null}
      {choiceGroups.map(({ parent, options }) => (
        <DetailOptionList
          key={String(parent.id)}
          items={options}
          groupLabel={parent.name}
          groupHint={parent.description}
          showColumnHeaders={false}
        />
      ))}
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
  const { data: allSkills = [] } = useCodexSkills();

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

  const speciesSkillChips = useMemo(() => {
    if (!species?.skills?.length) return [];
    return species.skills.map((skillId) => speciesSkillToSummaryChipItem(skillId, allSkills));
  }, [species, allSkills]);

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
                <DescriptorChip key={ability} variant="primary">
                  {ability.substring(0, 3).toUpperCase()} +{bonus}
                </DescriptorChip>
              ))}
            </div>
          </div>
        )}

        {/* Skills and Languages - Main Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Species Skills - Clickable to show description */}
          {speciesSkillChips.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-text-secondary mb-2">
                Species Skills
              </h3>
              <SummaryChipList items={speciesSkillChips} />
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
                  <DescriptorChip key={lang} variant="primary">
                    {lang}
                  </DescriptorChip>
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
            />
          </>
        )}

      </div>
    </Modal>
  );
}
