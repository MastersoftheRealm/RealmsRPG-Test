/**
 * Guided powers/techniques Layer 2 — UnifiedSelectionModal items + confirm apply.
 * Regular catalog: Energy ≤ theoretical L1 max (TASK-463).
 * Innate catalog: Energy ≤ Innate Threshold (TASK-471 soft / TASK-472).
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import {
  buildPowerTechniqueCardFacts,
  resolvePowerTechniqueEnergy,
  type PowersTechniquesKind,
} from '@/lib/guided-creator/power-technique-display';
import {
  calculateGuidedL1TheoreticalMaxEnergy,
  isGuidedL2EnergyAllowed,
  type GuidedL1MaxEnergyInput,
} from '@/lib/guided-creator/powers-techniques-energy-filter';
import { formatActionTypeValue } from '@/lib/detail-option/compact-facts';
import { normalizeId } from '@/lib/utils';
import { TRAINING_POINTS_COST_LABEL } from '@/lib/detail-option/compact-facts';

export type PowersTechniquesL2Mode = 'regular' | 'innate';

export const POWERS_TECHNIQUES_L2_HEADER_COLUMNS = [
  { key: 'name', label: 'Name', align: 'left' as const, sortable: false },
  { key: 'action', label: 'Action Type', align: 'center' as const, sortable: false },
  { key: 'energy', label: 'Energy', align: 'center' as const, sortable: false },
  { key: 'tp', label: 'Training Points', align: 'center' as const, sortable: false },
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

  const rows: SelectableItem[] = [];
  for (const item of items) {
    const id = itemId(item);
    if (!id) continue;

    const energy = resolvePowerTechniqueEnergy(kind, item, powerPartsDb, techniquePartsDb);
    if (mode === 'regular') {
      if (!isGuidedL2EnergyAllowed(energy, maxEnergy)) continue;
    } else {
      // Innate: must have known Energy ≤ threshold
      if (energy == null || energy > innateThreshold) continue;
    }

    const facts = buildPowerTechniqueCardFacts(
      kind,
      item,
      id,
      powerPartsDb,
      techniquePartsDb,
      mode === 'innate' ? 'energy' : 'training-points'
    );
    const actionValue = facts.actionType ?? formatActionTypeValue(
      kind === 'techniques'
        ? (item as LibraryTechnique).actionType
        : (item as { actionType?: string }).actionType
    );

    const chips: ChipData[] = [...facts.detailChips];
    // Budget chip also in expand for parity with equipment L2 factChips
    chips.push(...facts.titleChips);

    const isPath = pathSet.has(normalizeId(id)) || pathSet.has(normalizeId(String(item.name ?? '')));

    rows.push({
      id,
      name: facts.name,
      description: facts.description,
      columns: [
        { key: 'action', value: actionValue ?? '—', align: 'center' },
        {
          key: 'energy',
          value: energy != null ? String(energy) : '—',
          align: 'center',
        },
        { key: 'tp', value: String(facts.tpCost), align: 'center' },
      ],
      chips: chips.length > 0 ? chips : undefined,
      totalCost: mode === 'regular' ? facts.tpCost : energy ?? 0,
      costLabel: mode === 'regular' ? TRAINING_POINTS_COST_LABEL : 'Energy',
      badges: isPath ? [{ label: 'Path', color: 'blue' }] : undefined,
      data: { kind, energy, tpCost: facts.tpCost },
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
