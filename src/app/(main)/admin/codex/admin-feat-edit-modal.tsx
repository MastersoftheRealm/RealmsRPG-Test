'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChipSelect } from '@/components/shared/filters';
import { Modal, Button, Input, Textarea, IconButton } from '@/components/ui';
import type { Feat, Skill } from '@/hooks';
import { Plus, X, Layers } from 'lucide-react';
import { getFeatLevel } from '@/lib/leveled-feats';
import { featToFormState, type FeatFormState } from './admin-feat-form';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';

export function AdminFeatEditModal({
  isOpen,
  onClose,
  title,
  copySourceName,
  feats,
  levelFeats,
  skills,
  filterOptions,
  abilityOptions,
  saving,
  canDelete,
  deleteConfirm,
  onRequestDelete,
  onSave,
  onSaveAll,
  initialForm,
  initialEditId,
  enableAddLevel,
  onAddLevel,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  copySourceName: string | null;
  feats: Feat[] | undefined;
  /** When editing a leveled feat family, this contains all feats in that family (sorted). */
  levelFeats: Feat[];
  skills: Skill[];
  filterOptions: { levels: number[]; abilities: string[]; categories: string[]; tags: string[]; abilReqAbilities: string[] };
  abilityOptions: { value: string; label: string }[];
  saving: boolean;
  canDelete: boolean;
  deleteConfirm: string | null;
  onRequestDelete: () => void;
  onSave: (id: string | null, form: FeatFormState) => void;
  onSaveAll: (editsById: Record<string, FeatFormState>) => void;
  initialForm: FeatFormState;
  initialEditId: string | null;
  enableAddLevel: boolean;
  onAddLevel?: (form: FeatFormState, sourceDbFeatId: string) => void;
}) {
  // Fresh state per open: parent remounts with key={modalSessionKey}.
  const [form, setForm] = useState<FeatFormState>(initialForm);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(initialEditId);
  const [draftsById, setDraftsById] = useState<Record<string, FeatFormState>>(() =>
    initialEditId ? { [initialEditId]: initialForm } : {}
  );
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const hasLevels = levelFeats.length > 1;
  const levelOptions = useMemo(() => {
    if (!hasLevels) return [];
    return levelFeats.map((f) => {
      const lvl = getFeatLevel(f);
      const label = lvl <= 1 ? 'Base (Level 1)' : `Level ${lvl}`;
      return { id: String(f.id), label };
    });
  }, [hasLevels, levelFeats]);

  const dirtyLevelLabels = useMemo(() => {
    if (!hasLevels) return [];
    const byId = new Map(levelFeats.map((f) => [String(f.id), f] as const));
    return [...dirtyIds]
      .map((id) => byId.get(id))
      .filter(Boolean)
      .sort((a, b) => getFeatLevel(a!) - getFeatLevel(b!))
      .map((feat) => {
        const lvl = getFeatLevel(feat!);
        return lvl <= 1 ? 'Base' : `L${lvl}`;
      });
  }, [dirtyIds, hasLevels, levelFeats]);

  const markDirty = useCallback((id: string) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const setFormField = useCallback(
    <K extends keyof FeatFormState>(key: K, value: FeatFormState[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        const id = selectedEditId;
        if (hasLevels && id) {
          setDraftsById((d) => ({ ...d, [id]: next }));
          markDirty(id);
        }
        return next;
      });
    },
    [hasLevels, selectedEditId, markDirty],
  );

  const setFormUpdater = useCallback(
    (updater: (prev: FeatFormState) => FeatFormState) => {
      setForm((prev) => {
        const next = updater(prev);
        const id = selectedEditId;
        if (hasLevels && id) {
          setDraftsById((d) => ({ ...d, [id]: next }));
          markDirty(id);
        }
        return next;
      });
    },
    [hasLevels, selectedEditId, markDirty],
  );

  const handleSelectLevel = (nextId: string) => {
    // Persist current level draft before switching
    if (hasLevels && selectedEditId) {
      setDraftsById((d) => ({ ...d, [selectedEditId]: form }));
    }
    setSelectedEditId(nextId);

    // If we've already started editing this level in this session, restore the draft.
    const existingDraft = draftsById[nextId];
    if (existingDraft) {
      setForm(existingDraft);
      return;
    }

    const match = levelFeats.find((f) => String(f.id) === String(nextId));
    if (!match) return;

    const nextForm = featToFormState(match);
    setForm(nextForm);
    setDraftsById((d) => ({ ...d, [nextId]: nextForm }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
      fullScreenOnMobile
      footer={
        <div className="flex justify-between">
          <div>
            {canDelete && (
              <Button
                variant="outline"
                onClick={onRequestDelete}
                className={deleteConfirm ? 'border-danger-500 text-danger-700 dark:text-danger-400' : ''}
              >
                {deleteConfirm ? 'Click again to confirm delete' : 'Delete'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                if (hasLevels) {
                  // Ensure current form is captured before bulk-save.
                  const currentId = selectedEditId;
                  const nextDrafts: Record<string, FeatFormState> = { ...draftsById };
                  if (currentId) nextDrafts[currentId] = form;
                  const payload: Record<string, FeatFormState> = {};
                  dirtyIds.forEach((id) => {
                    const draft = nextDrafts[id];
                    if (draft) payload[id] = draft;
                  });
                  // If user didn't change anything, do nothing.
                  if (Object.keys(payload).length === 0) return;
                  onSaveAll(payload);
                  return;
                }
                onSave(selectedEditId, form);
              }}
              disabled={saving || !form.name.trim() || (hasLevels && dirtyIds.size === 0)}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {hasLevels && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Editing level</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <select
                value={selectedEditId ?? ''}
                onChange={(e) => handleSelectLevel(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Select feat level to edit"
              >
                {levelOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              {enableAddLevel && onAddLevel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={saving || !selectedEditId}
                  onClick={() => {
                    if (!selectedEditId || !onAddLevel) return;
                    onAddLevel(form, selectedEditId);
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="w-4 h-4" aria-hidden />
                    Add Level
                  </span>
                </Button>
              )}
              {dirtyLevelLabels.length > 0 && (
                <div className="text-xs text-text-muted dark:text-text-secondary">
                  <span className="font-medium text-text-secondary dark:text-text-secondary">Unsaved:</span> {dirtyLevelLabels.join(', ')}
                </div>
              )}
            </div>
            <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
              This feat has multiple levels. Select which level you want to edit.
            </p>
          </div>
        )}
        {!hasLevels && enableAddLevel && onAddLevel && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-border-light bg-surface-alt px-3 py-2">
            <p className="text-xs text-text-muted dark:text-text-secondary">
              Save a new row for the next feat tier. Level and character level required are filled from the current feat.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={saving || !initialEditId}
              onClick={() => {
                if (!initialEditId || !onAddLevel) return;
                onAddLevel(form, initialEditId);
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-4 h-4" aria-hidden />
                Add Level
              </span>
            </Button>
          </div>
        )}
        {copySourceName && (
          <p className="text-sm text-text-secondary rounded-md bg-surface-alt px-3 py-2 border border-border-light">
            Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new feat.
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setFormField('name', e.target.value)}
            placeholder="Feat name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setFormField('description', e.target.value)}
            placeholder="Feat description"
            className="min-h-[120px] resize-y"
            rows={4}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Requirement Description (req_desc)</label>
          <Input
            value={form.req_desc}
            onChange={(e) => setFormField('req_desc', e.target.value)}
            placeholder="Human-readable requirement text"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
            <select
              value={form.category && filterOptions.categories.includes(form.category) ? form.category : (form.category ? '__new__' : '')}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__new__') setFormUpdater((f) => ({ ...f, category: f.category || '' }));
                else setFormField('category', v);
              }}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Feat category"
            >
              <option value="">None</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
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
            <label className="block text-sm font-medium text-text-secondary mb-1">Feat Category Required (feat_cat_req)</label>
            <select
              value={form.feat_cat_req && filterOptions.categories.includes(form.feat_cat_req) ? form.feat_cat_req : (form.feat_cat_req ? '__new__' : '')}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__new__') setFormUpdater((f) => ({ ...f, feat_cat_req: f.feat_cat_req || '' }));
                else setFormField('feat_cat_req', v);
              }}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Feat category required"
            >
              <option value="">None</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
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
            <label className="block text-sm font-medium text-text-secondary mb-1">Character Level Required (lvl_req)</label>
            <Input
              type="number"
              min={0}
              value={form.lvl_req ?? ''}
              onChange={(e) => setFormField('lvl_req', e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined)}
              placeholder="No value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Feat Level (feat_lvl)</label>
            <Input
              type="number"
              min={0}
              value={form.feat_lvl ?? ''}
              onChange={(e) => setFormField('feat_lvl', e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined)}
              placeholder="No value"
            />
          </div>
          <div>
            <label htmlFor="admin-feat-base-feat-id" className="block text-sm font-medium text-text-secondary mb-1">Base feat (level 1)</label>
            <select
              id="admin-feat-base-feat-id"
              value={form.base_feat_id}
              onChange={(e) => setFormField('base_feat_id', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Base feat (level 1) (leave empty for level 1 feats)"
            >
              <option value="">None (this is level 1)</option>
              {(feats ?? [])
                .filter((f) => !(f as Feat & { base_feat_id?: string }).base_feat_id && ((f as Feat).feat_lvl == null || (f as Feat).feat_lvl === 1))
                .map((f) => (
                  <option key={f.id} value={String(f.id)}>{f.name} (id: {f.id})</option>
                ))}
            </select>
            <p className="text-xs text-text-muted dark:text-text-secondary mt-1">For level 2+ feats, select the level-1 feat. Same name as base; ids differentiate levels.</p>
          </div>
        </div>
        <div>
          <ChipSelect
            label="Ability (sorting)"
            placeholder="Choose ability/defense"
            options={abilityOptions}
            selectedValues={form.ability}
            onSelect={(v) => setFormUpdater((f) => ({ ...f, ability: [...f.ability, v] }))}
            onRemove={(v) => setFormUpdater((f) => ({ ...f, ability: f.ability.filter(a => a !== v) }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Ability Requirements (ability/defense + min value)</label>
          <div className="space-y-2">
            {form.ability_req.map((abil, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={abil}
                  onChange={(e) => {
                    setFormUpdater((f) => {
                      const next = [...f.ability_req];
                      next[i] = e.target.value;
                      return { ...f, ability_req: next };
                    });
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
                  aria-label={`Ability requirement ${i + 1}`}
                >
                  {abil && !(ABILITIES_AND_DEFENSES as readonly string[]).includes(abil) && (
                    <option value={abil}>{abil}</option>
                  )}
                  {ABILITIES_AND_DEFENSES.map(a => (
                    <option key={a} value={a}>{a}</option>
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
                  <X className="w-4 h-4" />
                </IconButton>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormUpdater((f) => ({
                ...f,
                ability_req: [...f.ability_req, ABILITIES_AND_DEFENSES[0]],
                abil_req_val: [...f.abil_req_val, 0],
              }))}
            >
              <Plus className="w-4 h-4 mr-1 inline" />
              Add ability requirement
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Skill Requirements (skill ID + min bonus)</label>
          <div className="space-y-2">
            {form.skill_req.map((skillId, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={skillId}
                  onChange={(e) => {
                    setFormUpdater((f) => {
                      const next = [...f.skill_req];
                      next[i] = e.target.value;
                      return { ...f, skill_req: next };
                    });
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
                  aria-label={`Skill requirement ${i + 1}`}
                >
                  {skillId && !(skills as Skill[]).some((s) => String(s.id) === String(skillId)) && (
                    <option value={skillId}>{skillId}</option>
                  )}
                  {(skills as Skill[]).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
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
                  <X className="w-4 h-4" />
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
              <Plus className="w-4 h-4 mr-1 inline" />
              Add skill requirement
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Uses per recovery</label>
            <Input
              type="number"
              min={0}
              value={form.uses_per_rec ?? ''}
              onChange={(e) => setFormField('uses_per_rec', e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined)}
              placeholder="No value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Recovery Period</label>
            <select
              value={form.rec_period}
              onChange={(e) => setFormField('rec_period', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
              aria-label="Recovery period"
            >
              <option value="">None</option>
              <option value="Full">Full</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Power Ability Req</label>
            <Input
              type="number"
              min={0}
              value={form.pow_abil_req ?? ''}
              onChange={(e) => setFormField('pow_abil_req', e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined)}
              placeholder="No value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Martial Ability Req</label>
            <Input
              type="number"
              min={0}
              value={form.mart_abil_req ?? ''}
              onChange={(e) => setFormField('mart_abil_req', e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined)}
              placeholder="No value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof Req</label>
            <Input
              type="number"
              min={0}
              value={form.pow_prof_req ?? ''}
              onChange={(e) => setFormField('pow_prof_req', e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined)}
              placeholder="No value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof Req</label>
            <Input
              type="number"
              min={0}
              value={form.mart_prof_req ?? ''}
              onChange={(e) => setFormField('mart_prof_req', e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined)}
              placeholder="No value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Speed Req</label>
            <Input
              type="number"
              min={0}
              value={form.speed_req ?? ''}
              onChange={(e) => setFormField('speed_req', e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined)}
              placeholder="No value"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-alt border border-border-light text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setFormUpdater((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                  className="p-0.5 rounded hover:bg-surface text-text-muted hover:text-text-primary"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = '';
                if (v && !form.tags.includes(v)) setFormUpdater((f) => ({ ...f, tags: [...f.tags, v] }));
              }}
              className="px-3 py-2 rounded-md border border-border bg-background text-text-primary text-sm"
              aria-label="Add tag from existing"
            >
              <option value="">Add tag from list...</option>
              {filterOptions.tags.filter((t) => !form.tags.includes(t)).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="mt-2">
            <label htmlFor="new-tag-input" className="sr-only">New tag name</label>
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
      </div>
    </Modal>
  );
}
