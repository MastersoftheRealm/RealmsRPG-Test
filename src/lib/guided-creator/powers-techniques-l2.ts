/**
 * Guided powers/techniques Layer 2 — UnifiedSelectionModal items + confirm apply.
 * Regular catalog: Energy ≤ theoretical L1 max (TASK-463).
 * Innate catalog: Energy ≤ Innate Threshold (TASK-471 soft / TASK-472).
 *
 * Row columns/expand match Official Library GLR (`buildOfficialPowerRows` /
 * `buildOfficialTechniqueRows`) — TASK-709. Guided-only: innate / max-EN
 * orchestration + TP totalCost. Path-name chips come from `applyLivePathFilter`.
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { type PowersTechniquesKind } from '@/lib/guided-creator/power-technique-display';
import { buildPowerTechniqueFilterableRow } from '@/lib/library-selectable-builders';
import {
  buildOfficialPowerRows,
  officialPowerRowColumns,
  OFFICIAL_POWER_GRID,
  OFFICIAL_POWER_HEADER_COLUMNS,
} from '@/lib/library/official-power-list';
import {
  buildOfficialTechniqueRows,
  officialTechniqueRowColumns,
  OFFICIAL_TECHNIQUE_GRID,
  OFFICIAL_TECHNIQUE_HEADER_COLUMNS,
} from '@/lib/library/official-technique-list';
import { partsProficienciesSection } from '@/lib/chip/list-row-metadata';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import {
  applyPowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import {
  calculateGuidedL1TheoreticalMaxEnergy,
  isGuidedL2EnergyAllowed,
  type GuidedL1MaxEnergyInput,
} from '@/lib/guided-creator/powers-techniques-energy-filter';
import { TRAINING_POINTS_COST_LABEL } from '@/lib/detail-option/compact-facts';
import type { PathRecommendationKind } from '@/lib/game/archetype-path';

export type PowersTechniquesL2Mode = 'regular' | 'innate';

/** Live path-filter bag for this L2/L3 screen (innate uses `innatePowers`, not the powers union). */
export function pathRecommendationKindForL2(
  kind: PowersTechniquesKind,
  mode: PowersTechniquesL2Mode
): PathRecommendationKind {
  if (mode === 'innate') return 'innatePowers';
  return kind === 'techniques' ? 'techniques' : 'powers';
}

function toSelectableHeaders(
  headers: ReadonlyArray<{ key: string; label: string; align?: 'left' | 'center' | 'right' }>
) {
  return headers.map((h) => ({
    key: h.key,
    label: h.label,
    align: (h.align ?? 'center') as 'left' | 'center' | 'right',
    sortable: true,
  }));
}

export const GUIDED_POWERS_L2_HEADER_COLUMNS = toSelectableHeaders(OFFICIAL_POWER_HEADER_COLUMNS);
export const GUIDED_POWERS_L2_GRID = OFFICIAL_POWER_GRID;
export const GUIDED_TECHNIQUES_L2_HEADER_COLUMNS = toSelectableHeaders(
  OFFICIAL_TECHNIQUE_HEADER_COLUMNS
);
export const GUIDED_TECHNIQUES_L2_GRID = OFFICIAL_TECHNIQUE_GRID;

export function powersTechniquesL2Headers(kind: PowersTechniquesKind) {
  return kind === 'techniques'
    ? GUIDED_TECHNIQUES_L2_HEADER_COLUMNS
    : GUIDED_POWERS_L2_HEADER_COLUMNS;
}

export function powersTechniquesL2Grid(kind: PowersTechniquesKind) {
  return kind === 'techniques' ? GUIDED_TECHNIQUES_L2_GRID : GUIDED_POWERS_L2_GRID;
}

function itemId(item: LibraryPower | LibraryTechnique): string {
  return String(item.id ?? item.docId ?? item.name ?? '').trim();
}

function toBudgetKind(kind: PowersTechniquesKind) {
  return kind === 'techniques' ? 'technique' : 'power';
}

function numericEnergy(value: string | number | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === 'string' && value.trim() !== '' && value !== '-') {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  }
  return undefined;
}

function energyAllowed(
  energy: number | undefined,
  mode: PowersTechniquesL2Mode,
  maxEnergy: number | null,
  innateThreshold: number
): boolean {
  if (mode === 'regular') {
    return isGuidedL2EnergyAllowed(energy, maxEnergy);
  }
  if (energy == null) return false;
  return energy <= innateThreshold;
}

export function buildPowersTechniquesL2Items(opts: {
  kind: PowersTechniquesKind;
  mode: PowersTechniquesL2Mode;
  items: Array<LibraryPower | LibraryTechnique>;
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
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
    energyInput,
    innateThreshold = 0,
  } = opts;

  const maxEnergy =
    mode === 'regular' ? calculateGuidedL1TheoreticalMaxEnergy(energyInput) : null;
  const budgetKind = toBudgetKind(kind);

  const rows: SelectableItem[] = [];

  if (kind === 'techniques') {
    const officialRows = buildOfficialTechniqueRows(items as LibraryTechnique[], techniquePartsDb);
    for (const row of officialRows) {
      const id = row.id || itemId(row.raw);
      if (!id) continue;
      const energy = numericEnergy(row.energy);
      if (!energyAllowed(energy, mode, maxEnergy, innateThreshold)) continue;

      const section = partsProficienciesSection(row.parts, 'technique');

      rows.push({
        id,
        name: row.name,
        description: row.description,
        columns: officialTechniqueRowColumns(row),
        detailSections: section ? [section] : undefined,
        thumbnail: resolveListRowThumbnail('technique', row.raw, row.name),
        totalCost: row.tp,
        costLabel: TRAINING_POINTS_COST_LABEL,
        data: { kind, energy, tpCost: row.tp },
        powerTechniqueFilter: buildPowerTechniqueFilterableRow(
          budgetKind,
          row.raw,
          powerPartsDb,
          techniquePartsDb
        ),
      });
    }
  } else {
    const officialRows = buildOfficialPowerRows(items as LibraryPower[], powerPartsDb);
    for (const row of officialRows) {
      const id = row.id || itemId(row.raw);
      if (!id) continue;
      const energy = numericEnergy(row.energy);
      if (!energyAllowed(energy, mode, maxEnergy, innateThreshold)) continue;

      const section = partsProficienciesSection(row.parts, 'power');

      rows.push({
        id,
        name: row.name,
        description: row.description,
        columns: officialPowerRowColumns(row),
        detailSections: section ? [section] : undefined,
        thumbnail: resolveListRowThumbnail('power', row.raw, row.name),
        totalCost: row.tp,
        costLabel: TRAINING_POINTS_COST_LABEL,
        data: { kind, energy, tpCost: row.tp },
        powerTechniqueFilter: buildPowerTechniqueFilterableRow(
          budgetKind,
          row.raw,
          powerPartsDb,
          techniquePartsDb
        ),
      });
    }
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function filterPowersTechniquesL2ByPtFilters(
  items: SelectableItem[],
  filters: PowerTechniqueFilterState,
  kind: PowersTechniquesKind
): SelectableItem[] {
  const filterKind = kind === 'techniques' ? 'technique' : 'power';
  return items.filter((item) => {
    const row = item.powerTechniqueFilter;
    if (!row) return true;
    return applyPowerTechniqueFilters([row], filters, filterKind, null).length > 0;
  });
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
