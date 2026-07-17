/**
 * Character sheet — auto proficiency sync (TASK-381 Phase 2)
 * ==========================================================
 * Required-proficiency build + soft-cap apply + sync effect when library
 * content changes. Used by library add handlers and the sheet actions facade.
 */

'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { getArchetypeAbilityScore } from '@/lib/game/calculations';
import {
  buildRequiredProficiencies,
  dedupeHighestProficiencies,
  mergeOwnedWithRequired,
  calculateProficiencyTP,
  getTrainingPointLimit,
  getMissingRequiredProficiencies,
} from '@/lib/proficiencies';
import type { Character, Item } from '@/types';
import type { LibrarySectionProps } from './library-section';

export type ApplyAutoProficienciesResult = {
  character: Character;
  overLimitWarning?: string;
};

type ShowToast = (message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;

/** Toast must not run inside setState updaters or render — defer to a microtask. */
export function deferProficiencyOverLimitToast(showToast: ShowToast, warning: string | undefined) {
  if (!warning) return;
  queueMicrotask(() => showToast(warning, 'warning'));
}

export function computeAutoProficiencies(
  next: Character,
  reason: string,
  buildRequiredForCharacter: (c: Character) => ReturnType<typeof buildRequiredProficiencies>,
): ApplyAutoProficienciesResult {
  const required = buildRequiredForCharacter(next);
  const merged = mergeOwnedWithRequired(next.proficiencies || [], required);
  const deduped = dedupeHighestProficiencies(merged);
  const newSpent = deduped.reduce((sum, p) => sum + calculateProficiencyTP(p), 0);
  const currentDeduped = dedupeHighestProficiencies(next.proficiencies || []);
  const currentSpent = currentDeduped.reduce((sum, p) => sum + calculateProficiencyTP(p), 0);
  const ability = getArchetypeAbilityScore(next);
  const max = getTrainingPointLimit(next.level || 1, ability);
  const overLimit = newSpent > max;
  const thisActionAddedTp = newSpent > currentSpent;
  const overLimitWarning =
    overLimit && thisActionAddedTp
      ? `${reason} puts proficiency TP over the limit (${newSpent}/${max}). Adjust in the Proficiencies tab.`
      : undefined;

  return {
    character: { ...next, proficiencies: deduped },
    overLimitWarning,
  };
}

type UseSheetAutoProficienciesArgs = {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  powerPartsDb: LibrarySectionProps['powerPartsDb'];
  techniquePartsDb: LibrarySectionProps['techniquePartsDb'];
  itemPropertiesDb: LibrarySectionProps['itemPropertiesDb'];
  showToast: ShowToast;
};

export function useSheetAutoProficiencies({
  character,
  setCharacter,
  powerPartsDb,
  techniquePartsDb,
  itemPropertiesDb,
  showToast,
}: UseSheetAutoProficienciesArgs) {
  const existingIds = useMemo(() => {
    if (!character) return new Set<string>();
    const ids = new Set<string>();
    const add = (id: string | number | undefined) => {
      const s = String(id ?? '');
      if (s) ids.add(s);
    };
    character.powers?.forEach((p) => add(p.id));
    character.techniques?.forEach((t) => add(t.id));
    ((character.equipment?.weapons as Item[]) || []).forEach((w) => add(w.id));
    ((character.equipment?.shields as Item[]) || []).forEach((s) => add(s.id));
    ((character.equipment?.armor as Item[]) || []).forEach((a) => add(a.id));
    ((character.equipment?.items as Item[]) || []).forEach((e) => add(e.id));
    return ids;
  }, [character]);

  const buildRequiredForCharacter = useCallback(
    (c: Character) => {
      const weapons = (c.equipment?.weapons as Item[]) || [];
      const shields = (c.equipment?.shields as Item[]) || [];
      const armor = (c.equipment?.armor as Item[]) || [];
      return buildRequiredProficiencies({
        powers: c.powers || [],
        techniques: c.techniques || [],
        weapons,
        shields,
        armor,
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb,
      });
    },
    [powerPartsDb, techniquePartsDb, itemPropertiesDb],
  );

  const applyAutoProficiencies = useCallback(
    (next: Character, reason: string): ApplyAutoProficienciesResult => {
      return computeAutoProficiencies(next, reason, buildRequiredForCharacter);
    },
    [buildRequiredForCharacter],
  );

  useEffect(() => {
    if (!character) return;
    if (!powerPartsDb?.length && !techniquePartsDb?.length && !itemPropertiesDb?.length) return;
    const required = buildRequiredForCharacter(character);
    const missing = getMissingRequiredProficiencies(required, character.proficiencies || []);
    if (missing.length === 0) return;

    const result = applyAutoProficiencies(character, 'Sync proficiencies');
    setCharacter(result.character);
    deferProficiencyOverLimitToast(showToast, result.overLimitWarning);
    // Parity with pre-split facade deps (avoid re-running on unrelated character fields).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional subset (match prior facade)
  }, [
    character?.id,
    character?.powers,
    character?.techniques,
    character?.equipment,
    character?.proficiencies,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    buildRequiredForCharacter,
    applyAutoProficiencies,
    showToast,
  ]);

  return {
    existingIds,
    applyAutoProficiencies,
  };
}
