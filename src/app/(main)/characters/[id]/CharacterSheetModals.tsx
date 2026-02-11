/**
 * Character Sheet - Modal Components
 */

'use client';

import type { Character, CharacterPower, CharacterTechnique, Item } from '@/types';
import {
  AddLibraryItemModal,
  AddFeatModal,
  AddSkillModal,
  AddSubSkillModal,
  LevelUpModal,
  RecoveryModal,
} from '@/components/character-sheet';
import { DeleteConfirmModal } from '@/components/shared';
import type { CharacterSheetStats } from './character-sheet-utils';

export type AddModalType = 'power' | 'technique' | 'weapon' | 'armor' | 'equipment' | null;
export type FeatModalType = 'archetype' | 'character' | null;
export type SkillModalType = 'skill' | 'subskill' | null;

interface SkillForModal {
  id: string;
  name: string;
  category?: string;
  skill_val?: number;
  prof?: boolean;
  baseSkill?: string;
  ability?: string;
  availableAbilities?: string[];
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

interface CharacterSheetModalsProps {
  addModalType: AddModalType;
  setAddModalType: (t: AddModalType) => void;
  featModalType: FeatModalType;
  setFeatModalType: (t: FeatModalType) => void;
  skillModalType: SkillModalType;
  setSkillModalType: (t: SkillModalType) => void;
  featToRemove: { id: string; name: string } | null;
  setFeatToRemove: (f: { id: string; name: string } | null) => void;
  showLevelUpModal: boolean;
  setShowLevelUpModal: (v: boolean) => void;
  showRecoveryModal: boolean;
  setShowRecoveryModal: (v: boolean) => void;
  character: Character | null;
  calculatedStats: CharacterSheetStats | null;
  existingIds: Set<string>;
  skills: SkillForModal[];
  traitsDb: Array<{ name?: string; uses_per_rec?: number; rec_period?: string }>;
  onModalAdd: (items: CharacterPower[] | CharacterTechnique[] | Item[]) => void;
  onAddFeats: (feats: Array<{ id: string; name: string; description?: string; effect?: string; max_uses?: number }>, type: 'archetype' | 'character') => void;
  onAddSkills: (skills: Array<{ id: string; name: string; ability?: string; base_skill_id?: number; selectedBaseSkillId?: string }>) => void;
  onConfirmRemoveFeat: () => void;
  onLevelUp: (newLevel: number) => void;
  onFullRecovery: () => void;
  onPartialRecovery: (hpRestored: number, enRestored: number, resetPartialFeats: boolean) => void;
}

export function CharacterSheetModals({
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
  character,
  calculatedStats,
  existingIds,
  skills,
  traitsDb,
  onModalAdd,
  onAddFeats,
  onAddSkills,
  onConfirmRemoveFeat,
  onLevelUp,
  onFullRecovery,
  onPartialRecovery,
}: CharacterSheetModalsProps) {
  return (
    <>
      {addModalType && (
        <AddLibraryItemModal
          isOpen={!!addModalType}
          onClose={() => setAddModalType(null)}
          itemType={addModalType}
          existingIds={existingIds}
          onAdd={onModalAdd}
        />
      )}

      {featToRemove && (
        <DeleteConfirmModal
          itemName={featToRemove.name}
          itemType="feat"
          deleteContext="character"
          onConfirm={onConfirmRemoveFeat}
          onClose={() => setFeatToRemove(null)}
        />
      )}

      {character && featModalType && (
        <AddFeatModal
          isOpen={!!featModalType}
          onClose={() => setFeatModalType(null)}
          featType={featModalType}
          character={character}
          existingFeatIds={[
            ...(character.archetypeFeats || []).map(f => f.id || f.name),
            ...(character.feats || []).map(f => f.id || f.name),
          ]}
          onAdd={feats => onAddFeats(feats, featModalType)}
        />
      )}

      {character && skillModalType === 'skill' && (
        <AddSkillModal
          isOpen={true}
          onClose={() => setSkillModalType(null)}
          existingSkillNames={skills.map(s => s.name)}
          onAdd={onAddSkills}
        />
      )}

      {character && skillModalType === 'subskill' && (
        <AddSubSkillModal
          isOpen={true}
          onClose={() => setSkillModalType(null)}
          characterSkills={skills.map(s => ({ name: s.name, prof: s.prof || false }))}
          existingSkillNames={skills.map(s => s.name)}
          onAdd={onAddSkills}
        />
      )}

      {character && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          onClose={() => setShowLevelUpModal(false)}
          character={character}
          onConfirm={onLevelUp}
        />
      )}

      {character && calculatedStats && (
        <RecoveryModal
          isOpen={showRecoveryModal}
          onClose={() => setShowRecoveryModal(false)}
          currentHealth={character.currentHealth ?? character.health?.current ?? calculatedStats.maxHealth}
          maxHealth={calculatedStats.maxHealth}
          currentEnergy={character.currentEnergy ?? character.energy?.current ?? calculatedStats.maxEnergy}
          maxEnergy={calculatedStats.maxEnergy}
          feats={
            [
              ...(character.archetypeFeats || []).map(f => ({
                id: f.id || f.name,
                name: f.name,
                currentUses: f.currentUses,
                maxUses: f.maxUses,
                recovery: f.recovery,
              })),
              ...(character.feats || []).map(f => ({
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
              .filter(t => character.traitUses?.[t.name!] !== undefined)
              .map(t => ({
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
