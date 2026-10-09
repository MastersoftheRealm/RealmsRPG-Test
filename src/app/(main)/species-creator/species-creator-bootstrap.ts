/**
 * Species Creator — bootstrap helpers & form types (TASK-601)
 * ==========================================================
 */

import type { Trait, Skill, Species } from '@/hooks';
import { defined } from '@/lib/utils';
import { CACHE_EXPIRY_MS, CREATOR_CACHE_KEYS } from '@/lib/game/creator-constants';
import { findLoadedLibraryItem } from '@/lib/library/catalog-listing';

export const MAX_SPECIES_TRAITS = 3;
export const MAX_ANCESTRY_TRAITS = 6;
export const MAX_CHARACTERISTICS = 6;
export const MAX_FLAWS = 3;
export const MAX_SKILLS = 2;
export const MAX_SIZES = 2;
export const MAX_LANGUAGES = 2;
const DEFAULT_LANGUAGES = ['Universal'];
export const SIZE_OPTIONS = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];

export const SPECIES_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.SPECIES;

export const SPECIES_TRAIT_WARNING =
  'Most species only have 2 species traits; the 3rd is almost always used for a type of natural weapon, if any. Are you sure you wish to add this trait?';

export type TraitCategory = 'species_traits' | 'ancestry_traits' | 'characteristics' | 'flaws';

export const TRAIT_LIMITS: Record<TraitCategory, number> = {
  species_traits: MAX_SPECIES_TRAITS,
  ancestry_traits: MAX_ANCESTRY_TRAITS,
  characteristics: MAX_CHARACTERISTICS,
  flaws: MAX_FLAWS,
};

export interface SpeciesFormState {
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

export const initialSpeciesFormState: SpeciesFormState = {
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

export interface SpeciesCreatorCache {
  form: SpeciesFormState;
  timestamp: number;
}

/** Default speed for species (not user-editable). */
export const DEFAULT_SPECIES_SPEED = 6;

export function isSpeciesFormSaveReady(form: SpeciesFormState): boolean {
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
export function mergeCachedSpeciesForm(
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
  if (!sizes.length) sizes = [...initialSpeciesFormState.sizes];
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
  const speciesTraitsRaw = (f.species_traits ?? f.species_trait_ids) as
    | (string | number)[]
    | undefined;
  const ancestryTraitsRaw = (f.ancestry_traits ?? f.ancestry_trait_ids) as
    | (string | number)[]
    | undefined;
  const characteristicsRaw = (f.characteristics ?? f.characteristic_ids) as
    | (string | number)[]
    | undefined;
  const flawsRaw = (f.flaws ?? f.flaw_ids) as (string | number)[] | undefined;

  return {
    ...initialSpeciesFormState,
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
    imageUrl:
      typeof (f.imageUrl ?? f.image_url) === 'string' ? String(f.imageUrl ?? f.image_url) : null,
  };
}

/** Map a library/codex species record into form state. */
export function speciesLibraryRecordToFormState(
  s: Species | Record<string, unknown>,
  allTraits: Trait[],
  allSkills: Skill[],
): SpeciesFormState {
  const data =
    'data' in s && s.data && typeof s.data === 'object'
      ? (s as { data: Record<string, unknown> }).data
      : s;
  const d = (data || s) as Record<string, unknown>;
  const species_traits = normalizeTraitIds(
    (d.species_traits || d.species_trait_ids) as (string | number)[],
    allTraits,
  );
  const ancestry_traits = normalizeTraitIds(
    (d.ancestry_traits || d.ancestry_trait_ids) as (string | number)[],
    allTraits,
  );
  const characteristics = normalizeTraitIds(
    (d.characteristics || d.characteristic_ids) as (string | number)[],
    allTraits,
  );
  const flaws = normalizeTraitIds((d.flaws || d.flaw_ids) as (string | number)[], allTraits);
  const skillIds = normalizeSkillIds((d.skills || d.skill_ids) as (string | number)[], allSkills);
  let sizes = (d.sizes as string[]) || [];
  if (typeof d.sizes === 'string')
    sizes = (d.sizes as string)
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  if (!sizes.length && d.size) sizes = [d.size as string];
  if (!sizes.length) sizes = ['Medium'];
  const languages = Array.isArray(d.languages) ? (d.languages as string[]) : [];
  const lifespan = d.adulthood_lifespan as number[] | undefined;
  // Official rows store centimetres/kilograms as ave_hgt_cm / ave_wgt_kg.
  // Creator saves use ave_height / ave_weight.
  const aveHeight = d.ave_height != null && d.ave_height !== '' ? d.ave_height : d.ave_hgt_cm;
  const aveWeight = d.ave_weight != null && d.ave_weight !== '' ? d.ave_weight : d.ave_wgt_kg;
  return {
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
    ave_height: coerceNumberOrEmpty(aveHeight),
    ave_weight: coerceNumberOrEmpty(aveWeight),
    adulthood_lifespan:
      lifespan && lifespan.length >= 2 ? [defined(lifespan[0]), defined(lifespan[1])] : ['', ''],
    imageId: typeof (d.imageId ?? d.image_id) === 'string' ? String(d.imageId ?? d.image_id) : null,
    imageUrl:
      typeof (d.imageUrl ?? d.image_url) === 'string' ? String(d.imageUrl ?? d.image_url) : null,
  };
}

/** Official Library and My Codex Edit target for an existing species id. */
export function speciesCreatorEditHref(id: string): string {
  return `/species-creator?edit=${encodeURIComponent(id)}`;
}

/** Map a `?edit=` library row into the creator form. Null when that id is not loaded. */
export function resolveSpeciesEditForm(
  editSpeciesId: string,
  rawItems: readonly unknown[],
  allTraits: Trait[],
  allSkills: Skill[],
): { form: SpeciesFormState; item: unknown } | null {
  const item = findLoadedLibraryItem(rawItems, editSpeciesId);
  if (!item || typeof item !== 'object') return null;
  return {
    item,
    form: speciesLibraryRecordToFormState(
      item as Species | Record<string, unknown>,
      allTraits,
      allSkills,
    ),
  };
}

export type SpeciesCreatorEditPlan =
  | { type: 'use-draft' }
  | { type: 'wait' }
  | { type: 'replace'; form: SpeciesFormState; item: unknown }
  | { type: 'missing' };

/**
 * Decide what ?edit= may do to the local draft.
 * `wait` means the library has not settled — do not read or delete the draft.
 * `missing` means the id is unknown — keep the draft and tell the user.
 * `replace` is the only plan that may delete the draft.
 */
export function planSpeciesCreatorEdit(options: {
  editSpeciesId: string | null | undefined;
  libraryReady: boolean;
  rawItems: readonly unknown[];
  traits: Trait[];
  skills: Skill[];
}): SpeciesCreatorEditPlan {
  const id = options.editSpeciesId?.trim() ?? '';
  if (!id) return { type: 'use-draft' };
  if (!options.libraryReady) return { type: 'wait' };
  const resolved = resolveSpeciesEditForm(id, options.rawItems, options.traits, options.skills);
  if (!resolved) return { type: 'missing' };
  return { type: 'replace', form: resolved.form, item: resolved.item };
}

/**
 * Read the species draft. Drops an expired or corrupt entry.
 * Does not treat an edit id as a reason to delete the draft.
 */
export function readStoredSpeciesDraft(traits: Trait[], skills: Skill[]): SpeciesFormState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SPECIES_CREATOR_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpeciesCreatorCache;
    if (!parsed.timestamp || Date.now() - parsed.timestamp >= CACHE_EXPIRY_MS) {
      localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY);
      return null;
    }
    return mergeCachedSpeciesForm(parsed, traits, skills);
  } catch {
    try {
      localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY);
    } catch {
      // ignore quota / private mode
    }
    return null;
  }
}
