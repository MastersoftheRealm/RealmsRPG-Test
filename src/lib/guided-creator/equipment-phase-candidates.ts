/**
 * Layer 1 path-recommended equipment candidates per guided phase.
 */

import type { PathItemRecommendation } from '@/types/archetype';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import {
  filterEligibleEquipment,
  rankWeaponCandidates,
  type EligibleEquipmentRow,
  type EquipmentEligibilityContext,
  type EquipmentPhase,
} from '@/lib/guided-creator/equipment-eligibility';
import { catalogRowForRef } from '@/lib/guided-creator/equipment-catalog-rows';
import { resolvePoolItemCategory } from '@/lib/guided-creator/loadout-tp';

function normalizeId(id: string): string {
  return String(id).trim().toLowerCase();
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

export function getPhaseL1Candidates(
  pool: PathItemRecommendation[],
  phase: EquipmentPhase,
  catalog: Map<string, EligibleEquipmentRow>,
  ctx: EquipmentEligibilityContext,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): EligibleEquipmentRow[] {
  const phasePool = filterPoolToPhase(pool, phase, officialItems, codexEquipment);
  const rows = rowsForPool(phasePool, catalog);
  const eligible = filterEligibleEquipment(rows, { ...ctx, phase });
  if (phase === 'weapon') {
    return rankWeaponCandidates(eligible, ctx);
  }
  return [...eligible].sort((a, b) => a.name.localeCompare(b.name));
}
