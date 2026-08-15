'use client';

import { ChipSelect } from '@/components/shared';
import { Button, Input, IconButton } from '@/components/ui';
import { Plus, X } from 'lucide-react';
import { LAYER1_GOVERNANCE } from '@/lib/constants/creator-layer-governance';
import {
  PATH_LEVEL1_MAX_BASE_SKILLS,
  dedupeStrings,
  isCodexSubSkill,
} from './admin-archetype-path-form';
import { PathQuantityRow, SelectedFeatRows } from './admin-archetype-path-rows';
import {
  selectionFieldConfig,
  type AdminArchetypeEditorProps,
} from './admin-archetype-editor-config';

export type AdminArchetypeEditorLevel1Props = Pick<
  AdminArchetypeEditorProps,
  | 'form'
  | 'setForm'
  | 'showToast'
  | 'optionsByField'
  | 'level1SkillPickerOptions'
  | 'featOptionsLevel1'
  | 'characterFeatOptionsLevel1'
  | 'archetypeFeatOptionsLevel1'
  | 'weaponShieldArmamentOptions'
  | 'armorArmamentOptions'
  | 'armamentOptions'
  | 'equipmentOptions'
  | 'featById'
  | 'skillById'
  | 'level1SkillIssues'
  | 'level1WeaponShieldEntries'
  | 'level1ArmorEntries'
  | 'characterFeatGroups'
  | 'archetypeFeatGroups'
  | 'syncedFeatPreviewLabels'
  | 'addFeatGuidanceGroup'
  | 'updateFeatGuidanceGroup'
  | 'removeFeatGuidanceGroup'
  | 'addLevel1Armament'
  | 'updateLevel1ArmamentQty'
  | 'removeLevel1Armament'
>;

export function AdminArchetypeEditorLevel1({
  form,
  setForm,
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
}: AdminArchetypeEditorLevel1Props) {
  return (
    <div className="space-y-2 rounded-md border border-border-light bg-surface-alt p-3">
      <h4 className="text-sm font-medium text-text-primary">Level 1 Recommendations</h4>
      <p className="text-xs text-text-muted">
        Only level 1 feats can be recommended at level 1. For each progression level, only feats
        with level requirement ≤ that level are shown.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {selectionFieldConfig
          .filter((f) => {
            // Level 1 feats → guidance group sections below (TASK-514).
            if (f.key === 'feats' || f.key === 'armaments' || f.key === 'equipment') return false;
            if (f.key === 'innatePowers' && form.type === 'martial') return false;
            return true;
          })
          .map((field) => {
            if (field.key === 'skills') {
              const atCap = form.level1Path.skills.length >= PATH_LEVEL1_MAX_BASE_SKILLS;
              const skillOptionsForSelect = atCap
                ? level1SkillPickerOptions.filter((o) => form.level1Path.skills.includes(o.value))
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
                      if (form.level1Path.skills.length >= PATH_LEVEL1_MAX_BASE_SKILLS) {
                        showToast(
                          `Paths recommend at most ${PATH_LEVEL1_MAX_BASE_SKILLS} base skills. Remove one before adding another.`,
                          'warning',
                        );
                        return;
                      }
                      const skill = skillById.get(value);
                      if (skill && isCodexSubSkill(skill)) {
                        showToast(
                          'Sub-skills cannot be newly selected. Choose a base skill.',
                          'warning',
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
                  <p className="text-xs text-text-muted">
                    Base skills only; target max {PATH_LEVEL1_MAX_BASE_SKILLS}. Legacy paths with
                    more than {PATH_LEVEL1_MAX_BASE_SKILLS} or sub-skills can still be saved
                    (warning only).
                  </p>
                  {level1SkillIssues.length > 0 && (
                    <p role="status" className="text-xs text-warning-fg">
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
        <p className="text-xs text-text-muted">
          Innate Powers are separate from Powers. Save validates Appendix G: Energy ≤ Innate
          Threshold, Basic/Basic Reaction only, no healing or energy-gain parts, and total Energy ≤
          Innate Energy (Power 16 / Powered-Martial 6 at level 1).
        </p>
      )}

      {/* Level 1 feat guidance groups — character vs archetype (TASK-514 / ADR-0004) */}
      <div className="space-y-4 border-t border-border-light pt-3">
        <div>
          <h5 className="text-sm font-medium text-text-primary">Feat guidance groups</h5>
          <p className="mt-0.5 text-xs text-text-muted">
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
          <div
            key={section.audience}
            className="space-y-3 rounded-md border border-border-light p-3"
          >
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
                <Plus className="mr-1 h-4 w-4" aria-hidden />
                Add group
              </Button>
            </div>
            {section.groups.length === 0 ? (
              <p className="text-xs text-text-muted">No {section.audience} feat groups yet.</p>
            ) : (
              section.groups.map((group) => {
                const whyLen = group.why?.length ?? 0;
                const selectedFeatIds = group.feats ?? [];
                const atFeatCap = selectedFeatIds.length >= LAYER1_GOVERNANCE.maxItemsPerGroup;
                return (
                  <div
                    key={group.id}
                    className="space-y-3 rounded-md border border-border-light bg-surface-alt/40 p-3"
                  >
                    <div className="flex items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`gg-title-${group.id}`}
                          className="mb-1 block text-xs font-medium text-text-secondary"
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
                        className="min-h-[44px] min-w-[44px] shrink-0"
                        onClick={() => removeFeatGuidanceGroup(group.id)}
                        label={`Remove ${group.title || section.audience} feat group`}
                      >
                        <X className="h-4 w-4" />
                      </IconButton>
                    </div>
                    <div>
                      <label
                        htmlFor={`gg-why-${group.id}`}
                        className="mb-1 block text-xs font-medium text-text-secondary"
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
                        <p className="mt-0.5 text-xs text-text-muted">
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
                              'warning',
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
      <div className="space-y-4 border-t border-border-light pt-3">
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-text-secondary">Armaments (recommended qty)</h5>
            <p className="mt-0.5 text-xs text-text-muted">
              Split like guided loadout (weapons/shields vs armor). Stored as one level-1 armaments
              list.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <ChipSelect
                label="Weapons & shields"
                placeholder="Select weapon or shield"
                options={weaponShieldArmamentOptions
                  .filter((o) => !form.level1Path.armamentEntries.some((e) => e.id === o.value))
                  .map((o) => ({ value: o.value, label: o.label }))}
                selectedValues={[]}
                onSelect={addLevel1Armament}
              />
              <div className="space-y-2">
                {level1WeaponShieldEntries.map((entry) => {
                  const label =
                    armamentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
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
                  .filter((o) => !form.level1Path.armamentEntries.some((e) => e.id === o.value))
                  .map((o) => ({ value: o.value, label: o.label }))}
                selectedValues={[]}
                onSelect={addLevel1Armament}
              />
              <div className="space-y-2">
                {level1ArmorEntries.map((entry) => {
                  const label =
                    armamentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
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
              .filter((o) => !form.level1Path.equipmentEntries.some((e) => e.id === o.value))
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
              const label = equipmentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
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
                          i === idx ? { ...e, quantity: q } : e,
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
                          (_, i) => i !== idx,
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
      <label className="mt-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.level1Path.recommendUnarmedProwess}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              level1Path: { ...prev.level1Path, recommendUnarmedProwess: e.target.checked },
            }))
          }
          className="rounded border-border"
          aria-describedby="unarmed-prowess-desc"
        />
        <span className="text-sm font-medium text-text-primary">Recommend Unarmed Prowess</span>
      </label>
      <p id="unarmed-prowess-desc" className="mt-0.5 text-xs text-text-muted">
        When enabled, the equipment step (choose a path) will show Unarmed Prowess in the simplified
        view so the player can add it.
      </p>
      <Input
        value={form.level1Path.notes}
        onChange={(e) =>
          setForm((f) => ({ ...f, level1Path: { ...f.level1Path, notes: e.target.value } }))
        }
        placeholder="Level 1 notes (optional)"
        aria-label="Level 1 path notes"
      />
    </div>
  );
}
