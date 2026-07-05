/**
 * Layer 2 — mix and match path gear with Training Point budget visible.
 */

'use client';

import { useMemo, useCallback } from 'react';
import { GridListRow, ListHeader, GuidedLayerNav } from '@/components/shared';
import { CreatorResourceBar } from '@/components/character-creator/CreatorResourceBar';
import { useGameRules, useItemProperties } from '@/hooks';
import type { PathItemRecommendation } from '@/types/archetype';
import {
  buildEquipmentLookup,
  resolveEquipmentRef,
} from '@/lib/guided-creator/resolve-loadout-items';
import type { LibraryItem } from '@/types/library';
import type { CodexEquipmentItem } from '@/types/codex';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import {
  addItemToGuidedDraft,
  isItemSelectedInDraft,
  removeItemFromGuidedDraft,
} from '@/lib/guided-creator/loadout-pool';
import {
  computeGuidedLoadoutTpSummary,
  resolveItemTrainingPoints,
  resolvePoolItemCategory,
  wouldExceedLoadoutTp,
} from '@/lib/guided-creator/loadout-tp';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const panelCopy = GUIDED_CREATOR_COPY.steps.loadout.customize;
const layerNavCopy = GUIDED_CREATOR_COPY.layerNav;

const GRID_COLUMNS = '1.5fr minmax(5rem, auto) minmax(3.5rem, auto) minmax(6rem, auto)';
const HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const, sortable: false as const },
  { key: 'type', label: 'TYPE', align: 'center' as const, sortable: false as const },
  { key: 'tp', label: 'TP', align: 'center' as const, sortable: false as const },
  { key: 'stats', label: 'STATS', align: 'center' as const, sortable: false as const },
];

export interface GuidedLoadoutCustomizePanelProps {
  draft: GuidedDraft;
  pool: PathItemRecommendation[];
  officialItems: LibraryItem[];
  codexEquipment: CodexEquipmentItem[];
  onDraftChange: (partial: Partial<GuidedDraft>) => void;
  onBackToKits: () => void;
}

export function GuidedLoadoutCustomizePanel({
  draft,
  pool,
  officialItems,
  codexEquipment,
  onDraftChange,
  onBackToKits,
}: GuidedLoadoutCustomizePanelProps) {
  const { rules } = useGameRules();
  const { data: itemProperties = [] } = useItemProperties();

  const lookup = useMemo(
    () => buildEquipmentLookup(officialItems, codexEquipment),
    [officialItems, codexEquipment]
  );

  const poolRows = useMemo(() => {
    return pool.map((ref) => {
      const resolved = resolveEquipmentRef(ref, lookup, panelCopy.unresolvedItem);
          const tp = resolveItemTrainingPoints(ref.id, officialItems, codexEquipment, itemProperties) ?? 0;
      return { ref, resolved, tp };
    });
  }, [pool, lookup, officialItems, codexEquipment, itemProperties]);

  const tpSummary = useMemo(
    () =>
      computeGuidedLoadoutTpSummary(
        draft,
        officialItems,
        codexEquipment,
        itemProperties,
        rules
      ),
    [draft, officialItems, codexEquipment, itemProperties, rules]
  );

  const toggleItem = useCallback(
    (ref: PathItemRecommendation) => {
      const selected = isItemSelectedInDraft(draft, ref.id);
      if (selected) {
        const next = removeItemFromGuidedDraft(draft, ref.id);
        onDraftChange({
          ...next,
          loadoutId: 'custom',
        });
        return;
      }
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
        return;
      }
      const category = resolvePoolItemCategory(ref, officialItems, codexEquipment);
      const next = addItemToGuidedDraft(draft, ref, category);
      onDraftChange({
        ...next,
        loadoutId: 'custom',
      });
    },
    [draft, onDraftChange, officialItems, codexEquipment, itemProperties, rules]
  );

  const atCap = tpSummary.remaining <= 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary">{panelCopy.title}</h3>
        <p className="mt-1 font-nunito text-sm text-text-secondary">{panelCopy.description}</p>
      </div>

      <CreatorResourceBar
        layer={2}
        creationMode="path"
        trainingPoints={{ spent: tpSummary.spent, limit: tpSummary.limit }}
        className="mb-0"
      />

      {atCap ? (
        <p className="font-nunito text-sm text-warning-700 dark:text-warning-400">{panelCopy.atCap}</p>
      ) : null}

      <ListHeader columns={HEADER_COLUMNS} gridColumns={GRID_COLUMNS} compact />

      <div className="flex flex-col gap-1">
        {poolRows.map(({ ref, resolved, tp }) => {
          const selected = isItemSelectedInDraft(draft, ref.id);
          const blocked =
            !selected &&
            wouldExceedLoadoutTp(
              draft,
              ref,
              officialItems,
              codexEquipment,
              itemProperties,
              rules
            );
          const qtySuffix = ref.quantity > 1 ? ` ×${ref.quantity}` : '';

          return (
            <GridListRow
              key={`${ref.id}-${ref.quantity}`}
              id={`${ref.id}-${ref.quantity}`}
              name={`${resolved.name}${qtySuffix}`}
              description={resolved.description}
              gridColumns={GRID_COLUMNS}
              compact
              selectable
              isSelected={selected}
              disabled={blocked}
              warningMessage={blocked ? panelCopy.overBudget : undefined}
              onSelect={() => toggleItem(ref)}
              columns={[
                {
                  key: 'type',
                  label: 'Type',
                  value: resolved.categoryLabel,
                  align: 'center',
                },
                {
                  key: 'tp',
                  label: 'TP',
                  value: tp,
                  align: 'center',
                  highlight: true,
                },
                {
                  key: 'stats',
                  label: 'Stats',
                  value: resolved.statsLine ?? '—',
                  align: 'center',
                },
              ]}
            />
          );
        })}
      </div>

      <GuidedLayerNav
        collapseLabel={layerNavCopy.backToRecommendations}
        onCollapse={onBackToKits}
      />
    </div>
  );
}
