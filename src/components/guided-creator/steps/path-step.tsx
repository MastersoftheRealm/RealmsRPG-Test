/**
 * Guided · Chapter 1 · Path
 * =========================
 * Choose a path (archetype). Paths are grouped power → martial; hybrids behind expand.
 */

'use client';

import { useMemo, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { GuidedLayerNav } from '@/components/shared';
import { useCodexArchetypes } from '@/hooks';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import { DEFAULT_ABILITIES, type Archetype, type ArchetypeCategory } from '@/types';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-grid';
import { GuidedPathDetailModal } from '../guided-path-detail-modal';
import { GuidedStepLayout } from '../guided-step-layout';

const stepCopy = GUIDED_CREATOR_COPY.steps.path;

const TYPE_SORT_ORDER: Record<ArchetypeCategory, number> = {
  power: 0,
  martial: 1,
  'powered-martial': 2,
};

function sortPaths(a: Archetype, b: Archetype): number {
  const typeA = (a.type || 'power') as ArchetypeCategory;
  const typeB = (b.type || 'power') as ArchetypeCategory;
  const byType = TYPE_SORT_ORDER[typeA] - TYPE_SORT_ORDER[typeB];
  if (byType !== 0) return byType;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

export function PathStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { data: codexArchetypes = [], isLoading } = useCodexArchetypes();
  const [showHybrid, setShowHybrid] = useState(false);
  const [detailPathId, setDetailPathId] = useState<string | null>(null);

  const paths = useMemo(() => {
    return (codexArchetypes as Archetype[])
      .map((a) => ({ ...a, parsedPath: parseArchetypePathData(a.path_data) }))
      .filter((a) => pathHasPlayerVisibleLevel1(a.parsedPath));
  }, [codexArchetypes]);

  const hasHybrid = useMemo(() => paths.some((p) => p.type === 'powered-martial'), [paths]);

  const visiblePaths = useMemo(() => {
    return paths
      .filter((p) => showHybrid || p.type !== 'powered-martial')
      .slice()
      .sort(sortPaths);
  }, [paths, showHybrid]);

  // Lookup against full player-visible list so LayerNav hybrid toggle does not unmount the modal.
  const detailPath = useMemo(
    () => paths.find((p) => String(p.id) === detailPathId) ?? null,
    [paths, detailPathId]
  );

  const handleSelect = (path: Archetype) => {
    const type = (path.type || 'power') as ArchetypeCategory;
    const pathChanged = draft.archetypePathId !== String(path.id);
    const primaryAbility = path.archetype_ability ?? path.pow_abil ?? null;
    const secondaryAbility = path.mart_abil ?? path.secondary_ability ?? null;

    // Same path re-tap: keep all downstream picks. New path: invalidate dependents.
    updateDraft({
      archetypePathId: String(path.id),
      archetypeType: type,
      pow_abil: type === 'martial' ? null : primaryAbility,
      mart_abil:
        type === 'power'
          ? null
          : type === 'powered-martial'
            ? secondaryAbility
            : secondaryAbility ?? primaryAbility,
      ...(pathChanged
        ? {
            // Soft-default only runs when Abilities mounts with abilitiesMode null —
            // reset scores so chapter-jump / skip cannot keep the previous path array.
            abilities: { ...DEFAULT_ABILITIES },
            abilitiesMode: null,
            skills: {},
            declinedPathSkillIds: [],
            archetypeFeatIds: [],
            characterFeatIds: [],
            equipmentPhase: 'weapon' as const,
            loadoutWeapons: [],
            loadoutArmor: [],
            armaments: [],
            equipment: [],
            currency: CHARACTER_STARTING_CURRENCY,
            unarmedProwess: 0,
            powerIds: [],
            techniqueIds: [],
          }
        : {}),
    });
  };

  return (
    <GuidedStepLayout
      subStep="path"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={Boolean(draft.archetypePathId)}
      hideBack
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {visiblePaths.length === 0 ? (
            <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
          ) : (
            <div className={GUIDED_CHOICE_GRID_CLASS}>
              {visiblePaths.map((path) => (
                <GuidedChoiceCard
                  key={path.id}
                  className={GUIDED_CHOICE_GRID_ITEM_CLASS}
                  title={path.name}
                  description={path.description}
                  selected={draft.archetypePathId === String(path.id)}
                  onSelect={() => handleSelect(path)}
                  onDetails={() => setDetailPathId(String(path.id))}
                />
              ))}
            </div>
          )}

          {hasHybrid && !showHybrid ? (
            <GuidedLayerNav
              expandLabel={stepCopy.showHybridPaths}
              onExpand={() => setShowHybrid(true)}
            />
          ) : null}
          {hasHybrid && showHybrid ? (
            <GuidedLayerNav
              collapseLabel={stepCopy.backToCorePaths}
              onCollapse={() => setShowHybrid(false)}
            />
          ) : null}

          <GuidedPathDetailModal
            isOpen={detailPath != null}
            onClose={() => setDetailPathId(null)}
            path={detailPath}
            onSelect={detailPath ? () => handleSelect(detailPath) : undefined}
          />
        </>
      )}
    </GuidedStepLayout>
  );
}
