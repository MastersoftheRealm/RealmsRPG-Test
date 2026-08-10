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
import {
  deriveAgilityReductionFromProperties,
  deriveCriticalRangeIncreaseFromProperties,
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
  formatRange,
} from '@/lib/calculators';
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
import {
  deriveAbilityRequirementFromProperties,
} from '@/lib/game/weapon-attack-ability';
import { formatAbilityRequirementFact } from '@/lib/detail-option/compact-facts';
import { resolveArmorDamageReduction } from '@/lib/game/resolve-armor-damage-reduction';
import {
  armamentRowColumns,
  normalizeArmamentKind,
  type OfficialItemRow,
} from '@/lib/library/official-item-list';
import { formatListCellLabel, normalizeId } from '@/lib/utils';

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

function rarityDisplay(row: EligibleEquipmentRow): string {
  return formatListCellLabel(row.rarity ?? 'common') || 'Common';
}

function abilityRequirementDisplay(row: EligibleEquipmentRow): string {
  const req =
    row.abilityRequirement ??
    deriveAbilityRequirementFromProperties(row.properties);
  if (!req?.name?.trim() || req.level == null || Number.isNaN(Number(req.level))) {
    return '-';
  }
  const fact = formatAbilityRequirementFact({
    name: req.name.trim(),
    level: Number(req.level),
  });
  if (!fact) return '-';
  return fact.replace(/ Requirement /, ' ');
}

function rangeDisplay(row: EligibleEquipmentRow): string {
  if (row.range?.trim()) return row.range.trim();
  const fromProps = formatRange((row.properties ?? []) as ItemPropertyPayload[]);
  return fromProps || '-';
}

/** Build OfficialItemRow so Guided reuses `armamentRowColumns` (TASK-688 cleanup). */
function toOfficialItemRowForGuided(
  row: EligibleEquipmentRow,
  unitCost: number,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): OfficialItemRow {
  const props = (row.properties ?? []) as ItemPropertyPayload[];
  const lib = libraryRowForRef(row.id, officialItems, codexEquipment);
  const official = officialItems.find((i) => normalizeId(String(i.id)) === normalizeId(row.id));
  const armor = armorStatsForRef(row.id, officialItems, codexEquipment);
  const agility =
    armor.agilityPenalty != null && armor.agilityPenalty > 0
      ? armor.agilityPenalty
      : official && typeof official.agilityReduction === 'number'
        ? official.agilityReduction
        : deriveAgilityReductionFromProperties(props);
  const crit =
    official && typeof official.criticalRangeIncrease === 'number'
      ? official.criticalRangeIncrease
      : deriveCriticalRangeIncreaseFromProperties(props);
  const block = deriveShieldAmountFromProperties(props);
  const shieldDamage =
    deriveShieldDamageFromProperties(props) ??
    (typeof (lib as CodexEquipmentItem | undefined)?.damage === 'string'
      ? String((lib as CodexEquipmentItem).damage)
      : null);
  const weaponDamage = weaponDamageLineForRef(row.id, officialItems, codexEquipment) ?? '-';
  const kind = normalizeArmamentKind(row.type);
  const damageReduction =
    armor.damageReduction != null && armor.damageReduction > 0
      ? armor.damageReduction
      : official
        ? resolveArmorDamageReduction(official)
        : 0;
  const description =
    lib && 'description' in lib ? String(lib.description ?? '').trim() : '';

  return {
    id: row.id,
    raw: (official as LibraryItem) ?? {
      id: row.id,
      docId: row.id,
      name: row.name,
      type: row.type,
      properties: row.properties ?? [],
    },
    name: row.name,
    description,
    type: formatListCellLabel(row.type),
    rarity: rarityDisplay(row),
    currency: unitCost,
    tp: row.trainingPoints ?? 0,
    range: rangeDisplay(row),
    damage: kind === 'shield' ? shieldDamage || '-' : weaponDamage,
    damageReduction,
    agilityReduction: agility > 0 ? agility : 0,
    abilityRequirement: abilityRequirementDisplay(row),
    abilityReq: row.abilityRequirement ?? null,
    criticalRangeIncrease: crit > 0 ? crit : 0,
    block: block !== '-' ? block : '-',
    parts: [],
  };
}

/**
 * Guided L2/L3 columns — weapon/armor via shared `armamentRowColumns`.
 * Mixed weapon+shield phase keeps weapon headers; shields put Block in Damage.
 */
function buildL2Columns(
  phase: EquipmentPhase,
  row: EligibleEquipmentRow,
  unitCost: number,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): NonNullable<SelectableItem['columns']> {
  if (phase === 'gear') {
    return [
      { key: 'rarity', label: 'Rarity', value: rarityDisplay(row), align: 'center' },
      { key: 'currency', label: 'Currency', value: String(unitCost), align: 'center' },
    ];
  }

  const officialRow = toOfficialItemRowForGuided(
    row,
    unitCost,
    officialItems,
    codexEquipment
  );
  const kind = normalizeArmamentKind(row.type);

  if (phase === 'armor') {
    return armamentRowColumns(officialRow, 'armor');
  }

  // Weapon phase (weapons + shields)
  const cols = armamentRowColumns(officialRow, 'weapon');
  if (kind === 'shield') {
    const blockLabel =
      officialRow.block !== '-' ? `Block ${officialRow.block}` : 'Shield';
    return cols.map((c) =>
      c.key === 'damage' ? { ...c, value: blockLabel } : c
    );
  }
  return cols;
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
      abilityRequirement: row.abilityRequirement,
    });

    /** Expand chips match card See more, minus facts already shown as labeled columns. */
    const expandChips = stats.detailChips.filter((c) => {
      const n = c.name.toLowerCase();
      if (/^currency\s/.test(n) || /^training points\s/.test(n)) return false;
      if (/^rarity\b/.test(n)) return false;
      if (phase === 'weapon' && /\bdamage\b/.test(n) && /\dd\d/.test(n)) return false;
      if (phase === 'weapon' && /^range\b/.test(n)) return false;
      if (phase === 'armor' && /^damage reduction\b/.test(n)) return false;
      if (phase === 'armor' && /^agility reduction\b/.test(n)) return false;
      if (phase === 'armor' && /requirement\s+\d+\+/i.test(n)) return false;
      if (phase === 'armor' && /critical range/i.test(n)) return false;
      return true;
    });
    const detailSections =
      expandChips.length > 0
        ? [{ label: 'Details', chips: expandChips, hideLabelIfSingle: true as const }]
        : undefined;

    const columns = buildL2Columns(phase, row, unitCost, officialItems, codexEquipment);

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

/** Current draft refs for a phase — shared by modal Confirm and inline immediate apply (TASK-684). */
export function currentRefsForPhase(
  phase: EquipmentPhase,
  draft: GuidedDraft
): PathItemRecommendation[] {
  return phase === 'weapon'
    ? draft.loadoutWeapons
    : phase === 'armor'
      ? draft.loadoutArmor
      : draft.equipment;
}

export function initialSelectedIdsForPhase(
  phase: EquipmentPhase,
  draft: GuidedDraft
): Set<string> {
  return new Set(currentRefsForPhase(phase, draft).map((r) => String(r.id)));
}

function selectedToRefs(selected: SelectableItem[]): PathItemRecommendation[] {
  return selected.map((item) => {
    const data = item.data as GuidedEquipmentL2ItemData;
    const qty = (item as SelectableItem & { quantity?: number }).quantity ?? 1;
    return { id: data.ref.id, quantity: qty };
  });
}

function refCurrency(
  ref: PathItemRecommendation,
  catalog: Map<string, EligibleEquipmentRow>
): number {
  const row = catalog.get(normalizeId(ref.id));
  return resolveCatalogRowUnitCost(row) * Math.max(1, ref.quantity);
}

function computeRefsTpSpent(
  refs: PathItemRecommendation[],
  catalog: Map<string, EligibleEquipmentRow>
): number {
  return refs.reduce((sum, ref) => sum + refTp(ref, catalog), 0);
}

function computeRefsGearSpend(
  refs: PathItemRecommendation[],
  catalog: Map<string, EligibleEquipmentRow>
): number {
  return refs.reduce((sum, ref) => sum + refCurrency(ref, catalog), 0);
}

/** Cross-phase TP total (the two phases *not* being edited) — added to the edited phase's refs. */
export function crossPhaseTpSpent(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  catalog: Map<string, EligibleEquipmentRow>
): number {
  if (phase === 'weapon') return computeRefsTpSpent(draft.loadoutArmor, catalog);
  if (phase === 'armor') return computeRefsTpSpent(draft.loadoutWeapons, catalog);
  return 0;
}

export function computeL2TpSpent(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  selected: SelectableItem[],
  catalog: Map<string, EligibleEquipmentRow>
): number {
  return (
    crossPhaseTpSpent(phase, draft, catalog) + computeRefsTpSpent(selectedToRefs(selected), catalog)
  );
}

export function computeL2GearSpend(selected: SelectableItem[]): number {
  return selected.reduce((sum, item) => {
    const data = item.data as GuidedEquipmentL2ItemData | undefined;
    const qty = (item as SelectableItem & { quantity?: number }).quantity ?? 1;
    return sum + resolveCatalogRowUnitCost(data?.row) * Math.max(1, qty);
  }, 0);
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
    const armor = computeRefsGearSpend(draft.loadoutArmor, catalog);
    const gear = computeRefsGearSpend(draft.equipment, catalog);
    return selectedSpend + armor + gear;
  }
  if (phase === 'armor') {
    const weapons = computeRefsGearSpend(draft.loadoutWeapons, catalog);
    const gear = computeRefsGearSpend(draft.equipment, catalog);
    return weapons + selectedSpend + gear;
  }
  const arms =
    computeRefsGearSpend(draft.loadoutWeapons, catalog) +
    computeRefsGearSpend(draft.loadoutArmor, catalog);
  return arms + selectedSpend;
}

export interface ApplyL2Result {
  ok: boolean;
  message?: string;
  partial?: Partial<GuidedDraft>;
}

/**
 * Core validated-apply — hand-slot rules, TP limit, gear budget — shared by the L2 modal's
 * batch Confirm (`applyGuidedEquipmentL2Selection`) and the L3 inline catalog's immediate
 * toggle/quantity handlers (`toggleGuidedEquipmentL2Ref` / `changeGuidedEquipmentL2Quantity`),
 * so eligibility/budget rules never diverge between modal and inline (TASK-684).
 */
export function applyGuidedEquipmentL2Refs(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  refs: PathItemRecommendation[],
  catalog: Map<string, EligibleEquipmentRow>,
  tpLimit: number,
  gearBudget: number
): ApplyL2Result {
  if (phase === 'weapon') {
    const rows = refs
      .map((r) => catalog.get(normalizeId(r.id)))
      .filter((r): r is EligibleEquipmentRow => Boolean(r));
    const handCheck = validateWeaponHandSelection(rows);
    if (!handCheck.valid) {
      return { ok: false, message: handCheck.message };
    }
    const tpSpent = crossPhaseTpSpent(phase, draft, catalog) + computeRefsTpSpent(refs, catalog);
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
    const tpSpent = crossPhaseTpSpent(phase, draft, catalog) + computeRefsTpSpent(refs, catalog);
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

  const gearSpend = computeRefsGearSpend(refs, catalog);
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

export function applyGuidedEquipmentL2Selection(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  selected: SelectableItem[],
  catalog: Map<string, EligibleEquipmentRow>,
  tpLimit: number,
  gearBudget: number
): ApplyL2Result {
  return applyGuidedEquipmentL2Refs(
    phase,
    draft,
    selectedToRefs(selected),
    catalog,
    tpLimit,
    gearBudget
  );
}

/**
 * Immediate select/deselect for the L3 inline catalog (TASK-684) — armor is single-slot
 * (selecting a new one swaps it); weapon/gear append. Runs the same validated-apply as the
 * modal's Confirm so hand-slot rules and TP/currency budgets stay in lockstep.
 */
export function toggleGuidedEquipmentL2Ref(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  id: string,
  catalog: Map<string, EligibleEquipmentRow>,
  tpLimit: number,
  gearBudget: number
): ApplyL2Result {
  const current = currentRefsForPhase(phase, draft);
  const idNorm = normalizeId(id);
  const exists = current.some((r) => normalizeId(r.id) === idNorm);
  const nextRefs: PathItemRecommendation[] = exists
    ? current.filter((r) => normalizeId(r.id) !== idNorm)
    : phase === 'armor'
      ? [{ id, quantity: 1 }]
      : [...current, { id, quantity: 1 }];
  return applyGuidedEquipmentL2Refs(phase, draft, nextRefs, catalog, tpLimit, gearBudget);
}

/**
 * Immediate quantity +/- for the L3 inline catalog gear phase (TASK-684) — mirrors the
 * modal's `handleQuantityChange` delta semantics (clamped 0–99; 0 removes the row).
 */
export function changeGuidedEquipmentL2Quantity(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  id: string,
  delta: number,
  catalog: Map<string, EligibleEquipmentRow>,
  tpLimit: number,
  gearBudget: number
): ApplyL2Result {
  const current = currentRefsForPhase(phase, draft);
  const idNorm = normalizeId(id);
  const existing = current.find((r) => normalizeId(r.id) === idNorm);
  const next = Math.max(0, Math.min(99, (existing?.quantity ?? 0) + delta));

  if (next <= 0) {
    const nextRefs = current.filter((r) => normalizeId(r.id) !== idNorm);
    return applyGuidedEquipmentL2Refs(phase, draft, nextRefs, catalog, tpLimit, gearBudget);
  }

  const nextRefs = existing
    ? current.map((r) => (normalizeId(r.id) === idNorm ? { ...r, quantity: next } : r))
    : [...current, { id, quantity: next }];
  return applyGuidedEquipmentL2Refs(phase, draft, nextRefs, catalog, tpLimit, gearBudget);
}
