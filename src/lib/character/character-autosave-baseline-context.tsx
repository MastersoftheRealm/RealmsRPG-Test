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
  /** Survives sheet unmount (library add while user is on /library). */
  const persisted = useRef(new Map<string, Record<string, unknown>>());

  const register = useCallback((characterId: string, ref: BaselineRef) => {
    const id = characterId.trim();
    const stored = persisted.current.get(id);
    if (stored) {
      ref.current = structuredClone(stored) as Record<string, unknown>;
    } else if (ref.current) {
      persisted.current.set(id, structuredClone(ref.current) as Record<string, unknown>);
    }
    refs.current.set(id, ref);
    return () => {
      if (refs.current.get(id) === ref) refs.current.delete(id);
    };
  }, []);

  const advance = useCallback((characterId: string, result: CharacterSaveBaselineResult) => {
    const id = characterId.trim();
    const ref = refs.current.get(id);
    const base = ref?.current ?? persisted.current.get(id) ?? null;
    const next = advanceAutosaveBaselineFromSaveResult(base, result);
    const snapshot = structuredClone(next) as Record<string, unknown>;
    persisted.current.set(id, snapshot);
    if (ref) ref.current = structuredClone(snapshot) as Record<string, unknown>;
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