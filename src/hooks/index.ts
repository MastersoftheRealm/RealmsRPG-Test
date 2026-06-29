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
export { useCreatorPathData } from './use-creator-path-data';
export { useLoadModalLibrary } from './use-load-modal-library';
export type { LoadModalLibraryType, UseLoadModalLibraryReturn } from './use-load-modal-library';
export { useAddLibraryItemData } from './use-add-library-item-data';
export type {
  AddLibraryItemType,
  EqItem,
  PowerSelectionMode,
  UseAddLibraryItemDataOptions,
  UseAddLibraryItemDataReturn,
} from './use-add-library-item-data';
export { useCreatorWeaponOptions } from './use-creator-weapon-options';
export type { CreatorWeaponOption } from '@/lib/creator-weapon-options';
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

// Crafting
export {
  craftingKeys,
  useCraftingSessions,
  useCraftingSession,
  useCreateCraftingSession,
  useSaveCraftingSession,
  useDeleteCraftingSession,
} from './use-crafting';

// Enhanced items (user library + official admin)
export {
  enhancedItemsKeys,
  useEnhancedItems,
  useOfficialEnhancedItems,
  useCreateEnhancedItem,
  useCreateOfficialEnhancedItem,
  useDeleteEnhancedItem,
  useDeleteOfficialEnhancedItem,
  useUpdateEnhancedItem,
  useUpdateOfficialEnhancedItem,
  type EnhancedItemsScope,
  type OfficialEnhancedItem,
} from './use-enhanced-items';

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

// Game Data (useArchetype for single archetype by id; useArchetypes = useCodexArchetypes)
export { useArchetype } from './use-game-data';

// Codex Data (Supabase via API) — single codex fetch shared by all useCodex* and useGameRules
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
  useCodexArchetypes as useArchetypes,
} from './use-codex';
export { useGameRules, getGameRulesFallback } from './use-game-rules';

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
} from './codex-types';

// Official Library (browse, add to my library)
export { useOfficialLibrary, useAddOfficialToLibrary } from './use-official-library';

// User Library (user-specific content)
export {
  useUserLibrary,
  useUserPowers,
  useUserTechniques,
  useUserEmpoweredTechniques,
  useUserItems,
  useUserCreatures,
  useUserSpecies,
  useMergedSpecies,
  userSpeciesToSpecies,
  useDeletePower,
  useDeleteTechnique,
  useDeleteEmpoweredTechnique,
  useDeleteItem,
  useDeleteCreature,
  useDeleteSpecies,
  useDuplicatePower,
  useDuplicateTechnique,
  useDuplicateEmpoweredTechnique,
  useDuplicateItem,
  useDuplicateCreature,
  useDuplicateSpecies,
  type UserPower,
  type UserTechnique,
  type UserItem,
  type UserSpecies,
  type UserCreature,
  type SavedPart,
  type SavedDamage,
} from './use-user-library';

// Auto-save
export { useAutoSave } from './use-auto-save';
export { useCharacterResourceSync } from './use-character-resource-sync';

// Sort (shared list sorting logic)
export { useSort, toggleSort, sortByColumn } from './use-sort';
export { useModalListState } from './use-modal-list-state';
export type { UseModalListStateOptions } from './use-modal-list-state';
