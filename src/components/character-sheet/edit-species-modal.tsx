/**
 * Edit Species Modal
 * ==================
 * Change character species and ancestry from the sheet. Two steps: Species, then Ancestry.
 * State/handlers in `use-edit-species-modal`; step UI in sibling step components (TASK-666f).
 */

'use client';

import { Modal, Button } from '@/components/ui';
import type { Character } from '@/types';
import { MixedSpeciesModal } from '@/components/patterns';
import { useEditSpeciesModal, type EditSpeciesResult } from './use-edit-species-modal';
import { EditSpeciesSpeciesStep } from './edit-species-species-step';
import { EditSpeciesAncestryStep } from './edit-species-ancestry-step';

export type { EditSpeciesResult };

interface EditSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onSave: (updates: EditSpeciesResult) => void;
}

export function EditSpeciesModal({ isOpen, onClose, character, onSave }: EditSpeciesModalProps) {
  const m = useEditSpeciesModal({ isOpen, character, onSave, onClose });

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={m.step === 'species' ? 'Change species' : 'Ancestry & traits'}
      size="lg"
      fullScreenOnMobile
      flexLayout
      footer={
        m.step === 'species' ? (
          <div className="flex justify-between gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={() => m.setStep('ancestry')}
              disabled={!m.canContinueSpecies}
            >
              Next: Ancestry
            </Button>
          </div>
        ) : (
          <div className="flex justify-between gap-2">
            <Button variant="secondary" onClick={() => m.setStep('species')}>
              Back
            </Button>
            <Button size="lg" onClick={m.handleSave} disabled={!m.canContinueAncestry}>
              Save species & ancestry
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {m.step === 'species' && (
          <EditSpeciesSpeciesStep
            allSpecies={m.allSpecies}
            draftAncestry={m.draftAncestry}
            isMixed={m.isMixed}
            onOpenMixed={() => m.setShowMixedModal(true)}
            onSelectSingle={m.handleSingleSpeciesSelect}
          />
        )}

        {m.step === 'ancestry' && m.draftAncestry && (
          <EditSpeciesAncestryStep
            draftAncestry={m.draftAncestry}
            isMixed={m.isMixed}
            allTraits={m.allTraits}
            nameA={m.nameA}
            nameB={m.nameB}
            speciesA={m.speciesA}
            speciesB={m.speciesB}
            speciesTraits={m.speciesTraits}
            ancestryTraits={m.ancestryTraits}
            flaws={m.flaws}
            characteristics={m.characteristics}
            speciesTraitsFromA={m.speciesTraitsFromA}
            speciesTraitsFromB={m.speciesTraitsFromB}
            flawsFromA={m.flawsFromA}
            flawsFromB={m.flawsFromB}
            ancestryTraitsFromFlawSpecies={m.ancestryTraitsFromFlawSpecies}
            combinedSizes={m.combinedSizes}
            mixedSpeciesSkillOptions={m.mixedSpeciesSkillOptions}
            mixedAveragedPhysical={m.mixedAveragedPhysical}
            selectedTraitIds={m.selectedTraitIds}
            selectedFlaw={m.selectedFlaw}
            selectedCharacteristic={m.selectedCharacteristic}
            selectedSpeciesTraits={m.selectedSpeciesTraits}
            selectedFlawSpeciesId={m.selectedFlawSpeciesId}
            selectedSpeciesSkillIds={m.selectedSpeciesSkillIds}
            maxAncestryTraits={m.maxAncestryTraits}
            updateDraft={m.updateDraft}
            toggleAncestryTrait={m.toggleAncestryTrait}
            toggleFlaw={m.toggleFlaw}
            toggleFlawMixed={m.toggleFlawMixed}
            toggleCharacteristic={m.toggleCharacteristic}
            setSpeciesTraitChoice={m.setSpeciesTraitChoice}
            setSpeciesTraitA={m.setSpeciesTraitA}
            setSpeciesTraitB={m.setSpeciesTraitB}
            setAncestryBaseMixed={m.setAncestryBaseMixed}
            setAncestryExtraMixed={m.setAncestryExtraMixed}
            toggleMixedSpeciesSkill={m.toggleMixedSpeciesSkill}
          />
        )}
      </div>

      <MixedSpeciesModal
        isOpen={m.showMixedModal}
        onClose={() => m.setShowMixedModal(false)}
        onConfirm={m.handleMixedConfirm}
        allSpecies={m.allSpecies}
        userSpeciesIds={m.userSpeciesIds}
      />
    </Modal>
  );
}
