/**
 * Empowered Technique Creator — editor shared types (TASK-610)
 */

import type { PowerPart, TechniquePart } from '@/hooks';
import type { AreaConfig, DurationConfig } from '@/lib/calculators';
import type { AttackMode } from '@/lib/attack-mode';
import type {
  EmpoweredDamageConfig as DamageConfig,
  EmpoweredRangeConfig as RangeConfig,
  SelectedPowerPart,
  SelectedTechniquePart,
} from './empowered-technique-bootstrap';
import type { EmpoweredSectionCosts } from './empowered-technique-cost-derivation';

export type { EmpoweredSectionCosts };

export type EmpoweredTechniqueCreatorEditorProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;

  actionDisplay: string;
  actionType: string;
  onActionTypeChange: (value: string) => void;
  isReaction: boolean;
  onIsReactionChange: (value: boolean) => void;
  attackMode: AttackMode;
  onAttackModeChange: (mode: AttackMode) => void;

  rangeDisplay: string;
  range: RangeConfig;
  onRangeStepsChange: (steps: number) => void;
  area: AreaConfig;
  onAreaChange: (updater: (prev: AreaConfig) => AreaConfig) => void;
  duration: DurationConfig;
  onDurationChange: (updater: (prev: DurationConfig) => DurationConfig) => void;
  onDurationTypeChange: (nextType: DurationConfig['type']) => void;

  powerDamages: DamageConfig[];
  onPowerDamagesChange: (updater: (prev: DamageConfig[]) => DamageConfig[]) => void;
  powerDamageSummary: string;

  selectedPowerParts: SelectedPowerPart[];
  nonMechanicPowerParts: PowerPart[];
  onAddPowerPart: () => void;
  onRemovePowerPart: (index: number) => void;
  onUpdatePowerPart: (index: number, updates: Partial<SelectedPowerPart>) => void;

  selectedPowerAdvancedParts: SelectedPowerPart[];
  powerMechanicsForList: PowerPart[];
  onAddPowerMechanicPart: () => void;
  onRemovePowerAdvancedPart: (index: number) => void;
  onUpdatePowerAdvancedPart: (index: number, updates: Partial<SelectedPowerPart>) => void;

  selectedTechniqueParts: SelectedTechniquePart[];
  nonMechanicTechniqueParts: TechniquePart[];
  onAddTechniquePart: () => void;
  onRemoveTechniquePart: (index: number) => void;
  onUpdateTechniquePart: (index: number, updates: Partial<SelectedTechniquePart>) => void;

  techniqueDamage: { amount: number; size: number };
  onTechniqueDamageChange: (
    updater: (prev: { amount: number; size: number }) => { amount: number; size: number },
  ) => void;
  techniqueDamageSummary: string;

  sectionCosts: EmpoweredSectionCosts;
};
