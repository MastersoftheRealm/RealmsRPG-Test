/**
 * Shared chrome for guided progressive (Continue / deeper) vs previous (Back / shallower).
 * Used by GuidedStepFooter and GuidedLayerNav so layer hops match step footer affordances.
 */

import { cn } from '@/lib/utils';

/** Forward / deeper / Continue */
export const guidedNavProgressClassName = 'min-h-11 shrink-0';

/** Previous / shallower / Back */
export const guidedNavPreviousClassName = cn(
  guidedNavProgressClassName,
  'border-primary-outline-border text-primary-outline-fg',
  'dark:border-border dark:text-text-primary'
);
