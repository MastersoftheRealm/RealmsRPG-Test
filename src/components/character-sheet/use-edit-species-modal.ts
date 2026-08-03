/**
 * Edit Species Modal — state, derived data, and handlers.
 * Keeps `edit-species-modal.tsx` as a thin Modal shell (TASK-666f).
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Character, CharacterAncestry, CharacterSkillRow } from '@/types';
import { useMergedSpecies, useTraits, useCodexSkills, useUserSpecies, resolveTraitIds, type Species } from '@/hooks';
import { migrateSkillsAfterSpeciesChange } from '@/lib/species-skill-migration';
import { getChoiceOptionIds } from '@/lib/choice-trait';
import {
  averageMixedPhysical,
  buildMixedSpeciesAncestryDraft,
  buildMixedSpeciesSkillOptions,
  buildSingleSpeciesAncestryDraft,
  canContinueAncestryMixed,
  canContinueAncestrySingle,
  combineSpeciesSizes,
  resolveAncestryTraitBuckets,
  toggleCappedTraitSelection,
  toggleMixedSpeciesSkillSelection,
  toggleOptionalSingleSelection,
  trimTraitsForFlawMax,
} from '@/lib/ancestry/ancestry-selection';

export interface EditSpeciesResult {
  ancestry: CharacterAncestry;
  skills: CharacterSkillRow[];
}

export type EditSpeciesStep = 'species' | 'ancestry';

interface UseEditSpeciesModalArgs {
  isOpen: boolean;
  character: Character;
  onSave: (updates: EditSpeciesResult) => void;
  onClose: () => void;
}

export function useEditSpeciesModal({ isOpen, character, onSave, onClose }: UseEditSpeciesModalArgs) {
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: allTraits } = useTraits();
  const { data: allSkills } = useCodexSkills();
  const { data: userSpecies = [] } = useUserSpecies();
  const userSpeciesIds = useMemo(() => new Set(userSpecies.map((s) => s.id)), [userSpecies]);

  const [step, setStep] = useState<EditSpeciesStep>('species');
  const [draftAncestry, setDraftAncestry] = useState<CharacterAncestry | null>(null);
  const [showMixedModal, setShowMixedModal] = useState(false);
  const wasOpenRef = useRef(false);

  // Initialize draft only when the modal opens (not on every `character.ancestry` reference change while open).
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && character?.ancestry) {
      const next = { ...character.ancestry } as CharacterAncestry;
      queueMicrotask(() => {
        setDraftAncestry(next);
        setStep('species');
      });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, character?.ancestry, character?.id]);

  const isMixed = draftAncestry?.mixed === true;
  const selectedSpecies = useMemo(() => {
    if (!draftAncestry?.id || (draftAncestry.mixed === true && draftAncestry.speciesIds?.length === 2)) {
      return null;
    }
    return allSpecies.find((s: Species) => String(s.id) === String(draftAncestry.id)) ?? null;
  }, [draftAncestry, allSpecies]);
  const speciesA = useMemo(() => {
    if (draftAncestry?.mixed !== true || !draftAncestry?.speciesIds?.[0]) return null;
    return allSpecies.find((s: Species) => String(s.id) === String(draftAncestry.speciesIds?.[0])) ?? null;
  }, [draftAncestry, allSpecies]);
  const speciesB = useMemo(() => {
    if (draftAncestry?.mixed !== true || !draftAncestry?.speciesIds?.[1]) return null;
    return allSpecies.find((s: Species) => String(s.id) === String(draftAncestry.speciesIds?.[1])) ?? null;
  }, [draftAncestry, allSpecies]);

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

  const combinedSizes = useMemo(
    () => combineSpeciesSizes(speciesA, speciesB),
    [speciesA, speciesB],
  );

  const mixedSpeciesSkillOptions = useMemo(
    () => buildMixedSpeciesSkillOptions(speciesA, speciesB, allSkills),
    [speciesA, speciesB, allSkills],
  );

  const mixedAveragedPhysical = useMemo(
    () => averageMixedPhysical(speciesA, speciesB),
    [speciesA, speciesB],
  );

  const selectedTraitIds = useMemo(
    () => draftAncestry?.selectedTraits || [],
    [draftAncestry?.selectedTraits],
  );
  const selectedFlaw = draftAncestry?.selectedFlaw ?? null;
  const selectedCharacteristic = draftAncestry?.selectedCharacteristic ?? null;
  const selectedSpeciesTraits = draftAncestry?.selectedSpeciesTraits;
  const selectedFlawSpeciesId = draftAncestry?.selectedFlawSpeciesId ?? null;
  const selectedSpeciesSkillIds = useMemo(
    () => draftAncestry?.selectedSpeciesSkillIds ?? [],
    [draftAncestry?.selectedSpeciesSkillIds],
  );
  const maxAncestryTraits = selectedFlaw ? 2 : 1;

  const ancestryTraitsFromFlawSpecies = useMemo(() => {
    if (!selectedFlawSpeciesId || !allTraits) return [];
    const sp = speciesA?.id === selectedFlawSpeciesId ? speciesA : speciesB;
    return sp ? resolveTraitIds(sp.ancestry_traits || [], allTraits) : [];
  }, [selectedFlawSpeciesId, speciesA, speciesB, allTraits]);

  const flawsFromA = useMemo(
    () => (speciesA && allTraits ? resolveTraitIds(speciesA.flaws || [], allTraits) : []),
    [speciesA, allTraits],
  );
  const flawsFromB = useMemo(
    () => (speciesB && allTraits ? resolveTraitIds(speciesB.flaws || [], allTraits) : []),
    [speciesB, allTraits],
  );

  const updateDraft = useCallback((updates: Partial<CharacterAncestry>) => {
    setDraftAncestry((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const handleSingleSpeciesSelect = useCallback((s: Species) => {
    setDraftAncestry(buildSingleSpeciesAncestryDraft(s));
  }, []);

  const handleMixedConfirm = useCallback(
    (a: { id: string; name: string }, b: { id: string; name: string }) => {
      setDraftAncestry(buildMixedSpeciesAncestryDraft(a, b));
      setShowMixedModal(false);
    },
    [],
  );

  const toggleAncestryTrait = useCallback(
    (traitId: string) => {
      updateDraft({
        selectedTraits: toggleCappedTraitSelection(selectedTraitIds, traitId, maxAncestryTraits),
      });
    },
    [selectedTraitIds, maxAncestryTraits, updateDraft],
  );

  const toggleFlaw = useCallback(
    (flawId: string) => {
      const nextFlaw = toggleOptionalSingleSelection(selectedFlaw, flawId);
      updateDraft({
        selectedFlaw: nextFlaw ?? undefined,
        selectedTraits: trimTraitsForFlawMax(selectedTraitIds, nextFlaw),
      });
    },
    [selectedFlaw, selectedTraitIds, updateDraft],
  );

  const toggleFlawMixed = useCallback(
    (flawId: string, speciesId: string) => {
      const isSelected = selectedFlaw === flawId;
      const nextFlaw = isSelected ? null : flawId;
      updateDraft({
        selectedFlaw: nextFlaw ?? undefined,
        selectedFlawSpeciesId: nextFlaw ? speciesId : undefined,
        selectedTraits: trimTraitsForFlawMax(selectedTraitIds, nextFlaw),
      });
    },
    [selectedFlaw, selectedTraitIds, updateDraft],
  );

  const toggleCharacteristic = useCallback(
    (charId: string) => {
      updateDraft({
        selectedCharacteristic: toggleOptionalSingleSelection(selectedCharacteristic, charId),
      });
    },
    [selectedCharacteristic, updateDraft],
  );

  const setSpeciesTraitChoice = useCallback(
    (parentId: string, optionId: string) => {
      const prev = draftAncestry?.selectedSpeciesTraitChoices ?? {};
      const next = { ...prev };
      if (!optionId) delete next[String(parentId)];
      else next[String(parentId)] = String(optionId);
      updateDraft({ selectedSpeciesTraitChoices: next });
    },
    [draftAncestry?.selectedSpeciesTraitChoices, updateDraft],
  );

  const setSpeciesTraitA = useCallback(
    (traitId: string) => {
      updateDraft({
        selectedSpeciesTraits: [traitId, selectedSpeciesTraits?.[1] ?? ''] as [string, string],
      });
    },
    [selectedSpeciesTraits, updateDraft],
  );

  const setSpeciesTraitB = useCallback(
    (traitId: string) => {
      updateDraft({
        selectedSpeciesTraits: [selectedSpeciesTraits?.[0] ?? '', traitId] as [string, string],
      });
    },
    [selectedSpeciesTraits, updateDraft],
  );

  const setAncestryBaseMixed = useCallback(
    (traitId: string) => {
      const base = selectedTraitIds[0];
      const isSelected = base === traitId;
      const newBase = isSelected ? '' : traitId;
      const extra = selectedFlaw ? (selectedTraitIds[1] ?? '') : '';
      updateDraft({
        selectedTraits: extra ? [newBase, extra].filter(Boolean) : newBase ? [newBase] : [],
      });
    },
    [selectedTraitIds, selectedFlaw, updateDraft],
  );

  const setAncestryExtraMixed = useCallback(
    (traitId: string) => {
      const base = selectedTraitIds[0] ?? '';
      const extra = selectedTraitIds[1];
      const isSelected = extra === traitId;
      const newExtra = isSelected ? '' : traitId;
      updateDraft({ selectedTraits: [base, newExtra].filter(Boolean) });
    },
    [selectedTraitIds, updateDraft],
  );

  const toggleMixedSpeciesSkill = useCallback(
    (skillId: string) => {
      updateDraft({
        selectedSpeciesSkillIds: toggleMixedSpeciesSkillSelection(selectedSpeciesSkillIds, skillId),
      });
    },
    [selectedSpeciesSkillIds, updateDraft],
  );

  const canContinueSpecies = Boolean(draftAncestry?.id && draftAncestry?.name);
  const speciesChoiceTraitParents = useMemo(
    () => (!isMixed ? speciesTraits.filter((t) => getChoiceOptionIds(t).length > 0) : []),
    [isMixed, speciesTraits],
  );
  const canContinueAncestry =
    isMixed && speciesA && speciesB
      ? canContinueAncestryMixed({
          selectedSpeciesTraits,
          selectedTraitIds,
          ancestryTraitCount: ancestryTraits.length,
          selectedSize: draftAncestry?.selectedSize,
          mixedSkillOptionCount: mixedSpeciesSkillOptions.length,
          selectedSpeciesSkillIds,
        })
      : canContinueAncestrySingle({
          selectedTraitIds,
          ancestryTraitCount: ancestryTraits.length,
          speciesChoiceParents: speciesChoiceTraitParents,
          speciesTraitChoices: draftAncestry?.selectedSpeciesTraitChoices,
        });

  const handleSave = useCallback(() => {
    if (!draftAncestry || !character) return;
    let ancestryToSave = draftAncestry;
    if (draftAncestry.mixed === true) {
      const st = draftAncestry.selectedSpeciesTraits;
      const a = Array.isArray(st) ? String(st[0] ?? '').trim() : '';
      const b = Array.isArray(st) ? String(st[1] ?? '').trim() : '';
      ancestryToSave = {
        ...draftAncestry,
        selectedSpeciesTraits: [a, b] as [string, string],
        mixedPhysical: mixedAveragedPhysical ?? draftAncestry.mixedPhysical,
      };
    }
    const migratedSkills = migrateSkillsAfterSpeciesChange(character, ancestryToSave, allSpecies);
    onSave({ ancestry: ancestryToSave, skills: migratedSkills });
    onClose();
  }, [character, draftAncestry, allSpecies, mixedAveragedPhysical, onSave, onClose]);

  const nameA = draftAncestry?.speciesNames?.[0] ?? speciesA?.name;
  const nameB = draftAncestry?.speciesNames?.[1] ?? speciesB?.name;

  return {
    allSpecies,
    allTraits,
    userSpeciesIds,
    step,
    setStep,
    draftAncestry,
    showMixedModal,
    setShowMixedModal,
    isMixed,
    speciesA,
    speciesB,
    speciesTraits,
    ancestryTraits,
    flaws,
    characteristics,
    speciesTraitsFromA,
    speciesTraitsFromB,
    combinedSizes,
    mixedSpeciesSkillOptions,
    mixedAveragedPhysical,
    selectedTraitIds,
    selectedFlaw,
    selectedCharacteristic,
    selectedSpeciesTraits,
    selectedFlawSpeciesId,
    selectedSpeciesSkillIds,
    maxAncestryTraits,
    ancestryTraitsFromFlawSpecies,
    flawsFromA,
    flawsFromB,
    updateDraft,
    handleSingleSpeciesSelect,
    handleMixedConfirm,
    toggleAncestryTrait,
    toggleFlaw,
    toggleFlawMixed,
    toggleCharacteristic,
    setSpeciesTraitChoice,
    setSpeciesTraitA,
    setSpeciesTraitB,
    setAncestryBaseMixed,
    setAncestryExtraMixed,
    toggleMixedSpeciesSkill,
    canContinueSpecies,
    canContinueAncestry,
    handleSave,
    nameA,
    nameB,
  };
}
