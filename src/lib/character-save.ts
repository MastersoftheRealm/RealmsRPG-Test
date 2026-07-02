/**
 * Character save normalization — shared by POST/PATCH character API routes (TASK-359).
 */

import { removeUndefined } from '@/lib/utils/object';
import type { Character } from '@/types';

export function prepareCharacterForSave(data: Partial<Character>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...dataToSave } = data;

  const cleaned = { ...dataToSave } as Record<string, unknown>;
  delete cleaned._displayFeats;
  delete cleaned.allTraits;
  delete cleaned.defenses;
  delete cleaned.defenseBonuses;

  cleaned.updatedAt = new Date().toISOString();
  return removeUndefined(cleaned);
}

export function prepareCharacterForCreate(data: Partial<Character>): Record<string, unknown> {
  const cleaned = prepareCharacterForSave(data);
  cleaned.createdAt = new Date().toISOString();
  return cleaned;
}
