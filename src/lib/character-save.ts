/**
 * Character save normalization — shared by POST/PATCH character API routes (TASK-359).
 */

import { normalizeTempModifiers } from '@/lib/character/temp-modifiers';
import { normalizeCharacterForSave } from '@/lib/character/schema-normalize';
import { removeUndefined } from '@/lib/utils/object';
import type { Character, CharacterTempModifiers } from '@/types';

/** Matches `characterCreateSchema.clientRequestId` (uuid). */
const CLIENT_REQUEST_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when `value` is a uuid the create route will accept as `clientRequestId`. */
export function isClientRequestId(value: unknown): value is string {
  return typeof value === 'string' && CLIENT_REQUEST_ID_RE.test(value);
}

/**
 * Reuse a persisted idempotency key, or mint a new one. Creators persist this on the
 * draft so a reload-then-retry still hits the same row (TASK-738 AC 3).
 */
export function resolveClientRequestId(existing: unknown): string {
  return isClientRequestId(existing) ? existing : crypto.randomUUID();
}

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

  // Canonical field names + strip legacy aliases (TASK-663)
  normalizeCharacterForSave(cleaned);

  cleaned.updatedAt = new Date().toISOString();
  return removeUndefined(cleaned);
}

export function prepareCharacterForCreate(data: Partial<Character>): Record<string, unknown> {
  const cleaned = prepareCharacterForSave(data);
  cleaned.createdAt = new Date().toISOString();
  // Routing metadata — lives on `characters.client_request_id`, never in the JSON blob.
  delete cleaned.clientRequestId;
  return cleaned;
}
