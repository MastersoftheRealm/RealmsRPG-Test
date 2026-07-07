/**
 * Layer 2 — full catalog items + apply selection to guided draft.
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import type { PathItemRecommendation } from '@/types/archetype';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import {
  armorStatsForRef,
  gearShortUseForRef,
  rowsForEquipmentPhase,
  weaponDamageLineForRef,
} from '@/lib/guided-creator/equipment-catalog-rows';
import {
  filterEligibleEquipment,
  ineligibilityReason,
  isEligibleForGuidedEquipmentL2,
  rankWeaponCandidates,
  validateWeaponHandSelection,
  type EligibleEquipmentRow,
  type EquipmentEligibilityContext,
  type EquipmentPhase,
} from '@/lib/guided-creator/equipment-eligibility';
import { buildEquipmentPhaseCardStats } from '@/lib/guided-creator/equipment-phase-stats';
import { mergeLoadoutArmaments } from '@/lib/guided-creator/resolve-loadout-items';
import {
  computeSpentCurrency,
  resolveItemUnitCost,
} from '@/lib/guided-creator/equipment-currency';

export interface GuidedEquipmentL2ItemData {
  ref: PathItemRecommendation;
  category: 'weapon' | 'armor' | 'equipment';
  row: EligibleEquipmentRow;
}

function normalizeId(id: string): string {
  return String(id).trim().toLowerCase();
}

function mapCategory(phase: EquipmentPhase): GuidedEquipmentL2ItemData['category'] {
  if (phase === 'armor') return 'armor';
  if (phase === 'gear') return 'equipment';
  return 'weapon';
}

function refTp(
  ref: PathItemRecommendation,
  catalog: Map<string, EligibleEquipmentRow>
): number {
  const row = catalog.get(normalizeId(ref.id));
  return (row?.trainingPoints ?? 0) * Math.max(1, ref.quantity);
}

export function buildGuidedEquipmentL2Items(
  phase: EquipmentPhase,
  catalog: Map<string, EligibleEquipmentRow>,
  ctx: EquipmentEligibilityContext,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): SelectableItem[] {
  const phaseRows = rowsForEquipmentPhase(catalog, phase);
  const eligible = filterEligibleEquipment(phaseRows, ctx);
  const ranked =
    phase === 'weapon'
      ? rankWeaponCandidates(eligible, ctx)
      : [...eligible].sort((a, b) => a.name.localeCompare(b.name));

  return ranked.map((row) => {
    const eligibleNow = isEligibleForGuidedEquipmentL2(row, ctx);
    const category = mapCategory(phase);
    const damageLine =
      phase === 'weapon' ? weaponDamageLineForRef(row.id, officialItems, codexEquipment) : undefined;
    const armorStats =
      phase === 'armor' ? armorStatsForRef(row.id, officialItems, codexEquipment) : {};
    const stats = buildEquipmentPhaseCardStats({
      category: phase === 'gear' ? 'equipment' : phase === 'armor' ? 'armor' : 'weapon',
      properties: row.properties,
      damageLine,
      damageReduction: armorStats.damageReduction,
      agilityPenalty: armorStats.agilityPenalty,
      shortUse:
        phase === 'gear'
          ? gearShortUseForRef(row.id, officialItems, codexEquipment)
          : undefined,
    });

    const unitCost = resolveItemUnitCost(row);
    const statsDisplay = stats.primaryLine ?? (stats.tags.join(', ') || '—');
    const columns =
      phase === 'gear'
        ? [
            {
              key: 'cost',
              label: 'Cost',
              value: `${unitCost}c`,
              align: 'right' as const,
            },
          ]
        : [
            {
              key: 'tp',
              label: 'TP',
              value: row.trainingPoints ?? 0,
              align: 'center' as const,
              highlight: true,
            },
            {
              key: 'stats',
              label: 'Stats',
              value: statsDisplay,
              align: 'right' as const,
            },
          ];

    return {
      id: row.id,
      name: row.name,
      description: stats.secondaryLine ?? stats.primaryLine,
      columns,
      chips: stats.tags.map((tag) => ({ name: tag, kind: 'descriptor' as const })),
      disabled: !eligibleNow,
      warningMessage: ineligibilityReason(row, ctx),
      data: {
        ref: { id: row.id, quantity: 1 },
        category,
        row,
      } satisfies GuidedEquipmentL2ItemData,
    };
  });
}

export function initialSelectedIdsForPhase(
  phase: EquipmentPhase,
  draft: GuidedDraft
): Set<string> {
  const refs =
    phase === 'weapon'
      ? draft.loadoutWeapons
      : phase === 'armor'
        ? draft.loadoutArmor
        : draft.equipment;
  return new Set(refs.map((r) => String(r.id)));
}

export function computeL2TpSpent(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  selected: SelectableItem[],
  catalog: Map<string, EligibleEquipmentRow>
): number {
  const crossPhaseTp =
    phase === 'weapon'
      ? draft.loadoutArmor.reduce((sum, ref) => sum + refTp(ref, catalog), 0)
      : phase === 'armor'
        ? draft.loadoutWeapons.reduce((sum, ref) => sum + refTp(ref, catalog), 0)
        : 0;

  const selectedTp = selected.reduce((sum, item) => {
    const data = item.data as GuidedEquipmentL2ItemData | undefined;
    const tp = data?.row.trainingPoints ?? 0;
    const qty = (item as SelectableItem & { quantity?: number }).quantity ?? 1;
    return sum + tp * qty;
  }, 0);

  return crossPhaseTp + selectedTp;
}

export function computeL2GearSpend(selected: SelectableItem[]): number {
  return computeSpentCurrency(
    selected.map((item) => {
      const data = item.data as GuidedEquipmentL2ItemData | undefined;
      const qty = (item as SelectableItem & { quantity?: number }).quantity ?? 1;
      return {
        cost: resolveItemUnitCost(data?.row ?? {}),
        quantity: qty,
      };
    })
  );
}

export interface ApplyL2Result {
  ok: boolean;
  message?: string;
  partial?: Partial<GuidedDraft>;
}

export function applyGuidedEquipmentL2Selection(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  selected: SelectableItem[],
  catalog: Map<string, EligibleEquipmentRow>,
  tpLimit: number,
  gearBudget: number
): ApplyL2Result {
  const refs: PathItemRecommendation[] = selected.map((item) => {
    const data = item.data as GuidedEquipmentL2ItemData;
    const qty = (item as SelectableItem & { quantity?: number }).quantity ?? 1;
    return { id: data.ref.id, quantity: qty };
  });

  if (phase === 'weapon') {
    const rows = refs
      .map((r) => catalog.get(normalizeId(r.id)))
      .filter((r): r is EligibleEquipmentRow => Boolean(r));
    const handCheck = validateWeaponHandSelection(rows);
    if (!handCheck.valid) {
      return { ok: false, message: handCheck.message };
    }
    const tpSpent = computeL2TpSpent(phase, draft, selected, catalog);
    if (tpSpent > tpLimit) {
      return { ok: false, message: 'Not enough Training Points remaining' };
    }
    return {
      ok: true,
      partial: {
        loadoutWeapons: refs,
        loadoutId: 'custom',
        armaments: mergeLoadoutArmaments({
          loadoutWeapons: refs,
          loadoutArmor: draft.loadoutArmor,
        }),
      },
    };
  }

  if (phase === 'armor') {
    const tpSpent = computeL2TpSpent(phase, draft, selected, catalog);
    if (tpSpent > tpLimit) {
      return { ok: false, message: 'Not enough Training Points remaining' };
    }
    return {
      ok: true,
      partial: {
        loadoutArmor: refs,
        loadoutId: 'custom',
        armaments: mergeLoadoutArmaments({
          loadoutWeapons: draft.loadoutWeapons,
          loadoutArmor: refs,
        }),
      },
    };
  }

  const gearSpend = computeL2GearSpend(selected);
  if (gearSpend > gearBudget) {
    return { ok: false, message: 'Not enough currency remaining for this gear' };
  }

  return {
    ok: true,
    partial: {
      equipment: refs,
      loadoutId: 'custom',
    },
  };
}
