/**
 * Admin Codex species — form state + serializers (TASK-619).
 */

import type { Species, Skill, Trait } from '@/hooks';

export const COPY_NAME_SUFFIX = ' copy';

export type TraitPickerField =
  | 'speciesTraitIds'
  | 'ancestryTraitIds'
  | 'flawIds'
  | 'characteristicIds';

export const TRAIT_PICKER_TITLES: Record<TraitPickerField, string> = {
  speciesTraitIds: 'Add Species Trait',
  ancestryTraitIds: 'Add Ancestry Trait',
  flawIds: 'Add Flaw',
  characteristicIds: 'Add Characteristic',
};

export type SpeciesFormState = {
  name: string;
  description: string;
  type: string;
  size: string;
  sizes: string;
  skillIds: string[];
  speciesTraitIds: string[];
  ancestryTraitIds: string[];
  flawIds: string[];
  characteristicIds: string[];
  aveHeight: string;
  aveWeight: string;
  adultAge: string;
  maxAge: string;
  languages: string;
  isStarter: boolean;
  imageId: string | null;
  imageUrl: string | null;
};

export const EMPTY_SPECIES_FORM: SpeciesFormState = {
  name: '',
  description: '',
  type: '',
  size: 'Medium',
  sizes: 'Medium',
  skillIds: [],
  speciesTraitIds: [],
  ancestryTraitIds: [],
  flawIds: [],
  characteristicIds: [],
  aveHeight: '',
  aveWeight: '',
  adultAge: '',
  maxAge: '',
  languages: '',
  isStarter: false,
  imageId: null,
  imageUrl: null,
};

export function normalizeIds(
  values: string[] = [],
  all: Array<{ id: string; name: string }>,
): string[] {
  return values.map((val) => {
    const byId = all.find((it) => String(it.id) === String(val));
    if (byId) return String(byId.id);
    const byName = all.find((it) => it.name === val);
    return byName ? String(byName.id) : String(val);
  });
}

export function speciesToFormState(
  s: Species,
  skills: Skill[],
  traits: Trait[],
  copyName?: string,
): SpeciesFormState {
  const skillIds = normalizeIds((s.skills || []) as string[], skills);
  const speciesTraitIds = normalizeIds((s.species_traits || []) as string[], traits);
  const ancestryTraitIds = normalizeIds((s.ancestry_traits || []) as string[], traits);
  const flawIds = normalizeIds((s.flaws || []) as string[], traits);
  const characteristicIds = normalizeIds((s.characteristics || []) as string[], traits);
  const adult =
    s.adulthood_lifespan && s.adulthood_lifespan[0] != null ? String(s.adulthood_lifespan[0]) : '';
  const max =
    s.adulthood_lifespan && s.adulthood_lifespan[1] != null ? String(s.adulthood_lifespan[1]) : '';

  return {
    name: copyName ?? s.name,
    description: s.description || '',
    type: s.type || '',
    size: s.size || (s.sizes && s.sizes[0]) || 'Medium',
    sizes: (s.sizes || []).join(', ') || s.size || 'Medium',
    skillIds,
    speciesTraitIds,
    ancestryTraitIds,
    flawIds,
    characteristicIds,
    aveHeight: s.ave_height != null ? String(s.ave_height) : '',
    aveWeight: s.ave_weight != null ? String(s.ave_weight) : '',
    adultAge: adult,
    maxAge: max,
    languages: (s.languages || []).join(', '),
    isStarter: Boolean((s as Species & { is_starter?: boolean | undefined }).is_starter),
    imageId: s.image_id ?? null,
    imageUrl: s.image_url ?? null,
  };
}

export function speciesFormToSavePayload(form: SpeciesFormState): Record<string, unknown> {
  const sizes = form.sizes
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const adult = form.adultAge ? parseInt(form.adultAge, 10) || 0 : 0;
  const max = form.maxAge ? parseInt(form.maxAge, 10) || 0 : 0;
  const adulthood_lifespan = adult > 0 && max > 0 ? [adult, max] : undefined;
  const ave_height = form.aveHeight ? parseInt(form.aveHeight, 10) || 0 : undefined;
  const ave_weight = form.aveWeight ? parseInt(form.aveWeight, 10) || 0 : undefined;
  const languages = form.languages
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    type: form.type.trim(),
    sizes: sizes.length ? sizes : [sizes[0] || form.size || 'Medium'],
    skills: form.skillIds,
    species_traits: form.speciesTraitIds,
    ancestry_traits: form.ancestryTraitIds,
    flaws: form.flawIds,
    characteristics: form.characteristicIds,
    ave_height,
    ave_weight,
    adulthood_lifespan,
    languages,
    isStarter: form.isStarter,
    imageId: form.imageId,
    imageUrl: form.imageUrl,
  };
}
