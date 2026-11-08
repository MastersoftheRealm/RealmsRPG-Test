/**
 * Deep value validation for admin Codex write payloads (key allowlist + per-field shapes).
 * Complements `library-persisted-contract.ts` for official/user library saves.
 */

import type { CodexCollection } from '@/lib/codex/collections';
import { CATALOG_LISTINGS } from '@/lib/library/catalog-listing';
import {
  CODEX_BOOLEAN_FIELD_KEYS,
  CODEX_COMMA_LIST_FIELD_KEYS,
  CODEX_DESC_MAX_LENGTH,
  CODEX_IMAGE_FIELD_KEYS,
  CODEX_JSON_FIELD_KEYS,
  CODEX_NAME_MAX_LENGTH,
  CODEX_NUMERIC_FIELD_KEYS,
  CODEX_POSTGRES_TEXT_ARRAY_FIELD_KEYS,
  unknownCodexPersistedKeys,
} from '@/lib/codex-columnar-keys';

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isCommaListValue(value: unknown): boolean {
  if (isAbsent(value)) return true;
  if (typeof value === 'string') return true;
  return isStringArray(value);
}

function isJsonFieldValue(value: unknown): boolean {
  if (isAbsent(value)) return true;
  if (typeof value === 'string') return true;
  return typeof value === 'object';
}

function catalogListingError(value: unknown): string | null {
  if (isAbsent(value)) return null;
  if (typeof value !== 'string') return 'catalogListing must be a string';
  if (!CATALOG_LISTINGS.includes(value as (typeof CATALOG_LISTINGS)[number])) {
    return 'catalogListing must be listed or unlisted';
  }
  return null;
}

function imageFieldError(camel: string, value: unknown): string | null {
  if (isAbsent(value)) return null;
  const t = typeof value;
  if (t === 'string' || t === 'number') return null;
  return `${camel} must be a string`;
}

/** Validate one camelCase codex field value (lenient on legacy null/empty shapes). */
export function codexPersistedFieldShapeError(camel: string, value: unknown): string | null {
  if (isAbsent(value)) return null;

  if (camel === 'name' && typeof value === 'string' && value.length > CODEX_NAME_MAX_LENGTH) {
    return `name exceeds maximum length`;
  }
  if (
    camel === 'description' &&
    typeof value === 'string' &&
    value.length > CODEX_DESC_MAX_LENGTH
  ) {
    return `description exceeds maximum length`;
  }

  if (CODEX_NUMERIC_FIELD_KEYS.has(camel)) {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return `${camel} must be a finite number`;
      return null;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      if (Number.isNaN(Number(value))) return `${camel} must be numeric`;
      return null;
    }
    if (typeof value === 'boolean') return `${camel} must be numeric`;
  }

  if (CODEX_BOOLEAN_FIELD_KEYS.has(camel)) {
    if (typeof value !== 'boolean') return `${camel} must be a boolean`;
  }

  if (camel === 'catalogListing') return catalogListingError(value);

  if (CODEX_IMAGE_FIELD_KEYS.has(camel)) return imageFieldError(camel, value);

  if (CODEX_POSTGRES_TEXT_ARRAY_FIELD_KEYS.has(camel)) {
    if (Array.isArray(value) && !value.every((entry) => typeof entry === 'string')) {
      return 'sources must be an array of strings';
    }
    if (typeof value === 'string' && value.includes('\0')) {
      return 'sources must not contain control characters';
    }
    return null;
  }

  if (CODEX_JSON_FIELD_KEYS.has(camel)) {
    if (!isJsonFieldValue(value)) return `${camel} must be JSON (object, array, or JSON string)`;
    return null;
  }

  if (CODEX_COMMA_LIST_FIELD_KEYS.has(camel)) {
    if (!isCommaListValue(value)) return `${camel} must be a string or array of strings`;
    return null;
  }

  if (
    camel.endsWith('Desc') ||
    camel === 'type' ||
    camel === 'category' ||
    camel === 'ability' ||
    camel === 'mechanic' ||
    camel === 'recPeriod' ||
    camel === 'tags' ||
    camel === 'baseFeatId' ||
    camel === 'baseSkill' ||
    camel === 'baseSkillId' ||
    camel === 'adulthoodLifespan' ||
    camel === 'currency' ||
    camel === 'rarity' ||
    camel === 'percentage' ||
    camel === 'duration' ||
    camel === 'defense' ||
    camel === 'archetypeAbility' ||
    camel === 'secondaryAbility' ||
    camel === 'level1Notes'
  ) {
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      return `${camel} must be a scalar value`;
    }
  }

  return null;
}

/** Shape-check every key present in a camelCase admin payload for this collection. */
export function codexAdminCamelBodyShapeError(
  collection: CodexCollection,
  camelBody: Record<string, unknown>,
): string | null {
  const unknown = unknownCodexPersistedKeys(collection, camelBody);
  if (unknown.length > 0) {
    return `Payload contains unsupported fields: ${unknown.join(', ')}`;
  }
  for (const [key, value] of Object.entries(camelBody)) {
    const err = codexPersistedFieldShapeError(key, value);
    if (err) return err;
  }
  return null;
}
