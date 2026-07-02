/**
 * Edit Species Modal
 * ==================
 * Change character species and ancestry from the sheet. Two steps: Species, then Ancestry.
 * Reuses creator-style selection; on save runs skill migration (remove/add species skill points).
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Modal, Button, Chip } from '@/components/ui';
import { ChoiceTraitOptionListPicker } from '@/components/shared';
import {
  getChoiceOptionIds,
  resolveChoiceOptionTraits,
  firstSelectedChoiceOptionId,
} from '@/lib/choice-trait';
import { cn } from '@/lib/utils';
import type { Character, CharacterAncestry } from '@/types';
import { useMergedSpecies, useTraits, useCodexSkills, useUserSpecies, resolveTraitIds, type Species, type Trait } from '@/hooks';
import { MixedSpeciesModal } from '@/components/character-creator/MixedSpeciesModal';
import { migrateSkillsAfterSpeciesChange } from '@/lib/species-skill-migration';
import { AlertTriangle, Sparkles, Star, GitMerge, Heart } from 'lucide-react';

interface ResolvedTrait extends Trait {
  found: boolean;
}

function resolveTraits(ids: (string | number)[], allTraits: Trait[]): ResolvedTrait[] {
  return resolveTraitIds(ids, allTraits).map((t) => ({ ...t, found: t.id !== t.name }));
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
    if (!draftAncestry?.id || (draftAncestry.mixed === true && draftAncestry.speciesIds?.length === 2)) return null;
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
      return {
        speciesTraits: [],
        ancestryTraits: resolve([
          ...(speciesA.ancestry_traits || []),
          ...(speciesB.ancestry_traits || []),
        ]),
        flaws: resolve([...(speciesA.flaws || []), ...(speciesB.flaws || [])]),
        characteristics: resolve([
          ...(speciesA.characteristics || []),
          ...(speciesB.characteristics || []),
        ]),
      };
    }
    return { speciesTraits: [], ancestryTraits: [], flaws: [], characteristics: [] };
  }, [selectedSpecies, speciesA, speciesB, allTraits]);

  const speciesTraitsFromA = useMemo(
    () => (speciesA && allTraits ? resolveTraits(speciesA.species_traits || [], allTraits) : []),
    [speciesA, allTraits]
  );
  const speciesTraitsFromB = useMemo(
    () => (speciesB && allTraits ? resolveTraits(speciesB.species_traits || [], allTraits) : []),
    [speciesB, allTraits]
  );

  const combinedSizes = useMemo(() => {
    if (!speciesA && !speciesB) return [];
    const set = new Set<string>();
    (speciesA?.sizes || []).forEach((s) => set.add(s));
    (speciesB?.sizes || []).forEach((s) => set.add(s));
    if (speciesA?.size) set.add(speciesA.size);
    if (speciesB?.size) set.add(speciesB.size);
    return Array.from(set).slice(0, 4);
  }, [speciesA, speciesB]);

  const mixedSpeciesSkillOptions = useMemo(() => {
    if (!speciesA || !speciesB || !allSkills) return [];
    const merged = [...(speciesA.skills || []), ...(speciesB.skills || [])];
    const seen = new Set<string>();
    const map = new Map(
      (allSkills as { id: string | number; name?: string }[]).map((s) => [String(s.id), s.name ?? String(s.id)])
    );
    const options: { id: string; name: string }[] = [];
    merged.forEach((id: string | number) => {
      const sid = String(id);
      if (seen.has(sid)) return;
      seen.add(sid);
      options.push({ id: sid, name: sid === '0' ? 'Any' : (map.get(sid) ?? sid) });
    });
    return options;
  }, [speciesA, speciesB, allSkills]);

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
    return sp ? resolveTraits(sp.ancestry_traits || [], allTraits) : [];
  }, [selectedFlawSpeciesId, speciesA, speciesB, allTraits]);

  const updateDraft = useCallback((updates: Partial<CharacterAncestry>) => {
    setDraftAncestry((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const handleSingleSpeciesSelect = useCallback(
    (s: Species) => {
      setDraftAncestry({
        id: s.id,
        name: s.name ?? String(s.id),
        mixed: false,
        selectedTraits: [],
        selectedFlaw: undefined,
        selectedCharacteristic: undefined,
        speciesIds: undefined,
        speciesNames: undefined,
        selectedSize: undefined,
        selectedSpeciesTraits: undefined,
        selectedFlawSpeciesId: undefined,
        mixedPhysical: undefined,
        selectedSpeciesSkillIds: undefined,
        selectedSpeciesTraitChoices: undefined,
      });
    },
    []
  );

  const handleMixedConfirm = useCallback(
    (a: { id: string; name: string }, b: { id: string; name: string }) => {
      setDraftAncestry({
        id: `mixed:${a.id}+${b.id}`,
        name: `${a.name} / ${b.name}`,
        mixed: true,
        speciesIds: [a.id, b.id],
        speciesNames: [a.name, b.name],
        selectedTraits: [],
        selectedFlaw: undefined,
        selectedCharacteristic: undefined,
        selectedSize: undefined,
        selectedSpeciesTraits: undefined,
        selectedFlawSpeciesId: undefined,
        mixedPhysical: undefined,
        selectedSpeciesSkillIds: undefined,
        selectedSpeciesTraitChoices: undefined,
      });
      setShowMixedModal(false);
    },
    []
  );

  const toggleMixedSpeciesSkill = useCallback(
    (skillId: string) => {
      const current = draftAncestry?.selectedSpeciesSkillIds ?? [];
      const idx = current.indexOf(skillId);
      if (idx >= 0) {
        updateDraft({ selectedSpeciesSkillIds: current.filter((_, i) => i !== idx) });
      } else if (current.length < 2) {
        updateDraft({ selectedSpeciesSkillIds: [...current, skillId] });
      }
    },
    [draftAncestry, updateDraft]
  );

  const hasTwoSpeciesSkills =
    mixedSpeciesSkillOptions.length <= 2
      ? selectedSpeciesSkillIds.length === mixedSpeciesSkillOptions.length
      : selectedSpeciesSkillIds.length === 2;

  const canContinueSpecies = Boolean(draftAncestry?.id && draftAncestry?.name);
  const speciesChoiceTraitParents = useMemo(
    () => (!isMixed ? speciesTraits.filter((t) => getChoiceOptionIds(t).length > 0) : []),
    [isMixed, speciesTraits],
  );
  const speciesTraitChoicesMap = draftAncestry?.selectedSpeciesTraitChoices ?? {};
  const speciesChoicePicksOk =
    speciesChoiceTraitParents.length === 0 ||
    speciesChoiceTraitParents.every((t) => {
      const pid = String(t.id);
      const picked = speciesTraitChoicesMap[pid];
      return Boolean(picked && getChoiceOptionIds(t).includes(String(picked)));
    });
  const canContinueAncestrySingle =
    (selectedTraitIds.length >= 1 || ancestryTraits.length === 0) && speciesChoicePicksOk;
  const hasSpeciesTraitA = !!selectedSpeciesTraits?.[0];
  const hasSpeciesTraitB = !!selectedSpeciesTraits?.[1];
  const canContinueAncestryMixed =
    hasSpeciesTraitA &&
    hasSpeciesTraitB &&
    (selectedTraitIds.length >= 1 || ancestryTraits.length === 0) &&
    !!draftAncestry?.selectedSize &&
    hasTwoSpeciesSkills;
  const canContinueAncestry = isMixed && speciesA && speciesB ? canContinueAncestryMixed : canContinueAncestrySingle;

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
      };
    }
    const migratedSkills = migrateSkillsAfterSpeciesChange(character, ancestryToSave, allSpecies);
    onSave({ ancestry: ancestryToSave, skills: migratedSkills });
    onClose();
  }, [character, draftAncestry, allSpecies, onSave, onClose]);

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
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {step === 'species' && (
          <>
            <p className="text-sm text-text-secondary">
              Choose a new species (or mixed). Then you&apos;ll set ancestry traits and, for mixed, choose 2 species skills.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowMixedModal(true)}
                className={cn(
                  'flex flex-col items-center justify-center min-h-[100px] border-2 border-dashed rounded-xl p-4',
                  isMixed ? 'border-primary-outline-border bg-primary-subtle-bg' : 'border-border hover:border-primary-outline-border'
                )}
              >
                <GitMerge className="w-8 h-8 text-primary-link-fg mb-1" />
                <span className="font-medium text-text-primary">Mixed species</span>
              </button>
              {allSpecies.map((s: Species) => {
                const isSelected = !isMixed && draftAncestry?.id && String(draftAncestry.id) === String(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSingleSpeciesSelect(s)}
                    className={cn(
                      'text-left border-2 rounded-xl p-4 min-h-[100px]',
                      isSelected ? 'border-primary-outline-border bg-primary-subtle-bg' : 'border-border hover:border-primary-outline-border'
                    )}
                  >
                    <span className="font-medium text-text-primary">{s.name}</span>
                    <p className="text-xs text-text-secondary line-clamp-2 mt-1">{s.description}</p>
                  </button>
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
                  <strong>{nameA}</strong> + <strong>{nameB}</strong>. Set size, one species trait from each, ancestry traits, and choose 2 species skills.
                </>
              ) : (
                <>Set species trait options (if any), ancestry traits, and optional flaw/characteristic.</>
              )}
            </p>

            {!isMixed && speciesTraits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1">
                  <Heart className="w-4 h-4 text-primary-link-fg" />
                  Species traits
                </h4>
                <p className="text-xs text-text-secondary">
                  These are automatic. When a trait offers variants, pick one before saving.
                </p>
                <div className="space-y-3">
                  {speciesTraits.map((t) => {
                    const optionTraits = resolveChoiceOptionTraits(getChoiceOptionIds(t), allTraits ?? undefined);
                    if (optionTraits.length > 0) {
                      return (
                        <div key={t.id} className="rounded-lg border border-border-light p-3 bg-surface-alt">
                          <p className="text-sm font-medium text-text-primary">{t.name}</p>
                          {t.description ? (
                            <p className="text-xs text-text-secondary mt-1 mb-2">{t.description}</p>
                          ) : null}
                          <ChoiceTraitOptionListPicker
                            parentTraitName={t.name}
                            optionTraits={optionTraits}
                            value={draftAncestry?.selectedSpeciesTraitChoices?.[String(t.id)] ?? ''}
                            onChange={(next) => {
                              const prev = draftAncestry?.selectedSpeciesTraitChoices ?? {};
                              const map = { ...prev };
                              if (!next) delete map[String(t.id)];
                              else map[String(t.id)] = next;
                              updateDraft({ selectedSpeciesTraitChoices: map });
                            }}
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={t.id} className="rounded-lg border border-border-subtle p-2 bg-surface-alt">
                        <Chip variant="default" size="sm">
                          {t.name}
                        </Chip>
                        {t.description ? (
                          <p className="text-xs text-text-secondary mt-1">{t.description}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isMixed && speciesA && speciesB && (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-text-muted uppercase">Size</label>
                  <select
                    value={draftAncestry.selectedSize ?? ''}
                    onChange={(e) => updateDraft({ selectedSize: e.target.value })}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary"
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
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Species trait from {nameA}</h4>
                    <div className="flex flex-wrap gap-2 items-start">
                      {speciesTraitsFromA.map((t) => {
                        const optionTraits = resolveChoiceOptionTraits(getChoiceOptionIds(t), allTraits ?? undefined);
                        if (optionTraits.length > 0) {
                          return (
                            <div key={t.id} className="w-full">
                              <ChoiceTraitOptionListPicker
                                parentTraitName={t.name}
                                optionTraits={optionTraits}
                                value={selectedSpeciesTraits?.[0] ?? ''}
                                onChange={(next) =>
                                  updateDraft({
                                    selectedSpeciesTraits: [next, selectedSpeciesTraits?.[1] ?? ''] as [string, string],
                                  })
                                }
                              />
                            </div>
                          );
                        }
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              updateDraft({
                                selectedSpeciesTraits: [String(t.id), selectedSpeciesTraits?.[1] ?? ''] as [string, string],
                              })
                            }
                          >
                            <Chip variant={selectedSpeciesTraits?.[0] === t.id ? 'primary' : 'default'} size="sm" interactive>{t.name}</Chip>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Species trait from {nameB}</h4>
                    <div className="flex flex-wrap gap-2 items-start">
                      {speciesTraitsFromB.map((t) => {
                        const optionTraits = resolveChoiceOptionTraits(getChoiceOptionIds(t), allTraits ?? undefined);
                        if (optionTraits.length > 0) {
                          return (
                            <div key={t.id} className="w-full">
                              <ChoiceTraitOptionListPicker
                                parentTraitName={t.name}
                                optionTraits={optionTraits}
                                value={selectedSpeciesTraits?.[1] ?? ''}
                                onChange={(next) =>
                                  updateDraft({
                                    selectedSpeciesTraits: [selectedSpeciesTraits?.[0] ?? '', next] as [string, string],
                                  })
                                }
                              />
                            </div>
                          );
                        }
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              updateDraft({
                                selectedSpeciesTraits: [selectedSpeciesTraits?.[0] ?? '', String(t.id)] as [string, string],
                              })
                            }
                          >
                            <Chip variant={selectedSpeciesTraits?.[1] === t.id ? 'primary' : 'default'} size="sm" interactive>{t.name}</Chip>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {mixedSpeciesSkillOptions.length > 0 && (
                  <div className="space-y-2">
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
                              'px-3 py-1.5 rounded-full text-sm font-medium border',
                              selected
                                ? 'bg-primary-subtle-bg border-primary-subtle-border text-primary-subtle-fg'
                                : 'bg-surface border-border text-text-secondary hover:border-primary-outline-border'
                            )}
                          >
                            {opt.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-text-muted">Selected: {selectedSpeciesSkillIds.length} / 2</p>
                  </div>
                )}
              </>
            )}

            {!isMixed && ancestryTraits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Ancestry trait (choose {maxAncestryTraits})
                </h4>
                <div className="flex flex-wrap gap-2 items-start">
                  {ancestryTraits.map((t) => {
                    const optionIds = getChoiceOptionIds(t);
                    const optionTraits = resolveChoiceOptionTraits(optionIds, allTraits ?? undefined);
                    const selectedOptionId = firstSelectedChoiceOptionId(optionIds, selectedTraitIds);
                    const isChoice = optionTraits.length > 0;
                    const sel = isChoice ? Boolean(selectedOptionId) : selectedTraitIds.includes(t.id);

                    if (isChoice) {
                      return (
                        <div key={t.id}>
                          <ChoiceTraitOptionListPicker
                            parentTraitName={t.name}
                            optionTraits={optionTraits}
                            value={selectedOptionId ?? ''}
                            onChange={(next) => {
                              let nextTraits = selectedOptionId
                                ? selectedTraitIds.filter((id) => id !== selectedOptionId)
                                : [...selectedTraitIds];
                              if (next) {
                                nextTraits =
                                  nextTraits.length >= maxAncestryTraits
                                    ? [...nextTraits.slice(1), next]
                                    : [...nextTraits, next];
                              }
                              updateDraft({ selectedTraits: nextTraits });
                            }}
                          />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (sel) updateDraft({ selectedTraits: selectedTraitIds.filter((id) => id !== t.id) });
                          else
                            updateDraft({
                              selectedTraits:
                                selectedTraitIds.length >= maxAncestryTraits
                                  ? [...selectedTraitIds.slice(1), t.id]
                                  : [...selectedTraitIds, t.id],
                            });
                        }}
                      >
                        <Chip variant={sel ? 'primary' : 'default'} size="sm" interactive>
                          {t.name}
                        </Chip>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isMixed && ancestryTraits.length > 0 && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-text-primary">
                    Ancestry trait (1 from either species{selectedFlaw ? '; 2nd below from flaw species' : ''})
                  </h4>
                  <div className="flex flex-wrap gap-2 items-start">
                    {ancestryTraits.map((t) => {
                      const optionIds = getChoiceOptionIds(t);
                      const optionTraits = resolveChoiceOptionTraits(optionIds, allTraits ?? undefined);
                      const base = selectedTraitIds[0];
                      const selectedBaseOptionId = firstSelectedChoiceOptionId(optionIds, base ? [String(base)] : []);
                      const isChoice = optionTraits.length > 0;
                      const sel = isChoice ? Boolean(selectedBaseOptionId) : base === t.id;

                      if (isChoice) {
                        return (
                          <div key={t.id}>
                            <ChoiceTraitOptionListPicker
                              parentTraitName={t.name}
                              optionTraits={optionTraits}
                              value={selectedBaseOptionId ?? ''}
                              onChange={(next) =>
                                updateDraft({
                                  selectedTraits: [next, selectedTraitIds[1] ?? ''].filter(Boolean),
                                })
                              }
                            />
                          </div>
                        );
                      }

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            updateDraft({
                              selectedTraits: sel ? selectedTraitIds.filter((_, i) => i !== 0) : [t.id, ...selectedTraitIds.slice(1)].filter(Boolean),
                            })
                          }
                        >
                          <Chip variant={sel ? 'primary' : 'default'} size="sm" interactive>
                            {t.name}
                          </Chip>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selectedFlaw && ancestryTraitsFromFlawSpecies.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-text-primary">
                      Extra ancestry trait (from {selectedFlawSpeciesId === speciesA?.id ? nameA : nameB} only)
                    </h4>
                    <div className="flex flex-wrap gap-2 items-start">
                      {ancestryTraitsFromFlawSpecies.map((t) => {
                        const optionIds = getChoiceOptionIds(t);
                        const optionTraits = resolveChoiceOptionTraits(optionIds, allTraits ?? undefined);
                        const extra = selectedTraitIds[1];
                        const selectedExtraOptionId = firstSelectedChoiceOptionId(
                          optionIds,
                          extra ? [String(extra)] : [],
                        );
                        const isChoice = optionTraits.length > 0;
                        const sel = isChoice ? Boolean(selectedExtraOptionId) : extra === t.id;

                        if (isChoice) {
                          return (
                            <div key={t.id}>
                              <ChoiceTraitOptionListPicker
                                parentTraitName={t.name}
                                optionTraits={optionTraits}
                                value={selectedExtraOptionId ?? ''}
                                onChange={(next) =>
                                  updateDraft({
                                    selectedTraits: [selectedTraitIds[0] ?? '', next].filter(Boolean),
                                  })
                                }
                              />
                            </div>
                          );
                        }

                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              updateDraft({
                                selectedTraits: sel
                                  ? selectedTraitIds.filter((_, i) => i !== 1)
                                  : [selectedTraitIds[0] ?? '', t.id].filter(Boolean),
                              })
                            }
                          >
                            <Chip variant={sel ? 'primary' : 'default'} size="sm" interactive>
                              {t.name}
                            </Chip>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {flaws.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Flaw (optional, +1 ancestry trait)
                </h4>
                <div className="flex flex-wrap gap-2 items-start">
                  {flaws.map((t) => {
                    const optionIds = getChoiceOptionIds(t);
                    const optionTraits = resolveChoiceOptionTraits(optionIds, allTraits ?? undefined);
                    const selectedFlawOptionId = firstSelectedChoiceOptionId(
                      optionIds,
                      selectedFlaw ? [String(selectedFlaw)] : [],
                    );
                    const isChoice = optionTraits.length > 0;
                    const isSelected = isChoice ? Boolean(selectedFlawOptionId) : selectedFlaw === t.id;

                    const setFlaw = (nextFlaw: string | null) => {
                      const newMax = nextFlaw ? 2 : 1;
                      const current = selectedTraitIds;
                      const fromA = isMixed && speciesA && speciesB && (speciesA.flaws || []).includes(t.id);
                      setDraftAncestry((prev) => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          selectedFlaw: nextFlaw ?? undefined,
                          selectedTraits: current.length > newMax ? current.slice(0, newMax) : current,
                          ...(isMixed &&
                            speciesA &&
                            speciesB && {
                              selectedFlawSpeciesId: nextFlaw ? (fromA ? speciesA.id : speciesB.id) : undefined,
                            }),
                        };
                      });
                    };

                    if (isChoice) {
                      return (
                        <div key={t.id}>
                          <ChoiceTraitOptionListPicker
                            parentTraitName={t.name}
                            optionTraits={optionTraits}
                            value={selectedFlawOptionId ?? ''}
                            onChange={(next) => setFlaw(next || null)}
                          />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFlaw(isSelected ? null : t.id)}
                      >
                        <Chip variant={isSelected ? 'primary' : 'default'} size="sm" interactive>
                          {t.name}
                        </Chip>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {characteristics.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Characteristic (optional)
                </h4>
                <div className="flex flex-wrap gap-2 items-start">
                  {characteristics.map((t) => {
                    const optionIds = getChoiceOptionIds(t);
                    const optionTraits = resolveChoiceOptionTraits(optionIds, allTraits ?? undefined);
                    const selectedCharacteristicOptionId = firstSelectedChoiceOptionId(
                      optionIds,
                      selectedCharacteristic ? [String(selectedCharacteristic)] : [],
                    );
                    const isChoice = optionTraits.length > 0;
                    const isSelected = isChoice ? Boolean(selectedCharacteristicOptionId) : selectedCharacteristic === t.id;

                    if (isChoice) {
                      return (
                        <div key={t.id}>
                          <ChoiceTraitOptionListPicker
                            parentTraitName={t.name}
                            optionTraits={optionTraits}
                            value={selectedCharacteristicOptionId ?? ''}
                            onChange={(next) => updateDraft({ selectedCharacteristic: next || null })}
                          />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateDraft({ selectedCharacteristic: isSelected ? null : t.id })}
                      >
                        <Chip variant={isSelected ? 'primary' : 'default'} size="sm" interactive>
                          {t.name}
                        </Chip>
                      </button>
                    );
                  })}
                </div>
              </div>
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
