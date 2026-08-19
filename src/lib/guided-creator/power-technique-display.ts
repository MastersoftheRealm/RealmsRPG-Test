/**
 * Shared power/technique card display helpers for guided L1 + L2 browse.
 * Loadout-style disclosure (TASK-470): title-adjacent Training Points;
 * mechanic facts (Action Type, Energy) as See more desc chips.
 * Innate L1 cards use the same TP title chip (TASK-573); Energy stays in detail.
 *
 * Display shaping lives in `library-selectable-builders` (TASK-691).
 */

import { logClientError } from '@/lib/api-client';
import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import { trainingPointsFactChip } from '@/lib/detail-option/compact-facts';
import { pickHighestEnergyCost, type EnergyCostPick } from '@/lib/game/formulas';
import { buildLookup } from '@/lib/guided-creator/powers-techniques-step-helpers';
import {
  buildPowerTechniqueBudgetDisplay,
  type PowerTechniqueBudgetKind,
} from '@/lib/library-selectable-builders';
import { normalizeId } from '@/lib/utils/normalize-id';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';

export type PowersTechniquesKind = 'powers' | 'techniques';

export interface PowerTechniqueCardFacts {
  name: string;
  description?: string | undefined;
  /** Title-adjacent budget descriptors (Training Points only). */
  titleChips: ChipData[];
  /**
   * See more mechanic facts: Action Type (value-only) + Energy.
   * Never under the disclosure row; never title-adjacent Action Type.
   */
  detailChips: ChipData[];
  /** @deprecated Prefer detailChips Energy; kept empty for Loadout parity. */
  tagline?: string | undefined;
  tpCost: number;
  /** Energy cost when known (filter / innate gate). */
  energy?: number | undefined;
  /** Capitalized Action Type value for filters (without "Action Type" prefix). */
  actionType?: string | undefined;
}

function toBudgetKind(kind: PowersTechniquesKind): PowerTechniqueBudgetKind {
  return kind === 'techniques' ? 'technique' : 'power';
}

export function resolvePowerTechniqueTpCost(
  kind: PowersTechniquesKind,
  item: LibraryPower | LibraryTechnique | undefined,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
): number {
  if (!item) return 0;
  try {
    return buildPowerTechniqueBudgetDisplay(
      toBudgetKind(kind),
      item,
      String(item.id ?? item.docId ?? item.name ?? ''),
      powerPartsDb,
      techniquePartsDb,
    ).tp;
  } catch (err) {
    logClientError(
      `power-technique-display: TP cost failed (${kind}, ${item?.name ?? 'unknown'})`,
      err,
    );
    return 0;
  }
}

/** Energy cost for catalog filters / innate threshold (undefined when unknown). */
export function resolvePowerTechniqueEnergy(
  kind: PowersTechniquesKind,
  item: LibraryPower | LibraryTechnique | undefined,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
): number | undefined {
  if (!item) return undefined;
  try {
    return buildPowerTechniqueBudgetDisplay(
      toBudgetKind(kind),
      item,
      String(item.id ?? item.docId ?? item.name ?? ''),
      powerPartsDb,
      techniquePartsDb,
    ).energy;
  } catch (err) {
    logClientError(
      `power-technique-display: energy cost failed (${kind}, ${item?.name ?? 'unknown'})`,
      err,
    );
    return undefined;
  }
}

export function buildPowerTechniqueCardFacts(
  kind: PowersTechniquesKind,
  item: LibraryPower | LibraryTechnique | undefined,
  fallbackId: string,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
): PowerTechniqueCardFacts {
  if (!item) {
    const titleChips: ChipData[] = [];
    const tpChip = trainingPointsFactChip(0);
    if (tpChip) titleChips.push(tpChip);
    return {
      name: fallbackId,
      description: undefined,
      titleChips,
      detailChips: [],
      tpCost: 0,
    };
  }

  try {
    const display = buildPowerTechniqueBudgetDisplay(
      toBudgetKind(kind),
      item,
      fallbackId,
      powerPartsDb,
      techniquePartsDb,
    );
    return {
      name: display.name,
      description: display.description,
      titleChips: display.titleChips,
      detailChips: display.detailChips,
      tpCost: display.tp,
      energy: display.energy,
      actionType: display.actionTypeFilter,
    };
  } catch (err) {
    const name = item?.name ? String(item.name) : fallbackId;
    const description = item?.description ? String(item.description) : undefined;
    logClientError(`power-technique-display: card facts failed (${kind}, ${name})`, err);
    const titleChips: ChipData[] = [];
    const tpChip = trainingPointsFactChip(0);
    if (tpChip) titleChips.push(tpChip);
    return { name, description, titleChips, detailChips: [], tpCost: 0 };
  }
}

/** Filter helper — capitalized Action Type value (no "Action Type" prefix). */
export function resolvePowerTechniqueActionType(
  kind: PowersTechniquesKind,
  item: LibraryPower | LibraryTechnique,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
): string | undefined {
  return buildPowerTechniqueCardFacts(kind, item, itemId(item), powerPartsDb, techniquePartsDb)
    .actionType;
}

function itemId(item: LibraryPower | LibraryTechnique): string {
  return String(item.id ?? item.docId ?? item.name ?? '');
}

function toEnergyCostPick(
  kind: 'power' | 'technique',
  item: LibraryPower | LibraryTechnique | undefined,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
): EnergyCostPick | null {
  const catalogKind: PowersTechniquesKind = kind === 'technique' ? 'techniques' : 'powers';
  const energy = resolvePowerTechniqueEnergy(catalogKind, item, powerPartsDb, techniquePartsDb);
  if (typeof energy !== 'number') return null;
  const name =
    typeof item?.name === 'string' && item.name.trim()
      ? item.name.trim()
      : kind === 'technique'
        ? 'Technique'
        : 'Power';
  return { name, energy, kind };
}

/**
 * Highest Energy-cost Power/Technique among selected ids (incl. innates) and/or
 * already-resolved library rows (Advanced finalize).
 */
export function findHighestEnergyCostPick(args: {
  powerIds?: Iterable<string> | undefined;
  techniqueIds?: Iterable<string> | undefined;
  powers?: Array<LibraryPower | undefined> | undefined;
  techniques?: Array<LibraryTechnique | undefined> | undefined;
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
}): EnergyCostPick | null {
  const picks: EnergyCostPick[] = [];
  const powerByKey = buildLookup((args.powers ?? []).filter((p): p is LibraryPower => !!p));
  const techniqueByKey = buildLookup(
    (args.techniques ?? []).filter((t): t is LibraryTechnique => !!t),
  );

  const consider = (
    kind: 'power' | 'technique',
    item: LibraryPower | LibraryTechnique | undefined,
  ) => {
    const pick = toEnergyCostPick(kind, item, args.powerPartsDb, args.techniquePartsDb);
    if (pick) picks.push(pick);
  };

  for (const id of args.powerIds ?? []) {
    consider('power', powerByKey.get(normalizeId(id)));
  }
  for (const id of args.techniqueIds ?? []) {
    consider('technique', techniqueByKey.get(normalizeId(id)));
  }
  if (!args.powerIds) {
    for (const item of args.powers ?? []) consider('power', item);
  }
  if (!args.techniqueIds) {
    for (const item of args.techniques ?? []) consider('technique', item);
  }

  return pickHighestEnergyCost(picks);
}
