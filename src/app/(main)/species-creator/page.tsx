/**
 * Species Creator Page
 * ====================
 * User-facing species creator: traits (species/ancestry/characteristic/flaw), base skills,
 * sizes, languages. Load from Realms Codex or My Codex; save to private codex (user species).
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Users, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores';
import {
  useCodexSkills,
  useTraits,
  useAdmin,
  useCreatorSave,
  useLoadModalLibrary,
  type Species,
  type Trait,
  type Skill,
} from '@/hooks';
import { CREATURE_TYPES, CREATOR_CACHE_KEYS, CACHE_EXPIRY_MS } from '@/lib/game/creator-constants';
import { CreatorPageShell, CreatorSummaryPanel, CollapsibleSection } from '@/components/creator';
import { SourceFilter, sourceFilterSummary } from '@/components/shared/filters/source-filter';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/shared/unified-selection-modal';
import { ConfirmActionModal, RealmsImageField } from '@/components/shared';
import { Button, Input, Textarea } from '@/components/ui';
import { ChipList } from '../creature-creator/CreatureCreatorHelpers';
import { formatListCellLabel } from '@/lib/utils';

const MAX_SPECIES_TRAITS = 3;
const MAX_ANCESTRY_TRAITS = 6;
const MAX_CHARACTERISTICS = 6;
const MAX_FLAWS = 3;
const MAX_SKILLS = 2;
const MAX_SIZES = 2;
const MAX_LANGUAGES = 2;
const DEFAULT_LANGUAGES = ['Universal'];
const SIZE_OPTIONS = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];

const SPECIES_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.SPECIES;

const SPECIES_TRAIT_WARNING =
  'Most species only have 2 species traits; the 3rd is almost always used for a type of natural weapon, if any. Are you sure you wish to add this trait?';

type TraitCategory = 'species_traits' | 'ancestry_traits' | 'characteristics' | 'flaws';

const TRAIT_LIMITS: Record<TraitCategory, number> = {
  species_traits: MAX_SPECIES_TRAITS,
  ancestry_traits: MAX_ANCESTRY_TRAITS,
  characteristics: MAX_CHARACTERISTICS,
  flaws: MAX_FLAWS,
};

function isSpeciesFormSaveReady(form: SpeciesFormState): boolean {
  return (
    !!form.name.trim() &&
    !!form.type.trim() &&
    form.skillIds.filter((id) => id !== '').length >= MAX_SKILLS &&
    form.ave_height !== '' &&
    form.ave_weight !== '' &&
    form.adulthood_lifespan[0] !== '' &&
    form.adulthood_lifespan[1] !== ''
  );
}

interface SpeciesFormState {
  name: string;
  description: string;
  type: string;
  sizes: string[];
  skillIds: string[];
  species_traits: string[];
  ancestry_traits: string[];
  characteristics: string[];
  flaws: string[];
  languages: string[];
  ave_height: number | '';
  ave_weight: number | '';
  adulthood_lifespan: [number | '', number | '']; // [adulthood_years, lifespan_years]
  imageId: string | null;
  imageUrl: string | null;
}

const initialState: SpeciesFormState = {
  name: '',
  description: '',
  type: '',
  sizes: ['Medium'],
  skillIds: [],
  species_traits: [],
  ancestry_traits: [],
  characteristics: [],
  flaws: [],
  languages: [...DEFAULT_LANGUAGES],
  ave_height: '',
  ave_weight: '',
  adulthood_lifespan: ['', ''],
  imageId: null,
  imageUrl: null,
};

interface SpeciesCreatorCache {
  form: SpeciesFormState;
  timestamp: number;
}

/** Default speed for species (not user-editable). */
const DEFAULT_SPECIES_SPEED = 6;

function normalizeTraitIds(ids: (string | number)[] | undefined, allTraits: Trait[]): string[] {
  if (!ids?.length) return [];
  return ids.map((id) => {
    const str = String(id);
    const found = allTraits.find((t) => String(t.id) === str || t.name === str);
    return found ? String(found.id) : str;
  });
}

function normalizeSkillIds(ids: (string | number)[] | undefined, allSkills: Skill[]): string[] {
  if (!ids?.length) return [];
  return ids.map((id) => {
    const str = String(id);
    if (str === '0') return '0';
    const found = allSkills.find((s) => String(s.id) === str || s.name === str);
    return found ? String(found.id) : str;
  });
}

function coerceNumberOrEmpty(v: unknown): number | '' {
  if (v === '' || v == null) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
}

/** Restore form from localStorage cache; normalizes trait/skill IDs to current codex IDs. */
function mergeCachedSpeciesForm(
  cache: unknown,
  allTraits: Trait[],
  allSkills: Skill[],
): SpeciesFormState | null {
  if (!cache || typeof cache !== 'object') return null;
  const c = cache as Record<string, unknown>;
  const form = c.form;
  if (!form || typeof form !== 'object') return null;
  const f = form as Record<string, unknown>;

  const sizesRaw = f.sizes;
  let sizes = Array.isArray(sizesRaw) ? sizesRaw.map(String).filter(Boolean) : [];
  if (!sizes.length && typeof f.size === 'string' && f.size.trim()) sizes = [f.size.trim()];
  if (!sizes.length) sizes = [...initialState.sizes];
  sizes = sizes.slice(0, MAX_SIZES);

  const languagesRaw = f.languages;
  const languages = Array.isArray(languagesRaw)
    ? languagesRaw.map(String).filter(Boolean).slice(0, MAX_LANGUAGES)
    : [...DEFAULT_LANGUAGES];

  const al = f.adulthood_lifespan;
  let adulthood_lifespan: [number | '', number | ''] = ['', ''];
  if (Array.isArray(al) && al.length >= 2) {
    adulthood_lifespan = [coerceNumberOrEmpty(al[0]), coerceNumberOrEmpty(al[1])];
  }

  const skillIdsRaw = (f.skillIds ?? f.skill_ids) as (string | number)[] | undefined;
  const speciesTraitsRaw = (f.species_traits ?? f.species_trait_ids) as (string | number)[] | undefined;
  const ancestryTraitsRaw = (f.ancestry_traits ?? f.ancestry_trait_ids) as (string | number)[] | undefined;
  const characteristicsRaw = (f.characteristics ?? f.characteristic_ids) as (string | number)[] | undefined;
  const flawsRaw = (f.flaws ?? f.flaw_ids) as (string | number)[] | undefined;

  return {
    ...initialState,
    name: String(f.name ?? ''),
    description: String(f.description ?? ''),
    type: String(f.type ?? ''),
    sizes,
    skillIds: normalizeSkillIds(skillIdsRaw, allSkills).slice(0, MAX_SKILLS),
    species_traits: normalizeTraitIds(speciesTraitsRaw, allTraits).slice(0, MAX_SPECIES_TRAITS),
    ancestry_traits: normalizeTraitIds(ancestryTraitsRaw, allTraits).slice(0, MAX_ANCESTRY_TRAITS),
    characteristics: normalizeTraitIds(characteristicsRaw, allTraits).slice(0, MAX_CHARACTERISTICS),
    flaws: normalizeTraitIds(flawsRaw, allTraits).slice(0, MAX_FLAWS),
    languages: languages.length ? languages : [...DEFAULT_LANGUAGES],
    ave_height: coerceNumberOrEmpty(f.ave_height),
    ave_weight: coerceNumberOrEmpty(f.ave_weight),
    adulthood_lifespan,
    imageId: typeof (f.imageId ?? f.image_id) === 'string' ? String(f.imageId ?? f.image_id) : null,
    imageUrl: typeof (f.imageUrl ?? f.image_url) === 'string' ? String(f.imageUrl ?? f.image_url) : null,
  };
}

export default function SpeciesCreatorPage() {
  const { user } = useAuthStore();
  const load = useLoadModalLibrary('species');
  const [showAddSpeciesAncestryModal, setShowAddSpeciesAncestryModal] = useState(false);
  const [showAddFlawModal, setShowAddFlawModal] = useState(false);
  const [showAddCharacteristicModal, setShowAddCharacteristicModal] = useState(false);
  const [showThirdSpeciesTraitConfirm, setShowThirdSpeciesTraitConfirm] = useState(false);
  const [pendingTraitAdd, setPendingTraitAdd] = useState<{ traitId: string; category: TraitCategory } | null>(null);
  const [pendingBatch, setPendingBatch] = useState<{ traitIds: string[]; category: TraitCategory } | null>(null);
  const [newLanguage, setNewLanguage] = useState('');

  const [form, setForm] = useState<SpeciesFormState>(initialState);
  const cacheBootstrapRef = useRef(false);
  const [cacheReady, setCacheReady] = useState(false);

  const { data: skills = [], isLoading: skillsLoading } = useCodexSkills();
  const { data: traits = [], isLoading: traitsLoading } = useTraits();
  const { isAdmin } = useAdmin();

  // Load draft from localStorage once codex lists are ready (same 30-day window as other creators)
  useEffect(() => {
    if (skillsLoading || traitsLoading) return;
    if (cacheBootstrapRef.current) return;
    cacheBootstrapRef.current = true;
    try {
      const raw = localStorage.getItem(SPECIES_CREATOR_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SpeciesCreatorCache;
        if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
          const merged = mergeCachedSpeciesForm(parsed, traits as Trait[], skills as Skill[]);
          if (merged) queueMicrotask(() => setForm(merged));
        } else {
          localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY);
    }
    queueMicrotask(() => setCacheReady(true));
  }, [skillsLoading, traitsLoading, traits, skills]);

  // Persist draft across refresh (mirrors item/power creator cache pattern)
  useEffect(() => {
    if (!cacheReady) return;
    try {
      const cache: SpeciesCreatorCache = { form, timestamp: Date.now() };
      localStorage.setItem(SPECIES_CREATOR_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // ignore quota / private mode
    }
  }, [cacheReady, form]);

  // Base skills only (no sub-skills) for species skill selection
  const skillOptions = useMemo(() => {
    const baseSkills = (skills as Skill[]).filter(
      (s) => s.base_skill_id == null || s.base_skill_id === 0
    );
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
      setForm(initialState);
    },
  });

  const handleSave = useCallback(async () => {
    if (!isSpeciesFormSaveReady(form)) {
      return;
    }
    await save.handleSave();
  }, [save, form]);

  const handleReset = useCallback(() => {
    try {
      localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY);
    } catch {
      // ignore
    }
    setForm(initialState);
    save.setSaveMessage(null);
  }, [save]);

  const loadSpeciesIntoForm = useCallback(
    (s: Species | Record<string, unknown>) => {
      const allTraitsArr = traits as Trait[];
      const allSkillsArr = skills as Skill[];
      const data = 'data' in s && s.data && typeof s.data === 'object' ? (s as { data: Record<string, unknown> }).data : s;
      const d = (data || s) as Record<string, unknown>;
      const species_traits = normalizeTraitIds((d.species_traits || d.species_trait_ids) as (string | number)[], allTraitsArr);
      const ancestry_traits = normalizeTraitIds((d.ancestry_traits || d.ancestry_trait_ids) as (string | number)[], allTraitsArr);
      const characteristics = normalizeTraitIds((d.characteristics || d.characteristic_ids) as (string | number)[], allTraitsArr);
      const flaws = normalizeTraitIds((d.flaws || d.flaw_ids) as (string | number)[], allTraitsArr);
      const skillIds = normalizeSkillIds((d.skills || d.skill_ids) as (string | number)[], allSkillsArr);
      let sizes = (d.sizes as string[]) || [];
      if (typeof d.sizes === 'string') sizes = (d.sizes as string).split(',').map((x) => x.trim()).filter(Boolean);
      if (!sizes.length && d.size) sizes = [d.size as string];
      if (!sizes.length) sizes = ['Medium'];
      const languages = Array.isArray(d.languages) ? (d.languages as string[]) : [];
      const lifespan = d.adulthood_lifespan as number[] | undefined;
      setForm({
        name: String(d.name ?? ''),
        description: String(d.description ?? ''),
        type: String(d.type ?? ''),
        sizes: sizes.slice(0, MAX_SIZES),
        skillIds: skillIds.slice(0, MAX_SKILLS),
        species_traits: species_traits.slice(0, MAX_SPECIES_TRAITS),
        ancestry_traits: ancestry_traits.slice(0, MAX_ANCESTRY_TRAITS),
        characteristics: characteristics.slice(0, MAX_CHARACTERISTICS),
        flaws: flaws.slice(0, MAX_FLAWS),
        languages: languages.length ? languages.slice(0, MAX_LANGUAGES) : [...DEFAULT_LANGUAGES],
        ave_height: d.ave_height != null ? Number(d.ave_height) : '',
        ave_weight: d.ave_weight != null ? Number(d.ave_weight) : '',
        adulthood_lifespan: lifespan && lifespan.length >= 2 ? [lifespan[0], lifespan[1]] : ['', ''],
        imageId: typeof (d.imageId ?? d.image_id) === 'string' ? String(d.imageId ?? d.image_id) : null,
        imageUrl: typeof (d.imageUrl ?? d.image_url) === 'string' ? String(d.imageUrl ?? d.image_url) : null,
      });
      load.closeLoadModal();
      save.setSaveMessage({ type: 'success', text: 'Species loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [traits, skills, load, save]
  );

  /** Add multiple traits at once; respects limits and shows third-species-trait confirm when needed. */
  const addTraitBatchToCategory = useCallback(
    (traitIds: string[], category: TraitCategory) => {
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
            traitIds: [needThirdConfirm, ...traitIds.filter((x) => !toAdd.includes(x) && x !== needThirdConfirm)],
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
    },
    []
  );

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

  const addSize = useCallback((size: string) => {
    if (form.sizes.includes(size) || form.sizes.length >= MAX_SIZES) return;
    setForm((prev) => ({ ...prev, sizes: [...prev.sizes, size] }));
  }, [form.sizes]);

  const removeSize = useCallback((size: string) => {
    setForm((prev) => {
      const next = prev.sizes.filter((s) => s !== size);
      return { ...prev, sizes: next.length ? next : ['Medium'] };
    });
  }, []);

  const traitIdToName = useMemo(() => {
    const m = new Map<string, string>();
    (traits as Trait[]).forEach((t) => m.set(String(t.id), t.name));
    return m;
  }, [traits]);

  const summaryStatRows = useMemo(
    () => [
      { label: 'Species traits', value: `${form.species_traits.length} / ${MAX_SPECIES_TRAITS}` },
      { label: 'Ancestry traits', value: `${form.ancestry_traits.length} / ${MAX_ANCESTRY_TRAITS}` },
      { label: 'Characteristics', value: `${form.characteristics.length} / ${MAX_CHARACTERISTICS}` },
      { label: 'Flaws', value: `${form.flaws.length} / ${MAX_FLAWS}` },
      { label: 'Base skills', value: `${form.skillIds.length} / ${MAX_SKILLS}` },
      { label: 'Sizes', value: `${form.sizes.length} / ${MAX_SIZES}` },
      { label: 'Languages', value: `${form.languages.length} / ${MAX_LANGUAGES}` },
    ],
    [form]
  );

  // Collapsed summaries for collapsible sections (match other creators)
  const basicsSummary = useMemo(() => {
    if (form.name.trim()) return form.type ? `${form.name.trim()} · ${form.type}` : form.name.trim();
    return form.type ? form.type : 'Name, type, description';
  }, [form.name, form.type]);
  const sizesSummary = useMemo(() => form.sizes.join(', ') || 'Medium', [form.sizes]);
  const baseSkillsSummary = useMemo(() => {
    const names = form.skillIds.map((id) => (id === '0' || !id ? 'Any' : (skills as Skill[]).find((s) => String(s.id) === id)?.name ?? id));
    return names.filter(Boolean).length ? names.join(', ') : 'Select base skills';
  }, [form.skillIds, skills]);
  const languagesSummary = useMemo(() => form.languages.join(', ') || 'None', [form.languages]);
  const traitsSummary = useMemo(() => {
    const parts = [];
    if (form.species_traits.length) parts.push(`${form.species_traits.length} species`);
    if (form.ancestry_traits.length) parts.push(`${form.ancestry_traits.length} ancestry`);
    if (form.characteristics.length) parts.push(`${form.characteristics.length} characteristics`);
    if (form.flaws.length) parts.push(`${form.flaws.length} flaws`);
    return parts.length ? parts.join(', ') : 'No traits';
  }, [form.species_traits.length, form.ancestry_traits.length, form.characteristics.length, form.flaws.length]);
  const heightWeightLifespanSummary = useMemo(() => {
    const h = form.ave_height !== '' ? `${form.ave_height} cm` : null;
    const w = form.ave_weight !== '' ? `${form.ave_weight} kg` : null;
    const a = form.adulthood_lifespan[0] !== '' ? form.adulthood_lifespan[0] : null;
    const l = form.adulthood_lifespan[1] !== '' ? form.adulthood_lifespan[1] : null;
    if (h && w && a != null && l != null) return `H: ${h}, W: ${w}, ${a}–${l} yrs`;
    if (h || w || a != null || l != null) return [h, w, a != null ? `Adulthood: ${a}` : null, l != null ? `Lifespan: ${l}` : null].filter(Boolean).join(', ');
    return 'Not set';
  }, [form.ave_height, form.ave_weight, form.adulthood_lifespan]);

  return (
    <CreatorPageShell
      icon={<Users className="w-8 h-8 text-primary-link-fg" />}
      title="Species Creator"
      description="Create custom species. Add traits (species, ancestry, characteristic, flaw), choose base skills and sizes, and set languages. Load from Realms Codex or My Codex; save to My Codex."
      user={user}
      auth={{ returnPath: '/species-creator', contentType: 'species', requireAuthToLoad: false }}
      showPublicPrivate={isAdmin}
      saveTarget={save.saveTarget}
      onSaveTargetChange={save.setSaveTarget}
      onSave={handleSave}
      onLoad={load.openLoadModal}
      onReset={handleReset}
      saving={save.saving}
      saveDisabled={!isSpeciesFormSaveReady(form)}
      stickySidebar={false}
      loading={{
        isLoading: skillsLoading || traitsLoading,
        loadingMessage: 'Loading species creator...',
      }}
      publish={{
        isOpen: save.showPublishConfirm,
        onClose: () => save.setShowPublishConfirm(false),
        onConfirm: () => void save.confirmPublish(),
        title: save.publishConfirmTitle,
        description:
          save.publishConfirmDescription?.(form.name.trim(), {
            existingInPublic: save.publishExistingInPublic,
          }) ?? '',
      }}
      loadModal={{
        isOpen: load.showLoadModal,
        onClose: load.closeLoadModal,
        title: 'Load species',
        selectableItems: load.selectableItems,
        columns: load.columns,
        gridColumns: load.gridColumns,
        isLoading: load.isLoading,
        error: load.error,
        headerExtra: <SourceFilter value={load.source} onChange={load.setSource} />,
        optionsSummary: sourceFilterSummary(load.source),
        optionsActiveCount: load.source !== 'all' ? 1 : 0,
        emptyMessage: load.emptyMessage,
        emptySubMessage: load.emptySubMessage,
        searchPlaceholder: 'Search species...',
        onSelect: (item) => {
          const raw = (item.data as { raw?: Species | Record<string, unknown> })?.raw;
          if (raw) loadSpeciesIntoForm(raw as Species);
        },
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Summary"
          statRows={summaryStatRows}
          lineItems={[
            { label: 'Sizes', items: form.sizes },
            { label: 'Skills', items: form.skillIds.map((id) => (id === '0' ? 'Any' : (skills as Skill[]).find((s) => String(s.id) === id)?.name ?? id)) },
            { label: 'Languages', items: form.languages },
          ]}
        />
      }
      extraModals={
        <>
          <ConfirmActionModal
            isOpen={showThirdSpeciesTraitConfirm}
            onClose={() => { setShowThirdSpeciesTraitConfirm(false); setPendingTraitAdd(null); setPendingBatch(null); }}
            onConfirm={confirmThirdSpeciesTrait}
            title="Third species trait"
            description={SPECIES_TRAIT_WARNING}
            confirmLabel="Add anyway"
          />
          <TraitListModal
            isOpen={showAddSpeciesAncestryModal}
            onClose={() => setShowAddSpeciesAncestryModal(false)}
            title="Add species or ancestry trait"
            traits={traits as Trait[]}
            filter={(t) => !t.flaw && !t.characteristic}
            form={form}
            traitLimits={TRAIT_LIMITS}
            mode="species_ancestry"
            onAddBatch={addTraitBatchToCategory}
            onThirdSpeciesTrait={(traitId) => {
              setPendingTraitAdd({ traitId, category: 'species_traits' });
              setShowThirdSpeciesTraitConfirm(true);
            }}
          />
          <TraitListModal
            isOpen={showAddFlawModal}
            onClose={() => setShowAddFlawModal(false)}
            title="Add flaw"
            traits={traits as Trait[]}
            filter={(t) => t.flaw === true}
            form={form}
            traitLimits={TRAIT_LIMITS}
            mode="flaw"
            onAddBatch={addTraitBatchToCategory}
          />
          <TraitListModal
            isOpen={showAddCharacteristicModal}
            onClose={() => setShowAddCharacteristicModal(false)}
            title="Add characteristic"
            traits={traits as Trait[]}
            filter={(t) => t.characteristic === true}
            form={form}
            traitLimits={TRAIT_LIMITS}
            mode="characteristic"
            onAddBatch={addTraitBatchToCategory}
          />
        </>
      }
    >
      <div className="space-y-6">
        <CollapsibleSection title="Basics" collapsedSummary={basicsSummary} defaultExpanded={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Name *"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Species name"
                aria-label="Species name"
              />
            </div>
            <div>
              <label htmlFor="species-type" className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <select
                id="species-type"
                className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-text-primary"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                aria-label="Creature type"
              >
                <option value="">Select type</option>
                {CREATURE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Species description"
              rows={3}
              className="w-full"
              aria-label="Species description"
            />
          </div>
          {isAdmin && (
            <div className="mt-4">
              <RealmsImageField
                categories="species"
                imageId={form.imageId}
                imageUrl={form.imageUrl}
                onChange={({ imageId, imageUrl }) =>
                  setForm((previous) => ({ ...previous, imageId, imageUrl }))
                }
                entityName={form.name}
                label="Species card art"
                hint="Uploads are saved to the shared image bank."
              />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title={`Sizes (up to ${MAX_SIZES})`} collapsedSummary={sizesSummary} defaultExpanded={true}>
          <p className="text-sm text-text-muted dark:text-text-secondary mb-4">Choose up to two size options for this species.</p>
          <ChipList items={form.sizes} onRemove={removeSize} color="bg-primary-subtle-bg text-primary-subtle-fg" />
          <div className="flex flex-wrap gap-2 mt-2">
            {SIZE_OPTIONS.filter((s) => !form.sizes.includes(s)).slice(0, SIZE_OPTIONS.length - form.sizes.length).map((size) => (
              <Button key={size} variant="outline" size="sm" onClick={() => addSize(size)} disabled={form.sizes.length >= MAX_SIZES}>
                + {size}
              </Button>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Base skills (2)" collapsedSummary={baseSkillsSummary} defaultExpanded={true}>
          <p className="text-sm text-text-muted dark:text-text-secondary mb-4">Select two base skills; one may be &quot;Any&quot; (id 0). You cannot pick the same skill twice.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([0, 1] as const).map((i) => (
              <div key={i}>
                <label htmlFor={i === 0 ? 'base-skill-0' : 'base-skill-1'} className="block text-sm font-medium text-text-secondary mb-1">Skill {i + 1}</label>
                <select
                  id={i === 0 ? 'base-skill-0' : 'base-skill-1'}
                  className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-text-primary"
                  value={form.skillIds[i] ?? ''}
                  onChange={(e) => setSkill(i, e.target.value)}
                  aria-label={i === 0 ? 'First base skill' : 'Second base skill'}
                >
                  <option value="">Select</option>
                  {skillOptions.filter((opt) => opt.value !== form.skillIds[1 - i]).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={`Languages (up to ${MAX_LANGUAGES})`} collapsedSummary={languagesSummary} defaultExpanded={true}>
          <p className="text-sm text-text-muted dark:text-text-secondary mb-4">Universal can be included by default; add or remove as desired.</p>
          <ChipList items={form.languages} onRemove={removeLanguage} color="bg-info-100 dark:bg-info-900/30 text-info-800 dark:text-info-300" />
          <div className="flex gap-2 mt-2">
            <Input
              label="New language"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
              placeholder="Enter language..."
              className="flex-1"
              aria-label="New language to add"
            />
            <Button onClick={addLanguage} disabled={!newLanguage.trim() || form.languages.length >= MAX_LANGUAGES} size="sm">Add</Button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Traits"
          collapsedSummary={traitsSummary}
          defaultExpanded={true}
          rightSlot={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setShowAddSpeciesAncestryModal(true)}
                disabled={form.species_traits.length >= MAX_SPECIES_TRAITS && form.ancestry_traits.length >= MAX_ANCESTRY_TRAITS}
              >
                <Plus className="w-4 h-4 mr-1" aria-hidden />
                Species/ancestry
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAddFlawModal(true)} disabled={form.flaws.length >= MAX_FLAWS}>
                <Plus className="w-4 h-4 mr-1" aria-hidden />
                Flaw
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAddCharacteristicModal(true)} disabled={form.characteristics.length >= MAX_CHARACTERISTICS}>
                <Plus className="w-4 h-4 mr-1" aria-hidden />
                Characteristic
              </Button>
            </div>
          }
        >
          <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
            Species traits ({MAX_SPECIES_TRAITS} max), ancestry traits ({MAX_ANCESTRY_TRAITS} max), characteristics ({MAX_CHARACTERISTICS} max), flaws ({MAX_FLAWS} max). Add from the matching list; species/ancestry traits are classified after you add.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TraitBlock title="Species traits" limit={MAX_SPECIES_TRAITS} ids={form.species_traits} traitIdToName={traitIdToName} onRemove={(id) => removeTrait('species_traits', id)} />
            <TraitBlock title="Ancestry traits" limit={MAX_ANCESTRY_TRAITS} ids={form.ancestry_traits} traitIdToName={traitIdToName} onRemove={(id) => removeTrait('ancestry_traits', id)} />
            <TraitBlock title="Characteristics" limit={MAX_CHARACTERISTICS} ids={form.characteristics} traitIdToName={traitIdToName} onRemove={(id) => removeTrait('characteristics', id)} />
            <TraitBlock title="Flaws" limit={MAX_FLAWS} ids={form.flaws} traitIdToName={traitIdToName} onRemove={(id) => removeTrait('flaws', id)} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Height, weight & lifespan *" collapsedSummary={heightWeightLifespanSummary} defaultExpanded={true}>
          <p className="text-sm text-text-muted dark:text-text-secondary mb-4">Required. Average height (cm), average weight (kg), adulthood age, and lifespan (years).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Average height (cm) *"
                type="number"
                min={0}
                value={form.ave_height}
                onChange={(e) => setForm((p) => ({ ...p, ave_height: e.target.value === '' ? '' : Number(e.target.value) }))}
                aria-label="Average height in centimeters"
              />
            </div>
            <div>
              <Input
                label="Average weight (kg) *"
                type="number"
                min={0}
                value={form.ave_weight}
                onChange={(e) => setForm((p) => ({ ...p, ave_weight: e.target.value === '' ? '' : Number(e.target.value) }))}
                aria-label="Average weight in kilograms"
              />
            </div>
            <div>
              <Input
                label="Adulthood age *"
                type="number"
                min={0}
                value={form.adulthood_lifespan[0]}
                onChange={(e) => setForm((p) => ({ ...p, adulthood_lifespan: [e.target.value === '' ? '' : Number(e.target.value), p.adulthood_lifespan[1]] }))}
                aria-label="Adulthood age"
              />
            </div>
            <div>
              <Input
                label="Lifespan (years) *"
                type="number"
                min={0}
                value={form.adulthood_lifespan[1]}
                onChange={(e) => setForm((p) => ({ ...p, adulthood_lifespan: [p.adulthood_lifespan[0], e.target.value === '' ? '' : Number(e.target.value)] }))}
                aria-label="Lifespan in years"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </CreatorPageShell>
  );
}

function TraitBlock({
  title,
  limit,
  ids,
  traitIdToName,
  onRemove,
}: {
  title: string;
  limit: number;
  ids: string[];
  traitIdToName: Map<string, string>;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-secondary mb-2">{title} ({ids.length} / {limit})</h3>
      {ids.length === 0 ? (
        <p className="text-sm text-text-muted italic">None</p>
      ) : (
        <ul className="space-y-1">
          {ids.map((id) => (
            <li key={id} className="flex items-center justify-between gap-2 py-1">
              <span className="text-text-primary">{traitIdToName.get(id) ?? id}</span>
              <button type="button" onClick={() => onRemove(id)} className="text-text-muted hover:text-danger-fg">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const TRAIT_GRID_COLUMNS = '1.5fr 0.6fr 0.6fr';
const TRAIT_LIST_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: 'rec_period', label: 'RECOVERY' },
];

interface TraitListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  traits: Trait[];
  filter: (t: Trait) => boolean;
  form: SpeciesFormState;
  traitLimits: Record<TraitCategory, number>;
  mode: 'species_ancestry' | 'flaw' | 'characteristic';
  onAddBatch: (traitIds: string[], category: TraitCategory) => void;
  onThirdSpeciesTrait?: (traitId: string) => void;
}

function TraitListModal({
  isOpen,
  onClose,
  title,
  traits,
  filter,
  form,
  traitLimits,
  mode,
  onAddBatch,
  onThirdSpeciesTrait,
}: TraitListModalProps) {
  const alreadyUsed = useMemo(
    () => new Set([...form.species_traits, ...form.ancestry_traits, ...form.characteristics, ...form.flaws]),
    [form]
  );

  const items: SelectableItem[] = useMemo(() => {
    return traits
      .filter((t) => filter(t) && !alreadyUsed.has(String(t.id)))
      .map((t) => ({
        id: String(t.id),
        name: t.name,
        description: t.description ?? '',
        columns: [
          {
            key: 'uses_per_rec',
            value: t.uses_per_rec != null && t.uses_per_rec > 0 ? String(t.uses_per_rec) : '-',
            align: 'center' as const,
          },
          {
            key: 'rec_period',
            value: t.rec_period ? formatListCellLabel(t.rec_period) : '-',
            align: 'center' as const,
          },
        ],
        data: t,
      }));
  }, [traits, filter, alreadyUsed]);

  const canAddSpecies = form.species_traits.length < traitLimits.species_traits;
  const canAddAncestry = form.ancestry_traits.length < traitLimits.ancestry_traits;
  const canAddFlaw = form.flaws.length < traitLimits.flaws;
  const canAddCharacteristic = form.characteristics.length < traitLimits.characteristics;

  const description =
    mode === 'species_ancestry'
      ? 'Add as species traits or ancestry traits.'
      : undefined;

  const addIds = (selected: SelectableItem[], category: TraitCategory) => {
    const ids = selected.map((s) => String(s.id));
    if (!ids.length) return;
    if (category === 'species_traits' && ids.length === 1 && form.species_traits.length === 2) {
      onThirdSpeciesTrait?.(ids[0]);
      onClose();
      return;
    }
    onAddBatch(ids, category);
    onClose();
  };

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      items={items}
      onConfirm={(selected) => {
        if (mode === 'flaw') addIds(selected, 'flaws');
        else if (mode === 'characteristic') addIds(selected, 'characteristics');
      }}
      columns={TRAIT_LIST_COLUMNS}
      gridColumns={TRAIT_GRID_COLUMNS}
      itemLabel={mode === 'flaw' ? 'flaw' : mode === 'characteristic' ? 'characteristic' : 'trait'}
      emptyMessage="No traits found"
      emptySubMessage="Try adjusting your search or check limits."
      searchPlaceholder="Search traits..."
      confirmLabel={
        mode === 'flaw'
          ? 'Add selected'
          : mode === 'characteristic'
            ? 'Add selected'
            : 'Add Selected'
      }
      confirmDisabled={
        mode === 'flaw'
          ? () => !canAddFlaw
          : mode === 'characteristic'
            ? () => !canAddCharacteristic
            : undefined
      }
      primaryActions={
        mode === 'species_ancestry'
          ? (selected) => (
              <>
                <Button
                  onClick={() => addIds(selected, 'species_traits')}
                  disabled={selected.length === 0 || !canAddSpecies}
                >
                  Add selected as species trait{selected.length !== 1 ? 's' : ''}
                </Button>
                <Button
                  onClick={() => addIds(selected, 'ancestry_traits')}
                  disabled={selected.length === 0 || !canAddAncestry}
                >
                  Add selected as ancestry trait{selected.length !== 1 ? 's' : ''}
                </Button>
              </>
            )
          : undefined
      }
      size="lg"
      className="max-h-[60vh]"
    />
  );
}
