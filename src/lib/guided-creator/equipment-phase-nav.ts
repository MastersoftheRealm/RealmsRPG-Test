/**
 * Guided equipment in-step phase navigation (weapon → armor? → gear).
 */

import type { PathItemRecommendation } from '@/types/archetype';
import type { GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import {
  shouldSkipArmorPhase,
  type ArmorStepMode,
} from '@/lib/guided-creator/equipment-eligibility';

export const EQUIPMENT_PHASE_ORDER: GuidedEquipmentPhase[] = ['weapon', 'armor', 'gear'];

export interface EquipmentPhaseVisibility {
  /** Path has weapon/shield recommendations (or unarmed prowess). */
  includeWeapon: boolean;
  /** Path has armor recommendations and armor mode is not `none`. */
  includeArmor: boolean;
}

export interface EquipmentPhaseCompletionContext {
  loadoutWeapons: PathItemRecommendation[];
  loadoutArmor: PathItemRecommendation[];
  recommendUnarmed: boolean;
  unarmedProwess: number;
  armorMode: ArmorStepMode;
}

export function resolveEquipmentPhaseVisibility(
  armorMode: ArmorStepMode,
  opts: {
    hasWeaponOptions: boolean;
    hasArmorOptions: boolean;
    recommendUnarmed: boolean;
  }
): EquipmentPhaseVisibility {
  return {
    includeWeapon: opts.hasWeaponOptions || opts.recommendUnarmed,
    includeArmor: !shouldSkipArmorPhase(armorMode) && opts.hasArmorOptions,
  };
}

export function visibleEquipmentPhases(
  armorMode: ArmorStepMode,
  visibility?: Partial<EquipmentPhaseVisibility>
): GuidedEquipmentPhase[] {
  const includeWeapon = visibility?.includeWeapon ?? true;
  const includeArmor =
    visibility?.includeArmor ?? !shouldSkipArmorPhase(armorMode);

  const phases: GuidedEquipmentPhase[] = [];
  if (includeWeapon) phases.push('weapon');
  if (includeArmor) phases.push('armor');
  phases.push('gear');
  return phases;
}

export function nextEquipmentPhase(
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode,
  visibility?: Partial<EquipmentPhaseVisibility>
): GuidedEquipmentPhase | null {
  const phases = visibleEquipmentPhases(armorMode, visibility);
  const idx = phases.indexOf(current);
  if (idx < 0 || idx >= phases.length - 1) return null;
  return phases[idx + 1] ?? null;
}

export function prevEquipmentPhase(
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode,
  visibility?: Partial<EquipmentPhaseVisibility>
): GuidedEquipmentPhase | null {
  const phases = visibleEquipmentPhases(armorMode, visibility);
  const idx = phases.indexOf(current);
  if (idx <= 0) return null;
  return phases[idx - 1] ?? null;
}

export function isFirstEquipmentPhase(
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode,
  visibility?: Partial<EquipmentPhaseVisibility>
): boolean {
  return visibleEquipmentPhases(armorMode, visibility)[0] === current;
}

export function isLastEquipmentPhase(
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode,
  visibility?: Partial<EquipmentPhaseVisibility>
): boolean {
  const phases = visibleEquipmentPhases(armorMode, visibility);
  return phases[phases.length - 1] === current;
}

export function equipmentPhaseIndex(
  phase: GuidedEquipmentPhase,
  armorMode: ArmorStepMode,
  visibility?: Partial<EquipmentPhaseVisibility>
): number {
  return visibleEquipmentPhases(armorMode, visibility).indexOf(phase);
}

/**
 * Weapon, armor, and Equipment picks are optional (TASK-456).
 * Selection validation (hands, Currency, Training Points) still applies when items are chosen.
 */
export function canCompleteEquipmentPhase(
  _phase: GuidedEquipmentPhase,
  _ctx: EquipmentPhaseCompletionContext
): boolean {
  return true;
}

export function canNavigateToEquipmentPhase(
  target: GuidedEquipmentPhase,
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode,
  ctx: EquipmentPhaseCompletionContext,
  visibility?: Partial<EquipmentPhaseVisibility>
): boolean {
  const phases = visibleEquipmentPhases(armorMode, visibility);
  const targetIdx = phases.indexOf(target);
  const currentIdx = phases.indexOf(current);
  if (targetIdx < 0 || currentIdx < 0) return false;
  if (targetIdx <= currentIdx) return true;
  if (!canCompleteEquipmentPhase(current, ctx)) return false;
  return targetIdx === currentIdx + 1;
}
