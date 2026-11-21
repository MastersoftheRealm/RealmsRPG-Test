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

/**
 * Registers per-sheet `savedCleanRef` and applies library/sheet save results when the
 * sheet is mounted. No persisted snapshot: the server row (React Query character) is the
 * source of truth; the sheet re-seeds baseline on load/refetch while clean.
 */
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
    const id = characterId.trim();
    const ref = refs.current.get(id);
    if (!ref) return;
    const next = advanceAutosaveBaselineFromSaveResult(ref.current, result);
    ref.current = structuredClone(next) as Record<string, unknown>;
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