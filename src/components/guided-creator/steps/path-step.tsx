/**
 * Guided · Chapter 1 · Path
 * =========================
 * Choose a path (archetype). Grouped Power → Powered-Martial → Martial (custom-creator parity).
 */

'use client';

import { useMemo, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { InfoTippy } from '@/components/shared';
import { useCodexArchetypes } from '@/hooks';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import { formatAbilityLabel } from '@/lib/constants/ability-effect-blurbs';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { resolvePathAbilityLabels } from '@/lib/guided-creator/path-ability-labels';
import { buildPathSelectionDraftPatch } from '@/lib/guided-creator/path-selection-draft';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { type Archetype, type ArchetypeCategory } from '@/types';
import {
  guidedArchetypePathHelp,
  guidedMartialPathTypeHelp,
  guidedPoweredMartialPathTypeHelp,
  guidedPowerPathTypeHelp,
} from '../../../../public/tooltip-text';
import { GuidedChoiceCard, type GuidedChoiceTag } from '../guided-choice-card';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-styles';

import { GuidedPathDetailModal } from '../guided-path-detail-modal';
import { GuidedStepLayout } from '../guided-step-layout';

const stepCopy = GUIDED_CREATOR_COPY.steps.path;
const detailCopy = stepCopy.detail;

/** Path ability chips: slight enlarge for all; Primary uses primary (blue) tokens. */
function pathAbilityTags(path: Archetype): GuidedChoiceTag[] {
  const { primaryAbilities, secondaryAbility } = resolvePathAbilityLabels(path);
  const tags: GuidedChoiceTag[] = [];
  for (const ability of primaryAbilities) {
    tags.push({
      label: detailCopy.primaryAbility(formatAbilityLabel(ability)),
      variant: 'primary',
      size: 'md',
    });
  }
  if (secondaryAbility) {
    tags.push({
      label: detailCopy.secondaryAbility(formatAbilityLabel(secondaryAbility)),
      size: 'md',
    });
  }
  return tags;
}

/** Display order matches Advanced archetype path picker (REALMS §5.1). */
const PATH_GROUPS: ArchetypeCategory[] = ['power', 'powered-martial', 'martial'];

const PATH_GROUP_TIP: Record<ArchetypeCategory, string> = {
  power: guidedPowerPathTypeHelp,
  'powered-martial': guidedPoweredMartialPathTypeHelp,
  martial: guidedMartialPathTypeHelp,
};

function sortByName(a: Archetype, b: Archetype): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

export function PathStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { data: codexArchetypes = [], isLoading } = useCodexArchetypes();
  const [detailPathId, setDetailPathId] = useState<string | null>(null);

  const paths = useMemo(() => {
    return (codexArchetypes as Archetype[])
      .map((a) => ({ ...a, parsedPath: parseArchetypePathData(a.path_data) }))
      .filter((a) => pathHasPlayerVisibleLevel1(a.parsedPath));
  }, [codexArchetypes]);

  const pathsByGroup = useMemo(() => {
    const grouped: Record<ArchetypeCategory, Archetype[]> = {
      power: [],
      'powered-martial': [],
      martial: [],
    };
    for (const path of paths) {
      const type = (path.type || 'power') as ArchetypeCategory;
      if (grouped[type]) grouped[type].push(path);
    }
    for (const group of PATH_GROUPS) {
      grouped[group].sort(sortByName);
    }
    return grouped;
  }, [paths]);

  const hasAnyPath = paths.length > 0;

  // Lookup against full player-visible list so detail modal stays mounted across re-renders.
  const detailPath = useMemo(
    () => paths.find((p) => String(p.id) === detailPathId) ?? null,
    [paths, detailPathId]
  );

  const handleSelect = (path: Archetype) => {
    // Same path re-tap: keep dependents. New path: invalidate (see buildPathSelectionDraftPatch).
    updateDraft(buildPathSelectionDraftPatch(draft.archetypePathId, path));
  };

  return (
    <GuidedStepLayout
      subStep="path"
      title={stepCopy.title}
      titleAddon={
        <InfoTippy
          content={guidedArchetypePathHelp}
          label="About Archetype Path"
          size="inline"
        />
      }
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
          {!hasAnyPath ? (
            <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
          ) : (
            <div className="space-y-6">
              {PATH_GROUPS.map((group) => {
                const options = pathsByGroup[group];
                if (options.length === 0) return null;
                const title = stepCopy.groupTitles[group];
                return (
                  <section key={group} aria-label={title}>
                    <div className="flex items-center gap-1.5 mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                        {title}
                      </h3>
                      <InfoTippy
                        content={PATH_GROUP_TIP[group]}
                        label={`About ${title}`}
                        size="inline"
                      />
                    </div>
                    <div className={GUIDED_CHOICE_GRID_CLASS}>
                      {options.map((path) => (
                        <GuidedChoiceCard
                          key={path.id}
                          className={GUIDED_CHOICE_GRID_ITEM_CLASS}
                          title={path.name}
                          description={path.description}
                          tags={pathAbilityTags(path)}
                          selected={draft.archetypePathId === String(path.id)}
                          onSelect={() => handleSelect(path)}
                          onDetails={() => setDetailPathId(String(path.id))}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

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
