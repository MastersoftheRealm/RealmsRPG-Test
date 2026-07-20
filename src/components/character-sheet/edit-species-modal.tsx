/**
 * Edit Species Modal
 * ==================
 * Change character species and ancestry from the sheet. Two steps: Species, then Ancestry.
 * Reuses Advanced TraitSection + ancestry-selection helpers; on save runs skill migration.
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef, type KeyboardEvent } from 'react';
import { Modal, Button, SelectionCard, SelectionCardSurface } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Character, CharacterAncestry } from '@/types';
import { useMergedSpecies, useTraits, useCodexSkills, useUserSpecies, resolveTraitIds, type Species } from '@/hooks';
import { MixedSpeciesModal } from '@/components/character-creator/MixedSpeciesModal';
import { TraitSection } from '@/components/character-creator/TraitSection';
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
import { AlertTriangle, Sparkles, Star, GitMerge, Heart } from 'lucide-react';

function activateOnEnterOrSpace(e: KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
}

export interface EditSpeciesResult {
  ancestry: CharacterAncestry;
  skills: unknown;
}

interface EditSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onSave: (updates: EditSpeciesResult) => void;
}

export function EditSpeciesModal({ isOpen, onClose, character, onSave }: EditSpeciesModalProps) {
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: allTraits } = useTraits();
  const { data: allSkills } = useCodexSkills();
  const { data: userSpecies = [] } = useUserSpecies();
  const userSpeciesIds = useMemo(() => new Set(userSpecies.map((s) => s.id)), [userSpecies]);

  const [step, setStep] = useState<'species' | 'ancestry'>('species');
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

  const selectedTraitIds = draftAncestry?.selectedTraits || [];
  const selectedFlaw = draftAncestry?.selectedFlaw ?? null;
  const selectedCharacteristic = draftAncestry?.selectedCharacteristic ?? null;
  const selectedSpeciesTraits = draftAncestry?.selectedSpeciesTraits;
  const selectedFlawSpeciesId = draftAncestry?.selectedFlawSpeciesId ?? null;
  const selectedSpeciesSkillIds = draftAncestry?.selectedSpeciesSkillIds ?? [];
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

  if (!isOpen) return null;

  const nameA = draftAncestry?.speciesNames?.[0] ?? speciesA?.name;
  const nameB = draftAncestry?.speciesNames?.[1] ?? speciesB?.name;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'species' ? 'Change species' : 'Ancestry & traits'}
      size="lg"
      fullScreenOnMobile
      flexLayout
    >
      <div className="space-y-4">
        {step === 'species' && (
          <>
            <p className="text-sm text-text-secondary">
              Choose a new species (or mixed). Then you&apos;ll set ancestry traits and, for mixed,
              choose 2 species skills.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectionCardSurface
                role="button"
                tabIndex={0}
                selected={isMixed}
                onClick={() => setShowMixedModal(true)}
                onKeyDown={(e) => activateOnEnterOrSpace(e, () => setShowMixedModal(true))}
                className={cn(
                  'flex flex-col items-center justify-center min-h-[100px] border-dashed',
                  isMixed
                    ? 'border-primary-outline-border'
                    : 'border-border hover:border-primary-outline-border',
                )}
              >
                <GitMerge className="w-8 h-8 text-primary-link-fg mb-1" />
                <span className="font-medium text-text-primary">Mixed species</span>
              </SelectionCardSurface>
              {allSpecies.map((s: Species) => {
                const isSelected =
                  !isMixed && draftAncestry?.id && String(draftAncestry.id) === String(s.id);
                return (
                  <SelectionCard
                    key={s.id}
                    selected={Boolean(isSelected)}
                    onClick={() => handleSingleSpeciesSelect(s)}
                    className="text-left min-h-[100px]"
                  >
                    <span className="font-medium text-text-primary block">{s.name}</span>
                    <p className="text-xs text-text-secondary line-clamp-2 mt-1">{s.description}</p>
                  </SelectionCard>
                );
              })}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('ancestry')} disabled={!canContinueSpecies}>
                Next: Ancestry
              </Button>
            </div>
          </>
        )}

        {step === 'ancestry' && draftAncestry && (
          <>
            <p className="text-sm text-text-secondary">
              {isMixed ? (
                <>
                  <strong>{nameA}</strong> + <strong>{nameB}</strong>. Set size, one species trait
                  from each, ancestry traits, and choose 2 species skills.
                </>
              ) : (
                <>
                  Set species trait options (if any), ancestry traits, and optional
                  flaw/characteristic.
                </>
              )}
            </p>

            {!isMixed && speciesTraits.length > 0 && (
              <TraitSection
                title="Species Traits"
                subtitle="Granted automatically. When a trait offers variants, pick one before saving."
                icon={<Heart className="w-5 h-5 text-primary-link-fg" />}
                traits={speciesTraits}
                selectable={false}
                selectedIds={[]}
                onToggle={() => {}}
                allTraits={allTraits ?? undefined}
                speciesTraitChoices={draftAncestry.selectedSpeciesTraitChoices}
                onSpeciesTraitChoiceChange={setSpeciesTraitChoice}
              />
            )}

            {isMixed && speciesA && speciesB && (
              <>
                <div className="space-y-2 mb-4">
                  <label htmlFor="edit-species-mixed-size" className="block text-xs font-medium text-text-muted uppercase">
                    Size
                  </label>
                  <select
                    id="edit-species-mixed-size"
                    value={draftAncestry.selectedSize ?? ''}
                    onChange={(e) =>
                      updateDraft({
                        selectedSize: e.target.value,
                        mixedPhysical: mixedAveragedPhysical ?? undefined,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary min-h-[44px]"
                    aria-label="Size for mixed species"
                  >
                    <option value="">Select size</option>
                    {combinedSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TraitSection
                    title={`Species trait from ${nameA}`}
                    subtitle="Choose 1"
                    icon={<Heart className="w-5 h-5 text-primary-link-fg" />}
                    traits={speciesTraitsFromA}
                    selectable
                    selectedIds={selectedSpeciesTraits?.[0] ? [selectedSpeciesTraits[0]] : []}
                    onToggle={setSpeciesTraitA}
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
                    onToggle={setSpeciesTraitB}
                    variant="ancestry"
                    allTraits={allTraits ?? undefined}
                  />
                </div>

                {mixedSpeciesSkillOptions.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-semibold text-text-primary">Species skills (choose 2)</h4>
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
                                : 'bg-surface border-border text-text-secondary hover:border-primary-outline-border',
                            )}
                          >
                            {opt.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-text-muted dark:text-text-secondary">
                      Selected: {selectedSpeciesSkillIds.length} / 2
                    </p>
                  </div>
                )}
              </>
            )}

            {!isMixed && ancestryTraits.length > 0 && (
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

            {isMixed && ancestryTraits.length > 0 && (
              <TraitSection
                title="Ancestry trait"
                subtitle={
                  selectedFlaw
                    ? '1 from either species; 2nd below from the species you took the flaw from'
                    : 'Choose 1 from either species'
                }
                icon={<Star className="w-5 h-5 text-warning-700 dark:text-warning-400" />}
                traits={ancestryTraits}
                selectable
                selectedIds={selectedTraitIds[0] ? [selectedTraitIds[0]] : []}
                onToggle={setAncestryBaseMixed}
                variant="ancestry"
                allTraits={allTraits ?? undefined}
              />
            )}

            {!isMixed && characteristics.length > 0 && (
              <TraitSection
                title="Characteristics"
                subtitle="Select 1 characteristic (optional)"
                icon={<Sparkles className="w-5 h-5 text-info-fg dark:text-info-400" />}
                traits={characteristics}
                selectable
                selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
                onToggle={toggleCharacteristic}
                variant="characteristic"
                allTraits={allTraits ?? undefined}
              />
            )}

            {isMixed && characteristics.length > 0 && (
              <TraitSection
                title="Characteristic"
                subtitle="Choose 1 (optional)"
                icon={<Sparkles className="w-5 h-5 text-info-fg dark:text-info-400" />}
                traits={characteristics}
                selectable
                selectedIds={selectedCharacteristic ? [selectedCharacteristic] : []}
                onToggle={toggleCharacteristic}
                variant="characteristic"
                allTraits={allTraits ?? undefined}
              />
            )}

            {!isMixed && flaws.length > 0 && (
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

            {isMixed && (flawsFromA.length > 0 || flawsFromB.length > 0) && speciesA && speciesB && (
              <div className="mb-2">
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
                    selectedIds={
                      selectedFlaw && selectedFlawSpeciesId === speciesA.id ? [selectedFlaw] : []
                    }
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
                    selectedIds={
                      selectedFlaw && selectedFlawSpeciesId === speciesB.id ? [selectedFlaw] : []
                    }
                    onToggle={(id) => toggleFlawMixed(id, speciesB.id)}
                    variant="flaw"
                    allTraits={allTraits ?? undefined}
                  />
                )}
              </div>
            )}

            {isMixed && selectedFlaw && ancestryTraitsFromFlawSpecies.length > 0 && (
              <TraitSection
                title={`Extra ancestry trait (from ${selectedFlawSpeciesId === speciesA?.id ? nameA : nameB} only)`}
                subtitle="Choose 1"
                icon={<Star className="w-5 h-5 text-warning-700 dark:text-warning-400" />}
                traits={ancestryTraitsFromFlawSpecies}
                selectable
                selectedIds={selectedTraitIds[1] ? [selectedTraitIds[1]] : []}
                onToggle={setAncestryExtraMixed}
                variant="ancestry"
                allTraits={allTraits ?? undefined}
              />
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setStep('species')}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={!canContinueAncestry}>
                Save species & ancestry
              </Button>
            </div>
          </>
        )}
      </div>

      <MixedSpeciesModal
        isOpen={showMixedModal}
        onClose={() => setShowMixedModal(false)}
        onConfirm={handleMixedConfirm}
        allSpecies={allSpecies}
        userSpeciesIds={userSpeciesIds}
      />
    </Modal>
  );
}
