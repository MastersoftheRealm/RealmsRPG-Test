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

export function formatCodexChangeValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '—';
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

/** Normalize `changed_fields` rows from Supabase into a stable shape. */
export function parseChangedFields(
  raw: Array<Record<string, unknown>> | null | undefined,
): CodexFieldChange[] {
  if (!raw?.length) return [];
  const parsed: CodexFieldChange[] = [];
  for (const row of raw) {
    const field = typeof row.field === 'string' ? row.field : String(row.field ?? '');
    if (!field) continue;
    parsed.push({
      field,
      before: row.before ?? null,
      after: row.after ?? null,
    });
  }
  return parsed;
}

export function summarizeChangedFieldNames(changes: CodexFieldChange[]): string {
  if (changes.length === 0) return 'No field diffs recorded';
  const names = changes.map((c) => c.field);
  if (names.length <= 4) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
}
