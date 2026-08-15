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
import { deriveShieldDamageFromProperties, resolveWeaponRangeDisplay } from '@/lib/calculators';
import {
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
import { mergeLoadoutArmaments } from '@/lib/guided-creator/resolve-loadout-items';
import { resolveCatalogRowUnitCost } from '@/lib/guided-creator/equipment-currency';
import {
  armamentRowColumns,
  buildOfficialItemRows,
  normalizeArmamentKind,
  type OfficialItemRow,
} from '@/lib/library/official-item-list';
import { propertiesProficienciesSection } from '@/lib/chip/list-row-metadata';
import { formatListCellLabel, normalizeId } from '@/lib/utils';
import type { ItemProperty } from '@/hooks/codex-types';

export interface GuidedEquipmentL2ItemData {
  ref: PathItemRecommendation;
  category: 'weapon' | 'armor' | 'equipment';
  row: EligibleEquipmentRow;
}

export function pathRecommendationKindForEquipmentPhase(
  phase: EquipmentPhase,
): 'armaments' | 'equipment' {
  return phase === 'gear' ? 'equipment' : 'armaments';
}

function mapCategory(phase: EquipmentPhase): GuidedEquipmentL2ItemData['category'] {
  if (phase === 'armor') return 'armor';
  if (phase === 'gear') return 'equipment';
  return 'weapon';
}

function asLibraryItemType(type: string | undefined): LibraryItem['type'] {
  const t = String(type ?? '').toLowerCase();
  if (t === 'armor' || t === 'shield' || t === 'equipment') return t;
  return 'weapon';
}

function refTp(ref: PathItemRecommendation, catalog: Map<string, EligibleEquipmentRow>): number {
  const row = catalog.get(normalizeId(ref.id));
  return (row?.trainingPoints ?? 0) * Math.max(1, ref.quantity);
}

function itemDescription(
  rowId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
): string | undefined {
  const lib = libraryRowForRef(rowId, officialItems, codexEquipment);
  if (!lib || !('description' in lib)) return undefined;
  const text = String(lib.description ?? '').trim();
  return text || undefined;
}

function rarityDisplay(row: EligibleEquipmentRow): string {
  return formatListCellLabel(row.rarity ?? 'common') || 'Common';
}

/** Phase type labels — not taxonomy (Adventuring, Tools, …). */
const PHASE_IMPLIED_CATEGORY = new Set(['weapon', 'armor', 'shield', 'equipment', 'item', 'gear']);

/**
 * Gear Category cell: Codex taxonomy only. Blank when missing or when the
 * value just repeats the phase type (Weapon/Armor/Equipment).
 */
function taxonomyCategoryColumnValue(
  itemCategory: string | null | undefined,
  type: string | undefined,
): string {
  const raw = String(itemCategory ?? '').trim();
  if (!raw) return '-';
  const lower = raw.toLowerCase();
  if (PHASE_IMPLIED_CATEGORY.has(lower)) return '-';
  const typeLower = String(type ?? '')
    .trim()
    .toLowerCase();
  if (typeLower && lower === typeLower) return '-';
  return formatListCellLabel(raw);
}

function rangeDisplay(row: EligibleEquipmentRow): string {
  return resolveWeaponRangeDisplay(row.range, (row.properties ?? []) as ItemPropertyPayload[]);
}

function catalogRowAsLibraryItem(
  row: EligibleEquipmentRow,
  official: LibraryItem | undefined,
): LibraryItem {
  if (official) return official;
  return {
    id: row.id,
    docId: row.id,
    name: row.name,
    type: asLibraryItemType(row.type),
    properties: (row.properties ?? []) as LibraryItem['properties'],
    abilityRequirement: row.abilityRequirement ?? undefined,
  };
}

/** Official GLR row + catalog overlays (unit cost, TP, range, mixed-list damage). */
function toOfficialItemRowForGuided(
  row: EligibleEquipmentRow,
  unitCost: number,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[] = [],
): OfficialItemRow {
  const official = officialItems.find((i) => normalizeId(String(i.id)) === normalizeId(row.id));
  const kind = normalizeArmamentKind(row.type);
  const [built] = buildOfficialItemRows(
    [catalogRowAsLibraryItem(row, official)],
    itemProperties as ItemProperty[],
  );
  const lib = libraryRowForRef(row.id, officialItems, codexEquipment);
  const description =
    lib && 'description' in lib ? String(lib.description ?? '').trim() : (built?.description ?? '');
  const shieldDamage =
    deriveShieldDamageFromProperties((row.properties ?? []) as ItemPropertyPayload[]) ??
    (typeof (lib as CodexEquipmentItem | undefined)?.damage === 'string'
      ? String((lib as CodexEquipmentItem).damage)
      : null);
  const weaponDamage = weaponDamageLineForRef(row.id, officialItems, codexEquipment) ?? '-';

  return {
    ...(built as OfficialItemRow),
    id: row.id,
    name: row.name,
    description,
    rarity: rarityDisplay(row),
    currency: unitCost,
    tp: row.trainingPoints ?? 0,
    range: rangeDisplay(row),
    damage: kind === 'shield' ? shieldDamage || built?.damage || '-' : weaponDamage,
    abilityReq: row.abilityRequirement ?? built?.abilityReq ?? null,
  };
}

/**
 * Guided L2/L3 columns — weapon/armor via shared `armamentRowColumns`.
 * Mixed weapon+shield phase keeps weapon headers; shields put Block in Damage.
 * Gear adds Category (taxonomy); weapon/armor do not — type is implied by phase
 * and ARMAMENT_LIBRARY_CONFIG has no category column (TASK-724).
 */
function buildL2Columns(
  phase: EquipmentPhase,
  row: EligibleEquipmentRow,
  unitCost: number,
  officialRow: OfficialItemRow,
): NonNullable<SelectableItem['columns']> {
  if (phase === 'gear') {
    return [
      {
        key: 'category',
        label: 'Category',
        value: taxonomyCategoryColumnValue(row.itemCategory, row.type),
        align: 'center',
      },
      { key: 'rarity', label: 'Rarity', value: rarityDisplay(row), align: 'center' },
      { key: 'currency', label: 'Currency', value: String(unitCost), align: 'center' },
    ];
  }

  const kind = normalizeArmamentKind(row.type);

  if (phase === 'armor') {
    return armamentRowColumns(officialRow, 'armor');
  }

  // Weapon phase (weapons + shields)
  const cols = armamentRowColumns(officialRow, 'weapon');
  if (kind === 'shield') {
    const blockLabel = officialRow.block !== '-' ? `Block ${officialRow.block}` : 'Shield';
    return cols.map((c) => (c.key === 'damage' ? { ...c, value: blockLabel } : c));
  }
  return cols;
}

export function buildGuidedEquipmentL2Items(
  phase: EquipmentPhase,
  catalog: Map<string, EligibleEquipmentRow>,
  ctx: EquipmentEligibilityContext,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[] = [],
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
    const officialRow = toOfficialItemRowForGuided(
      row,
      unitCost,
      officialItems,
      codexEquipment,
      itemProperties,
    );
    const kind = normalizeArmamentKind(row.type);
    const family =
      phase === 'gear'
        ? 'item'
        : kind === 'armor'
          ? 'armor'
          : kind === 'shield'
            ? 'shield'
            : 'weapon';
    const propertySection = propertiesProficienciesSection(officialRow.parts, family);
    const detailSections = propertySection ? [propertySection] : undefined;
    const columns = buildL2Columns(phase, row, unitCost, officialRow);

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
  draft: GuidedDraft,
): PathItemRecommendation[] {
  return phase === 'weapon'
    ? draft.loadoutWeapons
    : phase === 'armor'
      ? draft.loadoutArmor
      : draft.equipment;
}

export function initialSelectedIdsForPhase(phase: EquipmentPhase, draft: GuidedDraft): Set<string> {
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
  catalog: Map<string, EligibleEquipmentRow>,
): number {
  const row = catalog.get(normalizeId(ref.id));
  return resolveCatalogRowUnitCost(row) * Math.max(1, ref.quantity);
}

function computeRefsTpSpent(
  refs: PathItemRecommendation[],
  catalog: Map<string, EligibleEquipmentRow>,
): number {
  return refs.reduce((sum, ref) => sum + refTp(ref, catalog), 0);
}

function computeRefsGearSpend(
  refs: PathItemRecommendation[],
  catalog: Map<string, EligibleEquipmentRow>,
): number {
  return refs.reduce((sum, ref) => sum + refCurrency(ref, catalog), 0);
}

/** Cross-phase TP total (the two phases *not* being edited) — added to the edited phase's refs. */
export function crossPhaseTpSpent(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  catalog: Map<string, EligibleEquipmentRow>,
): number {
  if (phase === 'weapon') return computeRefsTpSpent(draft.loadoutArmor, catalog);
  if (phase === 'armor') return computeRefsTpSpent(draft.loadoutWeapons, catalog);
  return 0;
}

/**
 * Cross-phase Currency total (the two phases *not* being edited) — the edited phase's own
 * spend is reclaimable because apply replaces that phase's refs wholesale.
 */
export function crossPhaseCurrencySpent(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  catalog: Map<string, EligibleEquipmentRow>,
): number {
  if (phase === 'weapon') {
    return (
      computeRefsGearSpend(draft.loadoutArmor, catalog) +
      computeRefsGearSpend(draft.equipment, catalog)
    );
  }
  if (phase === 'armor') {
    return (
      computeRefsGearSpend(draft.loadoutWeapons, catalog) +
      computeRefsGearSpend(draft.equipment, catalog)
    );
  }
  return (
    computeRefsGearSpend(draft.loadoutWeapons, catalog) +
    computeRefsGearSpend(draft.loadoutArmor, catalog)
  );
}

export function computeL2TpSpent(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  selected: SelectableItem[],
  catalog: Map<string, EligibleEquipmentRow>,
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
  catalog: Map<string, EligibleEquipmentRow>,
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

const CURRENCY_BLOCKED_MESSAGE: Record<EquipmentPhase, string> = {
  weapon: 'Not enough Currency remaining for this weapon selection',
  armor: 'Not enough Currency remaining for this armor',
  gear: 'Not enough Currency remaining for this gear',
};

/**
 * Core validated-apply — hand-slot rules, TP limit, Currency ceiling — shared by the L2
 * modal's batch Confirm (`applyGuidedEquipmentL2Selection`) and the L3 inline catalog's
 * immediate toggle/quantity handlers (`toggleGuidedEquipmentL2Ref` /
 * `changeGuidedEquipmentL2Quantity`), so eligibility/budget rules never diverge between
 * modal and inline (TASK-684).
 *
 * `currencyBudget` is the level-1 starting Currency and applies to all three phases: it used
 * to be a gear-only ceiling, which let weapons and armor spend past the budget and write a
 * negative balance onto the saved character (audit P1-1).
 */
export function applyGuidedEquipmentL2Refs(
  phase: EquipmentPhase,
  draft: GuidedDraft,
  refs: PathItemRecommendation[],
  catalog: Map<string, EligibleEquipmentRow>,
  tpLimit: number,
  currencyBudget: number,
): ApplyL2Result {
  const currencySpent =
    crossPhaseCurrencySpent(phase, draft, catalog) + computeRefsGearSpend(refs, catalog);
  if (currencySpent > currencyBudget) {
    return { ok: false, message: CURRENCY_BLOCKED_MESSAGE[phase] };
  }

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
  currencyBudget: number,
): ApplyL2Result {
  return applyGuidedEquipmentL2Refs(
    phase,
    draft,
    selectedToRefs(selected),
    catalog,
    tpLimit,
    currencyBudget,
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
  currencyBudget: number,
): ApplyL2Result {
  const current = currentRefsForPhase(phase, draft);
  const idNorm = normalizeId(id);
  const exists = current.some((r) => normalizeId(r.id) === idNorm);
  const nextRefs: PathItemRecommendation[] = exists
    ? current.filter((r) => normalizeId(r.id) !== idNorm)
    : phase === 'armor'
      ? [{ id, quantity: 1 }]
      : [...current, { id, quantity: 1 }];
  return applyGuidedEquipmentL2Refs(phase, draft, nextRefs, catalog, tpLimit, currencyBudget);
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
  currencyBudget: number,
): ApplyL2Result {
  const current = currentRefsForPhase(phase, draft);
  const idNorm = normalizeId(id);
  const existing = current.find((r) => normalizeId(r.id) === idNorm);
  const next = Math.max(0, Math.min(99, (existing?.quantity ?? 0) + delta));

  if (next <= 0) {
    const nextRefs = current.filter((r) => normalizeId(r.id) !== idNorm);
    return applyGuidedEquipmentL2Refs(phase, draft, nextRefs, catalog, tpLimit, currencyBudget);
  }

  const nextRefs = existing
    ? current.map((r) => (normalizeId(r.id) === idNorm ? { ...r, quantity: next } : r))
    : [...current, { id, quantity: next }];
  return applyGuidedEquipmentL2Refs(phase, draft, nextRefs, catalog, tpLimit, currencyBudget);
}
