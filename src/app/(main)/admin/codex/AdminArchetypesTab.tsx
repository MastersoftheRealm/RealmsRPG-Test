/**
 * Admin Codex — Archetypes tab (TASK-381)
 * =======================================
 * List chrome + Modal shell. Workspace owns state/options/save;
 * modal body is AdminArchetypeEditor.
 */

'use client';

import { SectionHeader, ErrorDisplay as ErrorState, GridListRow } from '@/components/patterns';
import { Modal, SearchInput, LoadingState, EmptyState } from '@/components/ui';
import { AdminArchetypeEditor } from './admin-archetype-editor';
import { useAdminArchetypeWorkspace, type ArchetypeItem } from './use-admin-archetype-workspace';
import { AdminCodexRowActions } from './admin-codex-row-actions';
import { AdminCodexEditModalFooter } from './admin-codex-edit-modal-footer';
import { formatListCellLabel } from '@/lib/utils';

export function AdminArchetypesTab() {
  const {
    showToast,
    isLoading,
    error,
    refetch,
    search,
    setSearch,
    modalOpen,
    editing,
    saving,
    copySourceName,
    form,
    setForm,
    filtered,
    featById,
    featOptionsLevel1,
    characterFeatOptionsLevel1,
    archetypeFeatOptionsLevel1,
    level1SkillPickerOptions,
    skillById,
    level1SkillIssues,
    weaponShieldArmamentOptions,
    armorArmamentOptions,
    armamentOptions,
    equipmentOptions,
    optionsByField,
    isSelectionDataLoading,
    characterFeatGroups,
    archetypeFeatGroups,
    syncedFeatPreviewLabels,
    level1WeaponShieldEntries,
    level1ArmorEntries,
    getFeatOptionsForLevel,
    updateFeatGuidanceGroup,
    addFeatGuidanceGroup,
    removeFeatGuidanceGroup,
    addLevel1Armament,
    updateLevel1ArmamentQty,
    removeLevel1Armament,
    openAdd,
    openDuplicate,
    openEdit,
    closeModal,
    handleSave,
    askDelete,
    deleteModals,
  } = useAdminArchetypeWorkspace();

  if (error)
    return (
      <ErrorState
        message="Failed to load archetypes"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <SectionHeader title="Archetypes" onAdd={openAdd} size="md" />
      <div className="mt-2 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search archetypes..." />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {filtered.map((a: ArchetypeItem) => (
            <div
              key={a.id}
              className="flex items-center border-t border-border first:border-t-0 hover:bg-surface-alt/50"
            >
              <div className="min-w-0 flex-1">
                <GridListRow
                  id={a.id}
                  name={a.name || ''}
                  description={(a as { description?: string | undefined }).description || ''}
                  columns={[{ key: 'Type', value: formatListCellLabel(a.type) }]}
                />
              </div>
              <div className="min-w-0">
                <AdminCodexRowActions
                  entity={a}
                  onEdit={openEdit}
                  onDuplicate={openDuplicate}
                  onDelete={askDelete}
                />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState
              title="No archetypes found"
              description="Add one to get started."
              action={{ label: 'Add Archetype', onClick: openAdd }}
              size="sm"
            />
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Archetype' : 'Add Archetype'}
        size="full"
        fullScreenOnMobile
        footer={
          <AdminCodexEditModalFooter
            onDelete={editing ? () => askDelete(editing) : undefined}
            onClose={closeModal}
            onSave={handleSave}
            saveDisabled={saving || !form.name.trim() || isSelectionDataLoading}
            saving={saving}
          />
        }
      >
        <AdminArchetypeEditor
          form={form}
          setForm={setForm}
          copySourceName={copySourceName}
          isSelectionDataLoading={isSelectionDataLoading}
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
          getFeatOptionsForLevel={getFeatOptionsForLevel}
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
      </Modal>
      {deleteModals}
    </div>
  );
}
