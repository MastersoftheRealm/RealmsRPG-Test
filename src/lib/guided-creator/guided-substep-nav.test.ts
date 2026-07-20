/**
 * Footer Continue one-screen advance (DEV-V-013-T059 / TASK-592).
 */

import { describe, expect, it } from 'vitest';
import {
  GUIDED_SUBSTEP_ORDER,
  type GuidedSubStep,
} from '@/stores/guided-creator-store';
import {
  landsOnFirstInnerScreen,
  nextGuidedSubStep,
  prevGuidedSubStep,
} from './guided-substep-nav';

describe('nextGuidedSubStep', () => {
  it('advances one sub-step (species → ancestry), not furthest chapter', () => {
    // No completedSubSteps arg — furthest progress cannot influence Continue.
    expect(nextGuidedSubStep('species', GUIDED_SUBSTEP_ORDER)).toBe('ancestry');
    expect(nextGuidedSubStep('species', GUIDED_SUBSTEP_ORDER)).not.toBe('abilities');
    expect(nextGuidedSubStep('species', GUIDED_SUBSTEP_ORDER)).not.toBe('loadout');
  });

  it('walks the full order one step at a time', () => {
    let current: GuidedSubStep | null = 'path';
    const seen: GuidedSubStep[] = [];
    while (current) {
      seen.push(current);
      current = nextGuidedSubStep(current, GUIDED_SUBSTEP_ORDER);
    }
    expect(seen).toEqual([...GUIDED_SUBSTEP_ORDER]);
  });

  it('returns null at the last sub-step', () => {
    expect(nextGuidedSubStep('reveal', GUIDED_SUBSTEP_ORDER)).toBeNull();
  });
});

describe('prevGuidedSubStep', () => {
  it('moves exactly one sub-step backward', () => {
    expect(prevGuidedSubStep('ancestry', GUIDED_SUBSTEP_ORDER)).toBe('species');
    expect(prevGuidedSubStep('path', GUIDED_SUBSTEP_ORDER)).toBeNull();
  });
});

describe('landsOnFirstInnerScreen', () => {
  it('Continue and chapter rail land on first inner screen', () => {
    expect(landsOnFirstInnerScreen('forward')).toBe(true);
    expect(landsOnFirstInnerScreen('first')).toBe(true);
  });

  it('Back resumes last inner screen (does not force first)', () => {
    expect(landsOnFirstInnerScreen('back')).toBe(false);
  });
});
