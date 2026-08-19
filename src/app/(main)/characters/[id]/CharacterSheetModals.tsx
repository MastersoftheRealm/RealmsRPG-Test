/**
 * Character Sheet - Modal Components
 * Reads modal state + handlers from character-sheet context (TASK-667).
 */

'use client';

import { useMemo } from 'react';
import type { Character, Item } from '@/types';
import {
  AddLibraryItemModal,
  AddFeatModal,
  LevelUpModal,
  RecoveryModal,
  EditArchetypeModal,
  EditSpeciesModal,
} from '@/components/character-sheet';
import { DeleteConfirmModal, AddSubSkillModal } from '@/components/patterns';
import type { AddLibraryItemType } from '@/hooks/use-add-library-item-data';
import {
  useCharacterSheet,
  type AddModalType,
} from '@/components/character-sheet/character-sheet-context';

/**
 * DESIGN_INTENT: Add-modal exclusion set is type-scoped only.
 * Cross-table numeric ids (weapon id "1" vs codex gear id "1") must not hide rows.
 * Equipment is stackable — return empty so owned gear stays selectable (quantity merges).
 */
function existingIdsForAddModal(
  character: Character | null,
  addModalType: AddModalType,
): Set<string> {
  const ids = new Set<string>();
  if (!character || !addModalType) return ids;
  const add = (id: string | number | undefined) => {
    const s = String(id ?? '');
    if (s) ids.add(s);
  };
  switch (addModalType) {
    case 'power':
    case 'innate-power':
      character.powers?.forEach((p) => add(p.id));
      break;
    case 'technique':
      character.techniques?.forEach((t) => add(t.id));
      break;
    case 'weapon':
      ((character.equipment?.weapons as Item[]) || []).forEach((w) => add(w.id));
      break;
    case 'armor':
      ((character.equipment?.armor as Item[]) || []).forEach((a) => add(a.id));
      break;
    case 'shield':
      ((character.equipment?.shields as Item[]) || []).forEach((s) => add(s.id));
      break;
    case 'equipment':
      // Stackable — do not exclude owned gear (quantity merges on add).
      break;
  }
  return ids;
}

interface TraitForModal {
  name: string;
  currentUses?: number;
  maxUses?: number;
  recovery?: string;
}

interface FeatForModal {
  id: string;
  name: string;
  currentUses?: number;
  maxUses?: number;
  recovery?: string;
}

export function CharacterSheetModals() {
  const {
    character,
    displayCharacter,
    calculatedStats,
    skills,
    libraryModel,
    addModalType,
    setAddModalType,
    featModalType,
    setFeatModalType,
    skillModalType,
    setSkillModalType,
    featToRemove,
    setFeatToRemove,
    showLevelUpModal,
    setShowLevelUpModal,
    showRecoveryModal,
    setShowRecoveryModal,
    showEditArchetypeModal,
    setShowEditArchetypeModal,
    editArchetypeSessionKey,
    showEditSpeciesModal,
    setShowEditSpeciesModal,
    onModalAdd,
    onAddFeats,
    onAddSkills,
    onConfirmRemoveFeat,
    onLevelUp,
    onFullRecovery,
    onPartialRecovery,
    onArchetypeSave,
    onSpeciesSave,
  } = useCharacterSheet();

  const traitsDb = libraryModel?.traitsDb ?? [];
  const scopedExistingIds = useMemo(
    () => existingIdsForAddModal(character, addModalType),
    [character, addModalType],
  );

  return (
    <>
      {showEditArchetypeModal && (
        <EditArchetypeModal
          key={editArchetypeSessionKey}
          isOpen
          onClose={() => setShowEditArchetypeModal(false)}
          character={character}
          displayCharacter={displayCharacter ?? character}
          onSave={onArchetypeSave}
        />
      )}

      <EditSpeciesModal
        isOpen={showEditSpeciesModal}
        onClose={() => setShowEditSpeciesModal(false)}
        character={character}
        onSave={onSpeciesSave}
      />

      {addModalType && (
        <AddLibraryItemModal
          isOpen={!!addModalType}
          onClose={() => setAddModalType(null)}
          itemType={
            addModalType === 'innate-power' ? 'power' : (addModalType as AddLibraryItemType)
          }
          titleOverride={
            addModalType === 'innate-power' ? 'Add Innate Power from Library' : undefined
          }
          existingIds={scopedExistingIds}
          onAdd={onModalAdd}
        />
      )}

      {featToRemove && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={featToRemove.name}
          itemType="feat"
          deleteContext="character"
          onConfirm={onConfirmRemoveFeat}
          onClose={() => setFeatToRemove(null)}
        />
      )}

      {featModalType && (
        <AddFeatModal
          key={featModalType}
          isOpen
          onClose={() => setFeatModalType(null)}
          featType={featModalType}
          character={character}
          existingFeatIds={[
            ...(character.archetypeFeats || []).map((f) => f.id || f.name),
            ...(character.feats || []).map((f) => f.id || f.name),
          ]}
          onAdd={(feats) => onAddFeats(feats, featModalType)}
        />
      )}

      {skillModalType === 'subskill' && (
        <AddSubSkillModal
          isOpen={true}
          onClose={() => setSkillModalType(null)}
          characterSkills={skills.map((s) => ({ name: s.name, prof: s.prof || false }))}
          existingSkillNames={skills.map((s) => s.name)}
          onAdd={onAddSkills}
        />
      )}

      {showLevelUpModal && (
        <LevelUpModal
          key={`${character.id}:${character.level ?? 1}`}
          isOpen
          onClose={() => setShowLevelUpModal(false)}
          character={character}
          displayCharacter={displayCharacter ?? character}
          onConfirm={onLevelUp}
        />
      )}

      {calculatedStats && (
        <RecoveryModal
          isOpen={showRecoveryModal}
          onClose={() => setShowRecoveryModal(false)}
          currentHealth={
            character.currentHealth ?? character.health?.current ?? calculatedStats.maxHealth
          }
          maxHealth={calculatedStats.maxHealth}
          currentEnergy={
            character.currentEnergy ?? character.energy?.current ?? calculatedStats.maxEnergy
          }
          maxEnergy={calculatedStats.maxEnergy}
          feats={
            [
              ...(character.archetypeFeats || []).map((f) => ({
                id: f.id || f.name,
                name: f.name,
                currentUses: f.currentUses,
                maxUses: f.maxUses,
                recovery: f.recovery,
              })),
              ...(character.feats || []).map((f) => ({
                id: f.id || f.name,
                name: f.name,
                currentUses: f.currentUses,
                maxUses: f.maxUses,
                recovery: f.recovery,
              })),
            ] as FeatForModal[]
          }
          traits={
            traitsDb
              .filter((t) => t.name != null && character.traitUses?.[t.name] !== undefined)
              .map((t) => ({
                name: t.name!,
                currentUses: character.traitUses?.[t.name!],
                maxUses: t.uses_per_rec,
                recovery: t.rec_period,
              })) as TraitForModal[]
          }
          onConfirmFullRecovery={onFullRecovery}
          onConfirmPartialRecovery={onPartialRecovery}
        />
      )}
    </>
  );
}
