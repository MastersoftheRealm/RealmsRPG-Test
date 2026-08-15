'use client';

import { cn } from '@/lib/utils';
import { Card, DescriptorChip } from '@/components/ui';
import { statusBadgeDescriptorVariant } from '@/lib/chip/descriptor-chip-variants';
import { InfoTippy, SummaryChipList } from '@/components/shared';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { TraitSection } from '@/components/character-creator/TraitSection';
import type { Species, Trait } from '@/hooks';
import type { CharacterDraft } from '@/types';
import type { ValidationIssue, StepCompletion } from '@/lib/character-creator-validation';
import type { SummaryChipItem } from '@/components/shared/summary-chip-list';
import { Heart, AlertTriangle, Sparkles, Star } from 'lucide-react';
import { chooseYourAncestryTraits } from '../../../../../public/tooltip-text';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { AncestryStepChecklist } from './ancestry-step-checklist';

export interface AncestrySinglePanelProps {
  draft: CharacterDraft;
  selectedSpecies: Species;
  allTraits: Trait[] | undefined;
  ancestryIssues: ValidationIssue[];
  ancestryPathNotes: string | undefined;
  ancestryCompletion: StepCompletion;
  canContinue: boolean;
  speciesSkillChips: SummaryChipItem[];
  speciesTraits: Trait[];
  ancestryTraits: Trait[];
  flaws: Trait[];
  characteristics: Trait[];
  selectedTraitIds: string[];
  selectedFlaw: string | null;
  selectedCharacteristic: string | null;
  maxAncestryTraits: number;
  toggleAncestryTrait: (traitId: string) => void;
  toggleFlaw: (flawId: string) => void;
  toggleCharacteristic: (charId: string) => void;
  setSpeciesTraitChoice: (parentId: string, optionId: string) => void;
  onChangeSpecies: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export function AncestrySinglePanel({
  draft,
  selectedSpecies,
  allTraits,
  ancestryIssues,
  ancestryPathNotes,
  ancestryCompletion,
  canContinue,
  speciesSkillChips,
  speciesTraits,
  ancestryTraits,
  flaws,
  characteristics,
  selectedTraitIds,
  selectedFlaw,
  selectedCharacteristic,
  maxAncestryTraits,
  toggleAncestryTrait,
  toggleFlaw,
  toggleCharacteristic,
  setSpeciesTraitChoice,
  onChangeSpecies,
  onBack,
  onContinue,
}: AncestrySinglePanelProps) {
  const sizesDisplay =
    Array.isArray(selectedSpecies.sizes) && selectedSpecies.sizes.length > 0
      ? selectedSpecies.sizes.join(' / ')
      : selectedSpecies.size || 'Medium';

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-1">
            <h2 className="text-2xl font-bold text-text-primary">Choose Your Ancestry Traits</h2>
            <InfoTippy
              content={chooseYourAncestryTraits}
              allowHTML
              label="Ancestry trait rules"
              size="inline"
            />
          </div>
          <p className="text-text-secondary">
            As a <strong>{selectedSpecies.name}</strong>, customize your heritage with traits and
            abilities.
          </p>
        </div>
        <button
          onClick={onChangeSpecies}
          className="text-sm text-primary-link-fg underline hover:text-primary-fg-hover"
        >
          Change Species
        </button>
      </div>

      <Card className="mb-6 bg-surface-alt p-4 shadow-none">
        {selectedSpecies.description && (
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            {selectedSpecies.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 lg:grid-cols-6">
          <div>
            <span className="block text-xs text-text-muted uppercase">Size</span>
            <span className="font-bold text-text-primary capitalize">{sizesDisplay}</span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Type</span>
            <span className="font-bold text-text-primary capitalize">
              {selectedSpecies.type || 'Humanoid'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Avg Height</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.ave_height != null && Number(selectedSpecies.ave_height) > 0
                ? `${selectedSpecies.ave_height} cm`
                : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Avg Weight</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.ave_weight != null && Number(selectedSpecies.ave_weight) > 0
                ? `${selectedSpecies.ave_weight} kg`
                : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Adulthood</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.adulthood_lifespan?.[0] != null
                ? `${selectedSpecies.adulthood_lifespan[0]} yr`
                : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Lifespan (max)</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.adulthood_lifespan?.[1] != null
                ? `${selectedSpecies.adulthood_lifespan[1]} yr`
                : '-'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border-light pt-4 md:grid-cols-2">
          {speciesSkillChips.length > 0 && (
            <div>
              <span className="text-xs text-text-muted uppercase">Species Skills:</span>
              <div className="mt-1">
                <SummaryChipList items={speciesSkillChips} />
              </div>
            </div>
          )}
          {selectedSpecies.languages && selectedSpecies.languages.length > 0 && (
            <div>
              <span className="text-xs text-text-muted uppercase">Languages:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedSpecies.languages.map((lang: string) => (
                  <DescriptorChip key={lang} variant="primary" size="sm">
                    {lang}
                  </DescriptorChip>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <AncestryStepChecklist
        draft={draft}
        ancestryIssues={ancestryIssues}
        ancestryPathNotes={ancestryPathNotes}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          className={cn(
            'rounded-xl border-2 p-4',
            selectedTraitIds.length === maxAncestryTraits
              ? statusPanel.complete
              : statusPanel.warning,
          )}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Ancestry Traits</span>
            <DescriptorChip
              size="sm"
              variant={statusBadgeDescriptorVariant(
                selectedTraitIds.length === maxAncestryTraits ? 'complete' : 'warning',
              )}
              className="font-bold"
            >
              {selectedTraitIds.length} / {maxAncestryTraits}
            </DescriptorChip>
          </div>
          <p className="text-xs text-text-secondary">
            {selectedFlaw ? 'Flaw grants +1 trait!' : 'Select a flaw for +1 trait'}
          </p>
        </div>

        <div
          className={cn(
            'rounded-xl border-2 p-4',
            selectedCharacteristic ? statusPanel.complete : statusPanel.info,
          )}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Characteristic</span>
            <DescriptorChip
              size="sm"
              variant={statusBadgeDescriptorVariant(selectedCharacteristic ? 'complete' : 'info')}
              className="font-bold"
            >
              {selectedCharacteristic ? '1' : '0'} / 1
            </DescriptorChip>
          </div>
          <p className="text-xs text-text-secondary">Optional bonus trait</p>
        </div>

        <div
          className={cn(
            'rounded-xl border-2 p-4',
            selectedFlaw ? statusPanel.danger : statusPanel.neutral,
          )}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Flaw</span>
            <DescriptorChip
              size="sm"
              variant={statusBadgeDescriptorVariant(selectedFlaw ? 'danger' : 'neutral')}
              className="font-bold"
            >
              {selectedFlaw ? '1' : '0'} / 1
            </DescriptorChip>
          </div>
          <p className="text-xs text-text-secondary">Optional, grants +1 trait</p>
        </div>
      </div>

      {speciesTraits.length > 0 && (
        <TraitSection
          title="Species Traits"
          subtitle="Granted automatically. When a trait offers variants, pick one before continuing."
          icon={<Heart className="h-5 w-5 text-primary-link-fg" />}
          traits={speciesTraits}
          selectable={false}
          selectedIds={[]}
          onToggle={() => {}}
          allTraits={allTraits ?? undefined}
          speciesTraitChoices={draft.ancestry?.selectedSpeciesTraitChoices}
          onSpeciesTraitChoiceChange={setSpeciesTraitChoice}
        />
      )}

      {ancestryTraits.length > 0 && (
        <TraitSection
          title="Ancestry Traits"
          subtitle={`Select ${maxAncestryTraits} trait${maxAncestryTraits > 1 ? 's' : ''}`}
          icon={<Star className="h-5 w-5 text-warning-700 dark:text-warning-400" />}
          traits={ancestryTraits}
          selectable
          selectedIds={selectedTraitIds}
          onToggle={toggleAncestryTrait}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
      )}

      {characteristics.length > 0 && (
        <TraitSection
          title="Characteristics"
          subtitle="Select 1 characteristic (optional)"
          icon={<Sparkles className="h-5 w-5 text-info-fg dark:text-info-400" />}
          traits={characteristics}
          selectable
          selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
          onToggle={toggleCharacteristic}
          variant="characteristic"
          allTraits={allTraits ?? undefined}
        />
      )}

      {flaws.length > 0 && (
        <TraitSection
          title="Flaws"
          subtitle="Select 1 flaw to gain an extra ancestry trait (optional)"
          icon={<AlertTriangle className="h-5 w-5 text-danger-700 dark:text-danger-400" />}
          traits={flaws}
          selectable
          selectedIds={selectedFlaw ? [selectedFlaw] : []}
          onToggle={toggleFlaw}
          variant="flaw"
          allTraits={allTraits ?? undefined}
        />
      )}

      {ancestryTraits.length === 0 && speciesTraits.length === 0 && (
        <div className="mb-6 rounded-xl border border-border-light bg-surface-alt p-6 text-center">
          <p className="text-text-secondary">
            No specific ancestry traits defined for {selectedSpecies.name}. You may continue without
            selecting traits.
          </p>
        </div>
      )}

      <CreatorStepFooter
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!canContinue}
        completionHint={<span>{ancestryCompletion.label}</span>}
      />
    </div>
  );
}
