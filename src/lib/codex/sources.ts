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

/**
 * Code-unit order, matching `lower(spelling) COLLATE "C", spelling COLLATE "C"`.
 * `localeCompare` is not used: it can place letters outside ASCII differently.
 */
function compareCodexSourceCodeUnit(a: string, b: string): number {
  const aKey = a.toLowerCase();
  const bKey = b.toLowerCase();
  if (aKey < bKey) return -1;
  if (aKey > bKey) return 1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Sources array after a rename or merge.
 * `sql/codex-rename-source.sql` `rename_codex_source` must produce this array
 * for a row it rewrites. The SQL updates a row only when the row already
 * contains `fromName` or `toName`. This function still returns the rewrite
 * for any input, including a list that contains neither, so tests can state
 * the array result.
 * Matching is case-insensitive. The submitted `toName` spelling replaces every
 * match of either name. Other names keep their collapsed spelling, and the
 * first token wins. The result is sorted by code unit. An empty result is Core.
 * `String.toLowerCase` folds more than SQL `lower(x COLLATE "C")` (A-Z only).
 */
export function previewCodexSourceRename(
  current: unknown,
  fromName: string,
  toName: string,
): string[] {
  const fromKey = codexSourceKey(fromName);
  const toSpelling = collapseCodexSourceName(toName);
  const toKey = toSpelling.toLowerCase();
  const chosen = new Map<string, string>();
  for (const token of sourceTokens(current)) {
    const collapsed = collapseCodexSourceName(token);
    if (!collapsed) continue;
    const key = collapsed.toLowerCase();
    const spelling = key === fromKey || key === toKey ? toSpelling : collapsed;
    if (!spelling) continue;
    const spellingKey = spelling.toLowerCase();
    if (!chosen.has(spellingKey)) chosen.set(spellingKey, spelling);
  }
  const values = [...chosen.values()].sort(compareCodexSourceCodeUnit);
  return values.length > 0 ? values : [CORE_CODEX_SOURCE];
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

/** Catalog spelling when the draft matches an existing source key; otherwise the collapsed draft. */
export function resolveCodexSourceName(draft: string, catalogNames: readonly string[]): string {
  const collapsed = collapseCodexSourceName(draft);
  if (!collapsed) return collapsed;
  const key = codexSourceKey(collapsed);
  const match = catalogNames.find((name) => codexSourceKey(name) === key);
  return match ?? collapsed;
}

/** Sources array after adding a pack name (deduped case-insensitively, validated for write). */
export function codexSourcesAfterAdd(
  current: unknown,
  sourceName: string,
  catalogNames?: readonly string[],
): string[] {
  const currentList = codexSourcesOrCore(current, catalogNames);
  return codexSourcesForWrite([...currentList, sourceName], catalogNames);
}

/** Sources array after removing a pack name (empty becomes Core). */
export function codexSourcesAfterRemove(
  current: unknown,
  sourceName: string,
  catalogNames?: readonly string[],
): string[] {
  const key = codexSourceKey(sourceName);
  const currentList = codexSourcesOrCore(current, catalogNames);
  const filtered = currentList.filter((name) => codexSourceKey(name) !== key);
  return codexSourcesForWrite(filtered.length > 0 ? filtered : [], catalogNames);
}

/** False when remove would not change stored sources (for example Core-only rows). */
export function codexSourceMembershipRemoveOffered(
  itemSources: unknown,
  sourceName: string,
  catalogNames?: readonly string[],
): boolean {
  const before = codexSourcesOrCore(itemSources, catalogNames);
  const key = codexSourceKey(sourceName);
  if (!before.some((name) => codexSourceKey(name) === key)) return false;
  const after = codexSourcesAfterRemove(itemSources, sourceName, catalogNames);
  const beforeKeys = [...new Set(before.map((name) => codexSourceKey(name)))].sort();
  const afterKeys = [...new Set(after.map((name) => codexSourceKey(name)))].sort();
  return beforeKeys.join('\0') !== afterKeys.join('\0');
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
