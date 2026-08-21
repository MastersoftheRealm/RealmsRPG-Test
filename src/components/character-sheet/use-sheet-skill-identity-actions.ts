/**
 * Character sheet — skills / proficiencies / archetype / species (TASK-381 Phase 2d)
 */

'use client';

import { useCallback } from 'react';
import type { Character, CharacterSkillRow } from '@/types';
import type { EditArchetypeResult } from './edit-archetype-modal';
import type { SkillModalType } from './character-sheet-context';

type UseSheetSkillIdentityActionsArgs = {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  setSkillModalType: (type: SkillModalType) => void;
  setShowEditArchetypeModal: (value: boolean) => void;
  setShowEditSpeciesModal: (value: boolean) => void;
};

function getSkillRows(skills: Character['skills'] | undefined): CharacterSkillRow[] {
  if (!skills) return [];
  return Array.isArray(skills) ? skills : [];
}

function withSkillRows(prev: Character, nextSkills: CharacterSkillRow[]): Character {
  return { ...prev, skills: nextSkills };
}

export function useSheetSkillIdentityActions({
  character,
  setCharacter,
  setSkillModalType,
  setShowEditArchetypeModal,
  setShowEditSpeciesModal,
}: UseSheetSkillIdentityActionsArgs) {
  const handleAddSkills = useCallback(
    (
      newSkills: Array<{
        id: string;
        name: string;
        ability?: string | undefined;
        base_skill_id?: number | undefined;
        selectedBaseSkillId?: string | undefined;
      }>,
    ) => {
      if (!character) return;
      const skillsToAdd: CharacterSkillRow[] = newSkills.map((s) => {
        const availableAbilities =
          typeof s.ability === 'string'
            ? s.ability
                .split(',')
                .map((a) => a.trim().toLowerCase())
                .filter(Boolean)
            : [];

        const defaultAbility = availableAbilities[0] || 'strength';

        const skill: CharacterSkillRow = {
          id: s.id,
          name: s.name,
          category: defaultAbility,
          skill_val: 0,
          prof: false,
          ability: defaultAbility,
        };
        if (availableAbilities.length > 0) {
          skill.availableAbilities = availableAbilities;
        }
        if (s.base_skill_id !== undefined) skill.baseSkillId = s.base_skill_id;
        if (s.selectedBaseSkillId) skill.selectedBaseSkillId = s.selectedBaseSkillId;
        return skill;
      });

      setCharacter((prev) => {
        if (!prev) return null;
        return withSkillRows(prev, [...getSkillRows(prev.skills), ...skillsToAdd]);
      });
      setSkillModalType(null);
    },
    [character, setCharacter, setSkillModalType],
  );

  const handleRemoveSkill = useCallback(
    (skillId: string) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const currentSkills = getSkillRows(prev.skills);
        return withSkillRows(
          prev,
          currentSkills.filter((s) => s.id !== skillId),
        );
      });
    },
    [character, setCharacter],
  );

  const handleSkillChange = useCallback(
    (
      skillId: string,
      updates: Partial<{
        name: string;
        skill_val: number;
        prof: boolean | undefined;
        ability: string | undefined;
        availableAbilities: string[] | undefined;
        category: string | undefined;
        baseSkill: string | undefined;
      }>,
    ) => {
      if (!character) return;
      setCharacter((prev) => {
        if (!prev) return null;
        const currentSkills = getSkillRows(prev.skills);
        const idx = currentSkills.findIndex((skill) => String(skill.id) === String(skillId));
        if (idx >= 0) {
          const updatedSkills = currentSkills.map((skill, i) =>
            i === idx ? { ...skill, ...updates } : skill,
          );
          return withSkillRows(prev, updatedSkills);
        }
        // Catalog-only base skill first spend / ability / temp — upsert (TASK-584)
        if (!updates.name) return prev;
        const defaultAbility = updates.ability || 'strength';
        const seeded: CharacterSkillRow = {
          id: skillId,
          name: updates.name,
          category: updates.category ?? defaultAbility,
          skill_val: updates.skill_val ?? 0,
          prof: updates.prof ?? false,
          ability: defaultAbility,
          ...(updates.availableAbilities?.length
            ? { availableAbilities: updates.availableAbilities }
            : {}),
          ...(updates.baseSkill ? { baseSkill: updates.baseSkill } : {}),
        };
        return withSkillRows(prev, [...currentSkills, seeded]);
      });
    },
    [character, setCharacter],
  );

  const handleMartialProfChange = useCallback(
    (value: number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              mart_prof: Math.max(0, Math.min(6, value)),
              martialProficiency: Math.max(0, Math.min(6, value)),
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handlePowerProfChange = useCallback(
    (value: number) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              pow_prof: Math.max(0, Math.min(6, value)),
              powerProficiency: Math.max(0, Math.min(6, value)),
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  const handleArchetypeSave = useCallback(
    (result: EditArchetypeResult) => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              archetype: { id: result.archetype.id, type: result.archetype.type },
              pow_abil: result.pow_abil,
              mart_abil: result.mart_abil,
              mart_prof: result.mart_prof,
              pow_prof: result.pow_prof,
              martialProficiency: result.mart_prof,
              powerProficiency: result.pow_prof,
              ...(result.archetypePathId !== undefined
                ? { archetypePathId: result.archetypePathId ?? undefined }
                : {}),
            }
          : null,
      );
      setShowEditArchetypeModal(false);
    },
    [character, setCharacter, setShowEditArchetypeModal],
  );

  const handleEditSpeciesSave = useCallback(
    (updates: { ancestry: Character['ancestry']; skills: CharacterSkillRow[] }) => {
      if (!character) return;
      let ancestry = updates.ancestry;
      if (ancestry?.mixed === true && Array.isArray(ancestry.selectedSpeciesTraits)) {
        const st = ancestry.selectedSpeciesTraits;
        ancestry = {
          ...ancestry,
          selectedSpeciesTraits: [String(st[0] ?? '').trim(), String(st[1] ?? '').trim()] as [
            string,
            string,
          ],
        };
      }
      setCharacter((prev) => (prev ? { ...prev, ancestry, skills: updates.skills } : null));
      setShowEditSpeciesModal(false);
    },
    [character, setCharacter, setShowEditSpeciesModal],
  );

  const handleMilestoneChoiceChange = useCallback(
    (level: number, choice: 'innate' | 'feat') => {
      if (!character) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              archetypeChoices: {
                ...(prev.archetypeChoices || {}),
                [level]: choice,
              },
            }
          : null,
      );
    },
    [character, setCharacter],
  );

  return {
    handleAddSkills,
    handleRemoveSkill,
    handleSkillChange,
    handleMartialProfChange,
    handlePowerProfChange,
    handleArchetypeSave,
    handleEditSpeciesSave,
    handleMilestoneChoiceChange,
  };
}
