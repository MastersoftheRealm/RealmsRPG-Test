'use client';

import { ChipSelect } from '@/components/patterns/filters';
import { Button, Input, Textarea, IconButton } from '@/components/ui';
import type { Feat, Skill } from '@/hooks';
import { Plus, X } from 'lucide-react';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';
import type { FeatFormState } from './admin-feat-form';

export type AdminFeatEditModalFieldsProps = {
  form: FeatFormState;
  setFormField: <K extends keyof FeatFormState>(key: K, value: FeatFormState[K]) => void;
  setFormUpdater: (updater: (prev: FeatFormState) => FeatFormState) => void;
  feats: Feat[] | undefined;
  skills: Skill[];
  filterOptions: {
    levels: number[];
    abilities: string[];
    categories: string[];
    tags: string[];
    abilReqAbilities: string[];
  };
  abilityOptions: { value: string; label: string }[];
};

export function AdminFeatEditModalFields({
  form,
  setFormField,
  setFormUpdater,
  feats,
  skills,
  filterOptions,
  abilityOptions,
}: AdminFeatEditModalFieldsProps) {
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
        <Input
          value={form.name}
          onChange={(e) => setFormField('name', e.target.value)}
          placeholder="Feat name"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
        <Textarea
          value={form.description}
          onChange={(e) => setFormField('description', e.target.value)}
          placeholder="Feat description"
          className="min-h-[120px] resize-y"
          rows={4}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          Requirement Description (req_desc)
        </label>
        <Input
          value={form.req_desc}
          onChange={(e) => setFormField('req_desc', e.target.value)}
          placeholder="Human-readable requirement text"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Category</label>
          <select
            value={
              form.category && filterOptions.categories.includes(form.category)
                ? form.category
                : form.category
                  ? '__new__'
                  : ''
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__new__') setFormUpdater((f) => ({ ...f, category: f.category || '' }));
              else setFormField('category', v);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
            aria-label="Feat category"
          >
            <option value="">None</option>
            {filterOptions.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__new__">Add new category...</option>
          </select>
          {form.category && !filterOptions.categories.includes(form.category) && (
            <Input
              value={form.category}
              onChange={(e) => setFormField('category', e.target.value)}
              placeholder="Type new category"
              className="mt-2"
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Feat Category Required (feat_cat_req)
          </label>
          <select
            value={
              form.feat_cat_req && filterOptions.categories.includes(form.feat_cat_req)
                ? form.feat_cat_req
                : form.feat_cat_req
                  ? '__new__'
                  : ''
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__new__')
                setFormUpdater((f) => ({ ...f, feat_cat_req: f.feat_cat_req || '' }));
              else setFormField('feat_cat_req', v);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
            aria-label="Feat category required"
          >
            <option value="">None</option>
            {filterOptions.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__new__">Add new category...</option>
          </select>
          {form.feat_cat_req && !filterOptions.categories.includes(form.feat_cat_req) && (
            <Input
              value={form.feat_cat_req}
              onChange={(e) => setFormField('feat_cat_req', e.target.value)}
              placeholder="Type new category"
              className="mt-2"
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Character Level Required (lvl_req)
          </label>
          <Input
            type="number"
            min={0}
            value={form.lvl_req ?? ''}
            onChange={(e) =>
              setFormField(
                'lvl_req',
                e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
              )
            }
            placeholder="No value"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Feat Level (feat_lvl)
          </label>
          <Input
            type="number"
            min={0}
            value={form.feat_lvl ?? ''}
            onChange={(e) =>
              setFormField(
                'feat_lvl',
                e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
              )
            }
            placeholder="No value"
          />
        </div>
        <div>
          <label
            htmlFor="admin-feat-base-feat-id"
            className="mb-1 block text-sm font-medium text-text-secondary"
          >
            Base feat (level 1)
          </label>
          <select
            id="admin-feat-base-feat-id"
            value={form.base_feat_id}
            onChange={(e) => setFormField('base_feat_id', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
            aria-label="Base feat (level 1) (leave empty for level 1 feats)"
          >
            <option value="">None (this is level 1)</option>
            {(feats ?? [])
              .filter(
                (f) =>
                  !(f as Feat & { base_feat_id?: string | undefined }).base_feat_id &&
                  ((f as Feat).feat_lvl == null || (f as Feat).feat_lvl === 1),
              )
              .map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.name} (id: {f.id})
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-text-muted">
            For level 2+ feats, select the level-1 feat. Same name as base; ids differentiate
            levels.
          </p>
        </div>
      </div>
      <div>
        <ChipSelect
          label="Ability (sorting)"
          placeholder="Choose ability/defense"
          options={abilityOptions}
          selectedValues={form.ability}
          onSelect={(v) => setFormUpdater((f) => ({ ...f, ability: [...f.ability, v] }))}
          onRemove={(v) =>
            setFormUpdater((f) => ({ ...f, ability: f.ability.filter((a) => a !== v) }))
          }
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          Ability Requirements (ability/defense + min value)
        </label>
        <div className="space-y-2">
          {form.ability_req.map((abil, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={abil}
                onChange={(e) => {
                  setFormUpdater((f) => {
                    const next = [...f.ability_req];
                    next[i] = e.target.value;
                    return { ...f, ability_req: next };
                  });
                }}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
                aria-label={`Ability requirement ${i + 1}`}
              >
                {abil && !(ABILITIES_AND_DEFENSES as readonly string[]).includes(abil) && (
                  <option value={abil}>{abil}</option>
                )}
                {ABILITIES_AND_DEFENSES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={0}
                value={form.abil_req_val[i] ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormUpdater((f) => {
                    const next = [...f.abil_req_val];
                    next[i] = v === '' ? 0 : parseInt(v, 10) || 0;
                    return { ...f, abil_req_val: next };
                  });
                }}
                className="w-20"
                placeholder="Min"
              />
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormUpdater((f) => ({
                    ...f,
                    ability_req: f.ability_req.filter((_, j) => j !== i),
                    abil_req_val: f.abil_req_val.filter((_, j) => j !== i),
                  }));
                }}
                label="Remove"
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFormUpdater((f) => ({
                ...f,
                ability_req: [...f.ability_req, ABILITIES_AND_DEFENSES[0]],
                abil_req_val: [...f.abil_req_val, 0],
              }))
            }
          >
            <Plus className="mr-1 inline h-4 w-4" />
            Add ability requirement
          </Button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          Skill Requirements (skill ID + min bonus)
        </label>
        <div className="space-y-2">
          {form.skill_req.map((skillId, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={skillId}
                onChange={(e) => {
                  setFormUpdater((f) => {
                    const next = [...f.skill_req];
                    next[i] = e.target.value;
                    return { ...f, skill_req: next };
                  });
                }}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
                aria-label={`Skill requirement ${i + 1}`}
              >
                {skillId && !(skills as Skill[]).some((s) => String(s.id) === String(skillId)) && (
                  <option value={skillId}>{skillId}</option>
                )}
                {(skills as Skill[]).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={0}
                value={form.skill_req_val[i] ?? 0}
                onChange={(e) => {
                  setFormUpdater((f) => {
                    const next = [...f.skill_req_val];
                    next[i] = parseInt(e.target.value) || 0;
                    return { ...f, skill_req_val: next };
                  });
                }}
                className="w-20"
                placeholder="Min"
              />
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormUpdater((f) => ({
                    ...f,
                    skill_req: f.skill_req.filter((_, j) => j !== i),
                    skill_req_val: f.skill_req_val.filter((_, j) => j !== i),
                  }));
                }}
                label="Remove"
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const firstSkill = (skills as Skill[])[0];
              setFormUpdater((f) => ({
                ...f,
                skill_req: [...f.skill_req, firstSkill ? String(firstSkill.id) : ''],
                skill_req_val: [...f.skill_req_val, 0],
              }));
            }}
          >
            <Plus className="mr-1 inline h-4 w-4" />
            Add skill requirement
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Uses per recovery
          </label>
          <Input
            type="number"
            min={0}
            value={form.uses_per_rec ?? ''}
            onChange={(e) =>
              setFormField(
                'uses_per_rec',
                e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
              )
            }
            placeholder="No value"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Recovery Period
          </label>
          <select
            value={form.rec_period}
            onChange={(e) => setFormField('rec_period', e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
            aria-label="Recovery period"
          >
            <option value="">None</option>
            <option value="Full">Full</option>
            <option value="Partial">Partial</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Power Ability Req
          </label>
          <Input
            type="number"
            min={0}
            value={form.pow_abil_req ?? ''}
            onChange={(e) =>
              setFormField(
                'pow_abil_req',
                e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
              )
            }
            placeholder="No value"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Martial Ability Req
          </label>
          <Input
            type="number"
            min={0}
            value={form.mart_abil_req ?? ''}
            onChange={(e) =>
              setFormField(
                'mart_abil_req',
                e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
              )
            }
            placeholder="No value"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Power Prof Req
          </label>
          <Input
            type="number"
            min={0}
            value={form.pow_prof_req ?? ''}
            onChange={(e) =>
              setFormField(
                'pow_prof_req',
                e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
              )
            }
            placeholder="No value"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Martial Prof Req
          </label>
          <Input
            type="number"
            min={0}
            value={form.mart_prof_req ?? ''}
            onChange={(e) =>
              setFormField(
                'mart_prof_req',
                e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
              )
            }
            placeholder="No value"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Speed Req</label>
          <Input
            type="number"
            min={0}
            value={form.speed_req ?? ''}
            onChange={(e) =>
              setFormField(
                'speed_req',
                e.target.value === '' ? undefined : (parseInt(e.target.value, 10) ?? undefined),
              )
            }
            placeholder="No value"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Tags</label>
        <div className="mb-2 flex flex-wrap gap-1">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border border-border-light bg-surface-alt px-2 py-0.5 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() =>
                  setFormUpdater((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
                }
                className="rounded p-0.5 text-text-muted hover:bg-surface hover:text-text-primary"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = '';
              if (v && !form.tags.includes(v))
                setFormUpdater((f) => ({ ...f, tags: [...f.tags, v] }));
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
            aria-label="Add tag from existing"
          >
            <option value="">Add tag from list...</option>
            {filterOptions.tags
              .filter((t) => !form.tags.includes(t))
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </div>
        <div className="mt-2">
          <label htmlFor="new-tag-input" className="sr-only">
            New tag name
          </label>
          <Input
            id="new-tag-input"
            placeholder="Or type new tag and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const v = (e.target as HTMLInputElement).value.trim();
                if (v && !form.tags.includes(v)) {
                  setFormUpdater((f) => ({ ...f, tags: [...f.tags, v] }));
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && !form.tags.includes(v)) {
                setFormUpdater((f) => ({ ...f, tags: [...f.tags, v] }));
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.char_feat}
            onChange={(e) => setFormField('char_feat', e.target.checked)}
          />
          <span className="text-sm text-text-secondary">Character Feat</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.state_feat}
            onChange={(e) => setFormField('state_feat', e.target.checked)}
          />
          <span className="text-sm text-text-secondary">State Feat</span>
        </label>
      </div>
    </>
  );
}
