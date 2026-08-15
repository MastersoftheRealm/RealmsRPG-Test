'use client';

import { useMemo, useCallback } from 'react';
import { getChoiceOptionIds } from '@/lib/choice-trait';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import {
  useMergedSpecies,
  useTraits,
  useCodexSkills,
  useCreatorPathData,
  resolveTraitIds,
  type Species,
} from '@/hooks';
import {
  averageMixedPhysical,
  buildMixedSpeciesSkillOptions,
  canContinueAncestryMixed,
  canContinueAncestrySingle,
  combineSpeciesSizes,
  resolveAncestryTraitBuckets,
  toggleCappedTraitSelection,
  toggleMixedSpeciesSkillSelection,
  toggleOptionalSingleSelection,
  trimTraitsForFlawMax,
} from '@/lib/ancestry/ancestry-selection';
import { speciesSkillToSummaryChipItem } from '@/lib/chip/species-skill-chips';
import { getValidationIssuesForStep, getStepCompletion } from '@/lib/character-creator-validation';
import { EMPTY_STRING_ARRAY } from '@/lib/empty';

export function useAncestryStepState() {
  const { draft, nextStep, prevStep, setStep, updateDraft } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: allTraits } = useTraits();
  const { data: allSkills } = useCodexSkills();
  const pathData = useCreatorPathData();

  const isMixed = draft.ancestry?.mixed === true;

  const selectedSpecies = useMemo(() => {
    if (!allSpecies.length || !draft.ancestry?.id) return null;
    if (isMixed && draft.ancestry.speciesIds?.length === 2) return null;
    return allSpecies.find((s: Species) => s.id === draft.ancestry?.id) ?? null;
  }, [allSpecies, draft.ancestry?.id, draft.ancestry?.speciesIds, isMixed]);

  const speciesA = useMemo(() => {
    if (!isMixed || !draft.ancestry?.speciesIds?.[0]) return null;
    return allSpecies.find((s: Species) => s.id === draft.ancestry?.speciesIds?.[0]) ?? null;
  }, [allSpecies, isMixed, draft.ancestry?.speciesIds]);

  const speciesB = useMemo(() => {
    if (!isMixed || !draft.ancestry?.speciesIds?.[1]) return null;
    return allSpecies.find((s: Species) => s.id === draft.ancestry?.speciesIds?.[1]) ?? null;
  }, [allSpecies, isMixed, draft.ancestry?.speciesIds]);

  const speciesSkillIds = useMemo(() => {
    if (selectedSpecies) return (selectedSpecies.skills || []).map(String);
    if (speciesA && speciesB) {
      const merged = [...(speciesA.skills || []), ...(speciesB.skills || [])];
      return Array.from(new Set(merged.map(String)));
    }
    return [];
  }, [selectedSpecies, speciesA, speciesB]);

  const speciesSkillChips = useMemo(() => {
    if (!allSkills) return [];
    return speciesSkillIds.map((id) => speciesSkillToSummaryChipItem(id, allSkills));
  }, [speciesSkillIds, allSkills]);

  const mixedSpeciesSkillOptions = useMemo(
    () => buildMixedSpeciesSkillOptions(speciesA, speciesB, allSkills),
    [speciesA, speciesB, allSkills],
  );

  const selectedTraitIds = draft.ancestry?.selectedTraits ?? EMPTY_STRING_ARRAY;
  const selectedFlaw = draft.ancestry?.selectedFlaw || null;
  const selectedCharacteristic = draft.ancestry?.selectedCharacteristic || null;
  const selectedSpeciesTraits = draft.ancestry?.selectedSpeciesTraits;
  const selectedFlawSpeciesId = draft.ancestry?.selectedFlawSpeciesId || null;
  const selectedSpeciesSkillIds = draft.ancestry?.selectedSpeciesSkillIds ?? [];

  const { speciesTraits, ancestryTraits, flaws, characteristics } = useMemo(
    () =>
      resolveAncestryTraitBuckets({
        selectedSpecies,
        speciesA,
        speciesB,
        allTraits,
      }),
    [selectedSpecies, speciesA, speciesB, allTraits],
  );

  const speciesTraitsFromA = useMemo(
    () => (speciesA && allTraits ? resolveTraitIds(speciesA.species_traits || [], allTraits) : []),
    [speciesA, allTraits],
  );
  const speciesTraitsFromB = useMemo(
    () => (speciesB && allTraits ? resolveTraitIds(speciesB.species_traits || [], allTraits) : []),
    [speciesB, allTraits],
  );

  const ancestryTraitsFromFlawSpecies = useMemo(() => {
    if (!selectedFlawSpeciesId || !allTraits) return [];
    const sp = speciesA?.id === selectedFlawSpeciesId ? speciesA : speciesB;
    return sp ? resolveTraitIds(sp.ancestry_traits || [], allTraits) : [];
  }, [selectedFlawSpeciesId, speciesA, speciesB, allTraits]);

  const combinedSizes = useMemo(
    () => combineSpeciesSizes(speciesA, speciesB),
    [speciesA, speciesB],
  );

  const mixedAveragedPhysical = useMemo(
    () => averageMixedPhysical(speciesA, speciesB),
    [speciesA, speciesB],
  );

  const maxAncestryTraits = selectedFlaw ? 2 : 1;

  const toggleAncestryTrait = useCallback(
    (traitId: string) => {
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          selectedTraits: toggleCappedTraitSelection(selectedTraitIds, traitId, maxAncestryTraits),
        },
      });
    },
    [selectedTraitIds, maxAncestryTraits, draft.ancestry, updateDraft],
  );

  const toggleFlaw = useCallback(
    (flawId: string) => {
      const newFlaw = toggleOptionalSingleSelection(selectedFlaw, flawId);
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          selectedFlaw: newFlaw,
          selectedTraits: trimTraitsForFlawMax(selectedTraitIds, newFlaw),
        },
      });
    },
    [selectedFlaw, selectedTraitIds, draft.ancestry, updateDraft],
  );

  const toggleFlawMixed = useCallback(
    (flawId: string, speciesId: string) => {
      const isSelected = selectedFlaw === flawId;
      const newFlaw = isSelected ? null : flawId;
      const newFlawSpeciesId = isSelected ? null : speciesId;
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedFlaw: newFlaw,
          selectedFlawSpeciesId: newFlawSpeciesId,
          selectedTraits: trimTraitsForFlawMax(selectedTraitIds, newFlaw),
        },
      });
    },
    [selectedFlaw, selectedTraitIds, draft.ancestry, updateDraft],
  );

  const setMixedSize = useCallback(
    (size: string) => {
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedSize: size,
          mixedPhysical: mixedAveragedPhysical ?? undefined,
        },
      });
    },
    [draft.ancestry, mixedAveragedPhysical, updateDraft],
  );

  const setSpeciesTraitA = useCallback(
    (traitId: string) => {
      const current = draft.ancestry?.selectedSpeciesTraits ?? [undefined, undefined];
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedSpeciesTraits: [traitId, current[1] ?? ''],
        },
      });
    },
    [draft.ancestry, updateDraft],
  );

  const setSpeciesTraitB = useCallback(
    (traitId: string) => {
      const current = draft.ancestry?.selectedSpeciesTraits ?? [undefined, undefined];
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedSpeciesTraits: [current[0] ?? '', traitId],
        },
      });
    },
    [draft.ancestry, updateDraft],
  );

  const setAncestryBaseMixed = useCallback(
    (traitId: string) => {
      const current = draft.ancestry?.selectedTraits ?? [];
      const base = current[0];
      const isSelected = base === traitId;
      const newBase = isSelected ? '' : traitId;
      const extra = selectedFlaw ? (current[1] ?? '') : '';
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedTraits: extra ? [newBase, extra].filter(Boolean) : newBase ? [newBase] : [],
        },
      });
    },
    [draft.ancestry, selectedFlaw, updateDraft],
  );

  const setAncestryExtraMixed = useCallback(
    (traitId: string) => {
      const current = draft.ancestry?.selectedTraits ?? [];
      const base = current[0] ?? '';
      const extra = current[1];
      const isSelected = extra === traitId;
      const newExtra = isSelected ? '' : traitId;
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedTraits: [base, newExtra].filter(Boolean),
        },
      });
    },
    [draft.ancestry, updateDraft],
  );

  const toggleCharacteristic = useCallback(
    (charId: string) => {
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          selectedCharacteristic: toggleOptionalSingleSelection(selectedCharacteristic, charId),
        },
      });
    },
    [selectedCharacteristic, draft.ancestry, updateDraft],
  );

  const setSpeciesTraitChoice = useCallback(
    (parentId: string, optionId: string) => {
      const prev = draft.ancestry?.selectedSpeciesTraitChoices ?? {};
      const next = { ...prev };
      if (!optionId) delete next[String(parentId)];
      else next[String(parentId)] = String(optionId);
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          selectedSpeciesTraitChoices: next,
        },
      });
    },
    [draft.ancestry, updateDraft],
  );

  const toggleMixedSpeciesSkill = useCallback(
    (skillId: string) => {
      const current = draft.ancestry?.selectedSpeciesSkillIds ?? [];
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedSpeciesSkillIds: toggleMixedSpeciesSkillSelection(current, skillId),
        },
      });
    },
    [draft.ancestry, updateDraft],
  );

  const speciesChoiceTraitParents = speciesTraits.filter((t) => getChoiceOptionIds(t).length > 0);
  const canContinueSingle = canContinueAncestrySingle({
    selectedTraitIds,
    ancestryTraitCount: ancestryTraits.length,
    speciesChoiceParents: speciesChoiceTraitParents,
    speciesTraitChoices: draft.ancestry?.selectedSpeciesTraitChoices,
  });
  const canContinueMixed = canContinueAncestryMixed({
    selectedSpeciesTraits,
    selectedTraitIds,
    ancestryTraitCount: ancestryTraits.length,
    selectedSize: draft.ancestry?.selectedSize,
    mixedSkillOptionCount: mixedSpeciesSkillOptions.length,
    selectedSpeciesSkillIds,
  });

  const canContinue = isMixed && speciesA && speciesB ? canContinueMixed : canContinueSingle;

  const ancestryValidationContext = {
    allSpecies,
    codexSkills: allSkills ?? null,
    allTraits: allTraits ?? null,
  };
  const ancestryIssues = getValidationIssuesForStep('ancestry', draft, ancestryValidationContext);
  const ancestryCompletion = getStepCompletion('ancestry', draft, ancestryValidationContext);
  const ancestryPathNotes = draft.creationMode === 'path' ? pathData?.level1?.notes : undefined;

  return {
    draft,
    allTraits,
    isMixed,
    selectedSpecies,
    speciesA,
    speciesB,
    speciesSkillChips,
    mixedSpeciesSkillOptions,
    selectedTraitIds,
    selectedFlaw,
    selectedCharacteristic,
    selectedSpeciesTraits,
    selectedFlawSpeciesId,
    selectedSpeciesSkillIds,
    speciesTraits,
    ancestryTraits,
    flaws,
    characteristics,
    speciesTraitsFromA,
    speciesTraitsFromB,
    ancestryTraitsFromFlawSpecies,
    combinedSizes,
    mixedAveragedPhysical,
    maxAncestryTraits,
    toggleAncestryTrait,
    toggleFlaw,
    toggleFlawMixed,
    setMixedSize,
    setSpeciesTraitA,
    setSpeciesTraitB,
    setAncestryBaseMixed,
    setAncestryExtraMixed,
    toggleCharacteristic,
    setSpeciesTraitChoice,
    toggleMixedSpeciesSkill,
    canContinue,
    ancestryIssues,
    ancestryCompletion,
    ancestryPathNotes,
    prevStep,
    nextStep,
    setStep,
  };
}
