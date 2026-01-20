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
  ArchetypeProficiency,
  ArchetypeConfig,
  Archetype,
  ArchetypeFeat,
  ArchetypeTrait,
  CharacterArchetype,
} from './archetype';

// Ancestry
export type {
  SizeCategory,
  Ancestry,
  AncestryTrait,
  CharacterAncestry,
} from './ancestry';

// Skills
export type {
  SkillCategory,
  Skill,
  CharacterSkill,
  CharacterSkills,
  DefenseSkills,
} from './skills';
export { DEFAULT_DEFENSE_SKILLS } from './skills';

// Feats
export type {
  FeatCategory,
  Feat,
  CharacterFeat,
} from './feats';

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

// Character
export type {
  CharacterStatus,
  EntityType,
  CharacterPower,
  CharacterTechnique,
  CharacterCondition,
  ResourcePool,
  CombatBonuses,
  Character,
  CharacterSummary,
  CharacterDraft,
} from './character';

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
  SortState,
  ItemCategory,
  ItemTransformer,
  TransformContext,
  ListMode,
  ItemActions,
} from './items';
