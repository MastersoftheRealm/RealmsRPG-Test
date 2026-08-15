/**
 * Admin Codex feats — form state + serializers (TASK-609).
 */

import type { Feat } from '@/hooks';
import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';

export const COPY_NAME_SUFFIX = ' copy';

export type FeatFormState = {
  name: string;
  description: string;
  req_desc: string;
  category: string;
  ability: string[];
  ability_req: string[];
  abil_req_val: number[];
  tags: string[];
  skill_req: string[];
  skill_req_val: number[];
  feat_cat_req: string;
  pow_abil_req: number | undefined;
  mart_abil_req: number | undefined;
  pow_prof_req: number | undefined;
  mart_prof_req: number | undefined;
  speed_req: number | undefined;
  feat_lvl: number | undefined;
  lvl_req: number | undefined;
  uses_per_rec: number | undefined;
  rec_period: string;
  char_feat: boolean;
  state_feat: boolean;
  base_feat_id: string;
};

export const EMPTY_FEAT_FORM: FeatFormState = {
  name: '',
  description: '',
  req_desc: '',
  category: '',
  ability: [],
  ability_req: [],
  abil_req_val: [],
  tags: [],
  skill_req: [],
  skill_req_val: [],
  feat_cat_req: '',
  pow_abil_req: undefined,
  mart_abil_req: undefined,
  pow_prof_req: undefined,
  mart_prof_req: undefined,
  speed_req: undefined,
  feat_lvl: undefined,
  lvl_req: undefined,
  uses_per_rec: undefined,
  rec_period: '',
  char_feat: false,
  state_feat: false,
  base_feat_id: '',
};

function toOptNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export function featToFormState(feat: Feat): FeatFormState {
  const ext = feat as unknown as Record<string, unknown>;
  const abilityArr = normalizeFeatAbilities(feat.ability);
  return {
    name: feat.name,
    description: feat.description || '',
    req_desc: String(ext.req_desc || ''),
    category: feat.category || '',
    ability: abilityArr,
    ability_req: feat.ability_req || [],
    abil_req_val: feat.abil_req_val || [],
    tags: feat.tags || [],
    skill_req: feat.skill_req || [],
    skill_req_val: feat.skill_req_val || [],
    feat_cat_req: String(ext.feat_cat_req || ''),
    pow_abil_req: toOptNum(ext.pow_abil_req),
    mart_abil_req: toOptNum(ext.mart_abil_req),
    pow_prof_req: toOptNum(ext.pow_prof_req),
    mart_prof_req: toOptNum(ext.mart_prof_req),
    speed_req: toOptNum(ext.speed_req),
    feat_lvl: toOptNum(ext.feat_lvl),
    lvl_req: toOptNum(feat.lvl_req),
    uses_per_rec: toOptNum(feat.uses_per_rec),
    rec_period: feat.rec_period || '',
    char_feat: feat.char_feat ?? false,
    state_feat: feat.state_feat ?? false,
    base_feat_id: String((feat as { base_feat_id?: string }).base_feat_id ?? ''),
  };
}

/** Next feat level = current + 1; base_feat_id points at level-1; lvl_req defaults to newLevel*2. */
export function computeNextLevelFormState(
  sourceForm: FeatFormState,
  sourceDbFeatId: string,
): FeatFormState {
  const curLvl = sourceForm.feat_lvl != null && sourceForm.feat_lvl > 0 ? sourceForm.feat_lvl : 1;
  const newLvl = curLvl + 1;
  const baseId = sourceForm.base_feat_id.trim() || sourceDbFeatId;
  const defaultReq = newLvl * 2;
  const prevReq = sourceForm.lvl_req;
  const prevExpected = curLvl * 2;
  const lvl_req =
    prevReq != null && prevReq > prevExpected ? Math.max(defaultReq, prevReq) : defaultReq;

  return {
    ...sourceForm,
    feat_lvl: newLvl,
    lvl_req,
    base_feat_id: baseId,
  };
}

export function featFormToSavePayload(form: FeatFormState): Record<string, unknown> {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    req_desc: form.req_desc.trim() || undefined,
    category: form.category.trim() || undefined,
    ability: form.ability.length > 0 ? form.ability : undefined,
    ability_req: form.ability_req,
    abil_req_val: form.abil_req_val,
    tags: form.tags,
    skill_req: form.skill_req,
    skill_req_val: form.skill_req_val,
    feat_cat_req: form.feat_cat_req.trim() || undefined,
    pow_abil_req: form.pow_abil_req ?? undefined,
    mart_abil_req: form.mart_abil_req ?? undefined,
    pow_prof_req: form.pow_prof_req ?? undefined,
    mart_prof_req: form.mart_prof_req ?? undefined,
    speed_req: form.speed_req ?? undefined,
    feat_lvl: form.feat_lvl ?? undefined,
    lvl_req: form.lvl_req ?? undefined,
    uses_per_rec: form.uses_per_rec ?? undefined,
    rec_period: form.rec_period.trim() || undefined,
    char_feat: form.char_feat,
    state_feat: form.state_feat,
    base_feat_id: form.base_feat_id.trim() || undefined,
  };
}
