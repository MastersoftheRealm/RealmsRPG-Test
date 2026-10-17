/**
 * Rules sources on codex subrule rows.
 *
 * A source is a content-pack name stored on `sources text[]`.
 * The display name is the value: trimmed, with internal whitespace collapsed.
 * Names that differ only by case are the same source. A non-lowercase spelling
 * wins over an all-lowercase one (`Core` over `core`). When both spellings have
 * a capital letter, the earlier `localeCompare` string wins (`CORE` before `Core`).
 * An empty list is Core.
 *
 * `CODEX_SOURCE_WHITESPACE_CODE_POINTS` is the ES `\s` set (no `u` flag), which
 * is the same set `String.trim` removes. `sql/codex-entry-sources-open.sql`
 * `collapse_codex_source_name` must list these code points and no others.
 */

export const CORE_CODEX_SOURCE = 'Core';

/** Shared label for admin source picker and GLR rules-source filter. */
export const CODEX_SOURCE_PICKER_LABEL = 'Sources';

/** Shared ChipSelect placeholder (filter + admin picker). */
export const CODEX_SOURCE_PICKER_PLACEHOLDER = 'Add a source';

export const DEFAULT_CODEX_SOURCES: readonly string[] = [CORE_CODEX_SOURCE];

/** Same cap as character names. A content-pack label is one short string. */
export const CODEX_SOURCE_NAME_MAX_LENGTH = 100;

/**
 * List-filter token. `itemMatchesSources` treats this as "every item".
 * It cannot also be a content-pack name.
 */
export const CODEX_SOURCE_FILTER_ALL = 'all';

/** ES WhiteSpace + LineTerminator. Keep in lockstep with the open-sources SQL function. */
export const CODEX_SOURCE_WHITESPACE_CODE_POINTS: readonly number[] = [
  0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x0020, 0x00a0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003,
  0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
  0xfeff,
];

export function collapseCodexSourceName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function codexSourceKey(name: string): string {
  return collapseCodexSourceName(name).toLowerCase();
}

/**
 * Why a collapsed name cannot be stored. Empty is not an error: the caller skips
 * it, and a list of only empty tokens becomes Core.
 */
export function codexSourceNameError(name: string): string | null {
  if (!name) return null;
  if (name.length > CODEX_SOURCE_NAME_MAX_LENGTH) {
    return `Source name must be ${CODEX_SOURCE_NAME_MAX_LENGTH} characters or fewer.`;
  }
  if (/[<>]/.test(name)) return 'Source name cannot include HTML.';
  if (/[\u0000-\u001F\u007F]/.test(name)) {
    return 'Source name cannot include control characters.';
  }
  if (codexSourceKey(name) === CODEX_SOURCE_FILTER_ALL) {
    return 'All is reserved and cannot be a source name.';
  }
  return null;
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
    chosen.set(key, knownSpelling ?? preferCodexSourceSpelling(chosen.get(key), collapsed));
  }
  return [...chosen.values()].sort((a, b) => a.localeCompare(b));
}

/** At least Core. Reads and the admin field use this. It does not reject names. */
export function codexSourcesOrCore(value: unknown, known?: readonly string[]): string[] {
  const normalized = normalizeCodexSources(value, known);
  return normalized.length > 0 ? normalized : [CORE_CODEX_SOURCE];
}

function sourceTokensForWrite(value: unknown): string[] {
  if (Array.isArray(value)) {
    const tokens: string[] = [];
    for (const item of value) {
      if (typeof item !== 'string') throw new Error('Source name must be text.');
      tokens.push(item);
    }
    return tokens;
  }
  if (typeof value === 'string') return [value];
  if (value == null) return [];
  throw new Error('Source name must be text.');
}

/**
 * Value stored by admin creates, updates, and archetype saves.
 * Empty becomes Core. Duplicates collapse case-insensitively.
 * An over-long name, HTML, a control character, or All is rejected.
 */
export function codexSourcesForWrite(value: unknown, known?: readonly string[]): string[] {
  for (const token of sourceTokensForWrite(value)) {
    const collapsed = collapseCodexSourceName(token);
    if (!collapsed) continue;
    const error = codexSourceNameError(collapsed);
    if (error) throw new Error(error);
  }
  return codexSourcesOrCore(value, known);
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
