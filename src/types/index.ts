/**
 * Types Index
 * ============
 * Export all TypeScript types
 */

// Abilities
export type { AbilityName, Abilities, DefenseName, Defenses, DefenseBonuses } from './abilities';
export { DEFAULT_ABILITIES } from './abilities';

// Archetype
export type {
  ArchetypeCategory,
  ProficiencyDerivedArchetype,
  ArchetypeProficiency,
  ArchetypeConfig,
  Archetype,
  ArchetypeFeat,
  ArchetypeTrait,
  CharacterArchetype,
} from './archetype';

// Ancestry
export type { SizeCategory, Ancestry, AncestryTrait, CharacterAncestry } from './ancestry';

// Skills
export type {
  SkillCategory,
  Skill,
  CharacterSkill,
  CharacterSkillRow,
  CharacterSkills,
  DefenseSkills,
} from './skills';
export { DEFAULT_DEFENSE_SKILLS } from './skills';

// Feats
export type { FeatCategory, Feat, CharacterFeat, FeatTraitCustomization } from './feats';

// Equipment
export type {
  EquipmentSlot,
  ItemRarity,
  WeaponCategory,
  DamageType,
  Item,
  ItemProperty,
  Weapon,
  Armor,
  CharacterEquipment,
} from './equipment';

// Campaign
export type {
  Campaign,
  CampaignCharacter,
  CampaignSummary,
  ArchetypeDisplayName,
} from './campaign';

// Tabletop
export type {
  VttAction,
  VttActionStatus,
  VttActionType,
  VttFogMode,
  VttFogRegion,
  VttFogState,
  VttGridConfig,
  VttMapAsset,
  VttPoint,
  VttRole,
  VttScene,
  VttSceneSettings,
  VttTabletopState,
  VttToken,
  VttTokenMetadata,
} from './tabletop';

// Character
export type {
  CharacterStatus,
  CharacterVisibility,
  EntityType,
  CharacterPower,
  CharacterTechnique,
  CharacterLibraryTabId,
  ProficiencyKind,
  CharacterProficiency,
  CharacterCondition,
  ResourcePool,
  CombatBonuses,
  CharacterTempModifiers,
  Character,
  CharacterSummary,
  CharacterDraft,
  CharacterSaveData,
} from './character';

// Core Rules
export type {
  CoreRulesMap,
  CoreRulesCategory,
  ProgressionPlayerRules,
  ProgressionCreatureRules,
  AbilityRules,
  ArchetypeRules,
  ArchetypeConfigRules,
  ArmamentProficiencyRules,
  CombatRules,
  SkillsAndDefensesRules,
  ConditionsRules,
  ConditionDef,
  SizesRules,
  RaritiesRules,
  DamageTypesRules,
  RecoveryRules,
  ExperienceRules,
} from './core-rules';

// Codex (GET /api/codex payload + entity collections)
export type {
  CodexPayload,
  CodexPayloadKey,
  CodexArchetype,
  CodexFeat,
  CodexSkill,
  CodexSpecies,
  CodexTrait,
  CodexPowerPart,
  CodexTechniquePart,
  CodexPart,
  CodexItemProperty,
  CodexEquipmentItem,
  CodexCreatureFeat,
} from './codex';
export { CODEX_PAYLOAD_KEYS } from './codex';

// Library (user + official GET /api/* library)
export type {
  LibraryItemType,
  LibraryItemByType,
  LibraryRow,
  LibraryPower,
  LibraryTechnique,
  LibraryItem,
  LibrarySpecies,
  LibraryCreature,
  LibrarySaveBody,
} from './library';
export { LIBRARY_ITEM_TYPES } from './library';

// Crafting + enhanced items
export type {
  CraftingSessionStatus,
  CraftingRollSession,
  CraftingItemRef,
  CraftingCustomBaseItem,
  CraftingPowerRef,
  CraftingSessionData,
  CraftingSession,
  CraftingSessionSummary,
  UserEnhancedItem,
  EnhancedItemUsesType,
  OfficialEnhancedItemPayload,
  OfficialEnhancedItem,
  CreateOfficialEnhancedItemInput,
  UpdateOfficialEnhancedItemInput,
} from './crafting';

// Item Display System
export type {
  BaseGameItem,
  DisplayItem,
  ItemBadge,
  ItemStat,
  ItemDetail,
  ItemRequirement,
  FilterOption,
  SortOption,
  FilterState,
  ItemSortState,
  ItemCategory,
  ItemTransformer,
  TransformContext,
  ListMode,
  ItemActions,
} from './items';
