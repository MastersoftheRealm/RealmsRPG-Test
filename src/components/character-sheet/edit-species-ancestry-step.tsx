/**
 * Edit Species Modal — ancestry & traits step (single + mixed).
 */

'use client';

import { TraitSection } from '@/components/character-creator/TraitSection';
import { MixedSpeciesSkillPicker } from '@/components/character-creator/mixed-species-skill-picker';
import type { CharacterAncestry } from '@/types';
import type { Species, Trait } from '@/hooks';
import type { NamedIdOption } from '@/lib/ancestry/ancestry-selection';
import { AlertTriangle, Sparkles, Star, Heart } from 'lucide-react';

export interface EditSpeciesAncestryStepProps {
  draftAncestry: CharacterAncestry;
  isMixed: boolean;
  allTraits: Trait[] | undefined;
  nameA: string | undefined;
  nameB: string | undefined;
  speciesA: Species | null;
  speciesB: Species | null;
  speciesTraits: Trait[];
  ancestryTraits: Trait[];
  flaws: Trait[];
  characteristics: Trait[];
  speciesTraitsFromA: Trait[];
  speciesTraitsFromB: Trait[];
  flawsFromA: Trait[];
  flawsFromB: Trait[];
  ancestryTraitsFromFlawSpecies: Trait[];
  combinedSizes: string[];
  mixedSpeciesSkillOptions: NamedIdOption[];
  mixedAveragedPhysical: CharacterAncestry['mixedPhysical'] | null;
  selectedTraitIds: string[];
  selectedFlaw: string | null;
  selectedCharacteristic: string | null;
  selectedSpeciesTraits: CharacterAncestry['selectedSpeciesTraits'];
  selectedFlawSpeciesId: string | null;
  selectedSpeciesSkillIds: string[];
  maxAncestryTraits: number;
  updateDraft: (updates: Partial<CharacterAncestry>) => void;
  toggleAncestryTrait: (traitId: string) => void;
  toggleFlaw: (flawId: string) => void;
  toggleFlawMixed: (flawId: string, speciesId: string) => void;
  toggleCharacteristic: (charId: string) => void;
  setSpeciesTraitChoice: (parentId: string, optionId: string) => void;
  setSpeciesTraitA: (traitId: string) => void;
  setSpeciesTraitB: (traitId: string) => void;
  setAncestryBaseMixed: (traitId: string) => void;
  setAncestryExtraMixed: (traitId: string) => void;
  toggleMixedSpeciesSkill: (skillId: string) => void;
}

export function EditSpeciesAncestryStep({
  draftAncestry,
  isMixed,
  allTraits,
  nameA,
  nameB,
  speciesA,
  speciesB,
  speciesTraits,
  ancestryTraits,
  flaws,
  characteristics,
  speciesTraitsFromA,
  speciesTraitsFromB,
  flawsFromA,
  flawsFromB,
  ancestryTraitsFromFlawSpecies,
  combinedSizes,
  mixedSpeciesSkillOptions,
  mixedAveragedPhysical,
  selectedTraitIds,
  selectedFlaw,
  selectedCharacteristic,
  selectedSpeciesTraits,
  selectedFlawSpeciesId,
  selectedSpeciesSkillIds,
  maxAncestryTraits,
  updateDraft,
  toggleAncestryTrait,
  toggleFlaw,
  toggleFlawMixed,
  toggleCharacteristic,
  setSpeciesTraitChoice,
  setSpeciesTraitA,
  setSpeciesTraitB,
  setAncestryBaseMixed,
  setAncestryExtraMixed,
  toggleMixedSpeciesSkill,
}: EditSpeciesAncestryStepProps) {
  return (
    <>
      <p className="text-sm text-text-secondary">
        {isMixed ? (
          <>
            <strong>{nameA}</strong> + <strong>{nameB}</strong>. Set size, one species trait
            from each, ancestry traits, and choose 2 species skills.
          </>
        ) : (
          <>
            Set species trait options (if any), ancestry traits, and optional
            flaw/characteristic.
          </>
        )}
      </p>

      {!isMixed && speciesTraits.length > 0 && (
        <TraitSection
          title="Species Traits"
          subtitle="Granted automatically. When a trait offers variants, pick one before saving."
          icon={<Heart className="w-5 h-5 text-primary-link-fg" />}
          traits={speciesTraits}
          selectable={false}
          selectedIds={[]}
          onToggle={() => {}}
          allTraits={allTraits ?? undefined}
          speciesTraitChoices={draftAncestry.selectedSpeciesTraitChoices}
          onSpeciesTraitChoiceChange={setSpeciesTraitChoice}
        />
      )}

      {isMixed && speciesA && speciesB && (
        <>
          <div className="space-y-2 mb-4">
            <label htmlFor="edit-species-mixed-size" className="block text-xs font-medium text-text-muted uppercase">
              Size
            </label>
            <select
              id="edit-species-mixed-size"
              value={draftAncestry.selectedSize ?? ''}
              onChange={(e) =>
                updateDraft({
                  selectedSize: e.target.value,
                  mixedPhysical: mixedAveragedPhysical ?? undefined,
                })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary min-h-[44px]"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TraitSection
              title={`Species trait from ${nameA}`}
              subtitle="Choose 1"
              icon={<Heart className="w-5 h-5 text-primary-link-fg" />}
              traits={speciesTraitsFromA}
              selectable
              selectedIds={selectedSpeciesTraits?.[0] ? [selectedSpeciesTraits[0]] : []}
              onToggle={setSpeciesTraitA}
              variant="ancestry"
              allTraits={allTraits ?? undefined}
            />
            <TraitSection
              title={`Species trait from ${nameB}`}
              subtitle="Choose 1"
              icon={<Heart className="w-5 h-5 text-primary-link-fg" />}
              traits={speciesTraitsFromB}
              selectable
              selectedIds={selectedSpeciesTraits?.[1] ? [selectedSpeciesTraits[1]] : []}
              onToggle={setSpeciesTraitB}
              variant="ancestry"
              allTraits={allTraits ?? undefined}
            />
          </div>

          {mixedSpeciesSkillOptions.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-semibold text-text-primary">Species skills (choose 2)</h4>
              <MixedSpeciesSkillPicker
                options={mixedSpeciesSkillOptions}
                selectedIds={selectedSpeciesSkillIds}
                onToggle={toggleMixedSpeciesSkill}
              />
              <p className="text-xs text-text-muted dark:text-text-secondary">
                Selected: {selectedSpeciesSkillIds.length} / 2
              </p>
            </div>
          )}
        </>
      )}

      {!isMixed && ancestryTraits.length > 0 && (
        <TraitSection
          title="Ancestry Traits"
          subtitle={`Select ${maxAncestryTraits} trait${maxAncestryTraits > 1 ? 's' : ''}`}
          icon={<Star className="w-5 h-5 text-warning-700 dark:text-warning-400" />}
          traits={ancestryTraits}
          selectable
          selectedIds={selectedTraitIds}
          onToggle={toggleAncestryTrait}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
      )}

      {isMixed && ancestryTraits.length > 0 && (
        <TraitSection
          title="Ancestry trait"
          subtitle={
            selectedFlaw
              ? '1 from either species; 2nd below from the species you took the flaw from'
              : 'Choose 1 from either species'
          }
          icon={<Star className="w-5 h-5 text-warning-700 dark:text-warning-400" />}
          traits={ancestryTraits}
          selectable
          selectedIds={selectedTraitIds[0] ? [selectedTraitIds[0]] : []}
          onToggle={setAncestryBaseMixed}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
      )}

      {!isMixed && characteristics.length > 0 && (
        <TraitSection
          title="Characteristics"
          subtitle="Select 1 characteristic (optional)"
          icon={<Sparkles className="w-5 h-5 text-info-fg dark:text-info-400" />}
          traits={characteristics}
          selectable
          selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
          onToggle={toggleCharacteristic}
          variant="characteristic"
          allTraits={allTraits ?? undefined}
        />
      )}

      {isMixed && characteristics.length > 0 && (
        <TraitSection
          title="Characteristic"
          subtitle="Choose 1 (optional)"
          icon={<Sparkles className="w-5 h-5 text-info-fg dark:text-info-400" />}
          traits={characteristics}
          selectable
          selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
          onToggle={toggleCharacteristic}
          variant="characteristic"
          allTraits={allTraits ?? undefined}
        />
      )}

      {!isMixed && flaws.length > 0 && (
        <TraitSection
          title="Flaws"
          subtitle="Select 1 flaw to gain an extra ancestry trait (optional)"
          icon={<AlertTriangle className="w-5 h-5 text-danger-700 dark:text-danger-400" />}
          traits={flaws}
          selectable
          selectedIds={selectedFlaw ? [selectedFlaw] : []}
          onToggle={toggleFlaw}
          variant="flaw"
          allTraits={allTraits ?? undefined}
        />
      )}

      {isMixed && (flawsFromA.length > 0 || flawsFromB.length > 0) && speciesA && speciesB && (
        <div className="mb-2">
          <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger-700 dark:text-danger-400" />
            Flaw (optional, grants +1 ancestry trait from the same species)
          </h3>
          {flawsFromA.length > 0 && (
            <TraitSection
              title={`Flaws from ${nameA}`}
              subtitle="Choose up to 1"
              icon={<AlertTriangle className="w-5 h-5 text-danger-700 dark:text-danger-400" />}
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
              icon={<AlertTriangle className="w-5 h-5 text-danger-700 dark:text-danger-400" />}
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

      {isMixed && selectedFlaw && ancestryTraitsFromFlawSpecies.length > 0 && (
        <TraitSection
          title={`Extra ancestry trait (from ${selectedFlawSpeciesId === speciesA?.id ? nameA : nameB} only)`}
          subtitle="Choose 1"
          icon={<Star className="w-5 h-5 text-warning-700 dark:text-warning-400" />}
          traits={ancestryTraitsFromFlawSpecies}
          selectable
          selectedIds={selectedTraitIds[1] ? [selectedTraitIds[1]] : []}
          onToggle={setAncestryExtraMixed}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
      )}
    </>
  );
}
