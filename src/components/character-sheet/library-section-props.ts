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
  activeTab?: TabType | undefined;
  onActiveTabChange?: ((tab: TabType) => void) | undefined;
  className?: string | undefined;
}

/**
 * Derived + catalog inputs that are not already on sheet context as character/enrichedData.
 * Assembled by the page; LibrarySection maps these into panel data via buildLibrarySectionData.
 */
export interface SheetLibraryModel {
  archetypeProgression: {
    innateEnergy?: number | undefined;
    innateThreshold?: number | undefined;
    innatePools?: number | undefined;
  } | null;
  calculatedMaxEnergy: number;
  powerPartsDb?:
    | Array<{
        id: string;
        name: string;
        description?: string | undefined;
        base_tp?: number | undefined;
        op_1_tp?: number | undefined;
        op_2_tp?: number | undefined;
        op_3_tp?: number | undefined;
      }>
    | undefined;
  techniquePartsDb?:
    | Array<{
        id: string;
        name: string;
        description?: string | undefined;
        base_tp?: number | undefined;
        op_1_tp?: number | undefined;
        op_2_tp?: number | undefined;
        op_3_tp?: number | undefined;
      }>
    | undefined;
  itemPropertiesDb?:
    | Array<{
        id: string | number;
        name: string;
        description?: string | undefined;
        base_tp?: number | undefined;
        tp_cost?: number | undefined;
      }>
    | undefined;
  traitsDb?:
    | Array<{
        id: string;
        name: string;
        description?: string | undefined;
        uses_per_rec?: number | undefined;
        rec_period?: string | undefined;
      }>
    | undefined;
  featsDb?:
    | Array<{
        id: string;
        name: string;
        description?: string | undefined;
        effect?: string | undefined;
        max_uses?: number | undefined;
        rec_period?: string | undefined;
        category?: string | undefined;
      }>
    | undefined;
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
  currency?: number | undefined;
  innateEnergy?: number | undefined;
  innateThreshold?: number | undefined;
  innatePools?: number | undefined;
  currentInnateEnergy?: number | undefined;
  currentEnergy?: number | undefined;
  isEditMode?: boolean | undefined;
  onAddPower?: (() => void) | undefined;
  onRemovePower?: ((id: string | number) => void) | undefined;
  onTogglePowerInnate?: ((id: string | number, isInnate: boolean) => void) | undefined;
  onUsePower?: ((id: string | number, energyCost: number) => void) | undefined;
  onAddTechnique?: (() => void) | undefined;
  onRemoveTechnique?: ((id: string | number) => void) | undefined;
  onUseTechnique?: ((id: string | number, energyCost: number) => void) | undefined;
  onAddWeapon?: (() => void) | undefined;
  onRemoveWeapon?: ((id: string | number) => void) | undefined;
  onToggleEquipWeapon?: ((id: string | number) => void) | undefined;
  onAddShield?: (() => void) | undefined;
  onRemoveShield?: ((id: string | number) => void) | undefined;
  onToggleEquipShield?: ((id: string | number) => void) | undefined;
  onAddArmor?: (() => void) | undefined;
  onRemoveArmor?: ((id: string | number) => void) | undefined;
  onToggleEquipArmor?: ((id: string | number) => void) | undefined;
  onAddEquipment?: (() => void) | undefined;
  onRemoveEquipment?: ((id: string | number) => void) | undefined;
  onEquipmentQuantityChange?: ((id: string | number, delta: number) => void) | undefined;
  onCurrencyChange?: ((value: number) => void) | undefined;
  visibility?: 'private' | 'campaign' | 'public' | undefined;
  onVisibilityChange?: ((value: 'private' | 'campaign' | 'public') => void) | undefined;
  speedDisplayUnit?: 'spaces' | 'feet' | 'meters' | undefined;
  weight?: number | undefined;
  height?: number | undefined;
  appearance?: string | undefined;
  archetypeDesc?: string | undefined;
  notes?: string | undefined;
  abilities?: Abilities | undefined;
  powerAttackBonus?: number | undefined;
  onWeightChange?: ((value: number) => void) | undefined;
  onHeightChange?: ((value: number) => void) | undefined;
  onAppearanceChange?: ((value: string) => void) | undefined;
  onArchetypeDescChange?: ((value: string) => void) | undefined;
  onNotesChange?: ((value: string) => void) | undefined;
  namedNotes?: CharacterNote[] | undefined;
  onAddNote?: (() => void) | undefined;
  onUpdateNote?: ((id: string, updates: Partial<CharacterNote>) => void) | undefined;
  onDeleteNote?: ((id: string) => void) | undefined;
  level?: number | undefined;
  archetypeAbility?: number | undefined;
  martialProficiency?: number | undefined;
  powerPartsDb?: SheetLibraryModel['powerPartsDb'] | undefined;
  techniquePartsDb?: SheetLibraryModel['techniquePartsDb'] | undefined;
  itemPropertiesDb?: SheetLibraryModel['itemPropertiesDb'] | undefined;
  proficiencies?: CharacterProficiency[] | undefined;
  onProficienciesChange?: ((next: CharacterProficiency[]) => void) | undefined;
  unarmedProwess?: number | undefined;
  onUnarmedProwessChange?: ((level: number) => void) | undefined;
  tabVisibility?: Partial<Record<TabType, boolean>> | undefined;
  onTabVisibilityChange?: ((next: Partial<Record<TabType, boolean>>) => void) | undefined;
  ancestry?:
    | {
        selectedTraits?: string[] | undefined;
        selectedFlaw?: string | null | undefined;
        selectedCharacteristic?: string | null | undefined;
      }
    | undefined;
  vanillaTraits?:
    | {
        ancestryTraits?: string[] | undefined;
        flawTrait?: string | null | undefined;
        characteristicTrait?: string | null | undefined;
        speciesTraits?: string[] | undefined;
      }
    | undefined;
  speciesTraitsFromCodex?: string[] | undefined;
  traitsDb?: SheetLibraryModel['traitsDb'] | undefined;
  traitUses?: Record<string, number> | undefined;
  archetypeFeats?:
    | Array<{
        id?: string | number | undefined;
        name: string;
        description?: string | undefined;
        maxUses?: number | undefined;
        currentUses?: number | undefined;
        recovery?: string | undefined;
        customName?: string | undefined;
        note?: string | undefined;
      }>
    | undefined;
  characterFeats?:
    | Array<{
        id?: string | number | undefined;
        name: string;
        description?: string | undefined;
        maxUses?: number | undefined;
        currentUses?: number | undefined;
        recovery?: string | undefined;
        customName?: string | undefined;
        note?: string | undefined;
      }>
    | undefined;
  featsDb?: SheetLibraryModel['featsDb'] | undefined;
  onFeatUsesChange?: ((featId: string, delta: number) => void) | undefined;
  onFeatLevelChange?:
    | ((featId: string, targetLevel: number, listType: 'archetype' | 'character') => void)
    | undefined;
  featRequirementCharacter?:
    | import('@/lib/game/feat-requirements').CharacterForFeatRequirement
    | undefined;
  onTraitUsesChange?: ((traitName: string, delta: number) => void) | undefined;
  onAddArchetypeFeat?: (() => void) | undefined;
  onAddCharacterFeat?: (() => void) | undefined;
  onAddStateFeat?: (() => void) | undefined;
  onRemoveFeat?: ((featId: string) => void) | undefined;
  traitCustomizations?: Record<string, import('@/types/feats').FeatTraitCustomization> | undefined;
  onFeatCustomizationChange?:
    | ((
        featId: string,
        listType: 'archetype' | 'character',
        updates: Partial<import('@/types/feats').FeatTraitCustomization>,
      ) => void)
    | undefined;
  onTraitCustomizationChange?:
    | ((traitKey: string, updates: Partial<import('@/types/feats').FeatTraitCustomization>) => void)
    | undefined;
  stateFeats?:
    | Array<{
        id?: string | number | undefined;
        name: string;
        description?: string | undefined;
        maxUses?: number | undefined;
        currentUses?: number | undefined;
        recovery?: string | undefined;
        type?: 'archetype' | 'character' | undefined;
      }>
    | undefined;
  stateUsesCurrent?: number | undefined;
  stateUsesMax?: number | undefined;
  onStateUsesChange?: ((delta: number) => void) | undefined;
  onEnterState?: (() => void) | undefined;
  maxArchetypeFeats?: number | undefined;
  maxCharacterFeats?: number | undefined;
}
