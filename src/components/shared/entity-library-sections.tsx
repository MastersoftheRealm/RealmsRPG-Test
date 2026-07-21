'use client';

// =============================================================================
// Shared list sections (character sheet + creatures + elsewhere)
// Thin facade — implementation split into co-located private modules.
// =============================================================================

export type {
  EntityRowExtras,
  EntityListControls,
  EntityPowerRow,
  EntityTechniqueRow,
  EntityWeaponRow,
  EntityShieldRow,
  EntityArmorRow,
  EntityEquipmentRow,
  EntityFeatRow,
} from './entity-library-sections-types';

export {
  POWER_COLUMNS,
  POWER_GRID,
  CHARACTER_SHEET_TECHNIQUE_COLUMNS,
  CHARACTER_SHEET_TECHNIQUE_GRID,
  CHARACTER_SHEET_WEAPON_COLUMNS,
  CHARACTER_SHEET_WEAPON_GRID,
  CHARACTER_SHEET_SHIELD_COLUMNS,
  CHARACTER_SHEET_SHIELD_GRID,
  FEAT_COLUMNS,
  FEAT_GRID,
  FEAT_COLUMNS_WITH_LEVEL,
  FEAT_GRID_WITH_LEVEL,
} from './entity-library-sections-columns';

export { PowersListSection, TechniquesListSection } from './entity-library-powers-techniques';

export {
  WeaponsListSection,
  ShieldsListSection,
  ArmorListSection,
  EquipmentListSection,
} from './entity-library-inventory';

export { FeatsTraitsListSection, LibraryCollapsibleSection } from './entity-library-feats';
