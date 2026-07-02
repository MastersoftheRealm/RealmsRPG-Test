/**
 * Theme-aware validation / allocation panel surfaces (Phase 4).
 * Use instead of numbered green/amber/red/blue ramps + dark: pairs.
 */

export const statusPanel = {
  complete: 'bg-success-light border-success-300',
  completeBg: 'bg-success-light',
  completeBadge: 'bg-success-light text-success-fg',
  warning: 'bg-warning-light border-warning-300',
  warningBg: 'bg-warning-light',
  warningBadge: 'bg-warning-light text-warning-fg',
  info: 'bg-info-light border-info-border',
  infoBg: 'bg-info-light',
  infoBadge: 'bg-info-light text-info-fg',
  danger: 'bg-danger-light border-danger-300',
  dangerBg: 'bg-danger-light',
  dangerBadge: 'bg-danger-light text-danger-fg',
  neutral: 'bg-surface-alt border-border-light',
} as const;
