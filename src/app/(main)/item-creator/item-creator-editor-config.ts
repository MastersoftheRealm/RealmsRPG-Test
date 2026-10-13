/**
 * Item Creator — editor shared types (TASK-616)
 */

import type { ItemProperty } from '@/hooks';
import type {
  ArmamentType,
  ItemSelectedProperty as SelectedProperty,
  ItemDamageConfig as DamageConfig,
} from './item-creator-bootstrap';
import type { ItemSectionCosts } from './item-creator-cost-derivation';
import type { WeaponRangeType } from '@/lib/calculators';
import type { WeaponAttackAbility } from '@/lib/game/weapon-attack-ability';

export type { ItemSectionCosts };

export type ItemCreatorEditorProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;
  imageCategory: 'weapon' | 'armor' | 'shield';

  armamentType: ArmamentType;
  onArmamentTypeChange: (type: ArmamentType) => void;

  isTwoHanded: boolean;
  onIsTwoHandedChange: (value: boolean) => void;
  rangeType: WeaponRangeType;
  onRangeTypeChange: (value: WeaponRangeType) => void;
  rangeSpaces: number;
  onRangeSpacesChange: (value: number) => void;
  attackAbility: WeaponAttackAbility;
  onAttackAbilityChange: (value: WeaponAttackAbility) => void;
  weaponShieldConfigSummary: string;

  damage: DamageConfig;
  onDamageChange: (updater: (prev: DamageConfig) => DamageConfig) => void;
  baseDamageSummary: string;

  damageReduction: number;
  onDamageReductionChange: (value: number) => void;
  agilityReduction: number;
  onAgilityReductionChange: (value: number) => void;
  criticalRangeIncrease: number;
  onCriticalRangeIncreaseChange: (value: number) => void;
  armorConfigSummary: string;

  shieldDR: { amount: number; size: number };
  onShieldDRChange: (
    updater: (prev: { amount: number; size: number }) => { amount: number; size: number },
  ) => void;
  shieldBlockSummary: string;
  hasShieldDamage: boolean;
  onHasShieldDamageChange: (value: boolean) => void;
  shieldDamage: { amount: number; size: number };
  onShieldDamageChange: (
    updater: (prev: { amount: number; size: number }) => { amount: number; size: number },
  ) => void;
  shieldDamageSummary: string;

  abilityRequirement: { id: number; name: string; level: number } | null;
  onAbilityRequirementChange: (
    next:
      | { id: number; name: string; level: number }
      | null
      | ((
          prev: { id: number; name: string; level: number } | null,
        ) => { id: number; name: string; level: number } | null),
  ) => void;
  abilityReqSummary: string;

  selectedProperties: SelectedProperty[];
  itemProperties: ItemProperty[];
  propertiesSummary: string;
  onAddProperty: () => void;
  onRemoveProperty: (index: number) => void;
  onUpdateProperty: (index: number, updates: Partial<SelectedProperty>) => void;

  itemSectionCosts: ItemSectionCosts;
};
