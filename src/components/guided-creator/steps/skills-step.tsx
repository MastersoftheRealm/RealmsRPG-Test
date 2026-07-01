/**
 * Skills — species locked, path recommended, optional free picks.
 */

'use client';

import { useEffect, useMemo } from 'react';
import { Spinner } from '@/components/ui';
import { SkillSourceChip } from '@/components/shared';
import { useMergedSpecies, useCodexSkills } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const stepCopy = GUIDED_CREATOR_COPY.steps.skills;

export function SkillsStep() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const { pathData } = useGuidedPathData();
  const { data: allSpecies = [], isLoading: spLoading } = useMergedSpecies();
  const { data: codexSkills = [], isLoading: skLoading } = useCodexSkills();

  const species = useMemo(
    () => allSpecies.find((s) => String(s.id) === String(draft.speciesId)),
    [allSpecies, draft.speciesId]
  );

  const speciesSkillIds = useMemo(() => (species?.skills ?? []).map(String), [species]);
  const pathSkillIds = useMemo(() => (pathData?.level1?.skills ?? []).map(String), [pathData]);

  const skillName = (id: string) =>
    codexSkills.find((s) => String(s.id) === id)?.name ?? id;

  useEffect(() => {
    if (draft.skillIds.length > 0) return;
    const merged = Array.from(new Set([...speciesSkillIds, ...pathSkillIds]));
    if (merged.length > 0) {
      updateDraft({ skillIds: merged });
    }
  }, [draft.skillIds.length, speciesSkillIds, pathSkillIds, updateDraft]);

  const togglePathSkill = (id: string) => {
    const declined = draft.declinedPathSkillIds.includes(id);
    if (declined) {
      updateDraft({
        declinedPathSkillIds: draft.declinedPathSkillIds.filter((x) => x !== id),
        skillIds: Array.from(new Set([...draft.skillIds, id])),
      });
    } else if (pathSkillIds.includes(id)) {
      updateDraft({
        declinedPathSkillIds: [...draft.declinedPathSkillIds, id],
        skillIds: draft.skillIds.filter((x) => x !== id),
      });
    }
  };

  const loading = spLoading || skLoading;

  return (
    <GuidedStepLayout
      subStep="skills"
      title={stepCopy.title}
      description={stepCopy.description}
      canContinue={draft.skillIds.length > 0}
      continueLabel={stepCopy.continueLabel}
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          {speciesSkillIds.length > 0 && (
            <section>
              <h3 className="font-display text-lg font-semibold text-text-primary">{stepCopy.fromSpecies}</h3>
              <p className="mt-1 font-nunito text-sm text-text-secondary">{stepCopy.fromSpeciesHint}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {speciesSkillIds.map((id) => (
                  <li key={id}>
                    <SkillSourceChip source="species" label={skillName(id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pathSkillIds.length > 0 && (
            <section>
              <h3 className="font-display text-lg font-semibold text-text-primary">{stepCopy.fromPath}</h3>
              <p className="mt-1 font-nunito text-sm text-text-secondary">{stepCopy.fromPathHint}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {pathSkillIds.map((id) => (
                  <li key={id}>
                    <SkillSourceChip
                      source="path"
                      label={skillName(id)}
                      selected={draft.skillIds.includes(id)}
                      onToggle={() => togglePathSkill(id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </GuidedStepLayout>
  );
}
