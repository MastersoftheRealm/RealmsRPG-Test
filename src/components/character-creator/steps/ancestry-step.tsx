/**
 * Ancestry Step
 * ==============
 * Select ancestry traits, characteristic, and optional flaw from species.
 * 
 * Selection Rules:
 * - 1 ancestry trait by default
 * - Selecting a flaw grants +1 extra ancestry trait (up to 2 total)
 * - 1 characteristic (optional)
 * - Species traits are automatic (not selectable)
 */

'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Chip, Button, Alert, Card } from '@/components/ui';
import { SelectionToggle, ChoiceTraitOptionListPicker, InfoTippy } from '@/components/shared';
import {
  getChoiceOptionIds,
  resolveChoiceOptionTraits,
  firstSelectedChoiceOptionId,
} from '@/lib/choice-trait';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { PathHelpCard, PathNotes } from '@/components/character-creator/PathHelpCard';
import { useMergedSpecies, useTraits, useCodexSkills, useCreatorPathData, resolveTraitIds, resolveSkillIdsToNames, type Trait, type Species } from '@/hooks';
import { Heart, AlertTriangle, Sparkles, Star } from 'lucide-react';
import { chooseYourAncestryTraits } from '../../../../public/tooltip-text';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { getValidationIssuesForStep, getStepCompletion } from '@/lib/character-creator-validation';

interface ResolvedTrait extends Trait {
  found: boolean;
}

function resolveTraits(ids: (string | number)[], allTraits: Trait[]): ResolvedTrait[] {
  return resolveTraitIds(ids, allTraits).map(t => ({ ...t, found: t.id !== t.name }));
}

export function AncestryStep() {
  const { draft, nextStep, prevStep, setStep, updateDraft } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: allTraits } = useTraits();
  const { data: allSkills } = useCodexSkills();
  const pathData = useCreatorPathData();

  const isMixed = draft.ancestry?.mixed === true;

  // Single species or mixed: resolve species A and B
  const selectedSpecies = useMemo(() => {
    if (!allSpecies.length || !draft.ancestry?.id) return null;
    if (isMixed && draft.ancestry.speciesIds?.length === 2) return null; // use speciesA/speciesB for mixed
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

  // Resolve species skill IDs to names (single or merged for mixed)
  const speciesSkillNames = useMemo(() => {
    if (!allSkills) return [];
    if (selectedSpecies) return resolveSkillIdsToNames(selectedSpecies.skills || [], allSkills);
    if (speciesA && speciesB) {
      const merged = [...(speciesA.skills || []), ...(speciesB.skills || [])];
      const unique = Array.from(new Set(merged.map(String)));
      return resolveSkillIdsToNames(unique, allSkills);
    }
    return [];
  }, [selectedSpecies, speciesA, speciesB, allSkills]);

  // Mixed only: unique skill IDs from both species for "choose 2" (id + name)
  const mixedSpeciesSkillOptions = useMemo(() => {
    if (!speciesA || !speciesB || !allSkills) return [];
    const merged = [...(speciesA.skills || []), ...(speciesB.skills || [])];
    const seen = new Set<string>();
    const map = new Map(allSkills.map((s: { id: string | number; name?: string }) => [String(s.id), s.name ?? String(s.id)]));
    const options: { id: string; name: string }[] = [];
    merged.forEach((id: string | number) => {
      const sid = String(id);
      if (seen.has(sid)) return;
      seen.add(sid);
      options.push({ id: sid, name: sid === '0' ? 'Any' : (map.get(sid) ?? sid) });
    });
    return options;
  }, [speciesA, speciesB, allSkills]);

  // Current selections from draft
  const selectedTraitIds = draft.ancestry?.selectedTraits || [];
  const selectedFlaw = draft.ancestry?.selectedFlaw || null;
  const selectedCharacteristic = draft.ancestry?.selectedCharacteristic || null;
  const selectedSpeciesTraits = draft.ancestry?.selectedSpeciesTraits;
  const selectedFlawSpeciesId = draft.ancestry?.selectedFlawSpeciesId || null;

  // Resolve trait categories: single species
  const { speciesTraits, ancestryTraits, flaws, characteristics } = useMemo(() => {
    if (!allTraits) return { speciesTraits: [], ancestryTraits: [], flaws: [], characteristics: [] };
    const resolve = (ids: (string | number)[]) => resolveTraits(ids, allTraits);

    if (selectedSpecies) {
      return {
        speciesTraits: resolve(selectedSpecies.species_traits || []),
        ancestryTraits: resolve(selectedSpecies.ancestry_traits || []),
        flaws: resolve(selectedSpecies.flaws || []),
        characteristics: resolve(selectedSpecies.characteristics || []),
      };
    }

    if (speciesA && speciesB) {
      // Deduplicate by ID so shared traits between the two species appear once (TASK-284)
      const uniqueAncestryIds = Array.from(new Set([...(speciesA.ancestry_traits || []), ...(speciesB.ancestry_traits || [])].map(String)));
      const uniqueFlawIds = Array.from(new Set([...(speciesA.flaws || []), ...(speciesB.flaws || [])].map(String)));
      const uniqueCharIds = Array.from(new Set([...(speciesA.characteristics || []), ...(speciesB.characteristics || [])].map(String)));
      return {
        speciesTraits: [], // mixed uses selectedSpeciesTraits UI
        ancestryTraits: resolve(uniqueAncestryIds),
        flaws: resolve(uniqueFlawIds),
        characteristics: resolve(uniqueCharIds),
      };
    }

    return { speciesTraits: [], ancestryTraits: [], flaws: [], characteristics: [] };
  }, [selectedSpecies, speciesA, speciesB, allTraits]);

  // Mixed: species traits from A and B (for "pick one from each")
  const speciesTraitsFromA = useMemo(
    () => (speciesA && allTraits ? resolveTraits(speciesA.species_traits || [], allTraits) : []),
    [speciesA, allTraits]
  );
  const speciesTraitsFromB = useMemo(
    () => (speciesB && allTraits ? resolveTraits(speciesB.species_traits || [], allTraits) : []),
    [speciesB, allTraits]
  );

  // Mixed: ancestry traits from flaw species only (for extra trait when flaw taken)
  const ancestryTraitsFromFlawSpecies = useMemo(() => {
    if (!selectedFlawSpeciesId || !allTraits) return [];
    const sp = speciesA?.id === selectedFlawSpeciesId ? speciesA : speciesB;
    return sp ? resolveTraits(sp.ancestry_traits || [], allTraits) : [];
  }, [selectedFlawSpeciesId, speciesA, speciesB, allTraits]);

  // Mixed: combined unique sizes (max 4)
  const combinedSizes = useMemo(() => {
    if (!speciesA && !speciesB) return [];
    const set = new Set<string>();
    (speciesA?.sizes || []).forEach((s) => set.add(s));
    (speciesB?.sizes || []).forEach((s) => set.add(s));
    if (speciesA?.size) set.add(speciesA.size);
    if (speciesB?.size) set.add(speciesB.size);
    return Array.from(set).slice(0, 4);
  }, [speciesA, speciesB]);

  // Mixed: averaged physical
  const mixedAveragedPhysical = useMemo(() => {
    if (!speciesA || !speciesB) return null;
    const a = speciesA as Species;
    const b = speciesB as Species;
    const aveHeight =
      (Number(a.ave_height) || 0) + (Number(b.ave_height) || 0) !== 0
        ? Math.round(((Number(a.ave_height) || 0) + (Number(b.ave_height) || 0)) / 2)
        : undefined;
    const aveWeight =
      (Number(a.ave_weight) || 0) + (Number(b.ave_weight) || 0) !== 0
        ? Math.round(((Number(a.ave_weight) || 0) + (Number(b.ave_weight) || 0)) / 2)
        : undefined;
    const lifA = a.adulthood_lifespan;
    const lifB = b.adulthood_lifespan;
    const adulthood =
      lifA?.[0] != null && lifB?.[0] != null
        ? Math.round((Number(lifA[0]) + Number(lifB[0])) / 2)
        : undefined;
    const maxAge =
      lifA?.[1] != null && lifB?.[1] != null
        ? Math.round((Number(lifA[1]) + Number(lifB[1])) / 2)
        : undefined;
    return { aveHeight, aveWeight, adulthood, maxAge };
  }, [speciesA, speciesB]);

  // Calculate max ancestry traits based on flaw selection
  const maxAncestryTraits = selectedFlaw ? 2 : 1;

  // Toggle ancestry trait selection
  const toggleAncestryTrait = useCallback((traitId: string) => {
    const isSelected = selectedTraitIds.includes(traitId);
    let newTraits: string[];

    if (isSelected) {
      newTraits = selectedTraitIds.filter(id => id !== traitId);
    } else {
      if (selectedTraitIds.length >= maxAncestryTraits) {
        newTraits = [...selectedTraitIds.slice(1), traitId];
      } else {
        newTraits = [...selectedTraitIds, traitId];
      }
    }

    updateDraft({
      ancestry: {
        ...draft.ancestry,
        id: draft.ancestry?.id || '',
        name: draft.ancestry?.name || '',
        selectedTraits: newTraits,
      },
    });
  }, [selectedTraitIds, maxAncestryTraits, draft.ancestry, updateDraft]);

  // Toggle flaw selection (single species)
  const toggleFlaw = useCallback((flawId: string) => {
    const isSelected = selectedFlaw === flawId;
    const newFlaw = isSelected ? null : flawId;

    const currentTraits = selectedTraitIds;
    const newMaxTraits = newFlaw ? 2 : 1;
    const newTraits = currentTraits.length > newMaxTraits 
      ? currentTraits.slice(0, newMaxTraits)
      : currentTraits;

    updateDraft({
      ancestry: {
        ...draft.ancestry,
        id: draft.ancestry?.id || '',
        name: draft.ancestry?.name || '',
        selectedFlaw: newFlaw,
        selectedTraits: newTraits,
      },
    });
  }, [selectedFlaw, selectedTraitIds, draft.ancestry, updateDraft]);

  // Mixed: set flaw and which species it's from (for extra ancestry trait rule)
  const toggleFlawMixed = useCallback((flawId: string, speciesId: string) => {
    const isSelected = selectedFlaw === flawId;
    const newFlaw = isSelected ? null : flawId;
    const newFlawSpeciesId = isSelected ? null : speciesId;
    const currentTraits = selectedTraitIds;
    const newMaxTraits = newFlaw ? 2 : 1;
    const newTraits = currentTraits.length > newMaxTraits ? currentTraits.slice(0, newMaxTraits) : currentTraits;
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
        selectedTraits: newTraits,
      },
    });
  }, [selectedFlaw, selectedTraitIds, draft.ancestry, updateDraft]);

  // Mixed: set size and persist mixedPhysical
  const setMixedSize = useCallback((size: string) => {
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
  }, [draft.ancestry, mixedAveragedPhysical, updateDraft]);

  // Mixed: set species trait from species A (index 0)
  const setSpeciesTraitA = useCallback((traitId: string) => {
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
  }, [draft.ancestry, updateDraft]);

  // Mixed: set species trait from species B (index 1)
  const setSpeciesTraitB = useCallback((traitId: string) => {
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
  }, [draft.ancestry, updateDraft]);

  // Mixed: set base ancestry trait (1 from either species)
  const setAncestryBaseMixed = useCallback((traitId: string) => {
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
        selectedTraits: extra ? [newBase, extra].filter(Boolean) : (newBase ? [newBase] : []),
      },
    });
  }, [draft.ancestry, selectedFlaw, updateDraft]);

  // Mixed: set extra ancestry trait (from flaw species only)
  const setAncestryExtraMixed = useCallback((traitId: string) => {
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
  }, [draft.ancestry, updateDraft]);

  // Toggle characteristic selection
  const toggleCharacteristic = useCallback((charId: string) => {
    const isSelected = selectedCharacteristic === charId;
    updateDraft({
      ancestry: {
        ...draft.ancestry,
        id: draft.ancestry?.id || '',
        name: draft.ancestry?.name || '',
        selectedCharacteristic: isSelected ? null : charId,
      },
    });
  }, [selectedCharacteristic, draft.ancestry, updateDraft]);

  // Single-species: pick option for each species trait that has option_trait_ids
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

  // Mixed: toggle one of the 2 chosen species skills
  const selectedSpeciesSkillIds = draft.ancestry?.selectedSpeciesSkillIds ?? [];
  const toggleMixedSpeciesSkill = useCallback((skillId: string) => {
    const current = draft.ancestry?.selectedSpeciesSkillIds ?? [];
    const idx = current.indexOf(skillId);
    if (idx >= 0) {
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedSpeciesSkillIds: current.filter((_, i) => i !== idx),
        },
      });
    } else if (current.length < 2) {
      updateDraft({
        ancestry: {
          ...draft.ancestry,
          id: draft.ancestry?.id || '',
          name: draft.ancestry?.name || '',
          mixed: true,
          speciesIds: draft.ancestry?.speciesIds,
          speciesNames: draft.ancestry?.speciesNames,
          selectedSpeciesSkillIds: [...current, skillId],
        },
      });
    }
  }, [draft.ancestry, updateDraft]);

  // Validation: single species — ancestry picks + each choice-type species trait must have a valid option
  const speciesTraitChoicesMap = draft.ancestry?.selectedSpeciesTraitChoices ?? {};
  const speciesChoiceTraitParents = speciesTraits.filter((t) => getChoiceOptionIds(t).length > 0);
  const speciesChoicePicksComplete = speciesChoiceTraitParents.every((t) => {
    const pid = String(t.id);
    const picked = speciesTraitChoicesMap[pid];
    return Boolean(picked && getChoiceOptionIds(t).includes(String(picked)));
  });
  const canContinueSingle =
    (selectedTraitIds.length >= 1 || ancestryTraits.length === 0) && speciesChoicePicksComplete;
  // Mixed: need 1 species trait from each, 1 ancestry trait (2 if flaw), size chosen, and exactly 2 species skills
  const hasSpeciesTraitA = !!selectedSpeciesTraits?.[0];
  const hasSpeciesTraitB = !!selectedSpeciesTraits?.[1];
  const hasTwoSpeciesSkills = mixedSpeciesSkillOptions.length <= 2
    ? selectedSpeciesSkillIds.length === mixedSpeciesSkillOptions.length
    : selectedSpeciesSkillIds.length === 2;
  const canContinueMixed =
    hasSpeciesTraitA &&
    hasSpeciesTraitB &&
    (selectedTraitIds.length >= 1 || ancestryTraits.length === 0) &&
    !!draft.ancestry?.selectedSize &&
    hasTwoSpeciesSkills;

  const canContinue = isMixed && speciesA && speciesB ? canContinueMixed : canContinueSingle;

  // Guided "what's left to choose" checklist (REALMS_PRODUCT_OVERVIEW.md §5.3:
  // the user never hunts for a missing pick). Reuses step validation so the
  // checklist and the Continue gate never disagree.
  const ancestryValidationContext = {
    allSpecies,
    codexSkills: allSkills ?? null,
    allTraits: allTraits ?? null,
  };
  const ancestryIssues = getValidationIssuesForStep('ancestry', draft, ancestryValidationContext);
  const ancestryCompletion = getStepCompletion('ancestry', draft, ancestryValidationContext);
  const ancestryPathNotes =
    draft.creationMode === 'path' ? pathData?.level1?.notes : undefined;

  const guidedChecklist = (
    <>
      {draft.creationMode === 'path' && draft.archetype?.name && (
        <>
          <PathHelpCard pathName={draft.archetype.name}>
            Complete each ancestry choice below — the checklist updates as you go.
          </PathHelpCard>
          <PathNotes pathName={draft.archetype.name} notes={ancestryPathNotes} />
        </>
      )}
      <div
        className={cn(
          'mb-6 rounded-xl border-2 p-4',
          ancestryIssues.length === 0 ? statusPanel.complete : statusPanel.info
        )}
        role="region"
        aria-label="Ancestry choices remaining"
      >
        <h3 className="font-semibold text-text-primary mb-2">What to choose</h3>
        {ancestryIssues.length === 0 ? (
          <p className="text-sm text-success-fg">✓ Your ancestry is complete — nothing left to pick.</p>
        ) : (
          <ul className="space-y-1.5">
            {ancestryIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span aria-hidden className="shrink-0">{issue.emoji}</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  // No species selected at all
  if (!draft.ancestry?.id) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          <h2 className="text-2xl font-bold text-text-primary">Choose Your Ancestry Traits</h2>
          <InfoTippy content={chooseYourAncestryTraits} allowHTML label="Ancestry trait rules" size="inline" />
        </div>
        <p className="text-text-secondary mb-6">
          Customize your character with ancestry traits and an optional flaw.
        </p>
        <Alert variant="warning" className="mb-8">
          <div className="text-center">
            <p className="mb-4">
              <strong>No species selected!</strong> Please choose a species first.
            </p>
            <Button onClick={() => setStep('species')} className="min-h-11">
              Go to Species Selection
            </Button>
          </div>
        </Alert>
        <CreatorStepFooter
          onBack={prevStep}
          primaryAction={
            <Button disabled className="min-h-11 min-w-11">Continue →</Button>
          }
        />
      </div>
    );
  }

  // Mixed species UI
  if (isMixed && speciesA && speciesB) {
    const nameA = draft.ancestry?.speciesNames?.[0] ?? speciesA.name;
    const nameB = draft.ancestry?.speciesNames?.[1] ?? speciesB.name;
    const flawsFromA = allTraits ? resolveTraits(speciesA.flaws || [], allTraits) : [];
    const flawsFromB = allTraits ? resolveTraits(speciesB.flaws || [], allTraits) : [];
    const ancestryForFirstSlot = ancestryTraits;
    const ancestryForSecondSlot = selectedFlaw ? ancestryTraitsFromFlawSpecies : [];
    const ph = mixedAveragedPhysical;
    const selectedSize = draft.ancestry?.selectedSize || '';

    return (
      <div className="max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1 mb-2">
              <h2 className="text-2xl font-bold text-text-primary">Mixed Species: Ancestry</h2>
              <InfoTippy content={chooseYourAncestryTraits} allowHTML label="Ancestry trait rules" size="inline" />
            </div>
            <p className="text-text-secondary">
              <strong>{nameA}</strong> + <strong>{nameB}</strong>. Set physical traits and choose one species trait from each, then ancestry and optional flaw.
            </p>
          </div>
          <button
            onClick={() => setStep('species')}
            className="text-sm text-primary-link-fg hover:text-primary-fg-hover underline"
          >
            Change Species
          </button>
        </div>

        {guidedChecklist}

        {/* Physical: averaged + size */}
        <Card className="bg-surface-alt p-4 mb-6 shadow-none">
          <h3 className="font-semibold text-text-primary mb-3">Physical (averaged)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
            <div>
              <span className="block text-xs text-text-muted uppercase">Avg Height</span>
              <span className="font-bold text-text-primary">{ph?.aveHeight != null ? `${ph.aveHeight} cm` : '-'}</span>
            </div>
            <div>
              <span className="block text-xs text-text-muted uppercase">Avg Weight</span>
              <span className="font-bold text-text-primary">{ph?.aveWeight != null ? `${ph.aveWeight} kg` : '-'}</span>
            </div>
            <div>
              <span className="block text-xs text-text-muted uppercase">Adulthood</span>
              <span className="font-bold text-text-primary">{ph?.adulthood != null ? `${ph.adulthood} yr` : '-'}</span>
            </div>
            <div>
              <span className="block text-xs text-text-muted uppercase">Lifespan (max)</span>
              <span className="font-bold text-text-primary">{ph?.maxAge != null ? `${ph.maxAge} yr` : '-'}</span>
            </div>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase mb-1">Size (choose one)</span>
            <select
              value={selectedSize}
              onChange={(e) => setMixedSize(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-text-primary"
              aria-label="Size for mixed species"
            >
              <option value="">Select size</option>
              {combinedSizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Mixed: choose exactly 2 species skills from the combined list */}
        {mixedSpeciesSkillOptions.length > 0 && (
          <Card className="bg-surface-alt p-4 mb-6 shadow-none">
            <h3 className="font-semibold text-text-primary mb-1">Species skills</h3>
            <p className="text-sm text-text-secondary mb-3">
              Choose exactly 2 skills from the options below (from both species). You get proficiency in these; all other species skills are not granted.
            </p>
            <div className="flex flex-wrap gap-2">
              {mixedSpeciesSkillOptions.map((opt) => {
                const selected = selectedSpeciesSkillIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMixedSpeciesSkill(opt.id)}
                    className={cn(
                      'px-3 py-2 min-h-11 rounded-full text-sm font-medium border transition-colors',
                      selected
                        ? 'bg-primary-subtle-bg border-primary-subtle-border text-primary-subtle-fg'
                        : 'bg-surface border-border-light text-text-secondary hover:bg-surface-alt hover:border-primary-outline-border dark:hover:border-primary-outline-border'
                    )}
                  >
                    {opt.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-muted dark:text-text-secondary mt-2">
              Selected: {selectedSpeciesSkillIds.length} / 2
            </p>
          </Card>
        )}

        {/* Species traits: one from each */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TraitSection
            title={`Species trait from ${nameA}`}
            subtitle="Choose 1"
            icon={<Heart className="w-5 h-5 text-primary-link-fg" />}
            traits={speciesTraitsFromA}
            selectable
            selectedIds={selectedSpeciesTraits?.[0] ? [selectedSpeciesTraits[0]] : []}
            onToggle={(id) => setSpeciesTraitA(id)}
            variant="ancestry"
            allTraits={allTraits ?? undefined}
          />
          <TraitSection
            title={`Species trait from ${nameB}`}
            subtitle="Choose 1"
            icon={<Heart className="w-5 h-5 text-primary-link-fg" />}
            traits={speciesTraitsFromB}
            selectable
            selectedIds={selectedSpeciesTraits?.[1] ? [selectedSpeciesTraits[1]] : []}
            onToggle={(id) => setSpeciesTraitB(id)}
            variant="ancestry"
            allTraits={allTraits ?? undefined}
          />
        </div>

        {/* Ancestry: 1 base, +1 from flaw species if flaw taken */}
        {ancestryForFirstSlot.length > 0 && (
          <TraitSection
            title="Ancestry trait"
            subtitle={selectedFlaw ? '1 from either species; 2nd below from the species you took the flaw from' : 'Choose 1 from either species'}
            icon={<Star className="w-5 h-5 text-warning-700 dark:text-warning-400" />}
            traits={ancestryForFirstSlot}
            selectable
            selectedIds={draft.ancestry?.selectedTraits?.[0] ? [draft.ancestry.selectedTraits[0]] : []}
            onToggle={setAncestryBaseMixed}
            variant="ancestry"
            allTraits={allTraits ?? undefined}
          />
        )}
        {/* Characteristic: 1 from either */}
        {characteristics.length > 0 && (
          <TraitSection
            title="Characteristic"
            subtitle="Choose 1 (optional)"
            icon={<Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            traits={characteristics}
            selectable
            selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
            onToggle={toggleCharacteristic}
            variant="characteristic"
            allTraits={allTraits ?? undefined}
          />
        )}

        {/* Flaws: by species so we can set selectedFlawSpeciesId */}
        {(flawsFromA.length > 0 || flawsFromB.length > 0) && (
          <div className="mb-6">
            <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-700 dark:text-danger-400" />
              Flaw (optional, grants +1 ancestry trait from the same species)
            </h3>
            {flawsFromA.length > 0 && (
              <TraitSection
                title={`Flaws from ${nameA}`}
                subtitle="Choose up to 1"
                icon={<AlertTriangle className="w-5 h-5 text-danger-700 dark:text-danger-400" />}
                traits={flawsFromA}
                selectable
                selectedIds={selectedFlaw && selectedFlawSpeciesId === speciesA.id ? [selectedFlaw] : []}
                onToggle={(id) => toggleFlawMixed(id, speciesA.id)}
                variant="flaw"
                allTraits={allTraits ?? undefined}
              />
            )}
            {flawsFromB.length > 0 && (
              <TraitSection
                title={`Flaws from ${nameB}`}
                subtitle="Choose up to 1"
                icon={<AlertTriangle className="w-5 h-5 text-danger-700 dark:text-danger-400" />}
                traits={flawsFromB}
                selectable
                selectedIds={selectedFlaw && selectedFlawSpeciesId === speciesB.id ? [selectedFlaw] : []}
                onToggle={(id) => toggleFlawMixed(id, speciesB.id)}
                variant="flaw"
                allTraits={allTraits ?? undefined}
              />
            )}
          </div>
        )}

        {/* Extra ancestry trait unlocked by selecting a flaw (intentionally below the flaw section) */}
        {selectedFlaw && ancestryForSecondSlot.length > 0 && (
          <TraitSection
            title={`Extra ancestry trait (from ${selectedFlawSpeciesId === speciesA.id ? nameA : nameB} only)`}
            subtitle="Choose 1"
            icon={<Star className="w-5 h-5 text-warning-700 dark:text-warning-400" />}
            traits={ancestryForSecondSlot}
            selectable
            selectedIds={draft.ancestry?.selectedTraits?.[1] ? [draft.ancestry.selectedTraits[1]] : []}
            onToggle={setAncestryExtraMixed}
            variant="ancestry"
            allTraits={allTraits ?? undefined}
          />
        )}

        <CreatorStepFooter onBack={prevStep} onContinue={nextStep} continueDisabled={!canContinue} completionHint={<span>{ancestryCompletion.label}</span>} />
      </div>
    );
  }

  // Single species: need selectedSpecies
  if (!selectedSpecies) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Alert variant="warning" className="mb-8">
          Species data could not be loaded. Try changing species.
        </Alert>
        <CreatorStepFooter
          onBack={prevStep}
          continueLabel="Change Species"
          onContinue={() => setStep('species')}
        />
      </div>
    );
  }

  // Format sizes display (single)
  const sizesDisplay = Array.isArray(selectedSpecies.sizes) && selectedSpecies.sizes.length > 0
    ? selectedSpecies.sizes.join(' / ')
    : selectedSpecies.size || 'Medium';

  return (
    <div className="max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1 mb-2">
            <h2 className="text-2xl font-bold text-text-primary">Choose Your Ancestry Traits</h2>
            <InfoTippy content={chooseYourAncestryTraits} allowHTML label="Ancestry trait rules" size="inline" />
          </div>
          <p className="text-text-secondary">
            As a <strong>{selectedSpecies.name}</strong>, customize your heritage with traits and abilities.
          </p>
        </div>
        <button
          onClick={() => setStep('species')}
          className="text-sm text-primary-link-fg hover:text-primary-fg-hover underline"
        >
          Change Species
        </button>
      </div>

      {/* Species Info Summary */}
      <Card className="bg-surface-alt p-4 mb-6 shadow-none">
        {/* Species Description */}
        {selectedSpecies.description && (
          <p className="text-text-secondary text-sm mb-4 leading-relaxed">
            {selectedSpecies.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
          <div>
            <span className="block text-xs text-text-muted uppercase">Size</span>
            <span className="font-bold text-text-primary capitalize">{sizesDisplay}</span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Type</span>
            <span className="font-bold text-text-primary capitalize">{selectedSpecies.type || 'Humanoid'}</span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Avg Height</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.ave_height != null && Number(selectedSpecies.ave_height) > 0 ? `${selectedSpecies.ave_height} cm` : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Avg Weight</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.ave_weight != null && Number(selectedSpecies.ave_weight) > 0 ? `${selectedSpecies.ave_weight} kg` : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Adulthood</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.adulthood_lifespan?.[0] != null ? `${selectedSpecies.adulthood_lifespan[0]} yr` : '-'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Lifespan (max)</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.adulthood_lifespan?.[1] != null ? `${selectedSpecies.adulthood_lifespan[1]} yr` : '-'}
            </span>
          </div>
        </div>
        
        {/* Skills and Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border-light">
          {speciesSkillNames.length > 0 && (
            <div>
              <span className="text-xs text-text-muted uppercase">Species Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {speciesSkillNames.map(skillName => (
                  <Chip key={skillName} variant="default" size="sm">
                    {skillName}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {selectedSpecies.languages && selectedSpecies.languages.length > 0 && (
            <div>
              <span className="text-xs text-text-muted uppercase">Languages:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedSpecies.languages.map((lang: string) => (
                  <Chip key={lang} variant="primary" size="sm">
                    {lang}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {guidedChecklist}

      {/* Selection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedTraitIds.length === maxAncestryTraits
            ? statusPanel.complete
            : statusPanel.warning
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Ancestry Traits</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedTraitIds.length === maxAncestryTraits
                ? statusPanel.completeBadge
                : statusPanel.warningBadge
            )}>
              {selectedTraitIds.length} / {maxAncestryTraits}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            {selectedFlaw ? 'Flaw grants +1 trait!' : 'Select a flaw for +1 trait'}
          </p>
        </div>

        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedCharacteristic
            ? statusPanel.complete
            : statusPanel.info
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Characteristic</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedCharacteristic
                ? statusPanel.completeBadge
                : statusPanel.infoBadge
            )}>
              {selectedCharacteristic ? '1' : '0'} / 1
            </span>
          </div>
          <p className="text-xs text-text-secondary">Optional bonus trait</p>
        </div>

        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedFlaw
            ? statusPanel.danger
            : statusPanel.neutral
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Flaw</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedFlaw
                ? statusPanel.dangerBadge
                : 'bg-surface text-text-secondary'
            )}>
              {selectedFlaw ? '1' : '0'} / 1
            </span>
          </div>
          <p className="text-xs text-text-secondary">Optional, grants +1 trait</p>
        </div>
      </div>

      {/* Species Traits (Automatic) */}
      {speciesTraits.length > 0 && (
        <TraitSection
          title="Species Traits"
          subtitle="Granted automatically. When a trait offers variants, pick one before continuing."
          icon={<Heart className="w-5 h-5 text-primary-link-fg" />}
          traits={speciesTraits}
          selectable={false}
          selectedIds={[]}
          onToggle={() => {}}
          allTraits={allTraits ?? undefined}
          speciesTraitChoices={draft.ancestry?.selectedSpeciesTraitChoices}
          onSpeciesTraitChoiceChange={setSpeciesTraitChoice}
        />
      )}

      {/* Ancestry Traits (Selectable) */}
      {ancestryTraits.length > 0 && (
        <TraitSection
          title="Ancestry Traits"
          subtitle={`Select ${maxAncestryTraits} trait${maxAncestryTraits > 1 ? 's' : ''}`}
          icon={<Star className="w-5 h-5 text-warning-700 dark:text-warning-400" />}
          traits={ancestryTraits}
          selectable
          selectedIds={selectedTraitIds}
          onToggle={toggleAncestryTrait}
          variant="ancestry"
          allTraits={allTraits ?? undefined}
        />
      )}

      {/* Characteristics (Selectable - 1) */}
      {characteristics.length > 0 && (
        <TraitSection
          title="Characteristics"
          subtitle="Select 1 characteristic (optional)"
          icon={<Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          traits={characteristics}
          selectable
          selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
          onToggle={toggleCharacteristic}
          variant="characteristic"
          allTraits={allTraits ?? undefined}
        />
      )}

      {/* Flaws (Selectable - 1) */}
      {flaws.length > 0 && (
        <TraitSection
          title="Flaws"
          subtitle="Select 1 flaw to gain an extra ancestry trait (optional)"
          icon={<AlertTriangle className="w-5 h-5 text-danger-700 dark:text-danger-400" />}
          traits={flaws}
          selectable
          selectedIds={selectedFlaw ? [selectedFlaw] : []}
          onToggle={toggleFlaw}
          variant="flaw"
          allTraits={allTraits ?? undefined}
        />
      )}

      {/* No traits message */}
      {ancestryTraits.length === 0 && speciesTraits.length === 0 && (
        <div className="bg-surface-alt border border-border-light rounded-xl p-6 mb-6 text-center">
          <p className="text-text-secondary">
            No specific ancestry traits defined for {selectedSpecies.name}.
            You may continue without selecting traits.
          </p>
        </div>
      )}

      <CreatorStepFooter onBack={prevStep} onContinue={nextStep} continueDisabled={!canContinue} completionHint={<span>{ancestryCompletion.label}</span>} />
    </div>
  );
}

// =============================================================================
// TraitSection Component
// =============================================================================

interface TraitSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  traits: ResolvedTrait[];
  selectable: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  variant?: 'default' | 'ancestry' | 'characteristic' | 'flaw';
  /** When provided, choice traits (option_trait_ids) show a dropdown to pick one option; onToggle(optionId) is used. */
  allTraits?: Trait[] | null;
  /** Single-species automatic species traits: parent id → chosen option trait id. */
  speciesTraitChoices?: Record<string, string>;
  onSpeciesTraitChoiceChange?: (parentTraitId: string, optionId: string) => void;
}

function TraitSection({
  title,
  subtitle,
  icon,
  traits,
  selectable,
  selectedIds,
  onToggle,
  variant = 'default',
  allTraits,
  speciesTraitChoices,
  onSpeciesTraitChoiceChange,
}: TraitSectionProps) {
  const variantStyles = {
    default: {
      border: 'border-border-light',
      header: 'bg-surface-alt',
      selected: 'border-primary-outline-border bg-primary-subtle-bg',
    },
    ancestry: {
      border: 'border-warning-300',
      header: 'bg-warning-light',
      selected: 'border-warning-500 bg-warning-light',
    },
    characteristic: {
      border: 'border-info-border',
      header: 'bg-info-light',
      selected: 'border-info-500 bg-info-light',
    },
    flaw: {
      border: 'border-danger-300',
      header: 'bg-danger-light',
      selected: 'border-danger-500 bg-danger-light',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('border rounded-xl overflow-hidden mb-6', styles.border)}>
      <div className={cn('px-4 py-3 border-b flex items-center gap-2', styles.header, styles.border)}>
        {icon}
        <div>
          <h3 className="font-bold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      
      <div className="divide-y divide-border-subtle">
        {traits.map(trait => {
          const optionIds = getChoiceOptionIds(trait);
          const optionOptions = resolveChoiceOptionTraits(optionIds, allTraits ?? undefined);
          const isChoiceTrait = optionOptions.length > 0;
          const selectedOptionId = firstSelectedChoiceOptionId(optionIds, selectedIds);
          const isSelected = isChoiceTrait ? Boolean(selectedOptionId) : selectedIds.includes(trait.id);

          if (isChoiceTrait && selectable) {
            return (
              <div
                key={trait.id}
                className={cn(
                  'px-4 py-3 transition-colors',
                  'hover:bg-surface-alt',
                  isSelected && styles.selected
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary">{trait.name}</h4>
                    <p className="text-sm text-text-secondary mt-1">{trait.description}</p>
                    <ChoiceTraitOptionListPicker
                      parentTraitName={trait.name}
                      optionTraits={optionOptions}
                      value={selectedOptionId ?? ''}
                      onChange={(next) => {
                        if (selectedOptionId) onToggle(selectedOptionId);
                        if (next) onToggle(next);
                      }}
                      emptyLabel="Choose one option (expand to read)"
                    />
                  </div>
                </div>
              </div>
            );
          }

          if (isChoiceTrait && !selectable && onSpeciesTraitChoiceChange && allTraits) {
            const pid = String(trait.id);
            const value = speciesTraitChoices?.[pid] ?? '';
            const speciesChoiceSelected = Boolean(value);
            return (
              <div
                key={trait.id}
                className={cn(
                  'px-4 py-3 transition-colors',
                  'hover:bg-surface-alt',
                  speciesChoiceSelected && styles.selected
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary">{trait.name}</h4>
                    <p className="text-sm text-text-secondary mt-1">{trait.description}</p>
                    <p className="text-xs text-text-muted mt-1">Choose one variant for this species trait.</p>
                    <ChoiceTraitOptionListPicker
                      parentTraitName={trait.name}
                      optionTraits={optionOptions}
                      value={value}
                      onChange={(next) => onSpeciesTraitChoiceChange(pid, next)}
                      emptyLabel="Choose one option (expand to read)"
                    />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={trait.id}
              className={cn(
                'px-4 py-3 transition-colors',
                selectable && 'hover:bg-surface-alt',
                isSelected && styles.selected
              )}
            >
              <div className="flex items-start gap-3">
                {selectable && (
                  <div className="shrink-0 self-center">
                    <SelectionToggle
                      isSelected={isSelected}
                      onToggle={() => onToggle(trait.id)}
                      size="lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary">{trait.name}</h4>
                  <p className="text-sm text-text-secondary mt-1">{trait.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
