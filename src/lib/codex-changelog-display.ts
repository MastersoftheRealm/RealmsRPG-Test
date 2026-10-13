/**
 * Compact display helpers for admin codex changelogs (TASK-874).
 * Lib-layer only — no UI imports.
 */

export type CodexFieldChange = {
  field: string;
  before: unknown;
  after: unknown;
};

const MAX_VALUE_CHARS = 160;

/** Auto-maintained columns — not content the admin edited. */
const BOOKKEEPING_FIELDS = new Set(['updated_at', 'created_at']);

const ENTITY_KIND_LABEL: Record<string, string> = {
  codex_feats: 'Feat',
  codex_skills: 'Skill',
  codex_species: 'Species',
  codex_traits: 'Trait',
  codex_parts: 'Part',
  codex_properties: 'Property',
  codex_equipment: 'Equipment',
  codex_archetypes: 'Archetype',
  codex_creature_feats: 'Creature Feat',
  core_rules: 'Core Rule',
};

const IDENTITY_NAME_KEYS = ['name', 'title', 'key', 'rule_key'] as const;
const IDENTITY_TYPE_KEYS = ['type', 'part_type'] as const;

export function formatCodexChangeValue(value: unknown): string {
  if (isEmptyCodexChangeValue(value)) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > MAX_VALUE_CHARS ? `${trimmed.slice(0, MAX_VALUE_CHARS - 1)}…` : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    const json = JSON.stringify(value);
    return json.length > MAX_VALUE_CHARS ? `${json.slice(0, MAX_VALUE_CHARS - 1)}…` : json;
  } catch {
    return String(value);
  }
}

function isCodexChangelogBookkeepingField(field: string): boolean {
  return BOOKKEEPING_FIELDS.has(field);
}

function isEmptyCodexChangeValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function codexChangeValuesEqual(a: unknown, b: unknown): boolean {
  if (isEmptyCodexChangeValue(a) && isEmptyCodexChangeValue(b)) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

function isVisibleCodexFieldChange(change: CodexFieldChange): boolean {
  if (!change.field || isCodexChangelogBookkeepingField(change.field)) return false;
  if (codexChangeValuesEqual(change.before, change.after)) return false;
  return formatCodexChangeValue(change.before) !== formatCodexChangeValue(change.after);
}

/**
 * Top-level field diffs for store + display. Skips empty-equivalent pairs
 * (null / "" / [] / {}) and bookkeeping timestamps.
 */
export function diffCodexChangedFields(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): CodexFieldChange[] {
  const before = beforeData ?? {};
  const after = afterData ?? {};
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  const changed: CodexFieldChange[] = [];

  for (const field of keys) {
    const row: CodexFieldChange = {
      field,
      before: (before as Record<string, unknown>)[field] ?? null,
      after: (after as Record<string, unknown>)[field] ?? null,
    };
    if (!isVisibleCodexFieldChange(row)) continue;
    changed.push(row);
  }

  return changed;
}

/** Normalize `changed_fields` rows from Supabase into a stable, visible-only shape. */
export function parseChangedFields(
  raw: Array<Record<string, unknown>> | null | undefined,
): CodexFieldChange[] {
  if (!raw?.length) return [];
  const parsed: CodexFieldChange[] = [];
  for (const row of raw) {
    const field = typeof row.field === 'string' ? row.field : String(row.field ?? '');
    if (!field) continue;
    const change: CodexFieldChange = {
      field,
      before: row.before ?? null,
      after: row.after ?? null,
    };
    if (!isVisibleCodexFieldChange(change)) continue;
    parsed.push(change);
  }
  return parsed;
}

export function summarizeChangedFieldNames(changes: CodexFieldChange[]): string {
  if (changes.length === 0) return 'No field diffs recorded';
  const names = changes.map((c) => c.field);
  if (names.length <= 4) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
}

function firstString(data: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/** Name/type only — enough to identify a create; not a content dump. */
export function pickCodexChangelogIdentity(
  data: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!data) return null;
  const name = firstString(data, IDENTITY_NAME_KEYS);
  const type = firstString(data, IDENTITY_TYPE_KEYS);
  const identity: Record<string, unknown> = {};
  if (name) identity.name = name;
  if (type) identity.type = type;
  return Object.keys(identity).length > 0 ? identity : {};
}

export function readCodexChangelogEntityName(
  beforeData: Record<string, unknown> | null | undefined,
  afterData: Record<string, unknown> | null | undefined,
): string {
  return (
    firstString(afterData ?? {}, IDENTITY_NAME_KEYS) ??
    firstString(beforeData ?? {}, IDENTITY_NAME_KEYS) ??
    '(unnamed)'
  );
}

function formatCodexChangelogKind(entityType: string): string {
  return ENTITY_KIND_LABEL[entityType] ?? entityType;
}

export function formatCodexChangelogHeadline(input: {
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityName: string;
  fieldChanges: CodexFieldChange[];
}): string {
  const kind = formatCodexChangelogKind(input.entityType);
  if (input.operation === 'create') {
    return `Created “${input.entityName}” (${kind})`;
  }
  if (input.operation === 'delete') {
    return `Deleted “${input.entityName}” (${kind})`;
  }
  return summarizeChangedFieldNames(input.fieldChanges);
}

/** Creates never show a field dump — even on historical rows that stored every column. */
export function parseChangedFieldsForOperation(
  operation: 'create' | 'update' | 'delete',
  raw: Array<Record<string, unknown>> | null | undefined,
): CodexFieldChange[] {
  if (operation === 'create') return [];
  return parseChangedFields(raw);
}

export function buildCodexChangelogPersistPayload(
  operation: 'create' | 'update' | 'delete',
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): {
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  changed_fields: CodexFieldChange[];
} {
  if (operation === 'create') {
    return {
      before_data: null,
      after_data: pickCodexChangelogIdentity(afterData),
      changed_fields: [],
    };
  }
  if (operation === 'delete') {
    return {
      before_data: beforeData,
      after_data: null,
      changed_fields: diffCodexChangedFields(beforeData, null),
    };
  }
  return {
    before_data: beforeData,
    after_data: afterData,
    changed_fields: diffCodexChangedFields(beforeData, afterData),
  };
}
