/**
 * Admin Codex traits — form state + serializers (TASK-619).
 */

import type { Trait } from '@/hooks';

export type TraitFormState = {
  name: string;
  description: string;
  uses_per_rec: string;
  rec_period: string;
  flaw: boolean;
  characteristic: boolean;
  option_trait_ids: string[];
};

export const EMPTY_TRAIT_FORM: TraitFormState = {
  name: '',
  description: '',
  uses_per_rec: '',
  rec_period: '',
  flaw: false,
  characteristic: false,
  option_trait_ids: [],
};

export function traitToFormState(t: Trait, copyName?: string): TraitFormState {
  return {
    name: copyName ?? t.name,
    description: t.description || '',
    uses_per_rec: t.uses_per_rec != null ? String(t.uses_per_rec) : '',
    rec_period: t.rec_period || '',
    flaw: t.flaw === true,
    characteristic: t.characteristic === true,
    option_trait_ids: Array.isArray(t.option_trait_ids) ? [...t.option_trait_ids] : [],
  };
}

export function traitFormToSavePayload(form: TraitFormState): Record<string, unknown> {
  const uses_per_rec = form.uses_per_rec ? parseInt(form.uses_per_rec, 10) || 0 : undefined;
  const rec_period = form.rec_period.trim() || undefined;
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    uses_per_rec,
    rec_period,
    flaw: form.flaw,
    characteristic: form.characteristic,
    option_trait_ids: form.option_trait_ids.length > 0 ? form.option_trait_ids : undefined,
  };
}
