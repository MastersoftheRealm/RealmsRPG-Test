/**
 * Character save normalization — shared by POST/PATCH character API routes (TASK-359).
 */

import { normalizeTempModifiers } from '@/lib/character/temp-modifiers';
import { removeUndefined } from '@/lib/utils/object';
import type { Character, CharacterTempModifiers } from '@/types';

export function prepareCharacterForSave(data: Partial<Character>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...dataToSave } = data;

  const cleaned = { ...dataToSave } as Record<string, unknown>;
  delete cleaned._displayFeats;
  delete cleaned.allTraits;
  delete cleaned.defenses;
  delete cleaned.defenseBonuses;

  // Same sparse Temp Modifier contract as cleanForSave (ADR-0006)
  if (cleaned.tempModifiers !== undefined) {
    const normalized = normalizeTempModifiers(
      cleaned.tempModifiers as CharacterTempModifiers | undefined
    );
    if (normalized) cleaned.tempModifiers = normalized;
    else delete cleaned.tempModifiers;
  }

  cleaned.updatedAt = new Date().toISOString();
  return removeUndefined(cleaned);
}

export function prepareCharacterForCreate(data: Partial<Character>): Record<string, unknown> {
  const cleaned = prepareCharacterForSave(data);
  cleaned.createdAt = new Date().toISOString();
  return cleaned;
}
