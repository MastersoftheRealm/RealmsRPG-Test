'use client';

import { Card } from '@/components/ui';
import { InfoTippy, MixedSpeciesSkillPicker, TraitSection } from '@/components/patterns';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { resolveTraitIds, type Species, type Trait } from '@/hooks';
import type { CharacterAncestry, CharacterDraft } from '@/types';
import type { NamedIdOption } from '@/lib/ancestry/ancestry-selection';
import type { ValidationIssue, StepCompletion } from '@/lib/character-creator-validation';
import { Heart, AlertTriangle, Sparkles, Star } from 'lucide-react';
import { chooseYourAncestryTraits } from '../../../../../public/tooltip-text';
import { AncestryStepChecklist } from './ancestry-step-checklist';

export interface AncestryMixedPanelProps {
  draft: CharacterDraft;
  speciesA: Species;
  speciesB: Species;
  allTraits: Trait[] | undefined;
  ancestryIssues: ValidationIssue[];
  ancestryPathNotes: string | undefined;
  ancestryCompletion: StepCompletion;
  canContinue: boolean;
  mixedSpeciesSkillOptions: NamedIdOption[];
  selectedSpeciesSkillIds: string[];
  speciesTraitsFromA: Trait[];
  speciesTraitsFromB: Trait[];
  characteristics: Trait[];
  ancestryTraits: Trait[];
  ancestryTraitsFromFlawSpecies: Trait[];
  combinedSizes: string[];
  mixedAveragedPhysical: CharacterAncestry['mixedPhysical'] | null;
  selectedSpeciesTraits: string[] | undefined;
  selectedFlaw: string | null;
  selectedFlawSpeciesId: string | null;
  selectedCharacteristic: string | null;
  setMixedSize: (size: string) => void;
  toggleMixedSpeciesSkill: (skillId: string) => void;
  setSpeciesTraitA: (traitId: string) => void;
  setSpeciesTraitB: (traitId: string) => void;
  setAncestryBaseMixed: (traitId: string) => void;
  setAncestryExtraMixed: (traitId: string) => void;
  toggleCharacteristic: (charId: string) => void;
  toggleFlawMixed: (flawId: string, speciesId: string) => void;
  onChangeSpecies: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export function AncestryMixedPanel({
  draft,
  speciesA,
  speciesB,
  allTraits,
  ancestryIssues,
  ancestryPathNotes,
  ancestryCompletion,
  canContinue,
  mixedSpeciesSkillOptions,
  selectedSpeciesSkillIds,
  speciesTraitsFromA,
  speciesTraitsFromB,
  characteristics,
  ancestryTraits,
  ancestryTraitsFromFlawSpecies,
  combinedSizes,
  mixedAveragedPhysical,
  selectedSpeciesTraits,
  selectedFlaw,
  selectedFlawSpeciesId,
  selectedCharacteristic,
  setMixedSize,
  toggleMixedSpeciesSkill,
  setSpeciesTraitA,
  setSpeciesTraitB,
  setAncestryBaseMixed,
  setAncestryExtraMixed,
  toggleCharacteristic,
  toggleFlawMixed,
  onChangeSpecies,
  onBack,
  onContinue,
}: AncestryMixedPanelProps) {
  const nameA = draft.ancestry?.speciesNames?.[0] ?? speciesA.name;
  const nameB = draft.ancestry?.speciesNames?.[1] ?? speciesB.name;
  const flawsFromA = allTraits ? resolveTraitIds(speciesA.flaws || [], allTraits) : [];
  const flawsFromB = allTraits ? resolveTraitIds(speciesB.flaws || [], allTraits) : [];
  const ancestryForFirstSlot = ancestryTraits;
  const ancestryForSecondSlot = selectedFlaw ? ancestryTraitsFromFlawSpecies : [];
  const ph = mixedAveragedPhysical;
  const selectedSize = draft.ancestry?.selectedSize || '';

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-1">
            <h2 className="text-2xl font-bold text-text-primary">Mixed Species: Ancestry</h2>
            <InfoTippy content={chooseYourAncestryTraits} label="Ancestry trait rules" />
          </div>
          <p className="text-text-secondary">
            <strong>{nameA}</strong> + <strong>{nameB}</strong>. Set physical traits and choose one
            species trait from each, then ancestry and optional flaw.
          </p>
        </div>
        <button
          onClick={onChangeSpecies}
          className="text-sm text-primary-link-fg underline hover:text-primary-fg-hover"
        >
          Change Species
        </button>
      </div>

      <AncestryStepChecklist
        draft={draft}
        ancestryIssues={ancestryIssues}
        ancestryPathNotes={ancestryPathNotes}
      />

      <Card className="mb-6 bg-surface-alt p-4 shadow-none">
        <h3 className="mb-3 font-semibold text-text-primary">Physical (averaged)</h3>
        <div className="mb-4 grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          <div>
            <span className="block text-xs text-text-muted uppercase">Avg Height</span>
            <span className="font-bold text-text-primary">
              {ph?.aveHeight != null ? `${ph.aveHeight} cm` : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Avg Weight</span>
            <span className="font-bold text-text-primary">
              {ph?.aveWeight != null ? `${ph.aveWeight} kg` : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Adulthood</span>
            <span className="font-bold text-text-primary">
              {ph?.adulthood != null ? `${ph.adulthood} yr` : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Lifespan (max)</span>
            <span className="font-bold text-text-primary">
              {ph?.maxAge != null ? `${ph.maxAge} yr` : '-'}
            </span>
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs text-text-muted uppercase">Size (choose one)</span>
          <select
            value={selectedSize}
            onChange={(e) => setMixedSize(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-text-primary"
            aria-label="Size for mixed species"
          >
            <option value="">Select size</option>
            {combinedSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {mixedSpeciesSkillOptions.length > 0 && (
        <Card className="mb-6 bg-surface-alt p-4 shadow-none">
          <h3 className="mb-1 font-semibold text-text-primary">Species skills</h3>
          <p className="mb-3 text-sm text-text-secondary">
            Choose exactly 2 skills from the options below (from both species). You get proficiency
            in these; all other species skills are not granted.
          </p>
          <MixedSpeciesSkillPicker
            options={mixedSpeciesSkillOptions}
            selectedIds={selectedSpeciesSkillIds}
            onToggle={toggleMixedSpeciesSkill}
          />
          <p className="mt-2 text-xs text-text-muted">
            Selected: {selectedSpeciesSkillIds.length} / 2
          </p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <TraitSection
          title={`Species trait from ${nameA}`}
          subtitle="Choose 1"
          icon={<Heart className="h-5 w-5 text-primary-link-fg" />}
          traits={speciesTraitsFromA}
          selectable
          selectedIds={selectedSpeciesTraits?.[0] ? [selectedSpeciesTraits[0]] : []}
          onToggle={(id) => setSpeciesTraitA(id)}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
        <TraitSection
          title={`Species trait from ${nameB}`}
          subtitle="Choose 1"
          icon={<Heart className="h-5 w-5 text-primary-link-fg" />}
          traits={speciesTraitsFromB}
          selectable
          selectedIds={selectedSpeciesTraits?.[1] ? [selectedSpeciesTraits[1]] : []}
          onToggle={(id) => setSpeciesTraitB(id)}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
      </div>

      {ancestryForFirstSlot.length > 0 && (
        <TraitSection
          title="Ancestry trait"
          subtitle={
            selectedFlaw
              ? '1 from either species; 2nd below from the species you took the flaw from'
              : 'Choose 1 from either species'
          }
          icon={<Star className="h-5 w-5 text-warning-fg" />}
          traits={ancestryForFirstSlot}
          selectable
          selectedIds={
            draft.ancestry?.selectedTraits?.[0] ? [draft.ancestry.selectedTraits[0]] : []
          }
          onToggle={setAncestryBaseMixed}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
      )}

      {characteristics.length > 0 && (
        <TraitSection
          title="Characteristic"
          subtitle="Choose 1 (optional)"
          icon={<Sparkles className="h-5 w-5 text-info-fg" />}
          traits={characteristics}
          selectable
          selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
          onToggle={toggleCharacteristic}
          variant="characteristic"
          allTraits={allTraits ?? undefined}
        />
      )}

      {(flawsFromA.length > 0 || flawsFromB.length > 0) && (
        <div className="mb-6">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-text-primary">
            <AlertTriangle className="h-5 w-5 text-danger-fg" />
            Flaw (optional, grants +1 ancestry trait from the same species)
          </h3>
          {flawsFromA.length > 0 && (
            <TraitSection
              title={`Flaws from ${nameA}`}
              subtitle="Choose up to 1"
              icon={<AlertTriangle className="h-5 w-5 text-danger-fg" />}
              traits={flawsFromA}
              selectable
              selectedIds={
                selectedFlaw && selectedFlawSpeciesId === speciesA.id ? [selectedFlaw] : []
              }
              onToggle={(id) => toggleFlawMixed(id, speciesA.id)}
              variant="flaw"
              allTraits={allTraits ?? undefined}
            />
          )}
          {flawsFromB.length > 0 && (
            <TraitSection
              title={`Flaws from ${nameB}`}
              subtitle="Choose up to 1"
              icon={<AlertTriangle className="h-5 w-5 text-danger-fg" />}
              traits={flawsFromB}
              selectable
              selectedIds={
                selectedFlaw && selectedFlawSpeciesId === speciesB.id ? [selectedFlaw] : []
              }
              onToggle={(id) => toggleFlawMixed(id, speciesB.id)}
              variant="flaw"
              allTraits={allTraits ?? undefined}
            />
          )}
        </div>
      )}

      {selectedFlaw && ancestryForSecondSlot.length > 0 && (
        <TraitSection
          title={`Extra ancestry trait (from ${selectedFlawSpeciesId === speciesA.id ? nameA : nameB} only)`}
          subtitle="Choose 1"
          icon={<Star className="h-5 w-5 text-warning-fg" />}
          traits={ancestryForSecondSlot}
          selectable
          selectedIds={
            draft.ancestry?.selectedTraits?.[1] ? [draft.ancestry.selectedTraits[1]] : []
          }
          onToggle={setAncestryExtraMixed}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
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
