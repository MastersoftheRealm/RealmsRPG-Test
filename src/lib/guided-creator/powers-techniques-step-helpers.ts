import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
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
  const map = new Map<string, GuidedPathLibraryRow>();
  items.forEach((item) => {
    const id = item.id != null ? String(item.id) : '';
    const name = item.name != null ? String(item.name) : '';
    if (id) map.set(id.toLowerCase(), item);
    if (name) map.set(name.toLowerCase(), item);
  });
  return map;
}

export function resolveLibraryItem(
  id: string,
  lookup: Map<string, GuidedPathLibraryRow>
): GuidedPathLibraryRow | undefined {
  return lookup.get(String(id).toLowerCase());
}

export function pickAffordableIds(
  ids: string[],
  costOf: (id: string) => number,
  alreadySpent: number,
  limit: number
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
  tpLimit: number
): string[] {
  const candidates = ids
    .map((id) => ({ id, energy: energyOf(id), tp: tpOf(id) }))
    .filter(
      (row): row is { id: string; energy: number; tp: number } =>
        row.energy != null && row.energy >= 0 && row.energy <= threshold
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
