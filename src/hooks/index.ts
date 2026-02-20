/**
 * Hooks Index
 * ============
 * Export all custom hooks
 */

// Auth
export { useAuth, useAuthStore } from './use-auth';
export { useAdmin } from './use-admin';
export { useCreatorSave } from './use-creator-save';
export type { CreatorLibraryType, CreatorSavePayload, UseCreatorSaveOptions, UseCreatorSaveReturn } from './use-creator-save';
export { useProfile } from './use-profile';

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

// Game Data (only archetypes remain — use useCodex* hooks for skills/feats/species)
export {
  gameDataKeys,
  useArchetypes,
  useArchetype,
} from './use-game-data';

// Codex Data (Prisma via API)
export {
  useCodexFull,
  useCodexFeats,
  useCodexSkills,
  useCodexSpecies as useSpecies,
  useCodexTraits as useTraits,
  useCodexPowerParts as usePowerParts,
  useCodexTechniqueParts as useTechniqueParts,
  useCodexParts as useParts,
  useCodexItemProperties as useItemProperties,
  useCodexEquipment as useEquipment,
  useCodexCreatureFeats as useCreatureFeats,
  useCodexArchetypes,
  prefetchFunctions,
} from './use-codex';

// Codex utilities (trait/skill resolution) — use use-codex types
export {
  useResolvedTraits,
  findTraitByIdOrName,
  resolveTraitIds,
  useSkillIdToNameMap,
  useResolvedSkillNames,
  buildSkillIdToNameMap,
  resolveSkillIdsToNames,
  type Feat,
  type Skill,
  type Species,
  type Trait,
  type PowerPart,
  type TechniquePart,
  type Part,
  type ItemProperty,
  type EquipmentItem,
  type CreatureFeat,
} from './use-rtdb';

// Public Library (browse, add to my library)
export { usePublicLibrary, useAddPublicToLibrary } from './use-public-library';

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
