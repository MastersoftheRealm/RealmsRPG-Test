import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { wouldExceedSharedTp } from '@/lib/guided-creator/loadout-tp';
import { indexByNormalizedIds, normalizeId } from '@/lib/utils/normalize-id';
import type { LibraryPower, LibraryTechnique } from '@/types/library';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

export type PowersTechniquesItemKind = 'powers' | 'techniques';

export type GuidedPathLibraryRow = LibraryPower | LibraryTechnique;

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

export type InnateSelectionWarnReason = 'threshold' | 'energy';

type InnateSelectionBlockReason = 'tp';

type ApplyInnateSelectionResult =
  | { ok: true; nextIds: string[]; warn?: InnateSelectionWarnReason }
  | { ok: false; reason: InnateSelectionBlockReason };

export function innateSelectionWarnMessage(reason: InnateSelectionWarnReason): string {
  if (reason === 'threshold') return ptCopy.innateThresholdBlocked;
  return ptCopy.innateEnergyBlocked;
}

export function innateSelectionBlockMessage(reason: InnateSelectionBlockReason): string {
  switch (reason) {
    case 'tp':
      return ptCopy.tpBlocked;
  }
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
 * Append an innate pick. Over-threshold or over-Innate-Energy totals warn (86e3pbwf7);
 * Training Points still block when the shared budget would be exceeded.
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
  const nextIds = [...opts.selectedIds, key];

  if (
    wouldExceedSharedTp(
      opts.otherTpSpent + sumTp(opts.selectedIds, opts.tpOf),
      opts.tpLimit,
      opts.tpOf(key),
    )
  ) {
    return { ok: false, reason: 'tp' };
  }

  let warn: InnateSelectionWarnReason | undefined;
  if (energy == null || energy < 0 || energy > opts.threshold) {
    warn = 'threshold';
  } else if (sumResolvedEnergy(nextIds, opts.energyOf) > opts.energyMax) {
    warn = 'energy';
  }

  return warn ? { ok: true, nextIds, warn } : { ok: true, nextIds };
}
