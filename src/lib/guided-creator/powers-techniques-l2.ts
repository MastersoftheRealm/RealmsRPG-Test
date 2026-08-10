/**
 * Guided powers/techniques Layer 2 — UnifiedSelectionModal items + confirm apply.
 * Regular catalog: Energy ≤ theoretical L1 max (TASK-463).
 * Innate catalog: Energy ≤ Innate Threshold (TASK-471 soft / TASK-472).
 *
 * Row display from `buildPowerTechniqueBudgetDisplay` (library-selectable-builders, TASK-691).
 * Guided-only: innate / max-EN orchestration + Path badges + TP costLabel.
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { type PowersTechniquesKind } from '@/lib/guided-creator/power-technique-display';
import { buildPowerTechniqueBudgetDisplay } from '@/lib/library-selectable-builders';
import {
  calculateGuidedL1TheoreticalMaxEnergy,
  isGuidedL2EnergyAllowed,
  type GuidedL1MaxEnergyInput,
} from '@/lib/guided-creator/powers-techniques-energy-filter';
import { normalizeId } from '@/lib/utils';
import { TRAINING_POINTS_COST_LABEL } from '@/lib/detail-option/compact-facts';

export type PowersTechniquesL2Mode = 'regular' | 'innate';

export const POWERS_TECHNIQUES_L2_HEADER_COLUMNS = [
  { key: 'name', label: 'Name', align: 'left' as const, sortable: true },
  { key: 'action', label: 'Action Type', align: 'center' as const, sortable: true },
  { key: 'energy', label: 'Energy', align: 'center' as const, sortable: true },
  { key: 'tp', label: 'Training Points', align: 'center' as const, sortable: true },
];

export const POWERS_TECHNIQUES_L2_GRID = '1.6fr 1fr 0.7fr 0.9fr';

function itemId(item: LibraryPower | LibraryTechnique): string {
  return String(item.id ?? item.docId ?? item.name ?? '').trim();
}

function pathRecommendedSet(ids: string[]): Set<string> {
  const set = new Set<string>();
  for (const id of ids) {
    const key = normalizeId(id);
    if (key) set.add(key);
  }
  return set;
}

function toBudgetKind(kind: PowersTechniquesKind) {
  return kind === 'techniques' ? 'technique' : 'power';
}

export function buildPowersTechniquesL2Items(opts: {
  kind: PowersTechniquesKind;
  mode: PowersTechniquesL2Mode;
  items: Array<LibraryPower | LibraryTechnique>;
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
  /** Path L1 ids (for Path badge). */
  pathRecommendedIds: string[];
  energyInput: GuidedL1MaxEnergyInput;
  /** Innate mode: max Energy per pick (Innate Threshold). */
  innateThreshold?: number;
}): SelectableItem[] {
  const {
    kind,
    mode,
    items,
    powerPartsDb,
    techniquePartsDb,
    pathRecommendedIds,
    energyInput,
    innateThreshold = 0,
  } = opts;

  const pathSet = pathRecommendedSet(pathRecommendedIds);
  const maxEnergy =
    mode === 'regular' ? calculateGuidedL1TheoreticalMaxEnergy(energyInput) : null;
  const budgetKind = toBudgetKind(kind);

  const rows: SelectableItem[] = [];
  for (const item of items) {
    const id = itemId(item);
    if (!id) continue;

    const display = buildPowerTechniqueBudgetDisplay(
      budgetKind,
      item,
      id,
      powerPartsDb,
      techniquePartsDb
    );
    const energy = display.energy;
    if (mode === 'regular') {
      if (!isGuidedL2EnergyAllowed(energy, maxEnergy)) continue;
    } else {
      // Innate: must have known Energy ≤ threshold
      if (energy == null || energy > innateThreshold) continue;
    }

    const chips: ChipData[] = [...display.detailChips, ...display.titleChips];

    const isPath =
      pathSet.has(normalizeId(id)) || pathSet.has(normalizeId(String(item.name ?? '')));

    rows.push({
      id,
      name: display.name,
      description: display.description,
      columns: display.columns,
      chips: chips.length > 0 ? chips : undefined,
      // Innate and regular both spend shared Training Points (TASK-573).
      totalCost: display.tp,
      costLabel: TRAINING_POINTS_COST_LABEL,
      badges: isPath ? [{ label: 'Path', color: 'blue' }] : undefined,
      data: { kind, energy, tpCost: display.tp },
    });
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

/** Map selected modal rows to draft id list (canonical catalog ids). */
export function selectedIdsFromL2Items(selected: SelectableItem[]): string[] {
  return selected.map((row) => String(row.id)).filter(Boolean);
}

export function computeL2PowersTechniquesTpSpent(
  selected: SelectableItem[],
  loadoutTpSpent: number
): number {
  const combat = selected.reduce((sum, row) => {
    const data = row.data as { tpCost?: number } | undefined;
    return sum + Math.max(0, Math.floor(data?.tpCost ?? row.totalCost ?? 0));
  }, 0);
  return loadoutTpSpent + combat;
}
