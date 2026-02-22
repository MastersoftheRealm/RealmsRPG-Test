/**
 * Species Creator Page
 * ====================
 * User-facing species creator: traits (species/ancestry/characteristic/flaw), base skills,
 * sizes, languages. Load from public codex or My Codex; save to private codex (user species).
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Users, FolderOpen, Plus, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores';
import {
  useSpecies,
  useCodexSkills,
  useTraits,
  useUserSpecies,
  useCreatorSave,
  type Species,
  type Trait,
  type Skill,
} from '@/hooks';
import { CreatorLayout, CreatorSaveToolbar, CreatorSummaryPanel } from '@/components/creator';
import { LoginPromptModal, ConfirmActionModal } from '@/components/shared';
import { Button, Input, Textarea, Modal, LoadingState, Alert } from '@/components/ui';
import { ChipList } from '../creature-creator/CreatureCreatorHelpers';

const MAX_SPECIES_TRAITS = 3;
const MAX_ANCESTRY_TRAITS = 6;
const MAX_CHARACTERISTICS = 6;
const MAX_FLAWS = 3;
const MAX_SKILLS = 2;
const MAX_SIZES = 2;
const MAX_LANGUAGES = 2;
const DEFAULT_LANGUAGES = ['Universal'];
const SIZE_OPTIONS = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];

const SPECIES_TRAIT_WARNING =
  'Most species only have 2 species traits; the 3rd is almost always used for a type of natural weapon, if any. Are you sure you wish to add this trait?';

type TraitCategory = 'species_traits' | 'ancestry_traits' | 'characteristics' | 'flaws';

interface SpeciesFormState {
  name: string;
  description: string;
  type: string;
  speed: number;
  sizes: string[];
  skillIds: string[];
  species_traits: string[];
  ancestry_traits: string[];
  characteristics: string[];
  flaws: string[];
  languages: string[];
  ave_height: number | '';
  ave_weight: number | '';
  adulthood_lifespan: [number | '', number | ''];
}

const initialState: SpeciesFormState = {
  name: '',
  description: '',
  type: '',
  speed: 6,
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
};

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

export default function SpeciesCreatorPage() {
  const { user } = useAuthStore();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showAddTraitModal, setShowAddTraitModal] = useState(false);
  const [showThirdSpeciesTraitConfirm, setShowThirdSpeciesTraitConfirm] = useState(false);
  const [pendingTraitAdd, setPendingTraitAdd] = useState<{ traitId: string; category: TraitCategory } | null>(null);
  const [newLanguage, setNewLanguage] = useState('');

  const [form, setForm] = useState<SpeciesFormState>(initialState);

  const { data: codexSpecies = [], isLoading: codexLoading } = useSpecies();
  const { data: userSpeciesList = [] } = useUserSpecies();
  const { data: skills = [] } = useCodexSkills();
  const { data: traits = [] } = useTraits();

  const traitLimits: Record<TraitCategory, number> = {
    species_traits: MAX_SPECIES_TRAITS,
    ancestry_traits: MAX_ANCESTRY_TRAITS,
    characteristics: MAX_CHARACTERISTICS,
    flaws: MAX_FLAWS,
  };

  const skillOptions = useMemo(() => {
    const opts = (skills as Skill[]).map((s) => ({ value: String(s.id), label: s.name }));
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
        speed: form.speed,
        skills: form.skillIds,
        species_traits: form.species_traits,
        ancestry_traits: form.ancestry_traits,
        characteristics: form.characteristics,
        flaws: form.flaws,
        languages: form.languages.filter(Boolean),
        ave_height: form.ave_height !== '' ? Number(form.ave_height) : undefined,
        ave_weight: form.ave_weight !== '' ? Number(form.ave_weight) : undefined,
        adulthood_lifespan: adulthood,
      },
    };
  }, [form]);

  const save = useCreatorSave({
    type: 'species',
    getPayload,
    successMessage: 'Species saved to My Codex!',
    onSaveSuccess: () => setForm(initialState),
  });

  const handleSave = useCallback(async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    await save.handleSave();
  }, [user, save]);

  const handleReset = useCallback(() => {
    setForm(initialState);
    save.setSaveMessage(null);
  }, [save]);

  const loadSpeciesIntoForm = useCallback(
    (s: Species | (typeof userSpeciesList)[0]) => {
      const allTraitsArr = traits as Trait[];
      const allSkillsArr = skills as Skill[];
      const data = 'data' in s ? (s as { data: Record<string, unknown> }).data : s;
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
        speed: typeof d.speed === 'number' ? d.speed : 6,
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
      });
      setShowLoadModal(false);
    },
    [traits, skills]
  );

  const addTraitToCategory = useCallback(
    (traitId: string, category: TraitCategory) => {
      const key = category;
      const current = form[key];
      if (current.length >= traitLimits[category]) return;
      if (category === 'species_traits' && current.length === 2) {
        setPendingTraitAdd({ traitId, category });
        setShowThirdSpeciesTraitConfirm(true);
        return;
      }
      if (current.includes(traitId)) return;
      setForm((prev) => ({ ...prev, [key]: [...prev[key], traitId] }));
      setShowAddTraitModal(false);
    },
    [form, traitLimits]
  );

  const confirmThirdSpeciesTrait = useCallback(() => {
    if (pendingTraitAdd?.category === 'species_traits') {
      setForm((prev) => ({
        ...prev,
        species_traits: [...prev.species_traits, pendingTraitAdd.traitId],
      }));
    }
    setPendingTraitAdd(null);
    setShowThirdSpeciesTraitConfirm(false);
    setShowAddTraitModal(false);
  }, [pendingTraitAdd]);

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

  const canAddTrait = useMemo(() => {
    return (
      form.species_traits.length < MAX_SPECIES_TRAITS ||
      form.ancestry_traits.length < MAX_ANCESTRY_TRAITS ||
      form.characteristics.length < MAX_CHARACTERISTICS ||
      form.flaws.length < MAX_FLAWS
    );
  }, [form]);

  return (
    <CreatorLayout
      icon={<Users className="w-8 h-8 text-primary-600" />}
      title="Species Creator"
      description="Create custom species. Add traits (species, ancestry, characteristic, flaw), choose base skills and sizes, and set languages. Load from Public Codex or My Codex; save to My Codex."
      actions={
        <CreatorSaveToolbar
          saveTarget="private"
          onSaveTargetChange={() => {}}
          onSave={handleSave}
          onLoad={() => setShowLoadModal(true)}
          onReset={handleReset}
          saving={save.saving}
          saveDisabled={!form.name.trim()}
          showPublicPrivate={false}
          user={user}
        />
      }
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
      modals={
        <>
          <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} returnPath="/species-creator" />
          <ConfirmActionModal
            isOpen={showThirdSpeciesTraitConfirm}
            onClose={() => { setShowThirdSpeciesTraitConfirm(false); setPendingTraitAdd(null); }}
            onConfirm={confirmThirdSpeciesTrait}
            title="Third species trait"
            description={SPECIES_TRAIT_WARNING}
            confirmLabel="Add anyway"
          />
          {save.showPublishConfirm && (
            <ConfirmActionModal
              isOpen={save.showPublishConfirm}
              onClose={() => save.setShowPublishConfirm(false)}
              onConfirm={save.confirmPublish}
              title={save.publishConfirmTitle}
              description={save.publishConfirmDescription?.(form.name, { existingInPublic: save.publishExistingInPublic }) ?? ''}
              confirmLabel="Publish"
            />
          )}

          <Modal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} title="Load species" size="lg">
            <p className="text-sm text-text-muted mb-4">Load a species from Public Codex or My Codex to edit and save to your private codex.</p>
            {codexLoading ? (
              <LoadingState />
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {userSpeciesList.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">My Codex</h3>
                    <ul className="space-y-1">
                      {userSpeciesList.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="text-left w-full px-3 py-2 rounded-lg hover:bg-surface-alt text-primary-700"
                            onClick={() => loadSpeciesIntoForm(s)}
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">Public Codex</h3>
                  <ul className="space-y-1">
                    {(codexSpecies as Species[]).map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="text-left w-full px-3 py-2 rounded-lg hover:bg-surface-alt text-primary-700"
                          onClick={() => loadSpeciesIntoForm(s)}
                        >
                          {s.name} {s.type ? `(${s.type})` : ''}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showAddTraitModal} onClose={() => setShowAddTraitModal(false)} title="Add trait" size="md">
            <AddTraitModalContent
              traits={traits as Trait[]}
              form={form}
              traitLimits={traitLimits}
              traitIdToName={traitIdToName}
              onAdd={addTraitToCategory}
              onClose={() => setShowAddTraitModal(false)}
            />
          </Modal>
        </>
      }
    >
      {save.saveMessage && (
        <Alert variant={save.saveMessage.type === 'error' ? 'danger' : 'success'} className="mb-4">
          {save.saveMessage.text}
        </Alert>
      )}

      <div className="space-y-6">
        <section className="bg-surface rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Basics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Species name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <Input value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. Humanoid" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Speed</label>
              <Input type="number" min={0} value={form.speed} onChange={(e) => setForm((p) => ({ ...p, speed: parseInt(e.target.value, 10) || 0 }))} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Species description" rows={3} className="w-full" />
          </div>
        </section>

        <section className="bg-surface rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-text-primary mb-2">Sizes (up to {MAX_SIZES})</h2>
          <p className="text-sm text-text-muted mb-4">Choose up to two size options for this species.</p>
          <ChipList items={form.sizes} onRemove={removeSize} color="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200" />
          <div className="flex flex-wrap gap-2 mt-2">
            {SIZE_OPTIONS.filter((s) => !form.sizes.includes(s)).slice(0, SIZE_OPTIONS.length - form.sizes.length).map((size) => (
              <Button key={size} variant="outline" size="sm" onClick={() => addSize(size)} disabled={form.sizes.length >= MAX_SIZES}>
                + {size}
              </Button>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-text-primary mb-2">Base skills (2)</h2>
          <p className="text-sm text-text-muted mb-4">Select two base skills; one may be &quot;Any&quot; (id 0). You cannot pick the same skill twice.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([0, 1] as const).map((i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-text-secondary mb-1">Skill {i + 1}</label>
                <select
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                  value={form.skillIds[i] ?? ''}
                  onChange={(e) => setSkill(i, e.target.value)}
                >
                  <option value="">— Select —</option>
                  {skillOptions.filter((opt) => opt.value !== form.skillIds[1 - i]).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-text-primary mb-2">Languages (up to {MAX_LANGUAGES})</h2>
          <p className="text-sm text-text-muted mb-4">Universal can be included by default; add or remove as desired.</p>
          <ChipList items={form.languages} onRemove={removeLanguage} color="bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300" />
          <div className="flex gap-2 mt-2">
            <Input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLanguage()} placeholder="Enter language..." className="flex-1" />
            <Button onClick={addLanguage} disabled={!newLanguage.trim() || form.languages.length >= MAX_LANGUAGES} size="sm">Add</Button>
          </div>
        </section>

        <section className="bg-surface rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-text-primary mb-2">Traits</h2>
          <p className="text-sm text-text-muted mb-4">
            Species traits ({MAX_SPECIES_TRAITS} max), ancestry traits ({MAX_ANCESTRY_TRAITS} max), characteristics ({MAX_CHARACTERISTICS} max), flaws ({MAX_FLAWS} max). Classify each trait when adding.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <TraitBlock title="Species traits" limit={MAX_SPECIES_TRAITS} ids={form.species_traits} traitIdToName={traitIdToName} onRemove={(id) => removeTrait('species_traits', id)} />
            <TraitBlock title="Ancestry traits" limit={MAX_ANCESTRY_TRAITS} ids={form.ancestry_traits} traitIdToName={traitIdToName} onRemove={(id) => removeTrait('ancestry_traits', id)} />
            <TraitBlock title="Characteristics" limit={MAX_CHARACTERISTICS} ids={form.characteristics} traitIdToName={traitIdToName} onRemove={(id) => removeTrait('characteristics', id)} />
            <TraitBlock title="Flaws" limit={MAX_FLAWS} ids={form.flaws} traitIdToName={traitIdToName} onRemove={(id) => removeTrait('flaws', id)} />
          </div>
          <Button onClick={() => setShowAddTraitModal(true)} disabled={!canAddTrait}>
            <Plus className="w-4 h-4 mr-2" />
            Add trait
          </Button>
        </section>

        <section className="bg-surface rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Optional: height, weight, lifespan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Average height (cm)</label>
              <Input type="number" min={0} value={form.ave_height} onChange={(e) => setForm((p) => ({ ...p, ave_height: e.target.value === '' ? '' : Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Average weight (kg)</label>
              <Input type="number" min={0} value={form.ave_weight} onChange={(e) => setForm((p) => ({ ...p, ave_weight: e.target.value === '' ? '' : Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Adulthood age</label>
              <Input type="number" min={0} value={form.adulthood_lifespan[0]} onChange={(e) => setForm((p) => ({ ...p, adulthood_lifespan: [e.target.value === '' ? '' : Number(e.target.value), p.adulthood_lifespan[1]] }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Max age</label>
              <Input type="number" min={0} value={form.adulthood_lifespan[1]} onChange={(e) => setForm((p) => ({ ...p, adulthood_lifespan: [p.adulthood_lifespan[0], e.target.value === '' ? '' : Number(e.target.value)] }))} />
            </div>
          </div>
        </section>
      </div>
    </CreatorLayout>
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
              <button type="button" onClick={() => onRemove(id)} className="text-text-muted hover:text-danger-500">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddTraitModalContent({
  traits,
  form,
  traitLimits,
  traitIdToName,
  onAdd,
  onClose,
}: {
  traits: Trait[];
  form: SpeciesFormState;
  traitLimits: Record<TraitCategory, number>;
  traitIdToName: Map<string, string>;
  onAdd: (traitId: string, category: TraitCategory) => void;
  onClose: () => void;
}) {
  const [selectedTraitId, setSelectedTraitId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TraitCategory>('species_traits');

  const alreadyUsed = useMemo(() => {
    const set = new Set([...form.species_traits, ...form.ancestry_traits, ...form.characteristics, ...form.flaws]);
    return set;
  }, [form]);

  const availableTraits = useMemo(() => traits.filter((t) => !alreadyUsed.has(String(t.id))), [traits, alreadyUsed]);
  const canAddToCategory = form[selectedCategory].length < traitLimits[selectedCategory];

  const handleAdd = () => {
    if (!selectedTraitId || !canAddToCategory) return;
    onAdd(selectedTraitId, selectedCategory);
    setSelectedTraitId('');
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">Choose a trait and classify it. Limits: Species {traitLimits.species_traits}, Ancestry {traitLimits.ancestry_traits}, Characteristics {traitLimits.characteristics}, Flaws {traitLimits.flaws}.</p>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Trait</label>
        <select
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
          value={selectedTraitId}
          onChange={(e) => setSelectedTraitId(e.target.value)}
        >
          <option value="">— Select trait —</option>
          {availableTraits.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Classification</label>
        <select
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as TraitCategory)}
        >
          <option value="species_traits">Species trait ({form.species_traits.length}/{traitLimits.species_traits})</option>
          <option value="ancestry_traits">Ancestry trait ({form.ancestry_traits.length}/{traitLimits.ancestry_traits})</option>
          <option value="characteristics">Characteristic ({form.characteristics.length}/{traitLimits.characteristics})</option>
          <option value="flaws">Flaw ({form.flaws.length}/{traitLimits.flaws})</option>
        </select>
      </div>
      {selectedCategory === 'species_traits' && form.species_traits.length === 2 && (
        <Alert variant="warning" className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{SPECIES_TRAIT_WARNING}</span>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} disabled={!selectedTraitId || !canAddToCategory}>Add trait</Button>
      </div>
    </div>
  );
}
