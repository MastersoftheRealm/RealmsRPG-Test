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

type UseSheetAutoProficienciesArgs = {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  powerPartsDb: LibrarySectionProps['powerPartsDb'];
  techniquePartsDb: LibrarySectionProps['techniquePartsDb'];
  itemPropertiesDb: LibrarySectionProps['itemPropertiesDb'];
  showToast: (message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
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
    (next: Character, reason: string): Character | null => {
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
      if (overLimit && thisActionAddedTp) {
        // Soft cap: the TP limit is visibly flagged on the sheet and recoverable in
        // the Proficiencies tab, so we apply the change and warn rather than block
        // with a modal/confirm (TASK-338).
        showToast(
          `${reason} puts proficiency TP over the limit (${newSpent}/${max}). Adjust in the Proficiencies tab.`,
          'warning',
        );
      }
      return { ...next, proficiencies: deduped };
    },
    [buildRequiredForCharacter, showToast],
  );

  useEffect(() => {
    if (!character) return;
    if (!powerPartsDb?.length && !techniquePartsDb?.length && !itemPropertiesDb?.length) return;
    const required = buildRequiredForCharacter(character);
    const missing = getMissingRequiredProficiencies(required, character.proficiencies || []);
    if (missing.length === 0) return;
    setCharacter((prev) => {
      if (!prev) return prev;
      return applyAutoProficiencies(prev, 'Sync proficiencies');
    });
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
  ]);

  return {
    existingIds,
    applyAutoProficiencies,
  };
}
