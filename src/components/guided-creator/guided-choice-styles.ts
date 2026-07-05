/**
 * Unified typography and spacing for GuidedChoiceCard.
 * Collapsed min-heights keep grid cards aligned within each step (not globally).
 *
 * Preview line counts derived from codex description lengths (RealmsRPG-Test, 2026-07-04):
 *   species  — median 159, p75 172, avg 377 (n=17)
 *   paths    — median 215, p75 323 (codex_archetypes, n=11)
 *   feats    — median 156, p75 220 (codex_feats, n=803)
 *   traits   — median 127, p75 170 (codex_traits, n=210)
 */

/** Per-step card preview sizing — uniform within a step, not across steps. */
export type GuidedChoiceCardDensity = 'species' | 'path' | 'compact';

export const GUIDED_CHOICE_CARD_PRESETS: Record<
  GuidedChoiceCardDensity,
  { cardCollapsed: string; bodyCollapsed: string }
> = {
  /** Species — longest flavor text; 5-line preview (~200 chars). */
  species: {
    cardCollapsed: 'min-h-[12.5rem] sm:min-h-[12rem]',
    bodyCollapsed: 'min-h-[6.5rem] line-clamp-5',
  },
  /** Paths — medium copy; 4-line preview (~160 chars). */
  path: {
    cardCollapsed: 'min-h-[11rem] sm:min-h-[10.5rem]',
    bodyCollapsed: 'min-h-[5.25rem] line-clamp-4',
  },
  /** Feats, traits, loadouts — short copy; 3-line preview (~120 chars). */
  compact: {
    cardCollapsed: 'min-h-[9.25rem] sm:min-h-[9rem]',
    bodyCollapsed: 'min-h-[3.9rem] line-clamp-3',
  },
};

export const GUIDED_CHOICE_STYLES = {
  selectButton: 'flex min-h-0 w-full flex-1 flex-col gap-3 p-4 sm:p-5 text-left',
  headerRow: 'flex flex-1 gap-3 items-start',
  contentColumn: 'flex min-w-0 flex-1 flex-col',
  title: 'font-display text-lg sm:text-xl font-semibold text-text-primary',
  bodyWrap: 'mt-1.5 flex flex-col gap-1',
  body: 'font-nunito text-base text-text-secondary leading-relaxed',
  /** Reserved on every collapsed card so Read more never changes row height. */
  readMoreSlot: 'flex min-h-11 shrink-0 items-center',
  readMore:
    'flex w-fit items-center font-nunito text-sm font-semibold text-primary-link-fg hover:text-primary-fg-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm min-h-11 py-0.5',
  tagsRow: 'flex min-h-[1.625rem] flex-wrap gap-1.5',
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

/**
 * Typography for read-only overview panels (species reveal, summary chips).
 * Pair display titles with nunito body — no mixed display fonts on stat values.
 */
export const GUIDED_OVERVIEW_STYLES = {
  sectionTitle: 'font-display text-lg font-semibold text-text-primary',
  sectionHint: 'mt-1 font-nunito text-sm text-text-secondary',
  body: 'font-nunito text-base text-text-primary leading-relaxed',
  bodySecondary: 'font-nunito text-base text-text-secondary leading-relaxed',
  statLabel:
    'font-nunito text-xs font-medium uppercase tracking-wide text-text-secondary',
  statValue: 'mt-1 font-nunito text-sm font-semibold text-text-primary capitalize',
  callout: 'rounded-card border border-border-light bg-primary-subtle-bg/40 px-4 py-3',
} as const;

/**
 * Two-column grid — items-stretch + card h-full = equal card height per row
 * (content stays top-aligned within each card).
 */
export const GUIDED_CHOICE_GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch';

/** Same layout as GUIDED_CHOICE_GRID_CLASS; use with density="compact" cards. */
export const GUIDED_CHOICE_COMPACT_GRID_CLASS =
  'grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch';

/** @deprecated Prefer GUIDED_CHOICE_COMPACT_GRID_CLASS for trait/feat picks. */
export const GUIDED_CHOICE_LIST_CLASS = 'flex flex-col gap-3';
