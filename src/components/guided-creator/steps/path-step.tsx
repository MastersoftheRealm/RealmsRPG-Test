/**
 * Guided · Chapter 1 · Path
 * =========================
 * Choose a path (archetype). Paths are grouped power → martial; hybrids behind expand.
 */

'use client';

import { useMemo, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { useCodexArchetypes } from '@/hooks';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import type { Archetype, ArchetypeCategory } from '@/types';
import { GuidedChoiceCard } from '../guided-choice-card';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-grid';
import { GuidedStepLayout } from '../guided-step-layout';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

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

  const handleSelect = (path: Archetype) => {
    const type = (path.type || 'power') as ArchetypeCategory;
    const pathChanged = draft.archetypePathId !== String(path.id);
    const primaryAbility = path.archetype_ability ?? path.pow_abil ?? null;
    const secondaryAbility = path.mart_abil ?? path.secondary_ability ?? null;

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
      ...(pathChanged ? { abilitiesMode: null } : {}),
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
          {hasHybrid && !showHybrid && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowHybrid(true)}
                className="text-sm font-medium text-primary-fg hover:underline min-h-11 font-nunito"
              >
                {stepCopy.showHybridPaths}
              </button>
            </div>
          )}

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
                />
              ))}
            </div>
          )}
        </>
      )}
    </GuidedStepLayout>
  );
}
