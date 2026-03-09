/**
 * Power Creator - Shared Types
 */

import type { PowerPart } from '@/hooks';

export interface SelectedPart {
  part: PowerPart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
  selectedCategory: string;
}

/** Mechanic parts use same shape as SelectedPart for PowerPartCard compatibility */
export type AdvancedPart = SelectedPart;

export interface DamageConfig {
  amount: number;
  size: number;
  type: string;
  applyDuration?: boolean;
}

export interface RangeConfig {
  steps: number;
}
