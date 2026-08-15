import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { wouldExceedSharedTp } from '@/lib/guided-creator/loadout-tp';
import { indexByNormalizedIds, normalizeId } from '@/lib/utils/normalize-id';
import type { ArchetypeCategory } from '@/types';
import type { LibraryPower, LibraryTechnique } from '@/types/library';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

export type PowersTechniquesItemKind = 'powers' | 'techniques';

export type GuidedPathLibraryRow = LibraryPower | LibraryTechnique;

export function stepCopy(type: ArchetypeCategory | null): {
  title: string;
  description: string;
  kind: PowersTechniquesItemKind;
} {
  if (type === 'martial') {
    return { ...ptCopy.martial, kind: 'techniques' as const };
  }
  if (type === 'powered-martial') {
    return { ...ptCopy.poweredMartial, kind: 'powers' as const };
  }
  return { ...ptCopy.power, kind: 'powers' as const };
}

export function buildLookup(items: GuidedPathLibraryRow[]): Map<string, GuidedPathLibraryRow> {
  const map = indexByNormalizedIds(items);
  for (const item of items) {
    const nameKey = normalizeId(item.name);
    if (nameKey) map.set(nameKey, item);
  }
  return map;
}

export function resolveLibraryItem(
  id: string,
  lookup: Map<string, GuidedPathLibraryRow>,
): GuidedPathLibraryRow | undefined {
  return lookup.get(normalizeId(id));
}

export function pickAffordableIds(
  ids: string[],
  costOf: (id: string) => number,
  alreadySpent: number,
  limit: number,
): string[] {
  const picked: string[] = [];
  let spent = alreadySpent;
  for (const id of ids) {
    const cost = costOf(id);
    if (spent + cost > limit) continue;
    picked.push(id);
    spent += cost;
  }
  return picked;
}

/**
 * Soft-seed innate picks that fit threshold, fill as much Innate Energy as possible,
 * and stay within the shared Training Points budget.
 */
export function pickInnateFillIds(
  ids: string[],
  energyOf: (id: string) => number | undefined,
  tpOf: (id: string) => number,
  threshold: number,
  energyMax: number,
  tpAlreadySpent: number,
  tpLimit: number,
): string[] {
  const candidates = ids
    .map((id) => ({ id, energy: energyOf(id), tp: tpOf(id) }))
    .filter(
      (row): row is { id: string; energy: number; tp: number } =>
        row.energy != null && row.energy >= 0 && row.energy <= threshold,
    )
    .sort((a, b) => b.energy - a.energy);

  const picked: string[] = [];
  let energySpent = 0;
  let tpSpent = tpAlreadySpent;
  for (const row of candidates) {
    if (energySpent + row.energy > energyMax) continue;
    if (tpSpent + row.tp > tpLimit) continue;
    picked.push(row.id);
    energySpent += row.energy;
    tpSpent += row.tp;
    if (energySpent === energyMax) break;
  }
  return picked;
}

type InnateSelectionBlockReason = 'threshold' | 'energy' | 'tp';

type ApplyInnateSelectionResult =
  | { ok: true; nextIds: string[] }
  | { ok: false; reason: InnateSelectionBlockReason };

export function innateSelectionBlockMessage(reason: InnateSelectionBlockReason): string {
  if (reason === 'threshold') return ptCopy.innateThresholdBlocked;
  if (reason === 'energy') return ptCopy.innateEnergyBlocked;
  return ptCopy.tpBlocked;
}

function sumResolvedEnergy(ids: string[], energyOf: (id: string) => number | undefined): number {
  return ids.reduce((sum, id) => {
    const energy = energyOf(id);
    return sum + (energy != null ? energy : 0);
  }, 0);
}

function sumTp(ids: string[], tpOf: (id: string) => number): number {
  return ids.reduce((sum, id) => sum + tpOf(id), 0);
}

/**
 * Add an innate pick, dropping last-selected innates until Innate Energy fits
 * (TASK-727). Threshold-ineligible or over-max-alone stays blocked. TP is
 * checked against the remaining innates after those drops — not swapped for TP.
 */
export function applyInnateSelection(opts: {
  selectedIds: string[];
  id: string;
  energyOf: (id: string) => number | undefined;
  tpOf: (id: string) => number;
  threshold: number;
  energyMax: number;
  otherTpSpent: number;
  tpLimit: number;
}): ApplyInnateSelectionResult {
  const key = String(opts.id);
  const energy = opts.energyOf(key);
  if (energy == null || energy < 0 || energy > opts.threshold) {
    return { ok: false, reason: 'threshold' };
  }
  if (energy > opts.energyMax) {
    return { ok: false, reason: 'energy' };
  }

  let remaining = [...opts.selectedIds];
  while (
    remaining.length > 0 &&
    sumResolvedEnergy(remaining, opts.energyOf) + energy > opts.energyMax
  ) {
    remaining = remaining.slice(0, -1);
  }
  if (sumResolvedEnergy(remaining, opts.energyOf) + energy > opts.energyMax) {
    return { ok: false, reason: 'energy' };
  }

  if (
    wouldExceedSharedTp(
      opts.otherTpSpent + sumTp(remaining, opts.tpOf),
      opts.tpLimit,
      opts.tpOf(key),
    )
  ) {
    return { ok: false, reason: 'tp' };
  }

  return { ok: true, nextIds: [...remaining, key] };
}
