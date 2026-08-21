/**
 * Admin Archetype path editor — modal body islands (TASK-381 Phase 6b, TASK-609).
 * Presentational form sections. List chrome, modal shell/footer, save/delete,
 * and option memos stay in AdminArchetypesTab.
 */

'use client';

import { AdminArchetypeEditorGuided } from './admin-archetype-editor-guided';
import { AdminArchetypeEditorLevel1 } from './admin-archetype-editor-level1';
import { AdminArchetypeEditorMeta } from './admin-archetype-editor-meta';
import { AdminArchetypeEditorProgression } from './admin-archetype-editor-progression';
import type { AdminArchetypeEditorProps } from './admin-archetype-editor-config';

export type { AdminArchetypeEditorProps } from './admin-archetype-editor-config';

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
      <AdminArchetypeEditorMeta form={form} setForm={setForm} copySourceName={copySourceName} />
      <div className="space-y-3 rounded-lg border border-border-light p-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Archetype Path Builder</h3>
          <p className="mt-1 text-xs text-text-muted">
            Select existing codex and official library entries. No manual CSV input required.
          </p>
          {isSelectionDataLoading && (
            <p className="mt-1 text-xs text-text-muted">Loading official library options...</p>
          )}
        </div>

        <AdminArchetypeEditorLevel1
          form={form}
          setForm={setForm}
          showToast={showToast}
          optionsByField={optionsByField}
          level1SkillPickerOptions={level1SkillPickerOptions}
          featOptionsLevel1={featOptionsLevel1}
          characterFeatOptionsLevel1={characterFeatOptionsLevel1}
          archetypeFeatOptionsLevel1={archetypeFeatOptionsLevel1}
          weaponShieldArmamentOptions={weaponShieldArmamentOptions}
          armorArmamentOptions={armorArmamentOptions}
          armamentOptions={armamentOptions}
          equipmentOptions={equipmentOptions}
          featById={featById}
          skillById={skillById}
          level1SkillIssues={level1SkillIssues}
          level1WeaponShieldEntries={level1WeaponShieldEntries}
          level1ArmorEntries={level1ArmorEntries}
          characterFeatGroups={characterFeatGroups}
          archetypeFeatGroups={archetypeFeatGroups}
          syncedFeatPreviewLabels={syncedFeatPreviewLabels}
          addFeatGuidanceGroup={addFeatGuidanceGroup}
          updateFeatGuidanceGroup={updateFeatGuidanceGroup}
          removeFeatGuidanceGroup={removeFeatGuidanceGroup}
          addLevel1Armament={addLevel1Armament}
          updateLevel1ArmamentQty={updateLevel1ArmamentQty}
          removeLevel1Armament={removeLevel1Armament}
        />

        <AdminArchetypeEditorGuided
          form={form}
          setForm={setForm}
          equipmentOptions={equipmentOptions}
        />

        <AdminArchetypeEditorProgression
          form={form}
          setForm={setForm}
          optionsByField={optionsByField}
          getFeatOptionsForLevel={getFeatOptionsForLevel}
          featById={featById}
        />
      </div>
    </div>
  );
}
