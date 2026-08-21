import type { CoreRulesMap } from '@/types/core-rules';

export type CategoryId = keyof CoreRulesMap;

export interface TabDef {
  id: string;
  label: string;
  category: CategoryId;
}

export const TABS: TabDef[] = [
  { id: 'progression', label: 'Progression', category: 'PROGRESSION_PLAYER' },
  { id: 'combat', label: 'Combat', category: 'COMBAT' },
  { id: 'archetypes', label: 'Archetypes', category: 'ARCHETYPES' },
  { id: 'abilities', label: 'Abilities', category: 'ABILITY_RULES' },
  { id: 'skills', label: 'Skills & Defenses', category: 'SKILLS_AND_DEFENSES' },
  { id: 'conditions', label: 'Conditions', category: 'CONDITIONS' },
  { id: 'sizes', label: 'Sizes', category: 'SIZES' },
  { id: 'rarities', label: 'Rarities', category: 'RARITIES' },
  { id: 'damage', label: 'Damage Types', category: 'DAMAGE_TYPES' },
  { id: 'recovery', label: 'Recovery', category: 'RECOVERY' },
  { id: 'experience', label: 'Experience', category: 'EXPERIENCE' },
  { id: 'armament', label: 'Armament Prof.', category: 'ARMAMENT_PROFICIENCY' },
  { id: 'crafting', label: 'Crafting', category: 'CRAFTING' },
];
