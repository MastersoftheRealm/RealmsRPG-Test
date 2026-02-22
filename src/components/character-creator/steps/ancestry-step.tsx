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
import { Chip, Button, Alert } from '@/components/ui';
import { SelectionToggle } from '@/components/shared';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useMergedSpecies, useTraits, useCodexSkills, resolveTraitIds, resolveSkillIdsToNames, type Trait, type Species } from '@/hooks';
import { Heart, AlertTriangle, Sparkles, Star } from 'lucide-react';

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

  const isMixed = draft.ancestry?.mixed === true;
  const speciesIds = isMixed ? draft.ancestry?.speciesIds : (draft.ancestry?.id ? [draft.ancestry.id] : []);

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
      return {
        speciesTraits: [], // mixed uses selectedSpeciesTraits UI
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

  // Validation: single species
  const canContinueSingle = selectedTraitIds.length >= 1 || ancestryTraits.length === 0;
  // Mixed: need 1 species trait from each, 1 ancestry trait (2 if flaw), size chosen
  const hasSpeciesTraitA = !!selectedSpeciesTraits?.[0];
  const hasSpeciesTraitB = !!selectedSpeciesTraits?.[1];
  const canContinueMixed =
    hasSpeciesTraitA &&
    hasSpeciesTraitB &&
    (selectedTraitIds.length >= 1 || ancestryTraits.length === 0) &&
    !!draft.ancestry?.selectedSize;

  const canContinue = isMixed && speciesA && speciesB ? canContinueMixed : canContinueSingle;

  // No species selected at all
  if (!draft.ancestry?.id) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Choose Your Ancestry Traits</h1>
        <p className="text-text-secondary mb-6">
          Customize your character with ancestry traits and an optional flaw.
        </p>
        <Alert variant="warning" className="mb-8">
          <div className="text-center">
            <p className="mb-4">
              <strong>No species selected!</strong> Please choose a species first.
            </p>
            <Button
              onClick={() => setStep('species')}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Go to Species Selection
            </Button>
          </div>
        </Alert>
        <div className="flex justify-between">
          <Button variant="secondary" onClick={prevStep}>← Back</Button>
          <Button disabled>Continue →</Button>
        </div>
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Mixed Species — Ancestry</h1>
            <p className="text-text-secondary">
              <strong>{nameA}</strong> + <strong>{nameB}</strong>. Set physical traits and choose one species trait from each, then ancestry and optional flaw.
            </p>
          </div>
          <button
            onClick={() => setStep('species')}
            className="text-sm text-primary-600 hover:text-primary-800 underline"
          >
            Change Species
          </button>
        </div>

        {/* Physical: averaged + size */}
        <div className="bg-surface-alt rounded-xl p-4 mb-6 border border-border-light">
          <h3 className="font-semibold text-text-primary mb-3">Physical (averaged)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
            <div>
              <span className="block text-xs text-text-muted uppercase">Avg Height</span>
              <span className="font-bold text-text-primary">{ph?.aveHeight != null ? `${ph.aveHeight} cm` : '—'}</span>
            </div>
            <div>
              <span className="block text-xs text-text-muted uppercase">Avg Weight</span>
              <span className="font-bold text-text-primary">{ph?.aveWeight != null ? `${ph.aveWeight} kg` : '—'}</span>
            </div>
            <div>
              <span className="block text-xs text-text-muted uppercase">Adulthood</span>
              <span className="font-bold text-text-primary">{ph?.adulthood != null ? `${ph.adulthood} yr` : '—'}</span>
            </div>
            <div>
              <span className="block text-xs text-text-muted uppercase">Lifespan (max)</span>
              <span className="font-bold text-text-primary">{ph?.maxAge != null ? `${ph.maxAge} yr` : '—'}</span>
            </div>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase mb-1">Size (choose one)</span>
            <select
              value={selectedSize}
              onChange={(e) => setMixedSize(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-text-primary"
            >
              <option value="">Select size</option>
              {combinedSizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Species traits: one from each */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <TraitSection
            title={`Species trait from ${nameA}`}
            subtitle="Choose 1"
            icon={<Heart className="w-5 h-5 text-primary-600" />}
            traits={speciesTraitsFromA}
            selectable
            selectedIds={selectedSpeciesTraits?.[0] ? [selectedSpeciesTraits[0]] : []}
            onToggle={(id) => setSpeciesTraitA(id)}
            variant="ancestry"
          />
          <TraitSection
            title={`Species trait from ${nameB}`}
            subtitle="Choose 1"
            icon={<Heart className="w-5 h-5 text-primary-600" />}
            traits={speciesTraitsFromB}
            selectable
            selectedIds={selectedSpeciesTraits?.[1] ? [selectedSpeciesTraits[1]] : []}
            onToggle={(id) => setSpeciesTraitB(id)}
            variant="ancestry"
          />
        </div>

        {/* Ancestry: 1 base, +1 from flaw species if flaw taken */}
        {ancestryForFirstSlot.length > 0 && (
          <TraitSection
            title="Ancestry trait"
            subtitle={selectedFlaw ? '1 from either species; 2nd below from the species you took the flaw from' : 'Choose 1 from either species'}
            icon={<Star className="w-5 h-5 text-amber-600" />}
            traits={ancestryForFirstSlot}
            selectable
            selectedIds={draft.ancestry?.selectedTraits?.[0] ? [draft.ancestry.selectedTraits[0]] : []}
            onToggle={setAncestryBaseMixed}
            variant="ancestry"
          />
        )}
        {selectedFlaw && ancestryForSecondSlot.length > 0 && (
          <TraitSection
            title={`Extra ancestry trait (from ${selectedFlawSpeciesId === speciesA.id ? nameA : nameB} only)`}
            subtitle="Choose 1"
            icon={<Star className="w-5 h-5 text-amber-600" />}
            traits={ancestryForSecondSlot}
            selectable
            selectedIds={draft.ancestry?.selectedTraits?.[1] ? [draft.ancestry.selectedTraits[1]] : []}
            onToggle={setAncestryExtraMixed}
            variant="ancestry"
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
          />
        )}

        {/* Flaws: by species so we can set selectedFlawSpeciesId */}
        {(flawsFromA.length > 0 || flawsFromB.length > 0) && (
          <div className="mb-6">
            <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Flaw (optional — grants +1 ancestry trait from same species)
            </h3>
            {flawsFromA.length > 0 && (
              <TraitSection
                title={`Flaws from ${nameA}`}
                subtitle="Choose up to 1"
                icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                traits={flawsFromA}
                selectable
                selectedIds={selectedFlaw && selectedFlawSpeciesId === speciesA.id ? [selectedFlaw] : []}
                onToggle={(id) => toggleFlawMixed(id, speciesA.id)}
                variant="flaw"
              />
            )}
            {flawsFromB.length > 0 && (
              <TraitSection
                title={`Flaws from ${nameB}`}
                subtitle="Choose up to 1"
                icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                traits={flawsFromB}
                selectable
                selectedIds={selectedFlaw && selectedFlawSpeciesId === speciesB.id ? [selectedFlaw] : []}
                onToggle={(id) => toggleFlawMixed(id, speciesB.id)}
                variant="flaw"
              />
            )}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="secondary" onClick={prevStep}>← Back</Button>
          <Button onClick={nextStep} disabled={!canContinue}>Continue →</Button>
        </div>
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
        <div className="flex justify-between">
          <Button variant="secondary" onClick={prevStep}>← Back</Button>
          <Button onClick={() => setStep('species')}>Change Species</Button>
        </div>
      </div>
    );
  }

  // Format sizes display (single)
  const sizesDisplay = Array.isArray(selectedSpecies.sizes) && selectedSpecies.sizes.length > 0
    ? selectedSpecies.sizes.join(' / ')
    : selectedSpecies.size || 'Medium';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Choose Your Ancestry Traits</h1>
          <p className="text-text-secondary">
            As a <strong>{selectedSpecies.name}</strong>, customize your heritage with traits and abilities.
          </p>
        </div>
        <button
          onClick={() => setStep('species')}
          className="text-sm text-primary-600 hover:text-primary-800 underline"
        >
          Change Species
        </button>
      </div>

      {/* Species Info Summary */}
      <div className="bg-surface-alt rounded-xl p-4 mb-6 border border-border-light">
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
              {selectedSpecies.ave_height != null && Number(selectedSpecies.ave_height) > 0 ? `${selectedSpecies.ave_height} cm` : '—'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Avg Weight</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.ave_weight != null && Number(selectedSpecies.ave_weight) > 0 ? `${selectedSpecies.ave_weight} kg` : '—'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Adulthood</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.adulthood_lifespan?.[0] != null ? `${selectedSpecies.adulthood_lifespan[0]} yr` : '—'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted uppercase">Lifespan (max)</span>
            <span className="font-bold text-text-primary">
              {selectedSpecies.adulthood_lifespan?.[1] != null ? `${selectedSpecies.adulthood_lifespan[1]} yr` : '—'}
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
      </div>

      {/* Selection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedTraitIds.length === maxAncestryTraits
            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600/50'
            : 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600/50'
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Ancestry Traits</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedTraitIds.length === maxAncestryTraits
                ? 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
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
            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600/50'
            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600/50'
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Characteristic</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedCharacteristic
                ? 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
            )}>
              {selectedCharacteristic ? '1' : '0'} / 1
            </span>
          </div>
          <p className="text-xs text-text-secondary">Optional bonus trait</p>
        </div>

        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedFlaw
            ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600/50'
            : 'bg-surface-alt border-border-light'
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-text-primary text-sm">Flaw</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              selectedFlaw
                ? 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300'
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
          subtitle="These are automatically applied"
          icon={<Heart className="w-5 h-5 text-primary-600" />}
          traits={speciesTraits}
          selectable={false}
          selectedIds={[]}
          onToggle={() => {}}
        />
      )}

      {/* Ancestry Traits (Selectable) */}
      {ancestryTraits.length > 0 && (
        <TraitSection
          title="Ancestry Traits"
          subtitle={`Select ${maxAncestryTraits} trait${maxAncestryTraits > 1 ? 's' : ''}`}
          icon={<Star className="w-5 h-5 text-amber-600" />}
          traits={ancestryTraits}
          selectable
          selectedIds={selectedTraitIds}
          onToggle={toggleAncestryTrait}
          variant="ancestry"
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
        />
      )}

      {/* Flaws (Selectable - 1) */}
      {flaws.length > 0 && (
        <TraitSection
          title="Flaws"
          subtitle="Select 1 flaw to gain an extra ancestry trait (optional)"
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          traits={flaws}
          selectable
          selectedIds={selectedFlaw ? [selectedFlaw] : []}
          onToggle={toggleFlaw}
          variant="flaw"
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

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="secondary" onClick={prevStep}>← Back</Button>
        <Button
          onClick={nextStep}
          disabled={!canContinue}
        >
          Continue →
        </Button>
      </div>
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
}: TraitSectionProps) {
  const variantStyles = {
    default: {
      border: 'border-border-light',
      header: 'bg-surface-alt',
      selected: 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30',
    },
    ancestry: {
      border: 'border-amber-200 dark:border-amber-700/50',
      header: 'bg-amber-50 dark:bg-amber-900/30',
      selected: 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30',
    },
    characteristic: {
      border: 'border-blue-200',
      header: 'bg-blue-50 dark:bg-blue-900/30',
      selected: 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30',
    },
    flaw: {
      border: 'border-red-200 dark:border-red-700/50',
      header: 'bg-red-50 dark:bg-red-900/30',
      selected: 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/30',
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
          const isSelected = selectedIds.includes(trait.id);
          
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
                  <div className="flex-shrink-0 self-center">
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
