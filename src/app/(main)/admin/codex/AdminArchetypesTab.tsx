/**
 * Admin Codex — Archetypes tab (TASK-381)
 * =======================================
 * List chrome + Modal shell. Workspace owns state/options/save;
 * modal body is AdminArchetypeEditor.
 */

'use client';

import {
  SectionHeader,
  SearchInput,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
} from '@/components/shared';
import { Modal, Button, IconButton } from '@/components/ui';
import { AdminArchetypeEditor } from './admin-archetype-editor';
import { useAdminArchetypeWorkspace, type ArchetypeItem } from './use-admin-archetype-workspace';
import { Pencil, Copy, X } from 'lucide-react';
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
    deleteConfirm,
    pendingDeleteId,
    setPendingDeleteId,
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
    handleDelete,
    handleInlineDelete,
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
                  description={(a as { description?: string }).description || ''}
                  columns={[{ key: 'Type', value: formatListCellLabel(a.type) }]}
                />
              </div>
              <div className="flex items-center gap-1 pr-2">
                {pendingDeleteId === a.id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-medium whitespace-nowrap text-danger-700 dark:text-danger-400">
                      Remove?
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleInlineDelete(a.id)}
                      className="h-6 px-2 py-0.5 text-xs"
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingDeleteId(null)}
                      className="h-6 px-2 py-0.5 text-xs"
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(a)}
                      label="Edit"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openDuplicate(a)}
                      label="Duplicate"
                      aria-label="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteId(a.id)}
                      label="Delete"
                      className="text-danger-fg hover:bg-transparent hover:opacity-80"
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  </>
                )}
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
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(editing.id)}
                  className={
                    deleteConfirm === editing.id
                      ? 'border-danger-500 text-danger-700 dark:text-danger-400'
                      : ''
                  }
                >
                  {deleteConfirm === editing.id ? 'Click again to confirm delete' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || isSelectionDataLoading}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
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
    </div>
  );
}
