'use client';

import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { PathItemRecommendation } from '@/types/archetype';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import type { GuidedDraft, GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import { GuidedChoiceCard } from './guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from './guided-choice-styles';
import { GUIDED_CHOICE_GRID_ITEM_CLASS } from './guided-choice-grid';
import {
  armorStatsForRef,
  gearShortUseForRef,
  libraryRowForRef,
  weaponDamageLineForRef,
} from '@/lib/guided-creator/equipment-catalog-rows';
import {
  getPhaseL1Candidates,
  pathRecommendedIdSet,
} from '@/lib/guided-creator/equipment-phase-candidates';
import { validateWeaponHandSelection } from '@/lib/guided-creator/equipment-eligibility';
import { buildEquipmentPhaseCardStats } from '@/lib/guided-creator/equipment-phase-stats';
import {
  addItemToGuidedDraft,
  removeItemFromGuidedDraft,
} from '@/lib/guided-creator/loadout-pool';
import { wouldExceedLoadoutTp } from '@/lib/guided-creator/loadout-tp';
import {
  buildGuidedEquipmentEligibilityContext,
  useGuidedEquipmentCatalog,
} from '@/hooks/use-guided-equipment-catalog';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;

function normalizeId(id: string): string {
  return String(id).trim().toLowerCase();
}

function isSelectedInPhase(
  phase: GuidedEquipmentPhase,
  draft: GuidedDraft,
  itemId: string
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

export interface GuidedEquipmentL1PhaseProps {
  phase: GuidedEquipmentPhase;
  draft: GuidedDraft;
  pool: PathItemRecommendation[];
  officialItems: LibraryItem[];
  codexEquipment: CodexEquipmentItem[];
  armorOptional?: boolean;
  currencyRemaining?: number;
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
  const { catalog, tpSummary, itemProperties, rules } = useGuidedEquipmentCatalog(
    draft,
    officialItems,
    codexEquipment
  );
  const [handMessage, setHandMessage] = useState<string | null>(null);

  const pathRecommendedIds = useMemo(
    () => pathRecommendedIdSet(pool, phase, officialItems, codexEquipment),
    [pool, phase, officialItems, codexEquipment]
  );

  const eligibilityCtx = useMemo(
    () =>
      buildGuidedEquipmentEligibilityContext(
        phase,
        draft,
        phase === 'gear' ? { spent: 0, limit: 0 } : tpSummary,
        pathRecommendedIds,
        phase === 'gear' ? currencyRemaining : undefined
      ),
    [phase, draft, tpSummary, pathRecommendedIds, currencyRemaining]
  );

  const candidates = useMemo(
    () =>
      getPhaseL1Candidates(
        pool,
        phase,
        catalog,
        eligibilityCtx,
        officialItems,
        codexEquipment
      ),
    [pool, phase, catalog, eligibilityCtx, officialItems, codexEquipment]
  );

  const toggleSelection = useCallback(
    (ref: PathItemRecommendation) => {
      setHandMessage(null);
      const selected = isSelectedInPhase(phase, draft, ref.id);

      if (selected) {
        const next = removeItemFromGuidedDraft(draft, ref.id);
        onDraftChange({ ...next, loadoutId: 'custom' });
        return;
      }

      if (phase !== 'gear') {
        if (
          wouldExceedLoadoutTp(
            draft,
            ref,
            officialItems,
            codexEquipment,
            itemProperties,
            rules
          )
        ) {
          setHandMessage(
            phase === 'armor' ? phaseCopy.armorPhase.tpBlocked : phaseCopy.weaponPhase.tpBlocked
          );
          return;
        }
      }

      if (phase === 'armor') {
        const cleared = {
          ...draft,
          loadoutArmor: [],
          armaments: draft.loadoutWeapons,
        };
        const next = addItemToGuidedDraft(cleared, ref, 'armor');
        onDraftChange({ ...next, loadoutId: 'custom' });
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
        onDraftChange({ ...nextDraft, loadoutId: 'custom' });
        return;
      }

      const next = addItemToGuidedDraft(draft, ref, 'equipment');
      onDraftChange({ ...next, loadoutId: 'custom' });
    },
    [phase, draft, onDraftChange, officialItems, codexEquipment, itemProperties, rules, catalog]
  );

  const handleUnarmored = useCallback(() => {
    onDraftChange({ loadoutArmor: [], loadoutId: 'custom' });
  }, [onDraftChange]);

  if (candidates.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-card border border-border-light bg-surface-alt/40 px-4 py-5 dark:border-border">
          <p className="font-display text-base font-semibold text-text-primary">{copy.emptyTitle}</p>
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
        <p className="font-nunito text-sm text-warning-700 dark:text-warning-400" role="status">
          {handMessage}
        </p>
      ) : null}

      <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS} role="list">
        {candidates.map((row) => {
          const ref = pool.find((p) => normalizeId(p.id) === normalizeId(row.id)) ?? {
            id: row.id,
            quantity: 1,
          };
          const selected = isSelectedInPhase(phase, draft, row.id);
          const isPathPick = pathRecommendedIds.has(normalizeId(row.id));
          const libraryRow = libraryRowForRef(row.id, officialItems, codexEquipment);

          let stats = buildEquipmentPhaseCardStats({ category: 'equipment' });
          if (phase === 'weapon') {
            stats = buildEquipmentPhaseCardStats({
              category: 'weapon',
              properties: row.properties,
              damageLine: weaponDamageLineForRef(row.id, officialItems, codexEquipment),
            });
          } else if (phase === 'armor') {
            const armorStats = armorStatsForRef(row.id, officialItems, codexEquipment);
            stats = buildEquipmentPhaseCardStats({
              category: 'armor',
              properties: row.properties,
              damageReduction: armorStats.damageReduction,
              agilityPenalty: armorStats.agilityPenalty,
            });
          } else {
            stats = buildEquipmentPhaseCardStats({
              category: 'equipment',
              shortUse: gearShortUseForRef(row.id, officialItems, codexEquipment),
            });
          }

          const description = stats.primaryLine;
          const tagline =
            stats.secondaryLine ??
            (phase === 'gear'
              ? gearShortUseForRef(row.id, officialItems, codexEquipment)
              : undefined);

          return (
            <div key={row.id} className={cn(GUIDED_CHOICE_GRID_ITEM_CLASS)} role="listitem">
              <GuidedChoiceCard
                density="compact"
                imageKind="equipment"
                imageLayout="hero"
                imageRecord={libraryRow}
                title={row.name}
                description={description}
                tagline={tagline !== description ? tagline : undefined}
                tags={stats.tags}
                badge={isPathPick ? copy.pathBadge : undefined}
                selected={selected}
                onSelect={() => toggleSelection(ref)}
                selectAriaLabel={`${selected ? 'Deselect' : 'Select'} ${row.name}`}
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
