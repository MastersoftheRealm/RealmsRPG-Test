/**
 * Admin Archetypes — workspace hook (TASK-381 Phase 6c, TASK-617 facade)
 * =====================================================
 * Owns list/modal state, option memos, guidance/armament mutators, and
 * open/save/delete. Presentational modal body stays in admin-archetype-editor;
 * list chrome + Modal shell stay in AdminArchetypesTab.
 */

'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui';
import {
  useCodexArchetypes,
  useCodexEquipment,
  useCodexFeats,
  useCodexSkills,
  useCodexItemProperties,
  useCodexPowerParts,
} from '@/hooks/use-codex';
import { useOfficialLibrary } from '@/hooks/use-official-library';
import { useQueryClient } from '@tanstack/react-query';
import { type ArchetypeItem, type CodexFeatLike } from './admin-archetype-path-form';
import { useAdminArchetypeSelectionOptions } from './use-admin-archetype-selection-options';
import {
  createFeatGuidanceMutators,
  createLevel1ArmamentMutators,
} from './admin-archetype-workspace-mutators';
import {
  buildArchetypeFormFromItem,
  buildDuplicateArchetypeForm,
  EMPTY_ARCHETYPE_FORM,
  toastLevel1SkillsFromForm,
} from './admin-archetype-workspace-open';
import { saveAdminArchetype } from './admin-archetype-workspace-save';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryItem, LibraryPower } from '@/types/library';
import type { CodexSkill, CodexEquipmentItem } from '@/types/codex';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';

export type { ArchetypeItem } from './admin-archetype-path-form';

export function useAdminArchetypeWorkspace() {
  const { showToast } = useToast();
  const { data: archetypes, isLoading, error, refetch } = useCodexArchetypes();
  const { data: codexFeats = [] } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexEquipment = [] } = useCodexEquipment();
  const { data: powerPartsDb = [] } = useCodexPowerParts();
  const { data: officialPowers = [], isLoading: isLoadingOfficialPowers } =
    useOfficialLibrary('powers');
  const { data: officialTechniques = [], isLoading: isLoadingOfficialTechniques } =
    useOfficialLibrary('techniques');
  const { data: officialItems = [], isLoading: isLoadingOfficialItems } =
    useOfficialLibrary('items');
  const { data: itemProperties = [] } = useCodexItemProperties();
  const queryClient = useQueryClient();
  const {
    modalOpen,
    editing,
    saving,
    setSaving,
    copySourceName,
    openAdd: beginAdd,
    openDuplicate: beginDuplicate,
    openEdit: beginEdit,
    closeModal,
    askDelete,
    deleteModals,
  } = useAdminCodexEntity<ArchetypeItem>({
    collection: 'codex_archetypes',
    entityLabel: 'archetype',
  });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_ARCHETYPE_FORM);

  const filtered = (archetypes || []).filter(
    (a: ArchetypeItem) =>
      !search ||
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase()),
  );

  const selection = useAdminArchetypeSelectionOptions({
    codexFeats: codexFeats as CodexFeatLike[],
    codexSkills: codexSkills as CodexSkill[],
    codexEquipment: codexEquipment as Array<{ id?: string | undefined; name?: string | undefined }>,
    officialPowers,
    officialTechniques,
    officialItems,
    level1Skills: form.level1Path.skills,
    guidanceGroups: form.guidanceGroups,
    isLoadingOfficialPowers,
    isLoadingOfficialTechniques,
    isLoadingOfficialItems,
  });

  const {
    featById,
    getFeatOptionsForLevel,
    featOptionsLevel1,
    characterFeatOptionsLevel1,
    archetypeFeatOptionsLevel1,
    skillById,
    level1SkillPickerOptions,
    level1SkillIssues,
    weaponShieldArmamentOptions,
    armorArmamentOptions,
    armamentOptions,
    filterLevel1WeaponShieldEntries,
    filterLevel1ArmorEntries,
    equipmentOptions,
    optionsByField,
    isSelectionDataLoading,
    characterFeatGroups,
    archetypeFeatGroups,
    syncedFeatPreviewLabels,
  } = selection;

  const level1WeaponShieldEntries = useMemo(
    () => filterLevel1WeaponShieldEntries(form.level1Path.armamentEntries),
    [filterLevel1WeaponShieldEntries, form.level1Path.armamentEntries],
  );

  const level1ArmorEntries = useMemo(
    () => filterLevel1ArmorEntries(form.level1Path.armamentEntries),
    [filterLevel1ArmorEntries, form.level1Path.armamentEntries],
  );

  const { updateFeatGuidanceGroup, addFeatGuidanceGroup, removeFeatGuidanceGroup } =
    createFeatGuidanceMutators(setForm, showToast);
  const { addLevel1Armament, updateLevel1ArmamentQty, removeLevel1Armament } =
    createLevel1ArmamentMutators(setForm);

  const openAdd = () => beginAdd(() => setForm(EMPTY_ARCHETYPE_FORM));

  const openDuplicate = (a: ArchetypeItem) =>
    beginDuplicate(a, () => {
      const nextForm = buildDuplicateArchetypeForm(a, optionsByField);
      setForm(nextForm);
      toastLevel1SkillsFromForm(nextForm, codexSkills as CodexSkill[], showToast);
    });

  const openEdit = (a: ArchetypeItem) =>
    beginEdit(a, () => {
      const nextForm = buildArchetypeFormFromItem(a, optionsByField);
      setForm(nextForm);
      toastLevel1SkillsFromForm(nextForm, codexSkills as CodexSkill[], showToast);
    });

  const handleSave = async () => {
    await saveAdminArchetype({
      form,
      editing,
      optionsByField,
      skillById,
      officialPowers: officialPowers as LibraryPower[],
      officialItems: officialItems as LibraryItem[],
      codexEquipment: codexEquipment as CodexEquipmentItem[],
      itemProperties: itemProperties as ItemPropertyTpRow[],
      powerPartsDb: powerPartsDb as PowerPart[],
      queryClient,
      showToast,
      setSaving,
      onSuccess: closeModal,
    });
  };

  return {
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
  };
}
