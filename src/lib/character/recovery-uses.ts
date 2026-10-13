/**
 * Which feat and trait uses a recovery will refresh.
 * The predicates match handleFullRecovery / handlePartialRecovery.
 */

export interface RecoveryUseSource {
  name: string;
  currentUses?: number | undefined;
  maxUses?: number | undefined;
  recovery?: string | undefined;
}

interface CodexFeatRecoveryRow {
  id: string | number;
  name?: string | null | undefined;
  rec_period?: string | null | undefined;
  uses_per_rec?: number | null | undefined;
}

interface FeatRecoveryInput {
  id?: string | number | null | undefined;
  name?: string | null | undefined;
  recovery?: string | null | undefined;
  maxUses?: number | null | undefined;
}

/** Same id-then-name lookup the sheet recovery handlers use. */
export function findCodexFeatRecovery<T extends CodexFeatRecoveryRow>(
  feat: FeatRecoveryInput,
  rows: readonly T[],
): T | undefined {
  let match = rows.find((row) => String(row.id) === String(feat.id));
  if (!match && feat.name) {
    const lower = String(feat.name).toLowerCase();
    match = rows.find((row) => String(row.name ?? '').toLowerCase() === lower);
  }
  return match;
}

/** Character fields win. Codex fills recovery period and uses when the sheet omitted them. */
export function resolvedFeatUses(
  feat: FeatRecoveryInput,
  codex?: {
    rec_period?: string | null | undefined;
    uses_per_rec?: number | null | undefined;
  } | null,
): { recovery: string | undefined; maxUses: number | undefined } {
  const recovery = feat.recovery || codex?.rec_period || undefined;
  const maxUses = feat.maxUses ?? codex?.uses_per_rec;
  return { recovery, maxUses: maxUses ?? undefined };
}

export function featUsesAfterFullRecovery(
  currentUses: number | undefined,
  recovery: string | undefined,
  maxUses: number | undefined,
): number | undefined {
  const lower = (recovery || '').toLowerCase();
  if ((lower.includes('full') || lower.includes('partial')) && maxUses != null) {
    return maxUses;
  }
  return currentUses;
}

export function featUsesAfterPartialRecovery(
  currentUses: number | undefined,
  recovery: string | undefined,
  maxUses: number | undefined,
  resetPartialFeats: boolean,
): number | undefined {
  if (resetPartialFeats && recovery?.toLowerCase().includes('partial')) {
    return maxUses || currentUses;
  }
  return currentUses;
}

/** Full recovery resets every trait with uses. Partial resets only a partial period. */
export function traitUseResetValue(
  trait:
    | { uses_per_rec?: number | null | undefined; rec_period?: string | null | undefined }
    | undefined,
  mode: 'full' | 'partial',
): number | undefined {
  if (!trait?.uses_per_rec) return undefined;
  if (mode === 'partial' && !trait.rec_period?.toLowerCase().includes('partial')) return undefined;
  return trait.uses_per_rec;
}

function countRefreshes(current: number | undefined, next: number | undefined): boolean {
  if (next == null) return false;
  if (current == null) return true;
  return current < next;
}

/** Names whose remaining uses will go up. Already-full uses are omitted. */
export function recoveryUseNames(
  feats: readonly RecoveryUseSource[],
  traits: readonly RecoveryUseSource[],
  mode: 'full' | 'partial',
): string[] {
  const names: string[] = [];
  for (const feat of feats) {
    const next =
      mode === 'full'
        ? featUsesAfterFullRecovery(feat.currentUses, feat.recovery, feat.maxUses)
        : featUsesAfterPartialRecovery(feat.currentUses, feat.recovery, feat.maxUses, true);
    if (feat.name && countRefreshes(feat.currentUses, next)) names.push(feat.name);
  }
  for (const trait of traits) {
    const next = traitUseResetValue(
      { uses_per_rec: trait.maxUses, rec_period: trait.recovery },
      mode,
    );
    if (trait.name && next != null && countRefreshes(trait.currentUses, next)) {
      names.push(trait.name);
    }
  }
  return names;
}

export function formatRecoveryUseReset(
  names: readonly string[],
  mode: 'full' | 'partial',
): string | null {
  if (names.length === 0) return null;
  const noun =
    mode === 'partial'
      ? names.length === 1
        ? 'partial-recovery ability use'
        : 'partial-recovery ability uses'
      : names.length === 1
        ? 'ability use'
        : 'ability uses';
  return `Resets ${names.length} ${noun}: ${names.join(', ')}`;
}
