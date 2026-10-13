/**
 * Character Sheet - Modal Components
 * Reads modal state + handlers from character-sheet context (TASK-667).
 */

'use client';

import { useMemo } from 'react';
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
import { useCharacterSheet } from '@/components/character-sheet/character-sheet-context';
import { existingIdsForAddModal } from '@/lib/character-sheet/add-modal-existing-ids';
import { findCodexFeatRecovery, resolvedFeatUses } from '@/lib/character/recovery-uses';

interface TraitForModal {
  name: string;
  currentUses?: number | undefined;
  maxUses?: number | undefined;
  recovery?: string | undefined;
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
    characterSpeciesSkills,
    enrichedData,
  } = useCharacterSheet();

  const traitsDb = libraryModel?.traitsDb ?? [];
  const featsDb = libraryModel?.featsDb ?? [];
  const scopedExistingIds = useMemo(
    () => existingIdsForAddModal(character, addModalType, enrichedData),
    [character, addModalType, enrichedData],
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
          characterSpeciesSkills={characterSpeciesSkills}
          featsDb={featsDb}
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
          feats={[...(character.archetypeFeats || []), ...(character.feats || [])].map((f) => {
            const resolved = resolvedFeatUses(f, findCodexFeatRecovery(f, featsDb));
            return {
              id: String(f.id || f.name),
              name: f.name,
              currentUses: f.currentUses,
              maxUses: resolved.maxUses,
              recovery: resolved.recovery,
            };
          })}
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
