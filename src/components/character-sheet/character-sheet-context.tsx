/**
 * Character Sheet Context
 * =======================
 * Shared state and callbacks for the character sheet page to reduce prop drilling.
 * Sections consume via useCharacterSheet(); page builds the value from derived data + actions hooks.
 */

'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AbilityName, Character, CharacterLibraryTabId } from '@/types';
import type { EnrichedCharacterData } from '@/lib/data-enrichment';
import type { LibrarySectionProps } from './library-section';
import type { CharacterSheetSkillRow } from './use-character-sheet-derived';
import type { CharacterSheetPointBudgets } from './use-character-sheet-derived';

export type SkillModalType = 'skill' | 'subskill' | null;
export type AddModalType =
  | 'power'
  | 'technique'
  | 'weapon'
  | 'shield'
  | 'armor'
  | 'equipment'
  | null;
export type FeatModalType = 'archetype' | 'character' | 'state' | null;

export interface CharacterSheetContextValue {
  character: Character;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  isEditMode: boolean;
  isOwner: boolean;
  setAddModalType: (type: AddModalType) => void;
  setFeatModalType: (type: FeatModalType) => void;
  setSkillModalType: (type: SkillModalType) => void;

  /** Derived section data */
  skills: CharacterSheetSkillRow[];
  pointBudgets: CharacterSheetPointBudgets | null;
  enrichedData: EnrichedCharacterData | null;
  librarySectionProps: Omit<LibrarySectionProps, 'className' | 'activeTab' | 'onActiveTabChange'> | null;
  characterSpeciesSkills: string[];
  libraryActiveTab: CharacterLibraryTabId;
  setLibraryActiveTab: (tab: CharacterLibraryTabId) => void;

  /** Abilities & defenses */
  onAbilityChange: (ability: AbilityName, value: number) => void;
  onDefenseChange: (defense: string, value: number) => void;

  /** Skills */
  onSkillChange: (skillId: string, updates: Partial<{ skill_val: number; prof: boolean; ability: string }>) => void;
  onRemoveSkill: (skillId: string) => void;
  onAddSkill: () => void;
  onAddSubSkill: () => void;

  /** Archetype */
  onMartialProfChange: (value: number) => void;
  onPowerProfChange: (value: number) => void;
  onMilestoneChoiceChange: (level: number, choice: 'innate' | 'feat') => void;
  onEditArchetype: () => void;
  onEditSpecies: () => void;
}

const CharacterSheetContext = createContext<CharacterSheetContextValue | null>(null);

export function useCharacterSheet(): CharacterSheetContextValue {
  const ctx = useContext(CharacterSheetContext);
  if (!ctx) {
    throw new Error('useCharacterSheet must be used within CharacterSheetProvider');
  }
  return ctx;
}

export function useCharacterSheetOptional(): CharacterSheetContextValue | null {
  return useContext(CharacterSheetContext);
}

interface CharacterSheetProviderProps {
  value: CharacterSheetContextValue;
  children: ReactNode;
}

export function CharacterSheetProvider({ value, children }: CharacterSheetProviderProps) {
  const memoValue = useMemo(
    () => value,
    [
      value.character,
      value.isEditMode,
      value.isOwner,
      value.skills,
      value.pointBudgets,
      value.enrichedData,
      value.librarySectionProps,
      value.characterSpeciesSkills,
      value.libraryActiveTab,
      value.setCharacter,
      value.setAddModalType,
      value.setFeatModalType,
      value.setSkillModalType,
      value.setLibraryActiveTab,
      value.onAbilityChange,
      value.onDefenseChange,
      value.onSkillChange,
      value.onRemoveSkill,
      value.onAddSkill,
      value.onAddSubSkill,
      value.onMartialProfChange,
      value.onPowerProfChange,
      value.onMilestoneChoiceChange,
      value.onEditArchetype,
      value.onEditSpecies,
    ]
  );
  return (
    <CharacterSheetContext.Provider value={memoValue}>
      {children}
    </CharacterSheetContext.Provider>
  );
}
