/**
 * Guided powers/techniques in-step phase navigation (innate → powers → techniques).
 * Inner-phase pattern like equipment-phase-nav (TASK-756).
 */

import type { ArchetypeCategory } from '@/types';
import type { GuidedPowersPhase } from '@/stores/guided-creator-store';

export const POWERS_PHASE_ORDER: GuidedPowersPhase[] = ['innate', 'powers', 'techniques'];

export interface PowersPhaseVisibility {
  includeInnate: boolean;
  includePowers: boolean;
  includeTechniques: boolean;
}

export function resolvePowersPhaseVisibility(
  archetypeType: ArchetypeCategory | null
): PowersPhaseVisibility {
  if (archetypeType === 'martial') {
    return { includeInnate: false, includePowers: false, includeTechniques: true };
  }
  if (archetypeType === 'powered-martial') {
    return { includeInnate: true, includePowers: true, includeTechniques: true };
  }
  // Power, or unset (this step should already have a type).
  return { includeInnate: true, includePowers: true, includeTechniques: false };
}

export function visiblePowersPhases(
  visibility: PowersPhaseVisibility
): GuidedPowersPhase[] {
  const phases: GuidedPowersPhase[] = [];
  if (visibility.includeInnate) phases.push('innate');
  if (visibility.includePowers) phases.push('powers');
  if (visibility.includeTechniques) phases.push('techniques');
  return phases.length > 0 ? phases : ['powers'];
}

export function nextPowersPhase(
  current: GuidedPowersPhase,
  visibility: PowersPhaseVisibility
): GuidedPowersPhase | null {
  const phases = visiblePowersPhases(visibility);
  const idx = phases.indexOf(current);
  if (idx < 0 || idx >= phases.length - 1) return null;
  return phases[idx + 1] ?? null;
}

export function prevPowersPhase(
  current: GuidedPowersPhase,
  visibility: PowersPhaseVisibility
): GuidedPowersPhase | null {
  const phases = visiblePowersPhases(visibility);
  const idx = phases.indexOf(current);
  if (idx <= 0) return null;
  return phases[idx - 1] ?? null;
}

export function isFirstPowersPhase(
  current: GuidedPowersPhase,
  visibility: PowersPhaseVisibility
): boolean {
  return visiblePowersPhases(visibility)[0] === current;
}

export function isLastPowersPhase(
  current: GuidedPowersPhase,
  visibility: PowersPhaseVisibility
): boolean {
  const phases = visiblePowersPhases(visibility);
  return phases[phases.length - 1] === current;
}

export function powersPhaseIndex(
  phase: GuidedPowersPhase,
  visibility: PowersPhaseVisibility
): number {
  return visiblePowersPhases(visibility).indexOf(phase);
}
