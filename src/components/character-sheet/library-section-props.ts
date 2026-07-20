/**
 * Public props for LibrarySection (re-exported from library-section.tsx).
 */

import type { CharacterNote } from './notes-tab';
import type {
  CharacterPower,
  CharacterTechnique,
  Item,
  Abilities,
  CharacterProficiency,
} from '@/types';
import type { TabType } from './library-tab-config';

export interface LibrarySectionProps {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  shields: Item[];
  armor: Item[];
  equipment: Item[];
  currency?: number;
  innateEnergy?: number;
  innateThreshold?: number; // Innate energy threshold per pool
  innatePools?: number; // Number of innate pools
  currentInnateEnergy?: number; // Optional override; default = max minus innate power costs
  currentEnergy?: number; // Current energy for use button validation
  isEditMode?: boolean;
  // Power/Technique/Equipment callbacks
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
  // Notes tab props
  visibility?: 'private' | 'campaign' | 'public';
  onVisibilityChange?: (value: 'private' | 'campaign' | 'public') => void;
  /** Speed display unit for movement (Jump, Climb, Swim) in Notes tab */
  speedDisplayUnit?: 'spaces' | 'feet' | 'meters';
  weight?: number;
  height?: number;
  appearance?: string;
  archetypeDesc?: string;
  notes?: string;
  abilities?: Abilities;
  /** Power Attack Bonus (power ability + power proficiency) for power damage rolls */
  powerAttackBonus?: number;
  onWeightChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  onAppearanceChange?: (value: string) => void;
  onArchetypeDescChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  // Named notes (custom notes)
  namedNotes?: CharacterNote[];
  onAddNote?: () => void;
  onUpdateNote?: (id: string, updates: Partial<CharacterNote>) => void;
  onDeleteNote?: (id: string) => void;
  // Proficiencies tab props
  level?: number;
  archetypeAbility?: number;
  martialProficiency?: number; // For armament proficiency display
  // Codex parts data for enrichment (descriptions, TP costs)
  powerPartsDb?: Array<{ id: string; name: string; description?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
  techniquePartsDb?: Array<{ id: string; name: string; description?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
  itemPropertiesDb?: Array<{ id: string | number; name: string; description?: string; base_tp?: number; tp_cost?: number }>;
  proficiencies?: CharacterProficiency[];
  onProficienciesChange?: (next: CharacterProficiency[]) => void;
  unarmedProwess?: number;
  onUnarmedProwessChange?: (level: number) => void;
  tabVisibility?: Partial<Record<TabType, boolean>>;
  onTabVisibilityChange?: (next: Partial<Record<TabType, boolean>>) => void;
  // Feats tab props
  ancestry?: {
    selectedTraits?: string[];
    selectedFlaw?: string | null;
    selectedCharacteristic?: string | null;
  };
  // Vanilla site trait fields (stored at top level)
  vanillaTraits?: {
    ancestryTraits?: string[];
    flawTrait?: string | null;
    characteristicTrait?: string | null;
    speciesTraits?: string[];
  };
  // Species traits from Codex species data (automatically granted based on species)
  speciesTraitsFromCodex?: string[];
  traitsDb?: Array<{
    id: string;
    name: string;
    description?: string;
    uses_per_rec?: number;
    rec_period?: string;
  }>;
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
  featsDb?: Array<{
    id: string;
    name: string;
    description?: string;
    effect?: string;
    max_uses?: number;
    rec_period?: string;
    category?: string;
  }>;
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onFeatLevelChange?: (featId: string, targetLevel: number, listType: 'archetype' | 'character') => void;
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
    updates: Partial<import('@/types/feats').FeatTraitCustomization>
  ) => void;
  onTraitCustomizationChange?: (
    traitKey: string,
    updates: Partial<import('@/types/feats').FeatTraitCustomization>
  ) => void;
  /** State uses (current/max per recovery; max = proficiency). Restored on full recovery. */
  stateFeats?: Array<{ id?: string | number; name: string; description?: string; maxUses?: number; currentUses?: number; recovery?: string; type?: 'archetype' | 'character' }>;
  stateUsesCurrent?: number;
  stateUsesMax?: number;
  onStateUsesChange?: (delta: number) => void;
  onEnterState?: () => void;
  /** Max archetype feats (for overspend indicator and current/max display) */
  maxArchetypeFeats?: number;
  /** Max character feats (for overspend indicator and current/max display) */
  maxCharacterFeats?: number;
  /** Controlled tab (optional; page context owns tab when provided) */
  activeTab?: TabType;
  onActiveTabChange?: (tab: TabType) => void;
  className?: string;
}
