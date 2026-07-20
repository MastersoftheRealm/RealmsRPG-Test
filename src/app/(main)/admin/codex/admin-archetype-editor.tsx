/**
 * Admin Archetype path editor — modal body islands (TASK-381 Phase 6b).
 * Presentational form sections. List chrome, modal shell/footer, save/delete,
 * and option memos stay in AdminArchetypesTab.
 */

'use client';

import type { Dispatch, SetStateAction } from 'react';
import { ValueStepper, ChipSelect } from '@/components/shared';
import { Button, Input, IconButton } from '@/components/ui';
import { Plus, X } from 'lucide-react';
import { LAYER1_GOVERNANCE } from '@/lib/constants/creator-layer-governance';
import type { Level1ArmorStep } from '@/lib/game/archetype-path';
import type { CodexSkill } from '@/types/codex';
import type { PathGuidanceAudience, PathGuidanceGroup, PathItemRecommendation } from '@/types/archetype';
import {
  ABILITY_OPTIONS,
  PATH_LEVEL1_MAX_BASE_SKILLS,
  RECOMMENDED_ABILITY_MAX,
  dedupeStrings,
  isCodexSubSkill,
  labelForAbility,
  makeLevelRow,
  type AdminArchetypeFormState,
  type CodexFeatLike,
  type PathSelectionKey,
  type SelectionOption,
} from './admin-archetype-path-form';
import { PathQuantityRow, SelectedFeatRows } from './admin-archetype-path-rows';

type ShowToast = (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;

const selectionFieldConfig: Array<{ key: PathSelectionKey; label: string; placeholder: string }> = [
  // Level 1 feats authored via guidance groups (TASK-514); higher levels still use ChipSelect.
  { key: 'feats', label: 'Feats', placeholder: 'Select recommended feats' },
  { key: 'skills', label: 'Skills (max 3 base)', placeholder: 'Select up to 3 base skills' },
  { key: 'powers', label: 'Powers', placeholder: 'Select recommended powers' },
  { key: 'innatePowers', label: 'Innate Powers', placeholder: 'Select recommended innate powers' },
  { key: 'techniques', label: 'Techniques', placeholder: 'Select recommended techniques' },
  { key: 'armaments', label: 'Armaments', placeholder: 'Select recommended armaments' },
  { key: 'equipment', label: 'Equipment', placeholder: 'Select recommended equipment' },
];

const removeFieldConfig: Array<{ key: PathSelectionKey; label: string; placeholder: string }> = [
  { key: 'removeFeats', label: 'Remove Feats', placeholder: 'Select feats to remove at this level' },
  { key: 'removePowers', label: 'Remove Powers', placeholder: 'Select powers to remove at this level' },
  { key: 'removeTechniques', label: 'Remove Techniques', placeholder: 'Select techniques to remove at this level' },
  { key: 'removeArmaments', label: 'Remove Armaments', placeholder: 'Select armaments to remove at this level' },
];

export type AdminArchetypeEditorProps = {
  form: AdminArchetypeFormState;
  setForm: Dispatch<SetStateAction<AdminArchetypeFormState>>;
  copySourceName: string | null;
  isSelectionDataLoading: boolean;
  showToast: ShowToast;
  optionsByField: Partial<Record<PathSelectionKey, SelectionOption[]>>;
  level1SkillPickerOptions: SelectionOption[];
  featOptionsLevel1: SelectionOption[];
  characterFeatOptionsLevel1: SelectionOption[];
  archetypeFeatOptionsLevel1: SelectionOption[];
  weaponShieldArmamentOptions: SelectionOption[];
  armorArmamentOptions: SelectionOption[];
  armamentOptions: SelectionOption[];
  equipmentOptions: SelectionOption[];
  getFeatOptionsForLevel: (level: number) => SelectionOption[];
  featById: Map<string, CodexFeatLike>;
  skillById: Map<string, CodexSkill>;
  level1SkillIssues: Array<{ message: string }>;
  level1WeaponShieldEntries: PathItemRecommendation[];
  level1ArmorEntries: PathItemRecommendation[];
  characterFeatGroups: PathGuidanceGroup[];
  archetypeFeatGroups: PathGuidanceGroup[];
  syncedFeatPreviewLabels: string[];
  addFeatGuidanceGroup: (audience: PathGuidanceAudience) => void;
  updateFeatGuidanceGroup: (
    groupId: string,
    patch: Partial<Pick<PathGuidanceGroup, 'title' | 'why' | 'feats'>>
  ) => void;
  removeFeatGuidanceGroup: (groupId: string) => void;
  addLevel1Armament: (id: string) => void;
  updateLevel1ArmamentQty: (id: string, quantity: number) => void;
  removeLevel1Armament: (id: string) => void;
};

export function AdminArchetypeEditor({
  form,
  setForm,
  copySourceName,
  isSelectionDataLoading,
  showToast,
  optionsByField,
  level1SkillPickerOptions,
  featOptionsLevel1,
  characterFeatOptionsLevel1,
  archetypeFeatOptionsLevel1,
  weaponShieldArmamentOptions,
  armorArmamentOptions,
  armamentOptions,
  equipmentOptions,
  getFeatOptionsForLevel,
  featById,
  skillById,
  level1SkillIssues,
  level1WeaponShieldEntries,
  level1ArmorEntries,
  characterFeatGroups,
  archetypeFeatGroups,
  syncedFeatPreviewLabels,
  addFeatGuidanceGroup,
  updateFeatGuidanceGroup,
  removeFeatGuidanceGroup,
  addLevel1Armament,
  updateLevel1ArmamentQty,
  removeLevel1Armament,
}: AdminArchetypeEditorProps) {
  return (
      <div className="space-y-4">
        {copySourceName && (
          <p className="text-sm text-text-secondary rounded-md bg-surface-alt px-3 py-2 border border-border-light">
            Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new archetype.
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Archetype name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => {
              const nextType = e.target.value as 'power' | 'powered-martial' | 'martial';
              setForm((f) => ({
                ...f,
                type: nextType,
                level1Path:
                  nextType === 'martial'
                    ? { ...f.level1Path, innatePowers: [] }
                    : f.level1Path,
              }));
            }}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
            aria-label="Archetype type"
          >
            <option value="power">Power</option>
            <option value="powered-martial">Powered-Martial</option>
            <option value="martial">Martial</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Primary Ability</label>
            <select
              value={form.archetypeAbility}
              onChange={(e) => setForm((f) => ({ ...f, archetypeAbility: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Primary archetype ability"
            >
              <option value="">Not set</option>
              {ABILITY_OPTIONS.map((ability) => (
                <option key={ability} value={ability}>
                  {ability.charAt(0).toUpperCase() + ability.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Secondary Ability</label>
            <select
              value={form.secondaryAbility}
              onChange={(e) => setForm((f) => ({ ...f, secondaryAbility: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              aria-label="Secondary archetype ability"
            >
              <option value="">Not set</option>
              {ABILITY_OPTIONS.map((ability) => (
                <option key={ability} value={ability}>
                  {ability.charAt(0).toUpperCase() + ability.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof (Lv1)</label>
            <Input
              type="number"
              value={String(form.powerProfStart)}
              onChange={(e) => setForm((f) => ({ ...f, powerProfStart: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof (Lv1)</label>
            <Input
              type="number"
              value={String(form.martialProfStart)}
              onChange={(e) => setForm((f) => ({ ...f, martialProfStart: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof (Lv5)</label>
            <Input
              type="number"
              value={String(form.powerProfLevel5)}
              onChange={(e) => setForm((f) => ({ ...f, powerProfLevel5: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof (Lv5)</label>
            <Input
              type="number"
              value={String(form.martialProfLevel5)}
              onChange={(e) => setForm((f) => ({ ...f, martialProfLevel5: Number(e.target.value || 0) }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Archetype description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
        </div>
        <div className="rounded-lg border border-border-light p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Archetype Path Builder</h3>
            <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
              Select existing codex and official library entries. No manual CSV input required.
            </p>
            {isSelectionDataLoading && (
              <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                Loading official library options...
              </p>
            )}
          </div>

          <div className="rounded-md border border-border-light bg-surface-alt p-3 space-y-2">
            <h4 className="text-sm font-medium text-text-primary">Level 1 Recommendations</h4>
            <p className="text-xs text-text-muted dark:text-text-secondary">
              Only level 1 feats can be recommended at level 1. For each progression level, only feats with level requirement ≤ that level are shown.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectionFieldConfig
                .filter((f) => {
                  // Level 1 feats → guidance group sections below (TASK-514).
                  if (f.key === 'feats' || f.key === 'armaments' || f.key === 'equipment') return false;
                  if (f.key === 'innatePowers' && form.type === 'martial') return false;
                  return true;
                })
                .map((field) => {
                if (field.key === 'skills') {
                  const atCap =
                    form.level1Path.skills.length >= PATH_LEVEL1_MAX_BASE_SKILLS;
                  const skillOptionsForSelect = atCap
                    ? level1SkillPickerOptions.filter((o) =>
                        form.level1Path.skills.includes(o.value)
                      )
                    : level1SkillPickerOptions;
                  return (
                    <div key="level1-skills" className="space-y-1">
                      <ChipSelect
                        label={field.label}
                        placeholder={
                          atCap
                            ? `Maximum ${PATH_LEVEL1_MAX_BASE_SKILLS} skills (remove one to add)`
                            : field.placeholder
                        }
                        options={skillOptionsForSelect.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        selectedValues={form.level1Path.skills}
                        onSelect={(value) => {
                          if (
                            form.level1Path.skills.length >= PATH_LEVEL1_MAX_BASE_SKILLS
                          ) {
                            showToast(
                              `Paths recommend at most ${PATH_LEVEL1_MAX_BASE_SKILLS} base skills. Remove one before adding another.`,
                              'warning'
                            );
                            return;
                          }
                          const skill = skillById.get(value);
                          if (skill && isCodexSubSkill(skill)) {
                            showToast(
                              'Sub-skills cannot be newly selected. Choose a base skill.',
                              'warning'
                            );
                            return;
                          }
                          setForm((prev) => ({
                            ...prev,
                            level1Path: {
                              ...prev.level1Path,
                              skills: dedupeStrings([...prev.level1Path.skills, value]),
                            },
                          }));
                        }}
                        onRemove={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            level1Path: {
                              ...prev.level1Path,
                              skills: prev.level1Path.skills.filter((entry) => entry !== value),
                            },
                          }))
                        }
                      />
                      <p className="text-xs text-text-muted dark:text-text-secondary">
                        Base skills only; target max {PATH_LEVEL1_MAX_BASE_SKILLS}. Legacy paths
                        with more than {PATH_LEVEL1_MAX_BASE_SKILLS} or sub-skills can still be
                        saved (warning only).
                      </p>
                      {level1SkillIssues.length > 0 && (
                        <p
                          role="status"
                          className="text-xs text-warning-fg"
                        >
                          {level1SkillIssues.map((i) => i.message).join(' ')}
                        </p>
                      )}
                    </div>
                  );
                }
                const options =
                  (field.key === 'feats' ? featOptionsLevel1 : optionsByField[field.key]) ?? [];
                return (
                <ChipSelect
                  key={`level1-${field.key}`}
                  label={field.label}
                  placeholder={field.placeholder}
                  options={options.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  selectedValues={form.level1Path[field.key]}
                  onSelect={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      level1Path: {
                        ...prev.level1Path,
                        [field.key]: dedupeStrings([...prev.level1Path[field.key], value]),
                      },
                    }))
                  }
                  onRemove={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      level1Path: {
                        ...prev.level1Path,
                        [field.key]: prev.level1Path[field.key].filter((entry) => entry !== value),
                      },
                    }))
                  }
                />
                );
              })}
            </div>
            {form.type !== 'martial' && (
              <p className="text-xs text-text-muted dark:text-text-secondary">
                Innate Powers are separate from Powers. Save validates Appendix G: Energy ≤ Innate
                Threshold, Basic/Basic Reaction only, no healing or energy-gain parts, and total Energy
                ≤ Innate Energy (Power 16 / Powered-Martial 6 at level 1).
              </p>
            )}

            {/* Level 1 feat guidance groups — character vs archetype (TASK-514 / ADR-0004) */}
            <div className="space-y-4 pt-3 border-t border-border-light">
              <div>
                <h5 className="text-sm font-medium text-text-primary">Feat guidance groups</h5>
                <p className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
                  Name each group, add a short why, then pick feats. Expand a selected feat to read its
                  Codex description. Flat Level 1 feats sync to the union of these picks on save. Max{' '}
                  {LAYER1_GOVERNANCE.maxGroupsPerStep} groups per audience; max{' '}
                  {LAYER1_GOVERNANCE.maxItemsPerGroup} feats per group.
                </p>
              </div>

              {(
                [
                  {
                    audience: 'character' as const,
                    label: 'Character feat groups',
                    groups: characterFeatGroups,
                    options: characterFeatOptionsLevel1,
                  },
                  {
                    audience: 'archetype' as const,
                    label: 'Archetype feat groups',
                    groups: archetypeFeatGroups,
                    options: archetypeFeatOptionsLevel1,
                  },
                ] as const
              ).map((section) => (
                <div key={section.audience} className="space-y-3 rounded-md border border-border-light p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h6 className="text-sm font-medium text-text-secondary">{section.label}</h6>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => addFeatGuidanceGroup(section.audience)}
                      aria-label={`Add ${section.audience} feat group`}
                    >
                      <Plus className="w-4 h-4 mr-1" aria-hidden />
                      Add group
                    </Button>
                  </div>
                  {section.groups.length === 0 ? (
                    <p className="text-xs text-text-muted dark:text-text-secondary">
                      No {section.audience} feat groups yet.
                    </p>
                  ) : (
                    section.groups.map((group) => {
                      const whyLen = group.why?.length ?? 0;
                      const selectedFeatIds = group.feats ?? [];
                      const atFeatCap =
                        selectedFeatIds.length >= LAYER1_GOVERNANCE.maxItemsPerGroup;
                      return (
                        <div
                          key={group.id}
                          className="space-y-3 rounded-md border border-border-light bg-surface-alt/40 p-3"
                        >
                          <div className="flex items-end gap-2">
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`gg-title-${group.id}`}
                                className="block text-xs font-medium text-text-secondary mb-1"
                              >
                                Group name
                              </label>
                              <Input
                                id={`gg-title-${group.id}`}
                                value={group.title}
                                onChange={(e) =>
                                  updateFeatGuidanceGroup(group.id, { title: e.target.value })
                                }
                                placeholder="Group name"
                                className="min-h-[44px]"
                              />
                            </div>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              className="shrink-0 min-h-[44px] min-w-[44px]"
                              onClick={() => removeFeatGuidanceGroup(group.id)}
                              label={`Remove ${group.title || section.audience} feat group`}
                            >
                              <X className="w-4 h-4" />
                            </IconButton>
                          </div>
                          <div>
                            <label
                              htmlFor={`gg-why-${group.id}`}
                              className="block text-xs font-medium text-text-secondary mb-1"
                            >
                              Why (optional, max {LAYER1_GOVERNANCE.maxWhyCopyLength})
                            </label>
                            <Input
                              id={`gg-why-${group.id}`}
                              value={group.why ?? ''}
                              onChange={(e) =>
                                updateFeatGuidanceGroup(group.id, {
                                  why: e.target.value.slice(0, LAYER1_GOVERNANCE.maxWhyCopyLength),
                                })
                              }
                              placeholder="One-line why this group fits the path"
                              className="min-h-[44px]"
                            />
                            {whyLen > LAYER1_GOVERNANCE.maxWhyCopyLength - 20 && (
                              <p className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
                                {whyLen}/{LAYER1_GOVERNANCE.maxWhyCopyLength}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <ChipSelect
                              label="Add feats"
                              placeholder={
                                atFeatCap
                                  ? `Max ${LAYER1_GOVERNANCE.maxItemsPerGroup} feats`
                                  : 'Select a feat to add'
                              }
                              options={section.options
                                .filter((o) => !selectedFeatIds.includes(o.value))
                                .map((o) => ({ value: o.value, label: o.label }))}
                              selectedValues={[]}
                              onSelect={(value) => {
                                if (selectedFeatIds.length >= LAYER1_GOVERNANCE.maxItemsPerGroup) {
                                  showToast(
                                    `Max ${LAYER1_GOVERNANCE.maxItemsPerGroup} feats per group.`,
                                    'warning'
                                  );
                                  return;
                                }
                                updateFeatGuidanceGroup(group.id, {
                                  feats: dedupeStrings([...selectedFeatIds, value]),
                                });
                              }}
                            />
                            <SelectedFeatRows
                              featIds={selectedFeatIds}
                              featById={featById}
                              onRemove={(value) =>
                                updateFeatGuidanceGroup(group.id, {
                                  feats: selectedFeatIds.filter((id) => id !== value),
                                })
                              }
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
              {syncedFeatPreviewLabels.length > 0 && (
                <p className="text-xs text-text-secondary">
                  Synced Level 1 feats (union): {syncedFeatPreviewLabels.join(', ')}
                </p>
              )}
            </div>

            {/* Level 1: Armaments (weapon/shield vs armor) & Equipment with quantity */}
            <div className="space-y-4 pt-3 border-t border-border-light">
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-text-secondary">
                    Armaments (recommended qty)
                  </h5>
                  <p className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
                    Split like guided loadout (weapons/shields vs armor). Stored as one
                    level-1 armaments list.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <ChipSelect
                      label="Weapons & shields"
                      placeholder="Select weapon or shield"
                      options={weaponShieldArmamentOptions
                        .filter(
                          (o) =>
                            !form.level1Path.armamentEntries.some((e) => e.id === o.value)
                        )
                        .map((o) => ({ value: o.value, label: o.label }))}
                      selectedValues={[]}
                      onSelect={addLevel1Armament}
                    />
                    <div className="space-y-2">
                      {level1WeaponShieldEntries.map((entry) => {
                        const label =
                          armamentOptions.find((o) => o.value === entry.id)?.label ??
                          entry.id;
                        return (
                          <PathQuantityRow
                            key={`weapon-${entry.id}`}
                            label={label}
                            quantity={entry.quantity}
                            onQuantityChange={(q) => updateLevel1ArmamentQty(entry.id, q)}
                            onRemove={() => removeLevel1Armament(entry.id)}
                            removeLabel={`Remove ${label}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <ChipSelect
                      label="Armor"
                      placeholder="Select armor"
                      options={armorArmamentOptions
                        .filter(
                          (o) =>
                            !form.level1Path.armamentEntries.some((e) => e.id === o.value)
                        )
                        .map((o) => ({ value: o.value, label: o.label }))}
                      selectedValues={[]}
                      onSelect={addLevel1Armament}
                    />
                    <div className="space-y-2">
                      {level1ArmorEntries.map((entry) => {
                        const label =
                          armamentOptions.find((o) => o.value === entry.id)?.label ??
                          entry.id;
                        return (
                          <PathQuantityRow
                            key={`armor-${entry.id}`}
                            label={label}
                            quantity={entry.quantity}
                            onQuantityChange={(q) => updateLevel1ArmamentQty(entry.id, q)}
                            onRemove={() => removeLevel1Armament(entry.id)}
                            removeLabel={`Remove ${label}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <ChipSelect
                  label="Equipment (recommended qty)"
                  placeholder="Select equipment"
                  options={equipmentOptions
                    .filter(
                      (o) => !form.level1Path.equipmentEntries.some((e) => e.id === o.value)
                    )
                    .map((o) => ({ value: o.value, label: o.label }))}
                  selectedValues={[]}
                  onSelect={(value) => {
                    if (form.level1Path.equipmentEntries.some((e) => e.id === value)) return;
                    setForm((prev) => ({
                      ...prev,
                      level1Path: {
                        ...prev.level1Path,
                        equipmentEntries: [
                          ...prev.level1Path.equipmentEntries,
                          { id: value, quantity: 1 },
                        ],
                      },
                    }));
                  }}
                />
                <div className="space-y-2">
                  {form.level1Path.equipmentEntries.map((entry, idx) => {
                    const label =
                      equipmentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
                    return (
                      <PathQuantityRow
                        key={`${entry.id}-${idx}`}
                        label={label}
                        quantity={entry.quantity}
                        onQuantityChange={(q) =>
                          setForm((prev) => ({
                            ...prev,
                            level1Path: {
                              ...prev.level1Path,
                              equipmentEntries: prev.level1Path.equipmentEntries.map((e, i) =>
                                i === idx ? { ...e, quantity: q } : e
                              ),
                            },
                          }))
                        }
                        onRemove={() =>
                          setForm((prev) => ({
                            ...prev,
                            level1Path: {
                              ...prev.level1Path,
                              equipmentEntries: prev.level1Path.equipmentEntries.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          }))
                        }
                        removeLabel={`Remove ${label}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={form.level1Path.recommendUnarmedProwess}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  level1Path: { ...prev.level1Path, recommendUnarmedProwess: e.target.checked },
                }))}
                className="rounded border-border"
                aria-describedby="unarmed-prowess-desc"
              />
              <span className="text-sm font-medium text-text-primary">Recommend Unarmed Prowess</span>
            </label>
            <p id="unarmed-prowess-desc" className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
              When enabled, the equipment step (choose a path) will show Unarmed Prowess in the simplified view so the player can add it.
            </p>
            <Input
              value={form.level1Path.notes}
              onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, notes: e.target.value } }))}
              placeholder="Level 1 notes (optional)"
              aria-label="Level 1 path notes"
            />
          </div>

          <div className="space-y-3 rounded-md border border-border-light p-3">
            <h4 className="text-sm font-medium text-text-primary">Guided creator (Simple)</h4>
            <p className="text-xs text-text-muted dark:text-text-secondary">
              Powers the guided character creator: recommended abilities and phased equipment picks.
            </p>
            <div>
              <label htmlFor="guided-armor-step" className="block text-sm font-medium text-text-secondary mb-1">
                Armor step (guided loadout)
              </label>
              <select
                id="guided-armor-step"
                value={form.guidedArmorStep}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    guidedArmorStep: e.target.value as Level1ArmorStep | '',
                  }))
                }
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-describedby="guided-armor-step-desc"
              >
                <option value="">Default (power → none; martial → required)</option>
                <option value="required">Required: armor phase mandatory</option>
                <option value="optional">Optional: player may skip armor</option>
                <option value="none">None: skip armor phase</option>
              </select>
              <p id="guided-armor-step-desc" className="mt-1 text-xs text-text-muted dark:text-text-secondary">
                Controls whether the guided loadout step includes an armor sub-phase.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Recommended adventuring gear
              </label>
              <ChipSelect
                label="Add recommended gear item"
                placeholder="Select recommended equipment"
                options={equipmentOptions}
                selectedValues={[]}
                onSelect={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    guidedSharedEquipmentEntries: [
                      ...prev.guidedSharedEquipmentEntries,
                      { id: value, quantity: 1 },
                    ],
                  }))
                }
              />
              <div className="space-y-2 mt-1">
                {form.guidedSharedEquipmentEntries.map((entry, idx) => {
                  const label =
                    equipmentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
                  return (
                    <PathQuantityRow
                      key={`${entry.id}-${idx}`}
                      label={label}
                      quantity={entry.quantity}
                      onQuantityChange={(q) =>
                        setForm((prev) => ({
                          ...prev,
                          guidedSharedEquipmentEntries: prev.guidedSharedEquipmentEntries.map(
                            (item, i) => (i === idx ? { ...item, quantity: q } : item)
                          ),
                        }))
                      }
                      onRemove={() =>
                        setForm((prev) => ({
                          ...prev,
                          guidedSharedEquipmentEntries: prev.guidedSharedEquipmentEntries.filter(
                            (_, i) => i !== idx
                          ),
                        }))
                      }
                      removeLabel={`Remove recommended gear ${label}`}
                    />
                  );
                })}
              </div>
            </div>
            <div
              role="group"
              aria-labelledby="guided-recommended-abilities-label"
              aria-describedby="guided-recommended-abilities-desc"
            >
              <span
                id="guided-recommended-abilities-label"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Recommended abilities
              </span>
              <p id="guided-recommended-abilities-desc" className="text-xs text-text-muted dark:text-text-secondary mb-2">
                Suggested level 1 ability spread applied in one click during guided creation. Leave all at
                0 to skip the recommendation.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ABILITY_OPTIONS.map((ability) => {
                  const value = form.guidedRecommendedAbilities[ability] ?? 0;
                  const abilityLabel = labelForAbility(ability);
                  return (
                    <div
                      key={`rec-ability-${ability}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border-light bg-surface px-3 py-2"
                    >
                      <span className="text-sm font-medium text-text-primary">{abilityLabel}</span>
                      <ValueStepper
                        value={value}
                        min={0}
                        max={RECOMMENDED_ABILITY_MAX}
                        formatValue={(v) => `+${v}`}
                        decrementTitle={`Decrease recommended ${abilityLabel}`}
                        incrementTitle={`Increase recommended ${abilityLabel}`}
                        onChange={(next) =>
                          setForm((f) => ({
                            ...f,
                            guidedRecommendedAbilities: { ...f.guidedRecommendedAbilities, [ability]: next },
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-text-primary">Level Progression (2+)</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    levelPathRows: [...f.levelPathRows, makeLevelRow(Math.max(2, ...f.levelPathRows.map((row) => row.level)) + 1)],
                  }))
                }
              >
                Add Level
              </Button>
            </div>

            {form.levelPathRows.map((row) => (
              <div key={row.rowId} className="rounded-md border border-border-light p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-text-secondary">Level</label>
                    <Input
                      type="number"
                      value={String(row.level)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          levelPathRows: f.levelPathRows.map((candidate) =>
                            candidate.rowId === row.rowId ? { ...candidate, level: Number(e.target.value || 2) } : candidate
                          ),
                        }))
                      }
                      className="w-20"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        levelPathRows: f.levelPathRows.length > 1 ? f.levelPathRows.filter((candidate) => candidate.rowId !== row.rowId) : [makeLevelRow(2)],
                      }))
                    }
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectionFieldConfig.map((field) => {
                    const isFeatField = field.key === 'feats';
                    const options =
                      (isFeatField
                        ? getFeatOptionsForLevel(row.level)
                        : optionsByField[field.key]) ?? [];
                    const selected = row[field.key];
                    if (isFeatField) {
                      return (
                        <div key={`${row.rowId}-${field.key}`} className="space-y-2">
                          <ChipSelect
                            label={`Add ${field.label}`}
                            placeholder={field.placeholder}
                            options={options
                              .filter((option) => !selected.includes(option.value))
                              .map((option) => ({
                                value: option.value,
                                label: option.label,
                              }))}
                            selectedValues={[]}
                            onSelect={(value) =>
                              setForm((f) => ({
                                ...f,
                                levelPathRows: f.levelPathRows.map((candidate) =>
                                  candidate.rowId === row.rowId
                                    ? {
                                        ...candidate,
                                        [field.key]: dedupeStrings([
                                          ...candidate[field.key],
                                          value,
                                        ]),
                                      }
                                    : candidate
                                ),
                              }))
                            }
                          />
                          <SelectedFeatRows
                            featIds={selected}
                            featById={featById}
                            onRemove={(value) =>
                              setForm((f) => ({
                                ...f,
                                levelPathRows: f.levelPathRows.map((candidate) =>
                                  candidate.rowId === row.rowId
                                    ? {
                                        ...candidate,
                                        [field.key]: candidate[field.key].filter(
                                          (entry) => entry !== value
                                        ),
                                      }
                                    : candidate
                                ),
                              }))
                            }
                          />
                        </div>
                      );
                    }
                    return (
                      <ChipSelect
                        key={`${row.rowId}-${field.key}`}
                        label={`Add ${field.label}`}
                        placeholder={field.placeholder}
                        options={options.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        selectedValues={selected}
                        onSelect={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? {
                                    ...candidate,
                                    [field.key]: dedupeStrings([
                                      ...candidate[field.key],
                                      value,
                                    ]),
                                  }
                                : candidate
                            ),
                          }))
                        }
                        onRemove={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? {
                                    ...candidate,
                                    [field.key]: candidate[field.key].filter(
                                      (entry) => entry !== value
                                    ),
                                  }
                                : candidate
                            ),
                          }))
                        }
                      />
                    );
                  })}
                  {removeFieldConfig.map((field) => {
                    const isFeatField = field.key === 'removeFeats';
                    const options =
                      (isFeatField
                        ? getFeatOptionsForLevel(row.level)
                        : optionsByField[field.key]) ?? [];
                    const selected = row[field.key];
                    if (isFeatField) {
                      return (
                        <div key={`${row.rowId}-${field.key}`} className="space-y-2">
                          <ChipSelect
                            label={field.label}
                            placeholder={field.placeholder}
                            options={options
                              .filter((option) => !selected.includes(option.value))
                              .map((option) => ({
                                value: option.value,
                                label: option.label,
                              }))}
                            selectedValues={[]}
                            onSelect={(value) =>
                              setForm((f) => ({
                                ...f,
                                levelPathRows: f.levelPathRows.map((candidate) =>
                                  candidate.rowId === row.rowId
                                    ? {
                                        ...candidate,
                                        [field.key]: dedupeStrings([
                                          ...candidate[field.key],
                                          value,
                                        ]),
                                      }
                                    : candidate
                                ),
                              }))
                            }
                          />
                          <SelectedFeatRows
                            featIds={selected}
                            featById={featById}
                            onRemove={(value) =>
                              setForm((f) => ({
                                ...f,
                                levelPathRows: f.levelPathRows.map((candidate) =>
                                  candidate.rowId === row.rowId
                                    ? {
                                        ...candidate,
                                        [field.key]: candidate[field.key].filter(
                                          (entry) => entry !== value
                                        ),
                                      }
                                    : candidate
                                ),
                              }))
                            }
                          />
                        </div>
                      );
                    }
                    return (
                      <ChipSelect
                        key={`${row.rowId}-${field.key}`}
                        label={field.label}
                        placeholder={field.placeholder}
                        options={options.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        selectedValues={selected}
                        onSelect={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? {
                                    ...candidate,
                                    [field.key]: dedupeStrings([
                                      ...candidate[field.key],
                                      value,
                                    ]),
                                  }
                                : candidate
                            ),
                          }))
                        }
                        onRemove={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? {
                                    ...candidate,
                                    [field.key]: candidate[field.key].filter(
                                      (entry) => entry !== value
                                    ),
                                  }
                                : candidate
                            ),
                          }))
                        }
                      />
                    );
                  })}
                </div>
                <Input
                  value={row.notes}
                  onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, notes: e.target.value } : candidate) }))}
                  placeholder="Level notes (optional)"
                  aria-label={`Notes for level ${row.level}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label
              htmlFor="admin-archetype-advanced-path-json"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Advanced Path JSON Override (optional)
            </label>
            <textarea
              id="admin-archetype-advanced-path-json"
              value={form.advancedPathJson}
              onChange={(e) => setForm((f) => ({ ...f, advancedPathJson: e.target.value }))}
              placeholder="Optional: paste full path_data JSON to override builder output."
              className="w-full min-h-[120px] px-3 py-2 rounded-md border border-border bg-background text-text-primary font-mono text-xs"
              rows={6}
            />
          </div>
        </div>
      </div>
  );
}
