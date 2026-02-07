/**
 * Hooks Index
 * ============
 * Export all custom hooks
 */

// Auth
export { useAuth, useAuthStore } from './use-auth';
export { useAdmin } from './use-admin';

// Campaigns
export {
  campaignKeys,
  useCampaigns,
  useCampaignsFull,
  useCampaign,
  useCampaignByInviteCode,
  useInvalidateCampaigns,
} from './use-campaigns';
export { useCampaignRolls } from './use-campaign-rolls';

// Encounters
export {
  encounterKeys,
  useEncounters,
  useEncounter,
  useCreateEncounter,
  useSaveEncounter,
  useDeleteEncounter,
  useInvalidateEncounters,
} from './use-encounters';

// Characters
export {
  characterKeys,
  useCharacters,
  useCharacter,
  useSaveCharacter,
  useCreateCharacter,
  useDeleteCharacter,
  useDuplicateCharacter,
} from './use-characters';

// Game Data
export {
  gameDataKeys,
  useArchetypes,
  useArchetype,
  useSkills,
  useSkill,
  useFeats,
  useFeat,
  useAncestries,
  useAncestry,
  useGameData,
  useGameDataList,
} from './use-game-data';

// Codex Data (Firestore — migrated from RTDB)
export {
  useCodexFeats as useRTDBFeats,
  useCodexSkills as useRTDBSkills,
  useCodexSpecies as useSpecies,
  useCodexTraits as useTraits,
  useCodexPowerParts as usePowerParts,
  useCodexTechniqueParts as useTechniqueParts,
  useCodexParts as useParts,
  useCodexItemProperties as useItemProperties,
  useCodexEquipment as useEquipment,
  useCodexCreatureFeats as useCreatureFeats,
} from './use-firestore-codex';

// Codex utilities (trait/skill resolution)
export {
  useResolvedTraits,
  findTraitByIdOrName,
  resolveTraitIds,
  useSkillIdToNameMap,
  useResolvedSkillNames,
  buildSkillIdToNameMap,
  resolveSkillIdsToNames,
  prefetchFunctions,
  type Feat as RTDBFeat,
  type Skill as RTDBSkill,
  type Species,
  type Trait,
  type PowerPart,
  type TechniquePart,
  type Part,
  type ItemProperty,
  type EquipmentItem,
  type CreatureFeat,
} from './use-rtdb';

// User Library (user-specific content)
export {
  useUserPowers,
  useUserTechniques,
  useUserItems,
  useUserCreatures,
  useDeletePower,
  useDeleteTechnique,
  useDeleteItem,
  useDeleteCreature,
  useDuplicatePower,
  useDuplicateTechnique,
  useDuplicateItem,
  useDuplicateCreature,
  type UserPower,
  type UserTechnique,
  type UserItem,
  type UserCreature,
  type SavedPart,
  type SavedDamage,
} from './use-user-library';

// Auto-save
export { useAutoSave } from './use-auto-save';

// Session Sync (syncs Firebase Auth with server-side session cookies)
export { useSessionSync } from './use-session-sync';

// Creator Cache (localStorage persistence for guest users)
export { 
  useCreatorCache, 
  useCreatorCacheValue,
  clearAllCreatorCaches,
  getCreatorCacheInfo,
  type CreatorType,
} from './use-creator-cache';

// Sort (shared list sorting logic)
export { useSort, toggleSort, sortByColumn } from './use-sort';
