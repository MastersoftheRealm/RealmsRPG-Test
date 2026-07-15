/**
 * Layer 1 path-recommended equipment candidates per guided phase.
 */

import type { PathItemRecommendation } from '@/types/archetype';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import {
  rankWeaponCandidates,
  type EligibleEquipmentRow,
  type EquipmentPhase,
} from '@/lib/guided-creator/equipment-eligibility';
import { catalogRowForRef } from '@/lib/guided-creator/equipment-catalog-rows';
import { resolvePoolItemCategory } from '@/lib/guided-creator/loadout-tp';
import type { AbilityName } from '@/types';

function normalizeId(id: string): string {
  return String(id).trim().toLowerCase();
}

function rowMatchesPhase(row: EligibleEquipmentRow, phase: EquipmentPhase): boolean {
  const t = row.type.toLowerCase();
  if (phase === 'weapon') return t === 'weapon' || t === 'shield';
  if (phase === 'armor') return t === 'armor';
  if (phase === 'gear') {
    return t === 'equipment' || t === 'item' || t === 'consumable' || t === 'tool';
  }
  return false;
}

export function filterPoolToPhase(
  pool: PathItemRecommendation[],
  phase: EquipmentPhase,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): PathItemRecommendation[] {
  return pool.filter((ref) => {
    const category = resolvePoolItemCategory(ref, officialItems, codexEquipment);
    if (phase === 'weapon') return category === 'weapon';
    if (phase === 'armor') return category === 'armor';
    if (phase === 'gear') return category === 'equipment';
    return false;
  });
}

export function pathRecommendedIdSet(
  pool: PathItemRecommendation[],
  phase: EquipmentPhase,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): Set<string> {
  const ids = new Set<string>();
  for (const ref of filterPoolToPhase(pool, phase, officialItems, codexEquipment)) {
    ids.add(normalizeId(ref.id));
  }
  return ids;
}

function rowsForPool(
  pool: PathItemRecommendation[],
  catalog: Map<string, EligibleEquipmentRow>
): EligibleEquipmentRow[] {
  const seen = new Set<string>();
  const out: EligibleEquipmentRow[] = [];
  for (const ref of pool) {
    const key = normalizeId(ref.id);
    if (seen.has(key)) continue;
    const row = catalogRowForRef(ref.id, catalog);
    if (!row) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** Fields needed to rank L1 weapon cards — not L2 eligibility (ability/TP/currency). */
export type PhaseL1RankContext = {
  pathRecommendedIds?: Set<string>;
  martAbil?: AbilityName | null;
  powAbil?: AbilityName | null;
};

/**
 * Path L1 cards are always shown (no ability/TP eligibility filter — that is L2).
 * Currently selected ids that resolve in catalog stay visible so selection and grid stay in sync.
 */
export function getPhaseL1Candidates(
  pool: PathItemRecommendation[],
  phase: EquipmentPhase,
  catalog: Map<string, EligibleEquipmentRow>,
  rankCtx: PhaseL1RankContext,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  selectedIds: string[] = []
): EligibleEquipmentRow[] {
  const phasePool = filterPoolToPhase(pool, phase, officialItems, codexEquipment);
  const byId = new Map<string, EligibleEquipmentRow>();

  for (const row of rowsForPool(phasePool, catalog)) {
    byId.set(normalizeId(row.id), row);
  }

  for (const id of selectedIds) {
    const key = normalizeId(id);
    if (!key || byId.has(key)) continue;
    const row = catalogRowForRef(id, catalog);
    if (!row || !rowMatchesPhase(row, phase)) continue;
    byId.set(key, row);
  }

  const rows = [...byId.values()];
  if (phase === 'weapon') {
    return rankWeaponCandidates(rows, rankCtx);
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}
