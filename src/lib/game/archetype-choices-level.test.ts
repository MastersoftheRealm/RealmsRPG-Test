import { describe, expect, it } from 'vitest';
import { archetypeChoicesAtOrBelowLevel, calculateArchetypeProgression } from './formulas';

const stored = { 4: 'innate' as const, 7: 'feat' as const, 10: 'innate' as const };

describe('milestone choices on level down', () => {
  it('drops picks above the new level and keeps picks at or below it', () => {
    expect(archetypeChoicesAtOrBelowLevel(stored, 2)).toEqual({});
    expect(archetypeChoicesAtOrBelowLevel(stored, 4)).toEqual({ 4: 'innate' });
    expect(archetypeChoicesAtOrBelowLevel(stored, 7)).toEqual({ 4: 'innate', 7: 'feat' });
  });

  it('does not re-apply a cleared level-4 innate pick when that level is reached again', () => {
    const cleared = archetypeChoicesAtOrBelowLevel(stored, 2);
    const stale = calculateArchetypeProgression(4, 1, 1, stored);
    const again = calculateArchetypeProgression(4, 1, 1, cleared);
    const fresh = calculateArchetypeProgression(4, 1, 1, {});
    expect(stale.innateThreshold).not.toBe(again.innateThreshold);
    expect(again).toEqual(fresh);
  });
});
