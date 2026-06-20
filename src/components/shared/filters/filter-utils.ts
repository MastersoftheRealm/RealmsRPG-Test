/**
 * Shared helpers for filter dropdown option lists.
 */

export type SelectOption = { value: string; label: string };

/** Keep the first option for each value — avoids duplicate `<option>` rows. */
export function dedupeSelectOptions(options: SelectOption[]): SelectOption[] {
  const seen = new Set<string>();
  return options.filter((opt) => {
    if (seen.has(opt.value)) return false;
    seen.add(opt.value);
    return true;
  });
}

/**
 * Whether to render a synthetic placeholder row (`value=""`).
 * Skip when options already define an unfiltered sentinel (`""` or `"all"`).
 */
export function shouldShowSelectPlaceholder(
  placeholder: string | null | undefined,
  options: SelectOption[]
): placeholder is string {
  if (placeholder == null) return false;
  return !options.some((o) => o.value === '' || o.value === 'all');
}

/** Dedupe string lists used for tag / chip pickers. */
export function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}
