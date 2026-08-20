'use client';

import { useCallback, useMemo, useState } from 'react';
import { cn, normalizeId } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ValueStepper } from '@/components/patterns';
import type { PathItemRecommendation } from '@/types/archetype';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import type { GuidedDraft, GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import { GuidedChoiceCard } from './guided-choice-card';
import { GuidedFactChipRow } from './guided-equipment-fact-chips';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from './guided-choice-styles';
import { GUIDED_CHOICE_GRID_ITEM_CLASS } from './guided-choice-styles';

import {
  armorStatsForRef,
  libraryRowForRef,
  weaponDamageLineForRef,
} from '@/lib/guided-creator/equipment-catalog-rows';
import {
  filterPoolToPhase,
  getPhaseL1Candidates,
  pathRecommendedIdSet,
} from '@/lib/guided-creator/equipment-phase-candidates';
import { validateWeaponHandSelection } from '@/lib/guided-creator/equipment-eligibility';
import { buildEquipmentPhaseCardStats } from '@/lib/guided-creator/equipment-phase-stats';
import {
  resolveCatalogRowUnitCost,
  wouldExceedCurrency,
} from '@/lib/guided-creator/equipment-currency';
import {
  addAllRecommendedEquipment,
  addItemToGuidedDraft,
  removeItemFromGuidedDraft,
  setItemQuantityInGuidedDraft,
} from '@/lib/guided-creator/loadout-pool';
import { wouldExceedLoadoutTp } from '@/lib/guided-creator/loadout-tp';
import { useGuidedEquipmentCatalog } from '@/hooks/use-guided-equipment-catalog';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;

function isSelectedInPhase(
  phase: GuidedEquipmentPhase,
  draft: GuidedDraft,
  itemId: string,
): boolean {
  const key = normalizeId(itemId);
  if (phase === 'weapon') {
    return draft.loadoutWeapons.some((w) => normalizeId(w.id) === key);
  }
  if (phase === 'armor') {
    return draft.loadoutArmor.some((a) => normalizeId(a.id) === key);
  }
  return draft.equipment.some((e) => normalizeId(e.id) === key);
}

function selectedQuantity(phase: GuidedEquipmentPhase, draft: GuidedDraft, itemId: string): number {
  const key = normalizeId(itemId);
  const list =
    phase === 'weapon'
      ? draft.loadoutWeapons
      : phase === 'armor'
        ? draft.loadoutArmor
        : draft.equipment;
  return list.find((r) => normalizeId(r.id) === key)?.quantity ?? 1;
}

export interface GuidedEquipmentL1PhaseProps {
  phase: GuidedEquipmentPhase;
  draft: GuidedDraft;
  pool: PathItemRecommendation[];
  officialItems: LibraryItem[];
  codexEquipment: CodexEquipmentItem[];
  armorOptional?: boolean | undefined;
  /** Remaining Currency after arms + current gear (PointStatus). */
  currencyRemaining: number;
  onDraftChange: (partial: Partial<GuidedDraft>) => void;
}

export function GuidedEquipmentL1Phase({
  phase,
  draft,
  pool,
  officialItems,
  codexEquipment,
  armorOptional = false,
  currencyRemaining,
  onDraftChange,
}: GuidedEquipmentL1PhaseProps) {
  const copy = phaseCopy[`${phase}Phase` as 'weaponPhase' | 'armorPhase' | 'gearPhase'];
  const { catalog, itemProperties, rules } = useGuidedEquipmentCatalog(
    draft,
    officialItems,
    codexEquipment,
  );
  const [handMessage, setHandMessage] = useState<string | null>(null);

  const pathRecommendedIds = useMemo(
    () => pathRecommendedIdSet(pool, phase, officialItems, codexEquipment),
    [pool, phase, officialItems, codexEquipment],
  );

  const recommendedGearRefs = useMemo(
    () => filterPoolToPhase(pool, 'gear', officialItems, codexEquipment),
    [pool, officialItems, codexEquipment],
  );

  /** L1 ranks by path/attack ability only — full eligibility (ability/TP/currency) stays L2. */
  const rankCtx = useMemo(
    () => ({
      pathRecommendedIds,
      martAbil: draft.mart_abil,
      powAbil: draft.pow_abil,
    }),
    [pathRecommendedIds, draft.mart_abil, draft.pow_abil],
  );

  const selectedIds = useMemo(() => {
    if (phase === 'weapon') return draft.loadoutWeapons.map((w) => w.id);
    if (phase === 'armor') return draft.loadoutArmor.map((a) => a.id);
    return draft.equipment.map((e) => e.id);
  }, [phase, draft.loadoutWeapons, draft.loadoutArmor, draft.equipment]);

  const candidates = useMemo(
    () =>
      getPhaseL1Candidates(
        pool,
        phase,
        catalog,
        rankCtx,
        officialItems,
        codexEquipment,
        selectedIds,
      ),
    [pool, phase, catalog, rankCtx, officialItems, codexEquipment, selectedIds],
  );

  const allRecommendedSelected =
    phase === 'gear' &&
    recommendedGearRefs.length > 0 &&
    recommendedGearRefs.every((ref) =>
      draft.equipment.some((e) => normalizeId(e.id) === normalizeId(ref.id)),
    );

  const toggleSelection = useCallback(
    (ref: PathItemRecommendation) => {
      setHandMessage(null);
      const selected = isSelectedInPhase(phase, draft, ref.id);

      if (selected) {
        const next = removeItemFromGuidedDraft(draft, ref.id);
        onDraftChange({ ...next });
        return;
      }

      if (phase !== 'gear') {
        if (
          wouldExceedLoadoutTp(draft, ref, officialItems, codexEquipment, itemProperties, rules)
        ) {
          setHandMessage(
            phase === 'armor' ? phaseCopy.armorPhase.tpBlocked : phaseCopy.weaponPhase.tpBlocked,
          );
          return;
        }
      }

      const unitCost = resolveCatalogRowUnitCost(catalog.get(normalizeId(ref.id)));
      const qty = Math.max(1, ref.quantity ?? 1);
      if (wouldExceedCurrency(currencyRemaining, unitCost, qty)) {
        setHandMessage(
          phase === 'armor'
            ? phaseCopy.armorPhase.currencyBlocked
            : phase === 'weapon'
              ? phaseCopy.weaponPhase.currencyBlocked
              : phaseCopy.gearPhase.currencyBlocked,
        );
        return;
      }

      if (phase === 'armor') {
        const cleared = {
          ...draft,
          loadoutArmor: [],
          armaments: draft.loadoutWeapons,
        };
        const next = addItemToGuidedDraft(cleared, ref, 'armor');
        onDraftChange({ ...next });
        return;
      }

      if (phase === 'weapon') {
        const nextDraft = addItemToGuidedDraft(draft, ref, 'weapon');
        const nextRows = nextDraft.loadoutWeapons
          .map((w) => catalog.get(normalizeId(w.id)))
          .filter((r): r is NonNullable<typeof r> => Boolean(r));
        const handCheck = validateWeaponHandSelection(nextRows);
        if (!handCheck.valid) {
          setHandMessage(handCheck.message ?? phaseCopy.weaponPhase.handBlocked);
          return;
        }
        onDraftChange({ ...nextDraft });
        return;
      }

      const next = addItemToGuidedDraft(draft, ref, 'equipment');
      onDraftChange({ ...next });
    },
    [
      phase,
      draft,
      onDraftChange,
      officialItems,
      codexEquipment,
      itemProperties,
      rules,
      catalog,
      currencyRemaining,
    ],
  );

  const handleQuantityChange = useCallback(
    (ref: PathItemRecommendation, quantity: number) => {
      const qty = Math.max(1, quantity);
      const unitCost = resolveCatalogRowUnitCost(catalog.get(normalizeId(ref.id)));
      const currentQty = selectedQuantity(phase, draft, ref.id);
      const deltaCost = unitCost * (qty - currentQty);
      if (deltaCost > 0 && deltaCost > currencyRemaining) {
        setHandMessage(
          phase === 'armor'
            ? phaseCopy.armorPhase.currencyBlocked
            : phase === 'weapon'
              ? phaseCopy.weaponPhase.currencyBlocked
              : phaseCopy.gearPhase.currencyBlocked,
        );
        return;
      }
      const category = phase === 'weapon' ? 'weapon' : phase === 'armor' ? 'armor' : 'equipment';
      const next = setItemQuantityInGuidedDraft(draft, ref.id, qty, category);
      onDraftChange({ ...next });
    },
    [draft, onDraftChange, phase, catalog, currencyRemaining],
  );

  const handleAddAllRecommended = useCallback(() => {
    let remaining = currencyRemaining;
    const affordable: PathItemRecommendation[] = [];
    for (const ref of recommendedGearRefs) {
      const key = normalizeId(ref.id);
      if (draft.equipment.some((e) => normalizeId(e.id) === key)) continue;
      const unitCost = resolveCatalogRowUnitCost(catalog.get(key));
      const qty = Math.max(1, ref.quantity ?? 1);
      const line = unitCost * qty;
      if (line > remaining) continue;
      affordable.push(ref);
      remaining -= line;
    }
    if (
      affordable.length === 0 &&
      recommendedGearRefs.some((ref) => {
        const key = normalizeId(ref.id);
        return !draft.equipment.some((e) => normalizeId(e.id) === key);
      })
    ) {
      setHandMessage(phaseCopy.gearPhase.currencyBlocked);
      return;
    }
    const next = addAllRecommendedEquipment(draft, affordable);
    onDraftChange({ ...next });
  }, [draft, onDraftChange, recommendedGearRefs, catalog, currencyRemaining]);

  const handleUnarmored = useCallback(() => {
    onDraftChange({ loadoutArmor: [] });
  }, [onDraftChange]);

  if (candidates.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-card border border-border-light bg-surface-alt/40 px-4 py-5 dark:border-border">
          <p className="font-display text-base font-semibold text-text-primary">
            {copy.emptyTitle}
          </p>
          <p className="mt-1 font-nunito text-sm text-text-secondary">{copy.emptyDescription}</p>
        </div>
        {phase === 'armor' && armorOptional ? (
          <Button type="button" variant="secondary" onClick={handleUnarmored} className="min-h-11">
            {phaseCopy.skipArmorLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {handMessage ? (
        <p className="font-nunito text-sm text-warning-fg" role="status">
          {handMessage}
        </p>
      ) : null}

      {phase === 'gear' && recommendedGearRefs.length > 0 ? (
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddAllRecommended}
          disabled={allRecommendedSelected}
          className="min-h-11"
        >
          {phaseCopy.gearPhase.addAllRecommended}
        </Button>
      ) : null}

      <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS} role="list">
        {candidates.map((row) => {
          const poolRef = pool.find((p) => normalizeId(p.id) === normalizeId(row.id));
          const ref: PathItemRecommendation = poolRef ?? {
            id: row.id,
            quantity: 1,
          };
          const selected = isSelectedInPhase(phase, draft, row.id);
          const libraryRow = libraryRowForRef(row.id, officialItems, codexEquipment);
          const unitCost = resolveCatalogRowUnitCost(row);
          const description =
            libraryRow && 'description' in libraryRow
              ? String(libraryRow.description ?? '').trim() || undefined
              : undefined;

          let stats = buildEquipmentPhaseCardStats({ category: 'equipment' });
          if (phase === 'weapon') {
            stats = buildEquipmentPhaseCardStats({
              category: 'weapon',
              properties: row.properties,
              damageLine: weaponDamageLineForRef(row.id, officialItems, codexEquipment),
              unitCost,
              trainingPoints: row.trainingPoints,
              abilityRequirement: row.abilityRequirement,
              itemProperties,
              storedRange: row.range,
            });
          } else if (phase === 'armor') {
            const armorStats = armorStatsForRef(row.id, officialItems, codexEquipment);
            stats = buildEquipmentPhaseCardStats({
              category: 'armor',
              properties: row.properties,
              damageReduction: armorStats.damageReduction,
              agilityPenalty: armorStats.agilityPenalty,
              unitCost,
              trainingPoints: row.trainingPoints,
              itemProperties,
            });
          } else {
            stats = buildEquipmentPhaseCardStats({
              category: 'equipment',
              unitCost,
              trainingPoints: row.trainingPoints,
            });
          }

          const qty = selectedQuantity(phase, draft, row.id);

          return (
            <div key={row.id} className={cn(GUIDED_CHOICE_GRID_ITEM_CLASS)} role="listitem">
              <GuidedChoiceCard
                density="compact"
                imageKind="equipment"
                imageLayout="hero"
                imageRecord={libraryRow}
                title={row.name}
                description={description}
                hideTagsWhenExpanded
                selected={selected}
                onSelect={() => toggleSelection(ref)}
                selectAriaLabel={`${selected ? 'Deselect' : 'Select'} ${row.name}`}
                titleMeta={
                  stats.titleChips.length > 0 ? (
                    <GuidedFactChipRow chips={stats.titleChips} />
                  ) : undefined
                }
                expandedExtra={
                  stats.detailChips.length > 0 ? (
                    <GuidedFactChipRow chips={stats.detailChips} />
                  ) : undefined
                }
                beforeDisclosure={
                  phase === 'gear' && selected ? (
                    <div
                      className="flex items-center gap-2"
                      role="group"
                      aria-label={`Quantity for ${row.name}`}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <span
                        className="shrink-0 font-nunito text-sm text-text-secondary"
                        aria-hidden="true"
                      >
                        Quantity
                      </span>
                      <ValueStepper
                        value={qty}
                        min={1}
                        max={99}
                        size="sm"
                        variant="inline"
                        onChange={(next) => handleQuantityChange(ref, next)}
                        decrementTitle={`Decrease quantity for ${row.name}`}
                        incrementTitle={`Increase quantity for ${row.name}`}
                      />
                    </div>
                  ) : undefined
                }
              />
            </div>
          );
        })}
      </div>

      {phase === 'armor' && armorOptional && draft.loadoutArmor.length === 0 ? (
        <Button type="button" variant="secondary" onClick={handleUnarmored} className="min-h-11">
          {phaseCopy.skipArmorLabel}
        </Button>
      ) : null}
    </div>
  );
}
