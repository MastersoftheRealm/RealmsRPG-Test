/**
 * Admin Codex rules-source (TASK-928).
 * Free-text vocabulary, same add-or-pick behavior as feat category.
 */

export function collectCodexSources(
  rows: ReadonlyArray<{ source?: string | null | undefined }> | null | undefined,
): string[] {
  const values = new Set<string>();
  for (const row of rows ?? []) {
    const source = row.source?.trim();
    if (source) values.add(source);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

/**
 * Empty clears the column. Null (not undefined) so the key survives the server
 * action; an omitted key leaves the previous source in place.
 */
export function codexSourceForSave(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

export function codexSourceSelectValue(
  value: string,
  options: readonly string[],
  addingNew: boolean,
): string {
  if (addingNew || (value.trim() !== '' && !options.includes(value))) return '__new__';
  return value;
}

export function nextCodexSourceSelection(
  selected: string,
  current: string,
  options: readonly string[],
): { value: string; addingNew: boolean } {
  if (selected === '__new__') {
    return {
      value: options.includes(current) ? '' : current,
      addingNew: true,
    };
  }
  return { value: selected, addingNew: false };
}

/** Sources typed this session plus sources already stored on other rows. */
export function mergeCodexSourceOptions(
  options: readonly string[],
  extra: readonly string[],
): string[] {
  return collectCodexSources([...options, ...extra].map((source) => ({ source })));
}

/**
 * Enter accepts a typed source. A case-insensitive match uses the existing
 * spelling. Blank text stays in the add box.
 */
export function commitCodexSourceDraft(
  draft: string,
  options: readonly string[],
): { value: string; addingNew: false } | null {
  const trimmed = draft.trim();
  if (!trimmed) return null;
  const existing = options.find(
    (option) => option.localeCompare(trimmed, undefined, { sensitivity: 'accent' }) === 0,
  );
  return { value: existing ?? trimmed, addingNew: false };
}
