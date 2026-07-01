/**
 * Unified typography and spacing for GuidedChoiceCard.
 * Collapsed min-heights keep grid cards aligned (species, paths, etc.).
 */

export const GUIDED_CHOICE_STYLES = {
  cardCollapsed: 'min-h-[11rem] sm:min-h-[10.5rem]',
  selectButton: 'flex min-h-0 w-full flex-1 flex-col gap-3 p-4 sm:p-5 text-left',
  headerRow: 'flex flex-1 gap-3 items-start',
  contentColumn: 'flex min-w-0 flex-1 flex-col',
  title: 'font-display text-lg sm:text-xl font-semibold text-text-primary',
  bodyWrap: 'mt-1.5 flex flex-col gap-1',
  body: 'font-nunito text-base text-text-secondary leading-relaxed',
  bodyCollapsed: 'min-h-[5.25rem]',
  readMore:
    'flex w-fit items-center font-nunito text-sm font-semibold text-primary-link-fg hover:text-primary-fg-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm min-h-11 py-0.5',
  badge:
    'shrink-0 rounded-pill bg-surface-alt px-2 py-0.5 text-xs font-medium text-text-secondary font-nunito',
  tagsRow: 'flex min-h-[1.625rem] flex-wrap gap-1.5',
  tag: 'rounded-md bg-surface-alt px-2 py-0.5 text-xs font-medium text-text-secondary font-nunito',
  /** Default inline art (paths, feats). */
  media: 'relative h-12 w-12 shrink-0 overflow-hidden rounded-card bg-surface-alt',
  /** Larger selling-point art inline with title (species, equipment, powers). */
  mediaFeatured:
    'relative h-[4.75rem] w-[4.75rem] sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-card border border-border-light bg-surface-alt dark:border-border',
  iconWrap:
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-primary-subtle-bg text-primary-fg',
  selectedCheck:
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-primary text-text-on-dark',
  meta: 'font-nunito text-sm text-text-muted dark:text-text-secondary',
} as const;

/** Two-column grid — items-start so expanded cards do not stretch neighbors. */
export const GUIDED_CHOICE_GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 gap-3 items-start';

/**
 * Compact two-column grid for short comparable options (ancestry traits, feats).
 * items-stretch + card h-full = equal card height per row (content stays top-aligned).
 */
export const GUIDED_CHOICE_COMPACT_GRID_CLASS =
  'grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch';

/** @deprecated Prefer GUIDED_CHOICE_COMPACT_GRID_CLASS for trait/feat picks. */
export const GUIDED_CHOICE_LIST_CLASS = 'flex flex-col gap-3';
