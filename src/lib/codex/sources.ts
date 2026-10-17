/**
 * Rules sources on codex subrule rows.
 *
 * A source is a content-pack name stored on `sources text[]`.
 * The display name is the value: trimmed, with internal whitespace collapsed.
 * Names that differ only by case are the same source.
 * An empty list is Core.
 */

export const CORE_CODEX_SOURCE = 'Core';

export const DEFAULT_CODEX_SOURCES: readonly string[] = [CORE_CODEX_SOURCE];

export function collapseCodexSourceName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function codexSourceKey(name: string): string {
  return collapseCodexSourceName(name).toLowerCase();
}

function preferCodexSourceSpelling(current: string | undefined, next: string): string {
  if (!current) return next;
  const currentIsLower = current === current.toLowerCase();
  const nextIsLower = next === next.toLowerCase();
  if (currentIsLower !== nextIsLower) return currentIsLower ? next : current;
  return current.localeCompare(next) <= 0 ? current : next;
}

function sourceTokens(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') return [value];
  if (value == null) return [];
  return [String(value)];
}

/**
 * Distinct display names. A string is one source and is not split on commas.
 * `known` supplies the spelling already in use for that name.
 * Empty input stays empty; use `codexSourcesOrCore` when a row must have a source.
 */
export function normalizeCodexSources(value: unknown, known?: readonly string[]): string[] {
  const preferred = new Map<string, string>();
  for (const name of known ?? []) {
    const collapsed = collapseCodexSourceName(name);
    if (!collapsed) continue;
    const key = collapsed.toLowerCase();
    preferred.set(key, preferCodexSourceSpelling(preferred.get(key), collapsed));
  }

  const chosen = new Map<string, string>();
  for (const token of sourceTokens(value)) {
    const collapsed = collapseCodexSourceName(token);
    if (!collapsed) continue;
    const key = collapsed.toLowerCase();
    const knownSpelling = preferred.get(key);
    chosen.set(
      key,
      knownSpelling ?? preferCodexSourceSpelling(chosen.get(key), collapsed),
    );
  }
  return [...chosen.values()].sort((a, b) => a.localeCompare(b));
}

/** At least Core. This is the value admin saves. */
export function codexSourcesOrCore(value: unknown, known?: readonly string[]): string[] {
  const normalized = normalizeCodexSources(value, known);
  return normalized.length > 0 ? normalized : [CORE_CODEX_SOURCE];
}

/**
 * List filter for a later Library/Codex source chip control.
 * No selection, or only the "all" token, matches every item.
 * Otherwise the item matches when it shares any selected source (same "any" mode as feat tags).
 * Comparison is case-insensitive. A missing sources list is Core.
 */
export function itemMatchesSources(
  itemSources: unknown,
  selected: readonly string[] | null | undefined,
): boolean {
  const picked = (selected ?? [])
    .map((value) => codexSourceKey(value))
    .filter((value) => value !== '' && value !== 'all');
  if (picked.length === 0) return true;
  const have = new Set(codexSourcesOrCore(itemSources).map((name) => name.toLowerCase()));
  return picked.some((key) => have.has(key));
}
