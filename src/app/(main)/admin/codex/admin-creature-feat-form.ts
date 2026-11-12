/**
 * Admin creature-feat form. Level and base id come from the shared feat helper.
 * Required level is copied, not rewritten with the character-feat level*2 rule.
 */

import type { CreatureFeat } from '@/hooks';
import { computeNextLeveledFeatFields } from '@/lib/leveled-feats';
import { codexSourcesOrCore, DEFAULT_CODEX_SOURCES } from '@/lib/codex/sources';
import { storedFeatCategoryLabel } from '@/lib/codex/feat-list';

export type CreatureFeatFormState = {
  name: string;
  description: string;
  points: number | undefined;
  feat_lvl: number | undefined;
  base_feat_id: string;
  lvl_req: number | undefined;
  mechanic: boolean;
  category: string;
  sources: string[];
};

export const EMPTY_CREATURE_FEAT_FORM: CreatureFeatFormState = {
  name: '',
  description: '',
  points: undefined,
  feat_lvl: undefined,
  base_feat_id: '',
  lvl_req: undefined,
  mechanic: false,
  category: '',
  sources: [...DEFAULT_CODEX_SOURCES],
};

function toOptNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Parse admin number inputs that may be fractional (e.g. feat point cost 0.5 or -0.5). */
export function parseOptionalAdminDecimalInput(raw: string): number | undefined {
  if (raw === '') return undefined;
  const n = parseFloat(raw);
  return Number.isNaN(n) ? undefined : n;
}

export function creatureFeatToFormState(feat: CreatureFeat): CreatureFeatFormState {
  return {
    name: feat.name,
    description: feat.description || '',
    points: toOptNum(feat.points ?? feat.feat_points),
    feat_lvl: toOptNum(feat.feat_lvl),
    base_feat_id: String(feat.base_feat_id ?? ''),
    lvl_req: toOptNum(feat.lvl_req),
    mechanic: feat.mechanic === true,
    category: storedFeatCategoryLabel(feat.category),
    sources: codexSourcesOrCore(feat.sources),
  };
}

export function computeNextCreatureFeatFormState(
  sourceForm: CreatureFeatFormState,
  sourceDbFeatId: string,
): CreatureFeatFormState {
  const next = computeNextLeveledFeatFields({
    sourceFeatLvl: sourceForm.feat_lvl,
    sourceBaseFeatId: sourceForm.base_feat_id.trim() || undefined,
    sourceDbFeatId,
  });
  return {
    ...sourceForm,
    feat_lvl: next.feat_lvl,
    base_feat_id: next.base_feat_id,
  };
}

export function creatureFeatFormToSavePayload(
  form: CreatureFeatFormState,
): Record<string, unknown> {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    feat_points: form.points ?? undefined,
    feat_lvl: form.feat_lvl ?? undefined,
    base_feat_id: form.base_feat_id.trim() || undefined,
    lvl_req: form.lvl_req ?? undefined,
    mechanic: form.mechanic,
    category: form.category.trim() || null,
    sources: codexSourcesOrCore(form.sources),
  };
}
