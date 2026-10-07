/**
 * SectionCostBadge — Display EN/TP/IP costs next to section labels
 * ================================================================
 * Shows shorthand cost contribution for a creator section (e.g. Range, Area, Damage).
 * Uses same visual style as part/property cost chips.
 */

'use client';

import { cn } from '@/lib/utils';

export interface SectionCostBadgeProps {
  /** Energy cost (power/technique creators) */
  en?: number | undefined;
  /** Training point cost */
  tp?: number | undefined;
  /** Item point cost (armament creator) */
  ip?: number | undefined;
  /** Currency cost (armament creator) */
  currency?: number | undefined;
  /**
   * The section has a calculated cost that this tab does not charge.
   * Shown instead of the numbers so the tab is not mistaken for a priced one.
   */
  unpriced?: boolean | undefined;
  className?: string | undefined;
}

function formatBadgeNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, '');
}

export function SectionCostBadge({
  en,
  tp,
  ip,
  currency,
  unpriced = false,
  className,
}: SectionCostBadgeProps) {
  const parts: string[] = [];
  if (en !== undefined && en !== 0) parts.push(`EN: ${en >= 0 ? '+' : ''}${formatBadgeNumber(en)}`);
  if (tp !== undefined && tp !== 0) parts.push(`TP: ${tp >= 0 ? '+' : ''}${formatBadgeNumber(tp)}`);
  if (ip !== undefined && ip !== 0) parts.push(`IP: ${ip >= 0 ? '+' : ''}${formatBadgeNumber(ip)}`);
  if (currency !== undefined && currency !== 0)
    parts.push(`C: ${currency >= 0 ? '+' : ''}${formatBadgeNumber(currency)}`);

  if (unpriced) {
    if (parts.length === 0) return null;
    return (
      <span
        className={cn('text-xs font-medium text-text-muted', className)}
        aria-label="Not priced"
      >
        Not priced
      </span>
    );
  }

  if (parts.length === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-medium',
        'text-text-secondary dark:text-text-primary',
        className,
      )}
      aria-label={`Cost contribution: ${parts.join(', ')}`}
    >
      {en !== undefined && en !== 0 && (
        <span className="text-energy-text">{`EN: ${en >= 0 ? '+' : ''}${formatBadgeNumber(en)}`}</span>
      )}
      {tp !== undefined && tp !== 0 && (
        <span className="text-tp-text">{`TP: ${tp >= 0 ? '+' : ''}${formatBadgeNumber(tp)}`}</span>
      )}
      {ip !== undefined && ip !== 0 && (
        <span className="text-ip-text">{`IP: ${ip >= 0 ? '+' : ''}${formatBadgeNumber(ip)}`}</span>
      )}
      {currency !== undefined && currency !== 0 && (
        <span className="text-currency-text">{`C: ${currency >= 0 ? '+' : ''}${formatBadgeNumber(currency)}`}</span>
      )}
    </span>
  );
}
