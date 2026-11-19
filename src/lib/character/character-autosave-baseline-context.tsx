'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  advanceAutosaveBaselineFromSaveResult,
  type CharacterSaveBaselineResult,
} from '@/lib/character/autosave-baseline';

type BaselineRef = MutableRefObject<Record<string, unknown> | null>;

type CharacterAutosaveBaselineRegistry = {
  register: (characterId: string, ref: BaselineRef) => () => void;
  advance: (characterId: string, result: CharacterSaveBaselineResult) => void;
};

const CharacterAutosaveBaselineContext = createContext<CharacterAutosaveBaselineRegistry | null>(
  null,
);

export function CharacterAutosaveBaselineProvider({ children }: { children: ReactNode }) {
  const refs = useRef(new Map<string, BaselineRef>());

  const register = useCallback((characterId: string, ref: BaselineRef) => {
    const id = characterId.trim();
    refs.current.set(id, ref);
    return () => {
      if (refs.current.get(id) === ref) refs.current.delete(id);
    };
  }, []);

  const advance = useCallback((characterId: string, result: CharacterSaveBaselineResult) => {
    const ref = refs.current.get(characterId.trim());
    if (!ref) return;
    ref.current = advanceAutosaveBaselineFromSaveResult(ref.current, result);
  }, []);

  const value = useMemo(
    () => ({
      register,
      advance,
    }),
    [register, advance],
  );

  return (
    <CharacterAutosaveBaselineContext.Provider value={value}>{children}</CharacterAutosaveBaselineContext.Provider>
  );
}

function useCharacterAutosaveBaselineRegistry(): CharacterAutosaveBaselineRegistry | null {
  return useContext(CharacterAutosaveBaselineContext);
}

export function useRegisterCharacterAutosaveBaseline(
  characterId: string,
  ref: BaselineRef,
): void {
  const registry = useCharacterAutosaveBaselineRegistry();
  useEffect(() => {
    if (!registry) return;
    return registry.register(characterId, ref);
  }, [characterId, ref, registry]);
}

export function useAdvanceCharacterAutosaveBaseline() {
  const registry = useCharacterAutosaveBaselineRegistry();
  return useCallback(
    (characterId: string, result: CharacterSaveBaselineResult) => {
      registry?.advance(characterId, result);
    },
    [registry],
  );
}