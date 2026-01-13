/**
 * Hooks Index
 * ============
 * Export all custom hooks
 */

// Auth
export { useAuth, useAuthStore } from './use-auth';

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

// RTDB Data (Codex, Parts, Properties)
export {
  useFeats as useRTDBFeats,
  useSkills as useRTDBSkills,
  useSpecies,
  useTraits,
  usePowerParts,
  useTechniqueParts,
  useParts,
  useItemProperties,
  useEquipment,
  useCreatureFeats,
  useResolvedTraits,
  findTraitByIdOrName,
  resolveTraitIds,
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
  type UserPower,
  type UserTechnique,
  type UserItem,
  type UserCreature,
  type SavedPart,
  type SavedDamage,
} from './use-user-library';

// Auto-save
export { useAutoSave } from './use-auto-save';
