/**
 * Deep value validation for admin Codex write payloads (key allowlist + per-field shapes).
 * Complements `library-persisted-contract.ts` for official/user library saves.
 */

import type { CodexCollection } from '@/lib/codex/collections';
import {
  codexWriteGuidanceGroupsError,
  codexWriteLevel1LoadoutsError,
  codexWriteRecommendedAbilitiesError,
} from '@/lib/game/archetype-path';
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isFiniteNumberArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
  );
}

function isCommaListValue(value: unknown): boolean {
  if (isAbsent(value)) return true;
  if (typeof value === 'string') return true;
  return isStringArray(value);
}

const JSON_FIELD_DB_LABELS: Record<string, string> = {
  level1GuidanceGroups: 'level1_guidance_groups',
  level1RecommendedAbilities: 'level1_recommended_abilities',
  level1Loadouts: 'level1_loadouts',
};

function jsonFieldDbLabel(camel: string): string {
  return JSON_FIELD_DB_LABELS[camel] ?? camel;
}

function parseJsonCell(value: unknown): { parsed: unknown; error: string | null } {
  if (typeof value !== 'string') return { parsed: value, error: null };
  if (value.trim() === '') return { parsed: null, error: null };
  try {
    return { parsed: JSON.parse(value) as unknown, error: null };
  } catch {
    return { parsed: null, error: 'is not valid JSON' };
  }
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

function numericScalarError(camel: string, value: unknown): string | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return `${camel} must be a finite number`;
    return null;
  }
  if (typeof value === 'string') {
    if (value.trim() === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return `${camel} must be numeric`;
    return null;
  }
  if (typeof value === 'boolean') return `${camel} must be numeric`;
  if (value != null && typeof value === 'object') return `${camel} must be numeric`;
  return null;
}

function codexJsonFieldShapeError(camel: string, value: unknown): string | null {
  const { parsed, error } = parseJsonCell(value);
  if (error) {
    return `${jsonFieldDbLabel(camel)} ${error}, so this save was rejected and nothing was written.`;
  }
  if (parsed == null || parsed === '') return null;

  if (camel === 'level1Loadouts') {
    if (!Array.isArray(parsed) && !isPlainObject(parsed)) {
      return `${jsonFieldDbLabel(camel)} must be a JSON object or array`;
    }
    return codexWriteLevel1LoadoutsError(parsed);
  }
  if (camel === 'level1RecommendedAbilities') {
    if (!isPlainObject(parsed) || Array.isArray(parsed)) {
      return `${jsonFieldDbLabel(camel)} must be a JSON object`;
    }
    return codexWriteRecommendedAbilitiesError(parsed);
  }
  if (camel === 'level1GuidanceGroups') {
    if (!Array.isArray(parsed)) {
      return `${jsonFieldDbLabel(camel)} must be a JSON array`;
    }
    return codexWriteGuidanceGroupsError(parsed);
  }
  return `${camel} must be a JSON object or array`;
}

function commaSeparatedNonEmptyParts(value: string): string[] {
  return value.split(',').map((part) => part.trim());
}

function featStringListShapeError(camel: string, value: unknown): string | null {
  if (isAbsent(value)) return null;
  if (isStringArray(value)) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parts = commaSeparatedNonEmptyParts(trimmed);
    if (parts.length === 0 || parts.some((part) => part.length === 0)) {
      return `${camel} must be an array of strings`;
    }
    return null;
  }
  return `${camel} must be an array of strings`;
}

function featNumberListShapeError(camel: string, value: unknown): string | null {
  if (isAbsent(value)) return null;
  if (isFiniteNumberArray(value)) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? null : `${camel} must be an array of numbers`;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parts = commaSeparatedNonEmptyParts(trimmed);
    if (parts.length === 0 || parts.some((part) => part.length === 0)) {
      return `${camel} must be an array of numbers`;
    }
    if (!parts.every((part) => Number.isFinite(Number(part)))) {
      return `${camel} must be an array of numbers`;
    }
    return null;
  }
  return `${camel} must be an array of numbers`;
}

function adulthoodLifespanShapeError(value: unknown): string | null {
  if (isAbsent(value)) return null;
  if (isFiniteNumberArray(value)) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? null : 'adulthoodLifespan must be a numeric range';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parts = commaSeparatedNonEmptyParts(trimmed).filter((part) => part.length > 0);
    if (parts.length === 0) return 'adulthoodLifespan must be a numeric range';
    if (!parts.every((part) => Number.isFinite(Number(part)))) {
      return 'adulthoodLifespan must be a numeric range';
    }
    return null;
  }
  return 'adulthoodLifespan must be a numeric range';
}

function collectionFieldShapeError(
  collection: CodexCollection,
  camel: string,
  value: unknown,
): string | null {
  if (collection === 'codex_feats') {
    if (camel === 'ability' || camel === 'abilityReq' || camel === 'skillReq') {
      return featStringListShapeError(camel, value);
    }
    if (camel === 'abilReqVal' || camel === 'skillReqVal') {
      return featNumberListShapeError(camel, value);
    }
  }

  if (collection === 'codex_skills' && camel === 'ability') {
    if (isAbsent(value)) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return null;
    }
    return 'ability must be a scalar value';
  }

  if (collection === 'codex_parts' && camel === 'defense') {
    if (value === undefined || value === null) return null;
    if (isStringArray(value)) return null;
    if (typeof value === 'string') return null;
    return 'defense must be a string or array of strings';
  }

  if (collection === 'codex_species' && camel === 'adulthoodLifespan') {
    return adulthoodLifespanShapeError(value);
  }

  return null;
}

const FEAT_TYPED_LIST_FIELDS = new Set([
  'ability',
  'abilityReq',
  'skillReq',
  'abilReqVal',
  'skillReqVal',
]);

function collectionFieldBypassesGenericChecks(collection: CodexCollection, camel: string): boolean {
  if (collection === 'codex_feats' && FEAT_TYPED_LIST_FIELDS.has(camel)) return true;
  if (collection === 'codex_parts' && camel === 'defense') return true;
  if (collection === 'codex_species' && camel === 'adulthoodLifespan') return true;
  if (collection === 'codex_skills' && camel === 'ability') return true;
  return false;
}

/** Validate one camelCase codex field value (lenient on legacy null/empty shapes). */
export function codexPersistedFieldShapeError(
  collection: CodexCollection,
  camel: string,
  value: unknown,
): string | null {
  if (isAbsent(value)) return null;

  const collectionErr = collectionFieldShapeError(collection, camel, value);
  if (collectionErr) return collectionErr;
  if (collectionFieldBypassesGenericChecks(collection, camel)) return null;

  if (camel === 'name') {
    if (typeof value !== 'string') return 'name must be a string';
    if (value.length > CODEX_NAME_MAX_LENGTH) return 'name exceeds maximum length';
  }
  if (camel === 'description') {
    if (typeof value !== 'string') return 'description must be a string';
    if (value.length > CODEX_DESC_MAX_LENGTH) return 'description exceeds maximum length';
  }

  if (CODEX_NUMERIC_FIELD_KEYS.has(camel)) {
    const numericErr = numericScalarError(camel, value);
    if (numericErr) return numericErr;
    return null;
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
    return codexJsonFieldShapeError(camel, value);
  }

  if (CODEX_COMMA_LIST_FIELD_KEYS.has(camel)) {
    if (!isCommaListValue(value)) return `${camel} must be a string or array of strings`;
    return null;
  }

  if (
    camel.endsWith('Desc') ||
    camel === 'type' ||
    camel === 'category' ||
    camel === 'mechanic' ||
    camel === 'recPeriod' ||
    camel === 'tags' ||
    camel === 'baseFeatId' ||
    camel === 'baseSkill' ||
    camel === 'baseSkillId' ||
    camel === 'currency' ||
    camel === 'rarity' ||
    camel === 'percentage' ||
    camel === 'duration' ||
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
    const err = codexPersistedFieldShapeError(collection, key, value);
    if (err) return err;
  }
  return null;
}
