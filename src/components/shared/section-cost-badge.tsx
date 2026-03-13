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
  en?: number;
  /** Training point cost */
  tp?: number;
  /** Item point cost (armament creator) */
  ip?: number;
  /** Currency cost (armament creator) */
  currency?: number;
  className?: string;
}

export function SectionCostBadge({ en, tp, ip, currency, className }: SectionCostBadgeProps) {
  const parts: string[] = [];
  if (en !== undefined && en !== 0) parts.push(`EN: ${en >= 0 ? '+' : ''}${en}`);
  if (tp !== undefined && tp !== 0) parts.push(`TP: ${tp >= 0 ? '+' : ''}${tp}`);
  if (ip !== undefined && ip !== 0) parts.push(`IP: ${ip >= 0 ? '+' : ''}${ip}`);
  if (currency !== undefined && currency !== 0) parts.push(`C: ${currency >= 0 ? '+' : ''}${currency}`);

  if (parts.length === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-medium',
        'text-text-secondary dark:text-text-primary',
        className
      )}
      aria-label={`Cost contribution: ${parts.join(', ')}`}
    >
      {en !== undefined && en !== 0 && (
        <span className="text-energy-text">{`EN: ${en >= 0 ? '+' : ''}${en}`}</span>
      )}
      {tp !== undefined && tp !== 0 && (
        <span className="text-tp-text">{`TP: ${tp >= 0 ? '+' : ''}${tp}`}</span>
      )}
      {ip !== undefined && ip !== 0 && (
        <span className="text-ip-text">{`IP: ${ip >= 0 ? '+' : ''}${ip}`}</span>
      )}
      {currency !== undefined && currency !== 0 && (
        <span className="text-currency-text">{`C: ${currency >= 0 ? '+' : ''}${currency}`}</span>
      )}
    </span>
  );
}
