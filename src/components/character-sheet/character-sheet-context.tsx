/**
 * Character Sheet Context
 * =======================
 * Shared state and callbacks for the character sheet page to reduce prop drilling.
 * Sections can consume via useCharacterSheet(). Migration from props to context
 * can be done incrementally per section.
 */

'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Character } from '@/types';

export interface CharacterSheetContextValue {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  isEditMode: boolean;
  isOwner: boolean;
  /** Open add power/technique/weapon/armor/equipment modal */
  setAddModalType: (type: 'power' | 'technique' | 'weapon' | 'armor' | 'equipment' | null) => void;
  setFeatModalType: (type: 'archetype' | 'character' | null) => void;
  setSkillModalType: (type: 'skill' | null) => void;
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
  const memoValue = useMemo(() => value, [
    value.character,
    value.isEditMode,
    value.isOwner,
    value.setCharacter,
    value.setAddModalType,
    value.setFeatModalType,
    value.setSkillModalType,
  ]);
  return (
    <CharacterSheetContext.Provider value={memoValue}>
      {children}
    </CharacterSheetContext.Provider>
  );
}
