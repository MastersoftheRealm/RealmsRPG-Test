/**
 * Character Sheet Context
 * =======================
 * Shared state and callbacks for the character sheet page to reduce prop drilling.
 * Sections consume via useCharacterSheet(); page builds the value from derived data + actions hooks.
 */

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type {
  AbilityName,
  Character,
  CharacterLibraryTabId,
  CharacterPower,
  CharacterSkillRow,
  CharacterTechnique,
  CharacterTempModifiers,
  Item,
} from '@/types';
import type { EnrichedCharacterData } from '@/lib/data-enrichment';
import type { SheetLibraryModel } from './library-section-props';
import type {
  CharacterSheetDerivedHandlers,
  CharacterSheetSkillRow,
  CharacterSheetPointBudgets,
  CharacterSheetStats,
} from './use-character-sheet-derived';
import type { EditArchetypeResult } from './edit-archetype-modal';

/** Sheet only opens Add Sub-Skill (base skills are catalog-all — TASK-584). */
export type SkillModalType = 'subskill' | null;
export type AddModalType =
  | 'power'
  | 'innate-power'
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
  /** Sheet-level Temp Modifier mode — mutually exclusive with isEditMode (ADR-0006 / TASK-782). */
  isTempModifierMode: boolean;
  isOwner: boolean;

  /** Derived section data */
  skills: CharacterSheetSkillRow[];
  pointBudgets: CharacterSheetPointBudgets | null;
  enrichedData: EnrichedCharacterData | null;
  /** Codex/derived library inputs (not a mega props bag — TASK-667) */
  libraryModel: SheetLibraryModel | null;
  libraryHandlers: CharacterSheetDerivedHandlers;
  characterSpeciesSkills: string[];
  libraryActiveTab: CharacterLibraryTabId;
  setLibraryActiveTab: (tab: CharacterLibraryTabId) => void;

  /** Codex-hydrated character for path-aware modals (falls back to character). */
  displayCharacter: Character | null;
  calculatedStats: CharacterSheetStats | null;

  /** Modal UI state (TASK-667 — CharacterSheetModals reads from context) */
  addModalType: AddModalType;
  setAddModalType: (type: AddModalType) => void;
  featModalType: FeatModalType;
  setFeatModalType: (type: FeatModalType) => void;
  skillModalType: SkillModalType;
  setSkillModalType: (type: SkillModalType) => void;
  featToRemove: { id: string; name: string } | null;
  setFeatToRemove: (f: { id: string; name: string } | null) => void;
  showLevelUpModal: boolean;
  setShowLevelUpModal: (v: boolean) => void;
  showRecoveryModal: boolean;
  setShowRecoveryModal: (v: boolean) => void;
  showEditArchetypeModal: boolean;
  setShowEditArchetypeModal: (v: boolean) => void;
  editArchetypeSessionKey: number;
  showEditSpeciesModal: boolean;
  setShowEditSpeciesModal: (v: boolean) => void;

  /** Modal action handlers (no-ops on read-only campaign view) */
  onModalAdd: (items: CharacterPower[] | CharacterTechnique[] | Item[]) => void;
  onAddFeats: (
    feats: Array<{
      id: string;
      name: string;
      description?: string | undefined;
      effect?: string | undefined;
      max_uses?: number | undefined;
    }>,
    type: 'archetype' | 'character' | 'state',
  ) => void;
  onAddSkills: (
    skills: Array<{
      id: string;
      name: string;
      ability?: string | undefined;
      base_skill_id?: number | undefined;
      selectedBaseSkillId?: string | undefined;
    }>,
  ) => void;
  onConfirmRemoveFeat: () => void;
  onLevelUp: (newLevel: number) => void;
  onFullRecovery: () => void;
  onPartialRecovery: (hpRestored: number, enRestored: number, resetPartialFeats: boolean) => void;
  onArchetypeSave: (result: EditArchetypeResult) => void;
  onSpeciesSave: (updates: {
    ancestry: Character['ancestry'];
    skills: CharacterSkillRow[];
  }) => void;

  /** Abilities & defenses */
  onAbilityChange: (ability: AbilityName, value: number) => void;
  onDefenseChange: (defense: string, value: number) => void;
  /** Sparse Temp Modifier patch (ADR-0006 / TASK-586) */
  onTempModifiersChange: (patch: CharacterTempModifiers) => void;

  /** Skills */
  onSkillChange: (
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
  ) => void;
  onRemoveSkill: (skillId: string) => void;
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
  // Pass through — React Compiler handles stability; avoid manual field-list useMemo (TASK-430).
  return <CharacterSheetContext.Provider value={value}>{children}</CharacterSheetContext.Provider>;
}
