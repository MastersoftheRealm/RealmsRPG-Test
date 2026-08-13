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

/** Shared h-11 + rounded-md chrome for filter text/number inputs and native selects (TASK-725). */
export const FILTER_CONTROL_CLASS =
  'h-11 w-full rounded-md border border-border-light bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-outline-border focus:outline-none focus:ring-2 focus:ring-primary-outline-border disabled:cursor-not-allowed disabled:bg-surface-alt';

/** Shared h-11 control row chrome for filter checkboxes and inline controls. */
export const FILTER_CONTROL_ROW_CLASS =
  'flex min-h-11 items-center rounded-md border border-border-light bg-surface px-3';

/** Fixed label-row height so InfoTippy beside the label cannot stretch the track. */
export const FILTER_LABEL_ROW_CLASS = 'mb-1 flex h-5 items-center gap-1.5';
