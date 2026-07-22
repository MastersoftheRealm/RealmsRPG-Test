/**
 * Power Creator — editor shared types (TASK-616)
 */

import type { PowerPart } from '@/hooks';
import type { AreaConfig, DurationConfig } from '@/lib/calculators';
import type { AttackMode } from '@/lib/attack-mode';
import type { SelectedPart, AdvancedPart, DamageConfig, RangeConfig } from './power-creator-types';
import type { PowerSectionCosts } from './power-creator-cost-derivation';

export type PowerAreaPartInfo = {
  description: string;
  op1Desc?: string;
  op1Level: number;
} | null;

export type { PowerSectionCosts };

export type PowerCreatorEditorProps = {
  isAdmin: boolean;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageId: string | null;
  imageUrl: string | null;
  onImageChange: (selection: { imageId: string | null; imageUrl: string | null }) => void;

  actionType: string;
  onActionTypeChange: (value: string) => void;
  isReaction: boolean;
  onIsReactionChange: (value: boolean) => void;
  actionTypeDisplay: string;

  attackMode: AttackMode;
  onAttackModeChange: (mode: AttackMode) => void;

  range: RangeConfig;
  onRangeChange: (updater: (prev: RangeConfig) => RangeConfig) => void;
  rangeSummary: string;

  area: AreaConfig;
  onAreaChange: (updater: (prev: AreaConfig) => AreaConfig) => void;
  areaPartInfo: PowerAreaPartInfo;

  duration: DurationConfig;
  onDurationChange: (next: DurationConfig | ((prev: DurationConfig) => DurationConfig)) => void;
  durationSummary: string;

  selectedParts: SelectedPart[];
  nonMechanicParts: PowerPart[];
  powerPartsSummary: string;
  onAddPart: () => void;
  onRemovePart: (index: number) => void;
  onUpdatePart: (index: number, updates: Partial<SelectedPart>) => void;

  selectedAdvancedParts: AdvancedPart[];
  mechanicPartsForList: PowerPart[];
  powerMechanicsSummary: string;
  onAddMechanicPart: () => void;
  onRemoveAdvancedPart: (index: number) => void;
  onUpdateAdvancedPart: (index: number, updates: Partial<AdvancedPart>) => void;

  damages: DamageConfig[];
  onDamagesChange: (updater: (prev: DamageConfig[]) => DamageConfig[]) => void;
  damageSummary: string;

  sectionCosts: PowerSectionCosts;
};
