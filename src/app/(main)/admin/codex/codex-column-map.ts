/**
 * Admin Codex — write allowlist and key mapping.
 * Admin payloads arrive in mixed casing (`op_1_desc`, `imageId`); these helpers map them to
 * the DB column set each collection is allowed to write. `columnarDbColumns` exposes that
 * column set so the read/write parity test can compare it against the `/api/codex` projection.
 */

import type { CodexCollection } from '@/lib/codex/collections';
import {
  CODEX_COLUMNAR_FIELDS,
  CODEX_JSON_FIELD_KEYS,
  CODEX_POSTGRES_TEXT_ARRAY_FIELD_KEYS,
} from '@/lib/codex-columnar-keys';
import { assertCodexAdminBodyShapes } from '@/lib/codex-mutation-validation';
import { codexSourcesForWrite } from '@/lib/codex/sources';

function snakeToCamel(s: string): string {
  // Handle common codex column patterns like op_1_desc -> op1Desc
  // so option fields survive the allowed-field filter.
  const normalized = s.replace(/_(\d+)/g, '$1');
  return normalized.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Admin payloads use snake_case like `op_1_desc`. COLUMNAR_FIELDS use `op1Desc` (digit in the
 * camel segment). Plain snakeToCamel leaves `op_1Desc`, which fails the allowlist and drops
 * option fields on insert/update.
 */
function columnarSourceKeyToCamel(collection: CodexCollection, key: string): string {
  if ((collection === 'codex_properties' || collection === 'codex_parts') && /^op_\d+_/.test(key)) {
    const m = key.match(/^op_(\d+)_(.+)$/);
    if (m) {
      const optionIndex = m[1];
      const rest = m[2];
      if (optionIndex === undefined || rest === undefined) return snakeToCamel(key);
      const restCamel = snakeToCamel(rest);
      if (!restCamel) return snakeToCamel(key);
      return `op${optionIndex}${restCamel.charAt(0).toUpperCase()}${restCamel.slice(1)}`;
    }
  }
  return snakeToCamel(key);
}

function camelToSnake(s: string): string {
  return s.replace(/([a-zA-Z])(\d)/g, '$1_$2').replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * `codex_parts` / `codex_properties` separate the option index (`op_1_desc`), but
 * `codex_archetypes` keeps it attached (`level1_feats`, `power_prof_level5`). Splitting the
 * digit there produced columns that do not exist, so every archetype spreadsheet save failed.
 */
function camelToSnakeAttachedDigits(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function dbColumnName(collection: CodexCollection, key: string): string {
  return collection === 'codex_archetypes' ? camelToSnakeAttachedDigits(key) : camelToSnake(key);
}

/**
 * JSONB columns. Comma-joining these (the TEXT-array path) turns a group into
 * "[object Object]" and the spreadsheet edit does not survive reload.
 * A string that will not parse must not be stored as a JSON string scalar:
 * the creator treats that as missing, and a later list-mode save writes null.
 */
/** Parse a JSONB cell. Throws so the save returns an error before any update. */
function parseJsonColumn(camel: string, raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    const column = camelToSnakeAttachedDigits(camel);
    throw new Error(
      `${column} is not valid JSON, so this save was rejected and nothing was written.`,
    );
  }
}

/** Serialize value for columnar TEXT columns: arrays become comma-separated */
function toColumnValue(camel: string, val: unknown): unknown {
  if (CODEX_POSTGRES_TEXT_ARRAY_FIELD_KEYS.has(camel)) return codexSourcesForWrite(val);
  if (val == null) return null;
  if (CODEX_JSON_FIELD_KEYS.has(camel)) {
    if (val === '') return null;
    if (typeof val === 'string') return parseJsonColumn(camel, val);
    return val;
  }
  if (Array.isArray(val)) return val.map(String).join(', ');
  if (typeof val === 'object' && !(val instanceof Date)) return JSON.stringify(val);
  return val;
}

const COLUMNAR_FIELDS = CODEX_COLUMNAR_FIELDS;

/** Reject admin spreadsheet keys outside the collection write allowlist. */
export function assertCodexAdminPayloadKeys(
  collection: CodexCollection,
  data: Record<string, unknown>,
): void {
  const allowed = new Set(COLUMNAR_FIELDS[collection] ?? []);
  if (allowed.size === 0) return;
  const skip = new Set(['id', 'data', 'expectedUpdatedAt', 'updated_at', 'updatedAt']);
  const camelBody: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (skip.has(key)) continue;
    const camel = columnarSourceKeyToCamel(collection, key);
    if (!allowed.has(camel)) {
      throw new Error(`Unsupported codex field: ${key}`);
    }
    camelBody[camel] = data[key];
  }
  assertCodexAdminBodyShapes(collection, camelBody);
}

/** Build create/update payload from admin payload (snake_case, arrays). Output camelCase for toDbPayload. */
export function toColumnarPayload(
  collection: CodexCollection,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = new Set(COLUMNAR_FIELDS[collection] ?? []);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'data') continue;
    const camel = columnarSourceKeyToCamel(collection, key);
    if (allowed.size > 0 && !allowed.has(camel)) continue;
    out[camel] = toColumnValue(camel, value);
  }
  return out;
}

/** Convert camelCase payload to snake_case for Supabase (DB columns). Collection-specific aliases so API response keys round-trip to correct DB columns. */
export function toDbPayload(
  collection: CodexCollection,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (collection === 'codex_skills' && key === 'baseSkillId') {
      out.base_skill = value != null ? String(value) : null;
      continue;
    }
    if (collection === 'codex_species') {
      if (key === 'aveHeight') {
        out.ave_hgt_cm = value != null ? (typeof value === 'number' ? value : Number(value)) : null;
        continue;
      }
      if (key === 'aveWeight') {
        out.ave_wgt_kg = value != null ? (typeof value === 'number' ? value : Number(value)) : null;
        continue;
      }
    }
    out[dbColumnName(collection, key)] = value;
  }
  return out;
}

/** Every DB column this collection's write path can set, derived from the allowlist itself. */
export function columnarDbColumns(collection: CodexCollection): string[] {
  const camelPayload = Object.fromEntries(
    (COLUMNAR_FIELDS[collection] ?? []).map((field) => [field, null]),
  );
  return Object.keys(toDbPayload(collection, camelPayload));
}
