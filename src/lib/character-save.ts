/**
 * Character save helpers: POST/PATCH body normalize (TASK-359) and persist floor
 * `clampSavedCurrency` (TASK-739 / TASK-749).
 */

import { normalizeTempModifiers } from '@/lib/character/temp-modifiers';
import { normalizeCharacterForSave } from '@/lib/character/schema-normalize';
import { getErrorMessage, isApiError } from '@/lib/api-client';
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
 * Persistable remainder — never write a debt onto the character.
 * Display / rail keep the signed value; Guided `build-character`, Advanced
 * `getCharacter`, and `prepareCharacterForSave` (when `currency` is present)
 * floor here (TASK-739 / TASK-749).
 */
export function clampSavedCurrency(remaining: number): number {
  return Math.max(0, remaining);
}

/**
 * Reuse a persisted idempotency key, or mint a new one. Creators persist this on the
 * draft so a reload-then-retry still hits the same row (TASK-738 AC 3).
 */
export function resolveClientRequestId(existing: unknown): string {
  return isClientRequestId(existing) ? existing : crypto.randomUUID();
}

function isUncertainCreateOutcome(err: unknown): boolean {
  if (isApiError(err)) return false;
  if (
    typeof DOMException !== 'undefined' &&
    err instanceof DOMException &&
    err.name === 'AbortError'
  ) {
    return true;
  }
  if (err instanceof TypeError) return true;
  if (
    err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'AbortError'
  ) {
    return true;
  }
  return /failed to fetch|networkerror|load failed|aborted/i.test(getErrorMessage(err, ''));
}

/**
 * Player-facing create failure. 400 legality keeps the violation list. 500s and other
 * confirmed server failures do not mention My Characters / duplicates. Network/abort
 * after the POST may already have a row — only then append the retry hint (TASK-754).
 */
export function formatCharacterCreateFailureMessage(
  err: unknown,
  copy: { saveFailed: string; saveRetryHint: string },
): string {
  if (isApiError(err)) {
    if (err.status === 400) return err.message.trim() || copy.saveFailed;
    if (err.status >= 500) return copy.saveFailed;
    return err.message.trim() || copy.saveFailed;
  }
  if (isUncertainCreateOutcome(err)) {
    return `${copy.saveFailed} ${copy.saveRetryHint}`;
  }
  const message = getErrorMessage(err, copy.saveFailed).trim();
  return message || copy.saveFailed;
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
      cleaned.tempModifiers as CharacterTempModifiers | undefined,
    );
    if (normalized) cleaned.tempModifiers = normalized;
    else delete cleaned.tempModifiers;
  }

  // Canonical field names + strip legacy aliases (TASK-663)
  normalizeCharacterForSave(cleaned);

  if (typeof cleaned.currency === 'number' && Number.isFinite(cleaned.currency)) {
    cleaned.currency = clampSavedCurrency(cleaned.currency);
  }

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
