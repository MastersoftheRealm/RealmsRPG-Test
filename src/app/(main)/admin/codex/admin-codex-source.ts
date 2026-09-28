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

/** Empty clears the column. Form strings and raw payload values share this trim. */
export function codexSourceForSave(value: unknown): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
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
