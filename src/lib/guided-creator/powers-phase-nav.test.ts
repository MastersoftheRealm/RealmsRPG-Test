import { describe, expect, it } from 'vitest';
import {
  isLastPowersPhase,
  nextPowersPhase,
  prevPowersPhase,
  resolvePowersPhaseVisibility,
  visiblePowersPhases,
} from '@/lib/guided-creator/powers-phase-nav';

describe('powers-phase-nav (TASK-756)', () => {
  it('Power walks innate then powers and skips techniques', () => {
    const visibility = resolvePowersPhaseVisibility('power');
    expect(visiblePowersPhases(visibility)).toEqual(['innate', 'powers']);
    expect(nextPowersPhase('innate', visibility)).toBe('powers');
    expect(nextPowersPhase('powers', visibility)).toBeNull();
    expect(prevPowersPhase('powers', visibility)).toBe('innate');
    expect(isLastPowersPhase('powers', visibility)).toBe(true);
  });

  it('Martial is techniques only', () => {
    const visibility = resolvePowersPhaseVisibility('martial');
    expect(visiblePowersPhases(visibility)).toEqual(['techniques']);
    expect(nextPowersPhase('techniques', visibility)).toBeNull();
    expect(prevPowersPhase('techniques', visibility)).toBeNull();
    expect(isLastPowersPhase('techniques', visibility)).toBe(true);
  });

  it('Powered-Martial walks innate → powers → techniques', () => {
    const visibility = resolvePowersPhaseVisibility('powered-martial');
    expect(visiblePowersPhases(visibility)).toEqual(['innate', 'powers', 'techniques']);
    expect(nextPowersPhase('innate', visibility)).toBe('powers');
    expect(nextPowersPhase('powers', visibility)).toBe('techniques');
    expect(prevPowersPhase('techniques', visibility)).toBe('powers');
    expect(isLastPowersPhase('techniques', visibility)).toBe(true);
    expect(isLastPowersPhase('powers', visibility)).toBe(false);
  });

  it('unset type defaults to Power screens', () => {
    const visibility = resolvePowersPhaseVisibility(null);
    expect(visiblePowersPhases(visibility)).toEqual(['innate', 'powers']);
  });
});
