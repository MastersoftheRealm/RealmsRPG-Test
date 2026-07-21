/**
 * Admin archetype editor — shared field config + props (TASK-609).
 */

import type { Dispatch, SetStateAction } from 'react';
import type { CodexSkill } from '@/types/codex';
import type { PathGuidanceAudience, PathGuidanceGroup, PathItemRecommendation } from '@/types/archetype';
import type {
  AdminArchetypeFormState,
  CodexFeatLike,
  PathSelectionKey,
  SelectionOption,
} from './admin-archetype-path-form';

export type ShowToast = (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
export const selectionFieldConfig: Array<{ key: PathSelectionKey; label: string; placeholder: string }> = [
  // Level 1 feats authored via guidance groups (TASK-514); higher levels still use ChipSelect.
  { key: 'feats', label: 'Feats', placeholder: 'Select recommended feats' },
  { key: 'skills', label: 'Skills (max 3 base)', placeholder: 'Select up to 3 base skills' },
  { key: 'powers', label: 'Powers', placeholder: 'Select recommended powers' },
  { key: 'innatePowers', label: 'Innate Powers', placeholder: 'Select recommended innate powers' },
  { key: 'techniques', label: 'Techniques', placeholder: 'Select recommended techniques' },
  { key: 'armaments', label: 'Armaments', placeholder: 'Select recommended armaments' },
  { key: 'equipment', label: 'Equipment', placeholder: 'Select recommended equipment' },
];

export const removeFieldConfig: Array<{ key: PathSelectionKey; label: string; placeholder: string }> = [
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
