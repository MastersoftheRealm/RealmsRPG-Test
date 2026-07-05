/**
 * Equipment loadout — Layer 1 kits + Layer 2 customize with TP budget.
 */

'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { GuidedLayerNav } from '@/components/shared';
import { useEquipment, useOfficialLibrary } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedLoadoutSection } from '../guided-loadout-section';
import { GuidedUnarmedProwessPanel } from '../guided-unarmed-prowess-panel';
import { GuidedLoadoutCustomizePanel } from '../guided-loadout-customize-panel';
import type { PathLoadout } from '@/types/archetype';
import {
  buildEquipmentLookup,
  loadoutDraftFromSelection,
  resolveLoadoutItems,
} from '@/lib/guided-creator/resolve-loadout-items';
import { buildPathLoadoutPool } from '@/lib/guided-creator/loadout-pool';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.loadout;

export function LoadoutStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData, archetype } = useGuidedPathData();
  const { data: officialItems = [], isLoading: officialLoading } = useOfficialLibrary('items');
  const { data: codexEquipment = [], isLoading: codexLoading } = useEquipment();
  const [customizing, setCustomizing] = useState(draft.loadoutId === 'custom');
  const kitLoadoutIdRef = useRef<string | null>(
    draft.loadoutId && draft.loadoutId !== 'custom' ? draft.loadoutId : null
  );

  const isLoading = officialLoading || codexLoading;
  const recommendUnarmed = pathData?.level1?.recommendUnarmedProwess === true;

  const equipmentLookup = useMemo(
    () => buildEquipmentLookup(officialItems, codexEquipment),
    [officialItems, codexEquipment]
  );

  const loadouts: PathLoadout[] = useMemo(() => {
    const fromPath = pathData?.level1?.loadouts ?? [];
    if (fromPath.length > 0) return fromPath;

    const armaments = pathData?.level1?.armamentRecommendations ?? [];
    const equipment = pathData?.level1?.equipmentRecommendations ?? [];
    if (armaments.length === 0 && equipment.length === 0) return [];

    return [
      {
        id: 'path-default',
        title: stepCopy.pathDefaultTitle(archetype?.name ?? 'Path'),
        why: stepCopy.pathDefaultWhy,
        armaments,
        equipment,
      },
    ];
  }, [pathData, archetype?.name]);

  const itemPool = useMemo(
    () => buildPathLoadoutPool(loadouts, pathData?.level1),
    [loadouts, pathData?.level1]
  );

  const resolvedByLoadoutId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof resolveLoadoutItems>>();
    for (const loadout of loadouts) {
      map.set(
        loadout.id,
        resolveLoadoutItems(loadout, equipmentLookup, stepCopy.unresolvedItem)
      );
    }
    return map;
  }, [loadouts, equipmentLookup]);

  useEffect(() => {
    if (draft.loadoutId || loadouts.length === 0) return;
    const first = loadouts[0];
    kitLoadoutIdRef.current = first.id;
    updateDraft({
      loadoutId: first.id,
      ...loadoutDraftFromSelection(first),
    });
  }, [loadouts, draft.loadoutId, updateDraft]);

  const selectLoadout = useCallback(
    (loadout: PathLoadout) => {
      kitLoadoutIdRef.current = loadout.id;
      updateDraft({
        loadoutId: loadout.id,
        ...loadoutDraftFromSelection(loadout),
      });
    },
    [updateDraft]
  );

  const handleUnarmedChange = useCallback(
    (level: number) => {
      updateDraft({ unarmedProwess: level });
    },
    [updateDraft]
  );

  const openCustomize = useCallback(() => {
    if (draft.loadoutId && draft.loadoutId !== 'custom') {
      kitLoadoutIdRef.current = draft.loadoutId;
    }
    setCustomizing(true);
  }, [draft.loadoutId]);

  const backToKits = useCallback(() => {
    const restoreId = kitLoadoutIdRef.current ?? loadouts[0]?.id;
    const loadout = loadouts.find((l) => l.id === restoreId) ?? loadouts[0];
    if (loadout) {
      selectLoadout(loadout);
    }
    setCustomizing(false);
  }, [loadouts, selectLoadout]);

  const showGroupIntro = loadouts.length > 1 && !customizing;
  const hasSelection =
    draft.loadoutId === 'custom'
      ? draft.armaments.length + draft.equipment.length > 0
      : Boolean(draft.loadoutId);

  return (
    <GuidedStepLayout
      subStep="loadout"
      title={stepCopy.title}
      description={customizing ? stepCopy.customize.description : stepCopy.description}
      canContinue={hasSelection}
      continueLabel={stepCopy.continueLabel}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-text-secondary">
          <Spinner className="h-5 w-5" />
          <span>{stepCopy.loadingItems}</span>
        </div>
      ) : loadouts.length === 0 ? (
        <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
      ) : customizing ? (
        <GuidedLoadoutCustomizePanel
          draft={draft}
          pool={itemPool}
          officialItems={officialItems}
          codexEquipment={codexEquipment}
          onDraftChange={updateDraft}
          onBackToKits={backToKits}
        />
      ) : (
        <div className="space-y-8">
          {showGroupIntro ? (
            <p className="font-nunito text-sm text-text-secondary">{stepCopy.groupIntro}</p>
          ) : null}

          <div className="space-y-8" role="group" aria-label={stepCopy.loadoutGroupLabel}>
            {loadouts.map((loadout) => (
              <GuidedLoadoutSection
                key={loadout.id}
                loadoutId={loadout.id}
                title={loadout.title}
                why={loadout.why ?? stepCopy.defaultWhy}
                items={resolvedByLoadoutId.get(loadout.id) ?? []}
                selected={draft.loadoutId === loadout.id}
                onSelect={() => selectLoadout(loadout)}
              />
            ))}
          </div>

          {draft.loadoutId === 'custom' ? (
            <p className="font-nunito text-sm text-text-secondary">{stepCopy.customKitHint}</p>
          ) : null}

          {itemPool.length > 0 ? (
            <GuidedLayerNav expandLabel={stepCopy.customize.expandLabel} onExpand={openCustomize} />
          ) : null}

          {recommendUnarmed ? (
            <GuidedUnarmedProwessPanel
              level={draft.unarmedProwess ?? 0}
              onChange={handleUnarmedChange}
            />
          ) : null}
        </div>
      )}
    </GuidedStepLayout>
  );
}
