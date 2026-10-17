/**
 * Shared rules-source list for every codex subrule (feats, skills, species,
 * traits, parts, properties, equipment, archetypes, creature feats).
 *
 * One item can belong to several sources. Stored as `sources text[]` of these ids.
 * Missing or empty values are Core, the same default the migration backfills.
 */

export const CODEX_SOURCES = [
  { id: 'core', label: 'Core' },
  { id: 'crafting', label: 'Crafting' },
  { id: 'downtime', label: 'Downtime' },
  { id: 'harvesting', label: 'Harvesting' },
  { id: 'companions', label: 'Companions' },
  { id: 'homebrew', label: 'Homebrew' },
  { id: 'unreleased', label: 'Unreleased' },
] as const;

export type CodexSourceId = (typeof CODEX_SOURCES)[number]['id'];

export const CODEX_SOURCE_IDS: readonly CodexSourceId[] = CODEX_SOURCES.map((source) => source.id);

export const DEFAULT_CODEX_SOURCES: readonly CodexSourceId[] = ['core'];

const SOURCE_ID_SET = new Set<string>(CODEX_SOURCE_IDS);

/** Singular free-text values from the earlier source column. */
const LEGACY_SOURCE_LABELS: Record<string, CodexSourceId> = {
  core: 'core',
  'core rules': 'core',
  crafting: 'crafting',
  'crafting expansion': 'crafting',
  downtime: 'downtime',
  'downtime expansion': 'downtime',
  harvesting: 'harvesting',
  'harvesting expansion': 'harvesting',
  companions: 'companions',
  'companions expansion': 'companions',
  homebrew: 'homebrew',
  unreleased: 'unreleased',
  'unreleased/test': 'unreleased',
  test: 'unreleased',
};

export function isCodexSourceId(value: string): value is CodexSourceId {
  return SOURCE_ID_SET.has(value);
}

export function codexSourceLabel(id: CodexSourceId): string {
  const match = CODEX_SOURCES.find((source) => source.id === id);
  return match?.label ?? id;
}

function tokenToSourceId(raw: string): CodexSourceId | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  if (isCodexSourceId(key)) return key;
  return LEGACY_SOURCE_LABELS[key] ?? null;
}

function collectSourceIds(value: unknown): CodexSourceId[] {
  const tokens: string[] = [];
  if (Array.isArray(value)) {
    for (const item of value) tokens.push(String(item));
  } else if (typeof value === 'string') {
    for (const part of value.split(',')) tokens.push(part);
  } else if (value == null) {
    return [];
  } else {
    tokens.push(String(value));
  }

  const seen = new Set<CodexSourceId>();
  for (const token of tokens) {
    const id = tokenToSourceId(token);
    if (id) seen.add(id);
  }
  return CODEX_SOURCE_IDS.filter((id) => seen.has(id));
}

/**
 * Canonical ids in list order. Unknown tokens are dropped.
 * Empty input stays empty; use `codexSourcesOrCore` when a row must have a source.
 */
export function normalizeCodexSources(value: unknown): CodexSourceId[] {
  return collectSourceIds(value);
}

/** At least Core. This is the value admin saves and the migration default. */
export function codexSourcesOrCore(value: unknown): CodexSourceId[] {
  const normalized = collectSourceIds(value);
  return normalized.length > 0 ? normalized : ['core'];
}

/**
 * List filter for a later Library/Codex source chip control.
 * No selection, or only the "all" token, matches every item.
 * Otherwise the item matches when it shares any selected source (same "any" mode as feat tags).
 * A missing sources list is Core, matching the backfill.
 */
export function itemMatchesSources(
  itemSources: unknown,
  selected: readonly string[] | null | undefined,
): boolean {
  const picked = (selected ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value !== '' && value !== 'all');
  if (picked.length === 0) return true;
  const have = new Set<string>(codexSourcesOrCore(itemSources));
  return picked.some((id) => have.has(id));
}
