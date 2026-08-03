/**
 * Shared power/technique card display helpers for guided L1 + L2 browse.
 * Loadout-style disclosure (TASK-470): title-adjacent Training Points;
 * mechanic facts (Action Type, Energy) as See more desc chips.
 * Innate L1 cards use the same TP title chip (TASK-573); Energy stays in detail.
 */

import { logClientError } from '@/lib/api-client';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import {
  actionTypeFactChip,
  energyFactChip,
  formatActionTypeValue,
  trainingPointsFactChip,
} from '@/lib/detail-option/compact-facts';
import { derivePowerDisplay, type PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay, type TechniqueDocument } from '@/lib/calculators/technique-calc';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';

export type PowersTechniquesKind = 'powers' | 'techniques';

export interface PowerTechniqueCardFacts {
  name: string;
  description?: string;
  /** Title-adjacent budget descriptors (Training Points only). */
  titleChips: ChipData[];
  /**
   * See more mechanic facts: Action Type (value-only) + Energy.
   * Never under the disclosure row; never title-adjacent Action Type.
   */
  detailChips: ChipData[];
  /** @deprecated Prefer detailChips Energy; kept empty for Loadout parity. */
  tagline?: string;
  tpCost: number;
  /** Energy cost when known (filter / innate gate). */
  energy?: number;
  /** Capitalized Action Type value for filters (without "Action Type" prefix). */
  actionType?: string;
}

export function resolvePowerTechniqueTpCost(
  kind: PowersTechniquesKind,
  item: LibraryPower | LibraryTechnique | undefined,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[]
): number {
  if (!item) return 0;
  try {
    if (kind === 'techniques') {
      const tech = item as LibraryTechnique;
      const doc: TechniqueDocument = {
        name: String(tech.name ?? ''),
        description: String(tech.description ?? ''),
        parts: tech.parts ?? [],
        actionType: tech.actionType,
        weapon: tech.weapon?.name ? { name: tech.weapon.name } : undefined,
      };
      return Math.max(0, Math.round(deriveTechniqueDisplay(doc, techniquePartsDb).tp ?? 0));
    }
    const power = item as LibraryPower;
    const doc: PowerDocument = {
      name: String(power.name ?? ''),
      description: String(power.description ?? ''),
      parts: power.parts ?? [],
    };
    return Math.max(0, Math.round(derivePowerDisplay(doc, powerPartsDb).tp ?? 0));
  } catch (err) {
    logClientError(
      `power-technique-display: TP cost failed (${kind}, ${item?.name ?? 'unknown'})`,
      err
    );
    return 0;
  }
}

/** Energy cost for catalog filters / innate threshold (0 when unknown). */
export function resolvePowerTechniqueEnergy(
  kind: PowersTechniquesKind,
  item: LibraryPower | LibraryTechnique | undefined,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[]
): number | undefined {
  if (!item) return undefined;
  try {
    if (kind === 'techniques') {
      const tech = item as LibraryTechnique;
      const doc: TechniqueDocument = {
        name: String(tech.name ?? ''),
        description: String(tech.description ?? ''),
        parts: tech.parts ?? [],
        actionType: tech.actionType,
        weapon: tech.weapon?.name ? { name: tech.weapon.name } : undefined,
      };
      const energy = deriveTechniqueDisplay(doc, techniquePartsDb).energy;
      return typeof energy === 'number' ? energy : undefined;
    }
    const power = item as LibraryPower;
    const doc: PowerDocument = {
      name: String(power.name ?? ''),
      description: String(power.description ?? ''),
      parts: power.parts ?? [],
    };
    const energy = derivePowerDisplay(doc, powerPartsDb).energy;
    return typeof energy === 'number' ? energy : undefined;
  } catch (err) {
    logClientError(
      `power-technique-display: energy cost failed (${kind}, ${item?.name ?? 'unknown'})`,
      err
    );
    return undefined;
  }
}

export function buildPowerTechniqueCardFacts(
  kind: PowersTechniquesKind,
  item: LibraryPower | LibraryTechnique | undefined,
  fallbackId: string,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[]
): PowerTechniqueCardFacts {
  const name = item?.name ? String(item.name) : fallbackId;
  const description = item?.description ? String(item.description) : undefined;
  const tpCost = resolvePowerTechniqueTpCost(kind, item, powerPartsDb, techniquePartsDb);
  const titleChips: ChipData[] = [];
  const detailChips: ChipData[] = [];

  if (!item) {
    const tpChip = trainingPointsFactChip(tpCost);
    if (tpChip) titleChips.push(tpChip);
    return { name, description, titleChips, detailChips, tpCost };
  }

  try {
    if (kind === 'techniques') {
      const tech = item as LibraryTechnique;
      const doc: TechniqueDocument = {
        name: String(tech.name ?? ''),
        description: String(tech.description ?? ''),
        parts: tech.parts ?? [],
        actionType: tech.actionType,
        weapon: tech.weapon?.name ? { name: tech.weapon.name } : undefined,
      };
      const disp = deriveTechniqueDisplay(doc, techniquePartsDb);
      const rawAction = disp.actionType ?? tech.actionType;
      const actionChip = actionTypeFactChip(rawAction);
      if (actionChip) detailChips.push(actionChip);
      const energy =
        typeof disp.energy === 'number' ? Math.max(0, Math.floor(disp.energy)) : undefined;
      pushBudgetChips(titleChips, detailChips, tpCost, energy);
      return {
        name,
        description,
        titleChips,
        detailChips,
        tpCost,
        energy,
        actionType: formatActionTypeValue(rawAction),
      };
    }

    const power = item as LibraryPower;
    const doc: PowerDocument = {
      name: String(power.name ?? ''),
      description: String(power.description ?? ''),
      parts: power.parts ?? [],
    };
    const disp = derivePowerDisplay(doc, powerPartsDb);
    const rawAction = disp.actionType ?? (power as { actionType?: string }).actionType;
    const actionChip = actionTypeFactChip(rawAction);
    if (actionChip) detailChips.push(actionChip);
    const energy =
      typeof disp.energy === 'number' ? Math.max(0, Math.floor(disp.energy)) : undefined;
    pushBudgetChips(titleChips, detailChips, tpCost, energy);
    return {
      name,
      description,
      titleChips,
      detailChips,
      tpCost,
      energy,
      actionType: formatActionTypeValue(rawAction),
    };
  } catch (err) {
    logClientError(
      `power-technique-display: card facts failed (${kind}, ${name})`,
      err
    );
    const tpChip = trainingPointsFactChip(tpCost);
    if (tpChip) titleChips.push(tpChip);
    return { name, description, titleChips, detailChips, tpCost };
  }
}

function pushBudgetChips(
  titleChips: ChipData[],
  detailChips: ChipData[],
  tpCost: number,
  energy: number | undefined
): void {
  const tpChip = trainingPointsFactChip(tpCost);
  if (tpChip) titleChips.push(tpChip);
  const energyChip = energyFactChip(energy);
  if (energyChip) detailChips.push(energyChip);
}

/** Filter helper — capitalized Action Type value (no "Action Type" prefix). */
export function resolvePowerTechniqueActionType(
  kind: PowersTechniquesKind,
  item: LibraryPower | LibraryTechnique,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[]
): string | undefined {
  return buildPowerTechniqueCardFacts(kind, item, itemId(item), powerPartsDb, techniquePartsDb)
    .actionType;
}

function itemId(item: LibraryPower | LibraryTechnique): string {
  return String(item.id ?? item.docId ?? item.name ?? '');
}
