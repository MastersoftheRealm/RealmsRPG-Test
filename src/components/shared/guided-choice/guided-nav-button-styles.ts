/**
 * Shared chrome for guided footer progress vs layer navigation below step content.
 * Footer Continue stays primary; GuidedLayerNav expand uses hatch chrome (TASK-695).
 */

import { cn } from '@/lib/utils';

/** Footer Continue / primary progress CTA */
export const guidedNavProgressClassName = 'min-h-11 shrink-0';

/** GuidedLayerNav expand — deeper/hatch; outline + subtle fill, not footer primary */
export const guidedNavExpandClassName = cn(
  guidedNavProgressClassName,
  'bg-primary-subtle-bg hover:bg-primary-subtle-bg/80',
  'dark:bg-surface-alt dark:hover:bg-surface'
);

/** Previous / shallower / Back */
export const guidedNavPreviousClassName = cn(
  guidedNavProgressClassName,
  'border-primary-outline-border text-primary-outline-fg',
  'dark:border-border dark:text-text-primary'
);
