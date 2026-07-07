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

export interface EquipmentPhaseCompletionContext {
  loadoutWeapons: PathItemRecommendation[];
  loadoutArmor: PathItemRecommendation[];
  recommendUnarmed: boolean;
  unarmedProwess: number;
  armorMode: ArmorStepMode;
}

export function visibleEquipmentPhases(armorMode: ArmorStepMode): GuidedEquipmentPhase[] {
  if (shouldSkipArmorPhase(armorMode)) return ['weapon', 'gear'];
  return EQUIPMENT_PHASE_ORDER;
}

export function nextEquipmentPhase(
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode
): GuidedEquipmentPhase | null {
  const phases = visibleEquipmentPhases(armorMode);
  const idx = phases.indexOf(current);
  if (idx < 0 || idx >= phases.length - 1) return null;
  return phases[idx + 1] ?? null;
}

export function prevEquipmentPhase(
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode
): GuidedEquipmentPhase | null {
  const phases = visibleEquipmentPhases(armorMode);
  const idx = phases.indexOf(current);
  if (idx <= 0) return null;
  return phases[idx - 1] ?? null;
}

export function isFirstEquipmentPhase(
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode
): boolean {
  return visibleEquipmentPhases(armorMode)[0] === current;
}

export function isLastEquipmentPhase(
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode
): boolean {
  const phases = visibleEquipmentPhases(armorMode);
  return phases[phases.length - 1] === current;
}

export function equipmentPhaseIndex(
  phase: GuidedEquipmentPhase,
  armorMode: ArmorStepMode
): number {
  return visibleEquipmentPhases(armorMode).indexOf(phase);
}

export function canCompleteEquipmentPhase(
  phase: GuidedEquipmentPhase,
  ctx: EquipmentPhaseCompletionContext
): boolean {
  switch (phase) {
    case 'weapon':
      return (
        ctx.loadoutWeapons.length > 0 ||
        (ctx.recommendUnarmed && (ctx.unarmedProwess ?? 0) > 0)
      );
    case 'armor':
      if (shouldSkipArmorPhase(ctx.armorMode)) return true;
      if (ctx.armorMode === 'optional') return true;
      return ctx.loadoutArmor.length > 0;
    case 'gear':
      return true;
    default:
      return false;
  }
}

export function canNavigateToEquipmentPhase(
  target: GuidedEquipmentPhase,
  current: GuidedEquipmentPhase,
  armorMode: ArmorStepMode,
  ctx: EquipmentPhaseCompletionContext
): boolean {
  const phases = visibleEquipmentPhases(armorMode);
  const targetIdx = phases.indexOf(target);
  const currentIdx = phases.indexOf(current);
  if (targetIdx < 0 || currentIdx < 0) return false;
  if (targetIdx <= currentIdx) return true;
  if (!canCompleteEquipmentPhase(current, ctx)) return false;
  return targetIdx === currentIdx + 1;
}
