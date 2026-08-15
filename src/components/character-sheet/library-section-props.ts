/**
 * Library section types (TASK-667).
 * Public props are chrome-only; resolved panel data is built from sheet context.
 */

import type { CharacterNote } from './notes-tab';
import type {
  CharacterPower,
  CharacterTechnique,
  Item,
  Abilities,
  CharacterProficiency,
  CharacterFeat,
} from '@/types';
import type { TabType } from './library-tab-config';

/** Public LibrarySection props — tab chrome only; data comes from character-sheet context. */
export interface LibrarySectionProps {
  /** Controlled tab (optional; page context owns tab when provided) */
  activeTab?: TabType;
  onActiveTabChange?: (tab: TabType) => void;
  className?: string;
}

/**
 * Derived + catalog inputs that are not already on sheet context as character/enrichedData.
 * Assembled by the page; LibrarySection maps these into panel data via buildLibrarySectionData.
 */
export interface SheetLibraryModel {
  archetypeProgression: {
    innateEnergy?: number;
    innateThreshold?: number;
    innatePools?: number;
  } | null;
  calculatedMaxEnergy: number;
  powerPartsDb?: Array<{
    id: string;
    name: string;
    description?: string;
    base_tp?: number;
    op_1_tp?: number;
    op_2_tp?: number;
    op_3_tp?: number;
  }>;
  techniquePartsDb?: Array<{
    id: string;
    name: string;
    description?: string;
    base_tp?: number;
    op_1_tp?: number;
    op_2_tp?: number;
    op_3_tp?: number;
  }>;
  itemPropertiesDb?: Array<{
    id: string | number;
    name: string;
    description?: string;
    base_tp?: number;
    tp_cost?: number;
  }>;
  traitsDb?: Array<{
    id: string;
    name: string;
    description?: string;
    uses_per_rec?: number;
    rec_period?: string;
  }>;
  featsDb?: Array<{
    id: string;
    name: string;
    description?: string;
    effect?: string;
    max_uses?: number;
    rec_period?: string;
    category?: string;
  }>;
  characterSpeciesTraits: string[];
  archetypeFeatsForDisplay: CharacterFeat[];
  characterFeatsForDisplay: CharacterFeat[];
  stateFeatsList: Array<CharacterFeat & { type: 'archetype' | 'character' }>;
  stateUsesCurrent: number;
  stateUsesMax: number;
}

/**
 * Resolved library panel data (internal to character-sheet).
 * Built from character + SheetLibraryModel + handlers — not a public prop bag (TASK-667).
 */
export interface LibrarySectionData {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  shields: Item[];
  armor: Item[];
  equipment: Item[];
  currency?: number;
  innateEnergy?: number;
  innateThreshold?: number;
  innatePools?: number;
  currentInnateEnergy?: number;
  currentEnergy?: number;
  isEditMode?: boolean;
  onAddPower?: () => void;
  onRemovePower?: (id: string | number) => void;
  onTogglePowerInnate?: (id: string | number, isInnate: boolean) => void;
  onUsePower?: (id: string | number, energyCost: number) => void;
  onAddTechnique?: () => void;
  onRemoveTechnique?: (id: string | number) => void;
  onUseTechnique?: (id: string | number, energyCost: number) => void;
  onAddWeapon?: () => void;
  onRemoveWeapon?: (id: string | number) => void;
  onToggleEquipWeapon?: (id: string | number) => void;
  onAddShield?: () => void;
  onRemoveShield?: (id: string | number) => void;
  onToggleEquipShield?: (id: string | number) => void;
  onAddArmor?: () => void;
  onRemoveArmor?: (id: string | number) => void;
  onToggleEquipArmor?: (id: string | number) => void;
  onAddEquipment?: () => void;
  onRemoveEquipment?: (id: string | number) => void;
  onEquipmentQuantityChange?: (id: string | number, delta: number) => void;
  onCurrencyChange?: (value: number) => void;
  visibility?: 'private' | 'campaign' | 'public';
  onVisibilityChange?: (value: 'private' | 'campaign' | 'public') => void;
  speedDisplayUnit?: 'spaces' | 'feet' | 'meters';
  weight?: number;
  height?: number;
  appearance?: string;
  archetypeDesc?: string;
  notes?: string;
  abilities?: Abilities;
  powerAttackBonus?: number;
  onWeightChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  onAppearanceChange?: (value: string) => void;
  onArchetypeDescChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  namedNotes?: CharacterNote[];
  onAddNote?: () => void;
  onUpdateNote?: (id: string, updates: Partial<CharacterNote>) => void;
  onDeleteNote?: (id: string) => void;
  level?: number;
  archetypeAbility?: number;
  martialProficiency?: number;
  powerPartsDb?: SheetLibraryModel['powerPartsDb'];
  techniquePartsDb?: SheetLibraryModel['techniquePartsDb'];
  itemPropertiesDb?: SheetLibraryModel['itemPropertiesDb'];
  proficiencies?: CharacterProficiency[];
  onProficienciesChange?: (next: CharacterProficiency[]) => void;
  unarmedProwess?: number;
  onUnarmedProwessChange?: (level: number) => void;
  tabVisibility?: Partial<Record<TabType, boolean>>;
  onTabVisibilityChange?: (next: Partial<Record<TabType, boolean>>) => void;
  ancestry?: {
    selectedTraits?: string[];
    selectedFlaw?: string | null;
    selectedCharacteristic?: string | null;
  };
  vanillaTraits?: {
    ancestryTraits?: string[];
    flawTrait?: string | null;
    characteristicTrait?: string | null;
    speciesTraits?: string[];
  };
  speciesTraitsFromCodex?: string[];
  traitsDb?: SheetLibraryModel['traitsDb'];
  traitUses?: Record<string, number>;
  archetypeFeats?: Array<{
    id?: string | number;
    name: string;
    description?: string;
    maxUses?: number;
    currentUses?: number;
    recovery?: string;
    customName?: string;
    note?: string;
  }>;
  characterFeats?: Array<{
    id?: string | number;
    name: string;
    description?: string;
    maxUses?: number;
    currentUses?: number;
    recovery?: string;
    customName?: string;
    note?: string;
  }>;
  featsDb?: SheetLibraryModel['featsDb'];
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onFeatLevelChange?: (
    featId: string,
    targetLevel: number,
    listType: 'archetype' | 'character',
  ) => void;
  featRequirementCharacter?: import('@/lib/game/feat-requirements').CharacterForFeatRequirement;
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
  onAddStateFeat?: () => void;
  onRemoveFeat?: (featId: string) => void;
  traitCustomizations?: Record<string, import('@/types/feats').FeatTraitCustomization>;
  onFeatCustomizationChange?: (
    featId: string,
    listType: 'archetype' | 'character',
    updates: Partial<import('@/types/feats').FeatTraitCustomization>,
  ) => void;
  onTraitCustomizationChange?: (
    traitKey: string,
    updates: Partial<import('@/types/feats').FeatTraitCustomization>,
  ) => void;
  stateFeats?: Array<{
    id?: string | number;
    name: string;
    description?: string;
    maxUses?: number;
    currentUses?: number;
    recovery?: string;
    type?: 'archetype' | 'character';
  }>;
  stateUsesCurrent?: number;
  stateUsesMax?: number;
  onStateUsesChange?: (delta: number) => void;
  onEnterState?: () => void;
  maxArchetypeFeats?: number;
  maxCharacterFeats?: number;
}
