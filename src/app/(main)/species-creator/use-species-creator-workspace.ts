/**
 * Species Creator — workspace state hook (TASK-601)
 * =================================================
 * Owns form state, draft cache, trait/skill actions, and save/load.
 * Presentational sections stay in species-creator-editor.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCreatorSave, type Species, type Trait, type Skill } from '@/hooks';
import { creatorEditMissMessage } from '@/lib/library/catalog-listing';
import { findByNormalizedId } from '@/lib/utils';
import {
  SPECIES_CREATOR_CACHE_KEY,
  DEFAULT_SPECIES_SPEED,
  MAX_SPECIES_TRAITS,
  MAX_ANCESTRY_TRAITS,
  MAX_CHARACTERISTICS,
  MAX_FLAWS,
  MAX_SKILLS,
  MAX_SIZES,
  MAX_LANGUAGES,
  TRAIT_LIMITS,
  initialSpeciesFormState,
  isSpeciesFormSaveReady,
  planSpeciesCreatorEdit,
  readStoredSpeciesDraft,
  speciesLibraryRecordToFormState,
  type SpeciesFormState,
  type SpeciesCreatorCache,
  type TraitCategory,
} from './species-creator-bootstrap';
import { applySpeciesCreatorReset } from './species-creator-reset';

type UseSpeciesCreatorWorkspaceArgs = {
  traits: Trait[];
  skills: Skill[];
  skillsLoading: boolean;
  traitsLoading: boolean;
  closeLoadModal: () => void;
  /** `?edit=` id. Replaces the draft only after that id is found in the library. */
  editSpeciesId?: string | null | undefined;
  rawItems?: readonly unknown[] | undefined;
  libraryLoading?: boolean | undefined;
};

function resolveSpeciesSkillLabel(skills: Skill[], id: string): string {
  if (id === '0' || !id) return 'Any';
  return findByNormalizedId(skills, id)?.name ?? '';
}

export function useSpeciesCreatorWorkspace({
  traits,
  skills,
  skillsLoading,
  traitsLoading,
  closeLoadModal,
  editSpeciesId = null,
  rawItems = [],
  libraryLoading = false,
}: UseSpeciesCreatorWorkspaceArgs) {
  const [showAddSpeciesAncestryModal, setShowAddSpeciesAncestryModal] = useState(false);
  const [showAddFlawModal, setShowAddFlawModal] = useState(false);
  const [showAddCharacteristicModal, setShowAddCharacteristicModal] = useState(false);
  const [showThirdSpeciesTraitConfirm, setShowThirdSpeciesTraitConfirm] = useState(false);
  const [pendingTraitAdd, setPendingTraitAdd] = useState<{
    traitId: string;
    category: TraitCategory;
  } | null>(null);
  const [pendingBatch, setPendingBatch] = useState<{
    traitIds: string[];
    category: TraitCategory;
  } | null>(null);
  const [newLanguage, setNewLanguage] = useState('');

  const [form, setForm] = useState<SpeciesFormState>(initialSpeciesFormState);
  const settledEditKeyRef = useRef<string | null>(null);
  const draftHydratedRef = useRef(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [appliedEditId, setAppliedEditId] = useState<string | null>(null);
  const [preserveDraftDuringEdit, setPreserveDraftDuringEdit] = useState(false);
  const editSession = editSpeciesId?.trim() ? editSpeciesId.trim() : null;
  const editLibraryReady = !skillsLoading && !traitsLoading && !libraryLoading;

  // Persist draft across refresh (mirrors item/power creator cache pattern).
  // A confirmed ?edit= load does not write the library row back over the draft.
  useEffect(() => {
    if (!cacheReady || (editSession && !preserveDraftDuringEdit)) return;
    try {
      const cache: SpeciesCreatorCache = { form, timestamp: Date.now() };
      localStorage.setItem(SPECIES_CREATOR_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // ignore quota / private mode
    }
  }, [cacheReady, form, editSession, preserveDraftDuringEdit]);

  // Base skills only (no sub-skills) for species skill selection
  const skillOptions = useMemo(() => {
    const baseSkills = skills.filter((s) => s.base_skill_id == null || s.base_skill_id === 0);
    const opts = baseSkills.map((s) => ({ value: String(s.id), label: s.name }));
    return [{ value: '0', label: 'Any' }, ...opts];
  }, [skills]);

  const getPayload = useCallback(() => {
    const sizes = form.sizes.length ? form.sizes : ['Medium'];
    const adulthood =
      form.adulthood_lifespan[0] !== '' && form.adulthood_lifespan[1] !== ''
        ? [Number(form.adulthood_lifespan[0]), Number(form.adulthood_lifespan[1])]
        : undefined;
    return {
      name: form.name.trim(),
      data: {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type.trim(),
        size: sizes[0],
        sizes,
        speed: DEFAULT_SPECIES_SPEED,
        skills: form.skillIds,
        species_traits: form.species_traits,
        ancestry_traits: form.ancestry_traits,
        characteristics: form.characteristics,
        flaws: form.flaws,
        languages: form.languages.filter(Boolean),
        ave_height: form.ave_height !== '' ? Number(form.ave_height) : undefined,
        ave_weight: form.ave_weight !== '' ? Number(form.ave_weight) : undefined,
        adulthood_lifespan: adulthood,
        ...(form.imageId ? { imageId: form.imageId } : {}),
        ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      },
    };
  }, [form]);

  const save = useCreatorSave({
    type: 'species',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (species)? The existing Realms Codex species with this name will be replaced.`
        : `Are you sure you wish to publish this species "${n}" to the Realms Codex? All users will be able to see and use it.`,
    successMessage: 'Species saved to My Codex!',
    publicSuccessMessage: 'Species saved to Realms Codex!',
    onSaveSuccess: () => {
      try {
        localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY);
      } catch {
        // ignore
      }
      setForm(initialSpeciesFormState);
    },
  });

  // ?edit= replaces the draft only after that id is in the loaded library.
  // An unknown id keeps the draft, including when the creator was already open.
  useEffect(() => {
    if (skillsLoading || traitsLoading) return;
    const editKey = editSession ?? '';
    if (settledEditKeyRef.current === editKey) return;
    const plan = planSpeciesCreatorEdit({
      editSpeciesId: editSession,
      libraryReady: editLibraryReady,
      rawItems,
      traits,
      skills,
    });
    if (plan.type === 'wait') return;
    settledEditKeyRef.current = editKey;

    if (plan.type === 'replace') {
      draftHydratedRef.current = true;
      try {
        localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY);
      } catch {
        // ignore
      }
      queueMicrotask(() => {
        setPreserveDraftDuringEdit(false);
        setForm(plan.form);
        setAppliedEditId(editSession);
        setCacheReady(true);
        save.applyLoadedLibraryItem(plan.item);
      });
      return;
    }

    if (plan.type === 'missing') {
      const draft = draftHydratedRef.current ? null : readStoredSpeciesDraft(traits, skills);
      draftHydratedRef.current = true;
      queueMicrotask(() => {
        if (draft) setForm(draft);
        setPreserveDraftDuringEdit(true);
        setAppliedEditId(editSession);
        setCacheReady(true);
        save.setSaveMessage({ type: 'error', text: creatorEditMissMessage('species') });
      });
      return;
    }

    const draft = draftHydratedRef.current ? null : readStoredSpeciesDraft(traits, skills);
    draftHydratedRef.current = true;
    queueMicrotask(() => {
      if (draft) setForm(draft);
      setPreserveDraftDuringEdit(false);
      setCacheReady(true);
    });
  }, [skillsLoading, traitsLoading, traits, skills, editSession, editLibraryReady, rawItems, save]);

  const handleSave = useCallback(async () => {
    if (!isSpeciesFormSaveReady(form)) {
      return;
    }
    await save.handleSave();
  }, [save, form]);

  const handleReset = useCallback(() => {
    applySpeciesCreatorReset({
      clearDraftCache: () => {
        try {
          localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY);
        } catch {
          // ignore
        }
      },
      resetForm: () => setForm(initialSpeciesFormState),
      forgetLoadedLibraryItem: () => save.forgetLoadedLibraryItem(),
      clearSaveMessage: () => save.setSaveMessage(null),
    });
  }, [save]);

  const loadSpeciesIntoForm = useCallback(
    (s: Species | Record<string, unknown>) => {
      setForm(speciesLibraryRecordToFormState(s, traits, skills));
      save.applyLoadedLibraryItem(s);
      closeLoadModal();
      save.setSaveMessage({ type: 'success', text: 'Species loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [traits, skills, closeLoadModal, save],
  );

  /** Add multiple traits at once; respects limits and shows third-species-trait confirm when needed. */
  const addTraitBatchToCategory = useCallback((traitIds: string[], category: TraitCategory) => {
    if (!traitIds.length) return;
    const key = category;
    const limit = TRAIT_LIMITS[category];
    setForm((prev) => {
      const current = prev[key];
      const toAdd: string[] = [];
      let needThirdConfirm: string | null = null;
      for (const id of traitIds) {
        if (current.length + toAdd.length >= limit) break;
        if (prev[key].includes(id)) continue;
        if (category === 'species_traits' && current.length + toAdd.length === 2) {
          needThirdConfirm = id;
          break;
        }
        toAdd.push(id);
      }
      if (needThirdConfirm !== null) {
        setPendingTraitAdd({ traitId: needThirdConfirm, category });
        setPendingBatch({
          traitIds: [
            needThirdConfirm,
            ...traitIds.filter((x) => !toAdd.includes(x) && x !== needThirdConfirm),
          ],
          category,
        });
        setShowThirdSpeciesTraitConfirm(true);
        return toAdd.length > 0 ? { ...prev, [key]: [...prev[key], ...toAdd] } : prev;
      }
      if (toAdd.length === 0) return prev;
      return { ...prev, [key]: [...prev[key], ...toAdd] };
    });
    setShowAddSpeciesAncestryModal(false);
    setShowAddFlawModal(false);
    setShowAddCharacteristicModal(false);
  }, []);

  const confirmThirdSpeciesTrait = useCallback(() => {
    if (pendingTraitAdd?.category === 'species_traits') {
      setForm((prev) => {
        const idsToAdd =
          pendingBatch?.category === 'species_traits'
            ? pendingBatch.traitIds
            : [pendingTraitAdd.traitId];
        const limit = TRAIT_LIMITS.species_traits;
        const seen = new Set(prev.species_traits);
        const additions: string[] = [];
        for (const id of idsToAdd) {
          if (prev.species_traits.length + additions.length >= limit) break;
          if (seen.has(id)) continue;
          seen.add(id);
          additions.push(id);
        }
        if (additions.length === 0) return prev;
        return { ...prev, species_traits: [...prev.species_traits, ...additions] };
      });
    }
    setPendingTraitAdd(null);
    setPendingBatch(null);
    setShowThirdSpeciesTraitConfirm(false);
    setShowAddSpeciesAncestryModal(false);
  }, [pendingTraitAdd, pendingBatch]);

  const removeTrait = useCallback((category: TraitCategory, traitId: string) => {
    setForm((prev) => ({
      ...prev,
      [category]: prev[category].filter((id) => id !== traitId),
    }));
  }, []);

  const addLanguage = useCallback(() => {
    const trimmed = newLanguage.trim();
    if (!trimmed || form.languages.includes(trimmed)) return;
    if (form.languages.length >= MAX_LANGUAGES) return;
    setForm((prev) => ({ ...prev, languages: [...prev.languages, trimmed] }));
    setNewLanguage('');
  }, [newLanguage, form.languages]);

  const removeLanguage = useCallback((lang: string) => {
    setForm((prev) => ({ ...prev, languages: prev.languages.filter((l) => l !== lang) }));
  }, []);

  const setSkill = useCallback((index: 0 | 1, skillId: string) => {
    setForm((prev) => {
      const next = [...prev.skillIds];
      if (skillId === next[index]) return prev;
      if (index === 0 && next[1] === skillId) next[1] = '';
      if (index === 1 && next[0] === skillId) next[0] = '';
      next[index] = skillId;
      return { ...prev, skillIds: next };
    });
  }, []);

  const addSize = useCallback(
    (size: string) => {
      if (form.sizes.includes(size) || form.sizes.length >= MAX_SIZES) return;
      setForm((prev) => ({ ...prev, sizes: [...prev.sizes, size] }));
    },
    [form.sizes],
  );

  const removeSize = useCallback((size: string) => {
    setForm((prev) => {
      const next = prev.sizes.filter((s) => s !== size);
      return { ...prev, sizes: next.length ? next : ['Medium'] };
    });
  }, []);

  const traitIdToName = useMemo(() => {
    const m = new Map<string, string>();
    traits.forEach((t) => m.set(String(t.id), t.name));
    return m;
  }, [traits]);

  const summaryStatRows = useMemo(
    () => [
      { label: 'Species traits', value: `${form.species_traits.length} / ${MAX_SPECIES_TRAITS}` },
      {
        label: 'Ancestry traits',
        value: `${form.ancestry_traits.length} / ${MAX_ANCESTRY_TRAITS}`,
      },
      {
        label: 'Characteristics',
        value: `${form.characteristics.length} / ${MAX_CHARACTERISTICS}`,
      },
      { label: 'Flaws', value: `${form.flaws.length} / ${MAX_FLAWS}` },
      { label: 'Base skills', value: `${form.skillIds.length} / ${MAX_SKILLS}` },
      { label: 'Sizes', value: `${form.sizes.length} / ${MAX_SIZES}` },
      { label: 'Languages', value: `${form.languages.length} / ${MAX_LANGUAGES}` },
    ],
    [form],
  );

  const basicsSummary = useMemo(() => {
    if (form.name.trim())
      return form.type ? `${form.name.trim()} · ${form.type}` : form.name.trim();
    return form.type ? form.type : 'Name, type, description';
  }, [form.name, form.type]);
  const sizesSummary = useMemo(() => form.sizes.join(', ') || 'Medium', [form.sizes]);
  const baseSkillsSummary = useMemo(() => {
    const names = form.skillIds.map((id) => resolveSpeciesSkillLabel(skills, id)).filter(Boolean);
    return names.length ? names.join(', ') : 'Select base skills';
  }, [form.skillIds, skills]);
  const languagesSummary = useMemo(() => form.languages.join(', ') || 'None', [form.languages]);
  const traitsSummary = useMemo(() => {
    const parts = [];
    if (form.species_traits.length) parts.push(`${form.species_traits.length} species`);
    if (form.ancestry_traits.length) parts.push(`${form.ancestry_traits.length} ancestry`);
    if (form.characteristics.length) parts.push(`${form.characteristics.length} characteristics`);
    if (form.flaws.length) parts.push(`${form.flaws.length} flaws`);
    return parts.length ? parts.join(', ') : 'No traits';
  }, [
    form.species_traits.length,
    form.ancestry_traits.length,
    form.characteristics.length,
    form.flaws.length,
  ]);
  const heightWeightLifespanSummary = useMemo(() => {
    const h = form.ave_height !== '' ? `${form.ave_height} cm` : null;
    const w = form.ave_weight !== '' ? `${form.ave_weight} kg` : null;
    const a = form.adulthood_lifespan[0] !== '' ? form.adulthood_lifespan[0] : null;
    const l = form.adulthood_lifespan[1] !== '' ? form.adulthood_lifespan[1] : null;
    if (h && w && a != null && l != null) return `H: ${h}, W: ${w}, ${a}–${l} yrs`;
    if (h || w || a != null || l != null)
      return [h, w, a != null ? `Adulthood: ${a}` : null, l != null ? `Lifespan: ${l}` : null]
        .filter(Boolean)
        .join(', ');
    return 'Not set';
  }, [form.ave_height, form.ave_weight, form.adulthood_lifespan]);

  return {
    form,
    setForm,
    save,
    handleSave,
    handleReset,
    loadSpeciesIntoForm,
    skillOptions,
    traitIdToName,
    summaryStatRows,
    basicsSummary,
    sizesSummary,
    baseSkillsSummary,
    languagesSummary,
    traitsSummary,
    heightWeightLifespanSummary,
    newLanguage,
    setNewLanguage,
    addLanguage,
    removeLanguage,
    setSkill,
    addSize,
    removeSize,
    removeTrait,
    addTraitBatchToCategory,
    confirmThirdSpeciesTrait,
    showAddSpeciesAncestryModal,
    setShowAddSpeciesAncestryModal,
    showAddFlawModal,
    setShowAddFlawModal,
    showAddCharacteristicModal,
    setShowAddCharacteristicModal,
    showThirdSpeciesTraitConfirm,
    setShowThirdSpeciesTraitConfirm,
    setPendingTraitAdd,
    setPendingBatch,
    isSaveReady: isSpeciesFormSaveReady(form),
    skillLabel: (id: string) => resolveSpeciesSkillLabel(skills, id),
    editBootstrapPending: Boolean(editSession) && appliedEditId !== editSession,
  };
}
