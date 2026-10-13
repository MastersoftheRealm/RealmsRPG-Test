import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { archetypeChoicesAtOrBelowLevel, calculateArchetypeProgression } from './formulas';

const levelDown = readFileSync(
  new URL('../../components/character-sheet/use-sheet-resource-actions.ts', import.meta.url),
  'utf8',
);

const stored = { 4: 'innate' as const, 7: 'feat' as const, 10: 'innate' as const };

describe('milestone choices on level down (86e3jvjwc)', () => {
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

  it('clears choices in the sheet level change when the new level is lower', () => {
    expect(levelDown).toContain('archetypeChoicesAtOrBelowLevel(prev.archetypeChoices, newLevel)');
    expect(levelDown).toContain('newLevel < (prev.level || 1)');
  });
});
