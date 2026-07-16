/**
 * Layer 2 — full catalog items + apply selection to guided draft.
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import type { PathItemRecommendation } from '@/types/archetype';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import { deriveShieldAmountFromProperties } from '@/lib/calculators';
import {
  armorStatsForRef,
  libraryRowForRef,
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
import { resolveCatalogRowUnitCost } from '@/lib/guided-creator/equipment-currency';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { normalizeId } from '@/lib/utils';

export interface GuidedEquipmentL2ItemData {
  ref: PathItemRecommendation;
  category: 'weapon' | 'armor' | 'equipment';
  row: EligibleEquipmentRow;
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

function itemDescription(
  rowId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): string | undefined {
  const lib = libraryRowForRef(rowId, officialItems, codexEquipment);
  if (!lib || !('description' in lib)) return undefined;
  const text = String(lib.description ?? '').trim();
  return text || undefined;
}

function weaponDamageOrBlockDisplay(
  row: EligibleEquipmentRow,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): string {
  if (row.type.toLowerCase() === 'shield') {
    const block = deriveShieldAmountFromProperties(
      (row.properties ?? []) as ItemPropertyPayload[]
    );
    return block !== '-' ? `Block ${block}` : 'Shield';
  }
  return weaponDamageLineForRef(row.id, officialItems, codexEquipment) ?? '-';
}

export function buildGuidedEquipmentL2Items(
  phase: EquipmentPhase,
  catalog: Map<string, EligibleEquipmentRow>,
  ctx: EquipmentEligibilityContext,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[] = []
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
    const unitCost = resolveCatalogRowUnitCost(row);
    const description = itemDescription(row.id, officialItems, codexEquipment);
    const stats = buildEquipmentPhaseCardStats({
      category: phase === 'gear' ? 'equipment' : phase === 'armor' ? 'armor' : 'weapon',
      properties: row.properties,
      damageLine:
        phase === 'weapon'
          ? weaponDamageLineForRef(row.id, officialItems, codexEquipment)
          : undefined,
      damageReduction:
        phase === 'armor'
          ? armorStatsForRef(row.id, officialItems, codexEquipment).damageReduction
          : undefined,
      agilityPenalty:
        phase === 'armor'
          ? armorStatsForRef(row.id, officialItems, codexEquipment).agilityPenalty
          : undefined,
      unitCost,
      trainingPoints: phase === 'gear' ? undefined : row.trainingPoints,
      itemProperties,
    });

    /** Expand chips match card See more, minus facts already shown as labeled columns. */
    const expandChips = stats.detailChips.filter((c) => {
      const n = c.name.toLowerCase();
      if (/^currency\s/.test(n) || /^training points\s/.test(n)) return false;
      if (phase === 'weapon' && /\bdamage\b/.test(n) && /\dd\d/.test(n)) return false;
      if (phase === 'armor' && /^damage reduction\b/.test(n)) return false;
      return true;
    });
    const detailSections =
      expandChips.length > 0
        ? [{ label: 'Details', chips: expandChips, hideLabelIfSingle: true as const }]
        : undefined;

    let columns: NonNullable<SelectableItem['columns']>;
    if (phase === 'gear') {
      columns = [
        {
          key: 'currency',
          label: 'Currency',
          value: String(unitCost),
          align: 'right',
        },
      ];
    } else if (phase === 'armor') {
      const armor = armorStatsForRef(row.id, officialItems, codexEquipment);
      columns = [
        {
          key: 'dr',
          label: 'Damage Reduction',
          value: armor.damageReduction != null ? String(armor.damageReduction) : '-',
          align: 'center',
        },
        {
          key: 'currency',
          label: 'Currency',
          value: String(unitCost),
          align: 'right',
        },
        {
          key: 'tp',
          label: 'Training Points',
          value: row.trainingPoints ?? 0,
          align: 'center',
          highlight: true,
        },
      ];
    } else {
      columns = [
        {
          key: 'damage',
          label: 'Damage',
          value: weaponDamageOrBlockDisplay(row, officialItems, codexEquipment),
          align: 'center',
        },
        {
          key: 'currency',
          label: 'Currency',
          value: String(unitCost),
          align: 'right',
        },
        {
          key: 'tp',
          label: 'Training Points',
          value: row.trainingPoints ?? 0,
          align: 'center',
          highlight: true,
        },
      ];
    }

    return {
      id: row.id,
      name: row.name,
      description,
      columns,
      detailSections,
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
  return selected.reduce((sum, item) => {
    const data = item.data as GuidedEquipmentL2ItemData | undefined;
    const qty = (item as SelectableItem & { quantity?: number }).quantity ?? 1;
    return sum + resolveCatalogRowUnitCost(data?.row) * Math.max(1, qty);
  }, 0);
}

function refCurrency(
  ref: PathItemRecommendation,
  catalog: Map<string, EligibleEquipmentRow>
): number {
  const row = catalog.get(normalizeId(ref.id));
  return resolveCatalogRowUnitCost(row) * Math.max(1, ref.quantity);
}

/**
 * Preview Currency spent across all phases while L2 is open.
 * Current-phase draft spend is replaced by the live selection.
 */
export function computeL2CurrencySpent(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  selected: SelectableItem[],
  catalog: Map<string, EligibleEquipmentRow>
): number {
  const selectedSpend = computeL2GearSpend(selected);
  if (phase === 'weapon') {
    const armor = draft.loadoutArmor.reduce((sum, ref) => sum + refCurrency(ref, catalog), 0);
    const gear = draft.equipment.reduce((sum, ref) => sum + refCurrency(ref, catalog), 0);
    return selectedSpend + armor + gear;
  }
  if (phase === 'armor') {
    const weapons = draft.loadoutWeapons.reduce((sum, ref) => sum + refCurrency(ref, catalog), 0);
    const gear = draft.equipment.reduce((sum, ref) => sum + refCurrency(ref, catalog), 0);
    return weapons + selectedSpend + gear;
  }
  const arms =
    draft.loadoutWeapons.reduce((sum, ref) => sum + refCurrency(ref, catalog), 0) +
    draft.loadoutArmor.reduce((sum, ref) => sum + refCurrency(ref, catalog), 0);
  return arms + selectedSpend;
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
        armaments: mergeLoadoutArmaments({
          loadoutWeapons: draft.loadoutWeapons,
          loadoutArmor: refs,
        }),
      },
    };
  }

  const gearSpend = computeL2GearSpend(selected);
  if (gearSpend > gearBudget) {
    return { ok: false, message: 'Not enough Currency remaining for this gear' };
  }

  return {
    ok: true,
    partial: {
      equipment: refs,
    },
  };
}
