/** Shared recovery-period labels for trait/feat limited uses (deep-dive rows). */

export function formatTraitRecoveryLabel(recPeriod: string | undefined): string | null {
  const raw = recPeriod?.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('full')) return 'Full Recovery';
  if (lower.includes('partial') || lower.includes('short')) return 'Partial Recovery';
  return raw;
}

export function formatLimitedUsesExpandedHint(
  uses: number,
  recPeriod: string | undefined
): string | null {
  if (uses <= 0) return null;
  const recovery = formatTraitRecoveryLabel(recPeriod);
  return recovery
    ? `Limited uses. Recovers on ${recovery}.`
    : 'Limited uses per recovery period.';
}
