/**
 * Guided · Chapter 1 · Path
 * =========================
 * L1: archetype path cards. L3: custom archetype (type + abilities).
 * No distinct Path L2 (REALMS §5.1).
 */

'use client';

import { useMemo, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui';
import { GuidedLayerNav, InfoTippy } from '@/components/patterns';
import { useCodexArchetypes } from '@/hooks';
import {
  PATH_CATEGORY_GROUPS,
  groupPathsByCategory,
  listPlayerVisiblePaths,
} from '@/lib/game/archetype-edit';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { buildPathAbilityChipLabels } from '@/lib/guided-creator/path-ability-labels';
import {
  buildCustomArchetypeDraftPatch,
  buildEnterCustomArchetypeLayerPatch,
  buildEnterPathLayerPatch,
  buildPathSelectionDraftPatch,
  isGuidedCustomArchetypeComplete,
} from '@/lib/guided-creator/path-selection-draft';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { type AbilityName, type Archetype, type ArchetypeCategory } from '@/types';
import {
  guidedArchetypePathHelp,
  guidedCustomArchetypeHelp,
  guidedMartialPathTypeHelp,
  guidedPoweredMartialPathTypeHelp,
  guidedPowerPathTypeHelp,
} from '../../../../public/tooltip-text';
import { GuidedChoiceCard, type GuidedChoiceTag } from '../guided-choice-card';
import { GUIDED_CHOICE_GRID_CLASS, GUIDED_CHOICE_GRID_ITEM_CLASS } from '../guided-choice-styles';
import { GuidedPathCustomArchetype } from '../guided-path-custom-archetype';
import { GuidedPathDetailModal } from '../guided-path-detail-modal';
import { GuidedSectionTitle } from '../guided-section-title';
import { GuidedStepLayout } from '../guided-step-layout';

const stepCopy = GUIDED_CREATOR_COPY.steps.path;

/** Path ability chips: slight enlarge for all; Primary uses primary (blue) tokens. */
function pathAbilityTags(path: Archetype): GuidedChoiceTag[] {
  return buildPathAbilityChipLabels(path).map((chip) => ({
    label: chip.label,
    ...(chip.role === 'primary'
      ? { variant: 'primary' as const, size: 'md' as const }
      : { size: 'md' as const }),
  }));
}

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

  const pathLayer = draft.pathLayer === 'l3' ? 'l3' : 'l1';
  const isCustomLayer = pathLayer === 'l3';

  const paths = useMemo(
    () => listPlayerVisiblePaths(codexArchetypes as Archetype[]),
    [codexArchetypes],
  );

  const pathsByGroup = useMemo(() => {
    const grouped = groupPathsByCategory(paths);
    for (const group of PATH_CATEGORY_GROUPS) {
      grouped[group].sort(sortByName);
    }
    return grouped;
  }, [paths]);

  const hasAnyPath = paths.length > 0;

  const detailPath = useMemo(
    () => paths.find((p) => String(p.id) === detailPathId) ?? null,
    [paths, detailPathId],
  );

  const canContinue = isCustomLayer
    ? isGuidedCustomArchetypeComplete(draft.archetypeType, draft.pow_abil, draft.mart_abil)
    : Boolean(draft.archetypePathId);

  const handleSelectPath = (path: Archetype) => {
    updateDraft(buildPathSelectionDraftPatch(draft.archetypePathId, path));
  };

  const handleEnterCustom = () => {
    updateDraft(buildEnterCustomArchetypeLayerPatch());
  };

  const handleViewPaths = () => {
    updateDraft(buildEnterPathLayerPatch());
  };

  const applyCustomPatch = (
    type: ArchetypeCategory,
    powAbil: AbilityName | null,
    martAbil: AbilityName | null,
  ) => {
    updateDraft(
      buildCustomArchetypeDraftPatch({
        type,
        powAbil,
        martAbil,
        previousType: draft.archetypeType,
      }),
    );
  };

  const handleSelectType = (type: ArchetypeCategory) => {
    applyCustomPatch(type, null, null);
  };

  const handleSelectPowerAbility = (ability: AbilityName) => {
    if (!draft.archetypeType) return;
    applyCustomPatch(draft.archetypeType, ability, draft.mart_abil);
  };

  const handleSelectMartialAbility = (ability: AbilityName) => {
    if (!draft.archetypeType) return;
    applyCustomPatch(draft.archetypeType, draft.pow_abil, ability);
  };

  return (
    <GuidedStepLayout
      subStep="path"
      title={isCustomLayer ? stepCopy.customTitle : stepCopy.title}
      titleAddon={
        <InfoTippy
          content={isCustomLayer ? guidedCustomArchetypeHelp : guidedArchetypePathHelp}
          label={isCustomLayer ? 'About Custom Archetype' : 'About Archetype Path'}
        />
      }
      description={isCustomLayer ? stepCopy.customDescription : stepCopy.description}
      canContinue={canContinue}
      hideBack
    >
      {isCustomLayer ? (
        <>
          <GuidedPathCustomArchetype
            selectedType={draft.archetypeType}
            powAbil={draft.pow_abil}
            martAbil={draft.mart_abil}
            onSelectType={handleSelectType}
            onSelectPowerAbility={handleSelectPowerAbility}
            onSelectMartialAbility={handleSelectMartialAbility}
          />
          <GuidedLayerNav
            collapseLabel={stepCopy.viewArchetypePaths}
            onCollapse={handleViewPaths}
          />
        </>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {!hasAnyPath ? (
            <EmptyState title={stepCopy.emptyTitle} description={stepCopy.emptyDescription} />
          ) : (
            <div className="space-y-6">
              {PATH_CATEGORY_GROUPS.map((group) => {
                const options = pathsByGroup[group];
                if (options.length === 0) return null;
                const title = stepCopy.groupTitles[group];
                return (
                  <section key={group} aria-label={title}>
                    <GuidedSectionTitle
                      className="mb-3"
                      titleAddon={
                        <InfoTippy content={PATH_GROUP_TIP[group]} label={`About ${title}`} />
                      }
                    >
                      {title}
                    </GuidedSectionTitle>
                    <div className={GUIDED_CHOICE_GRID_CLASS}>
                      {options.map((path) => (
                        <GuidedChoiceCard
                          key={path.id}
                          className={GUIDED_CHOICE_GRID_ITEM_CLASS}
                          title={path.name}
                          description={path.description}
                          tags={pathAbilityTags(path)}
                          selected={draft.archetypePathId === String(path.id)}
                          onSelect={() => handleSelectPath(path)}
                          onDetails={() => setDetailPathId(String(path.id))}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <GuidedLayerNav expandLabel={stepCopy.customArchetype} onExpand={handleEnterCustom} />

          <GuidedPathDetailModal
            isOpen={detailPath != null}
            onClose={() => setDetailPathId(null)}
            path={detailPath}
            onSelect={detailPath ? () => handleSelectPath(detailPath) : undefined}
          />
        </>
      )}
    </GuidedStepLayout>
  );
}
