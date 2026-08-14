import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import { pickDirtyCharacterFields } from '@/lib/character/dirty-patch';
import { mergeSheetRealtimePayload } from './realtime-merge';

const abilities = {
  strength: 0,
  vitality: 0,
  agility: 0,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

function sheetCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    name: 'Hero',
    level: 1,
    abilities,
    notes: 'saved-notes',
    currentHealth: 10,
    health: { current: 10, max: 12 },
    equipment: {
      weapons: [{ id: 'a', name: 'Sword', type: 'weapon', properties: [] }],
      armor: [],
      shields: [],
    },
    feats: [{ id: 'f1', name: 'Old Feat' }],
    updatedAt: 'T0',
    ...overrides,
  } as Character;
}

describe('mergeSheetRealtimePayload (TASK-747)', () => {
  it('applies remote non-resource keys, keeps local dirty notes, and still merges HP', () => {
    const saved = sheetCharacter();
    const baseline = cleanForSave(saved) as Record<string, unknown>;
    const local = sheetCharacter({ notes: 'typing' });
    const remote = {
      ...(cleanForSave(saved) as Record<string, unknown>),
      notes: 'from-other-tab',
      equipment: {
        weapons: [
          { id: 'a', name: 'Sword', type: 'weapon', properties: [] },
          { id: 'b', name: 'Bow', type: 'weapon', properties: [] },
        ],
        armor: [],
        shields: [],
      },
      feats: [{ id: 'f2', name: 'New Feat' }],
      currentHealth: 4,
      health: { current: 4, max: 12 },
    };

    const { character: next } = mergeSheetRealtimePayload(local, remote, baseline, {
      updatedAt: 'T1',
    });
    expect(next.notes).toBe('typing');
    expect(next.feats).toEqual([{ id: 'f2', name: 'New Feat' }]);
    expect((next.equipment?.weapons as { id: string }[] | undefined)?.map((w) => w.id)).toEqual([
      'a',
      'b',
    ]);
    expect(next.currentHealth).toBe(4);
    expect(next.health?.current).toBe(4);
    expect(next.updatedAt).toBe('T1');
  });

  it('does not overwrite local HP while the resource echo window is active', () => {
    const saved = sheetCharacter();
    const baseline = cleanForSave(saved) as Record<string, unknown>;
    const local = sheetCharacter({ notes: 'typing', currentHealth: 8 });
    const remote = {
      ...(cleanForSave(saved) as Record<string, unknown>),
      notes: 'from-other-tab',
      feats: [{ id: 'f2', name: 'New Feat' }],
      currentHealth: 4,
      health: { current: 4, max: 12 },
    };

    const { character: next } = mergeSheetRealtimePayload(local, remote, baseline, {
      suppressResources: true,
      updatedAt: 'T1',
    });
    expect(next.notes).toBe('typing');
    expect(next.feats).toEqual([{ id: 'f2', name: 'New Feat' }]);
    expect(next.currentHealth).toBe(8);
    expect(next.health?.current).toBe(10);
  });

  it('adopts remote untouched keys into nextBaseline so they are not dirty', () => {
    const saved = sheetCharacter();
    const baseline = cleanForSave(saved) as Record<string, unknown>;
    const local = sheetCharacter({ notes: 'typing' });
    const remote = {
      ...(cleanForSave(saved) as Record<string, unknown>),
      notes: 'from-other-tab',
      feats: [{ id: 'f2', name: 'New Feat' }],
    };

    const { character: next, nextBaseline } = mergeSheetRealtimePayload(local, remote, baseline, {
      suppressResources: true,
      updatedAt: 'T1',
    });
    expect(next.notes).toBe('typing');
    expect(nextBaseline).not.toBeNull();
    expect(nextBaseline?.notes).toBe(baseline.notes);
    expect(nextBaseline?.feats).toEqual([{ id: 'f2', name: 'New Feat' }]);

    const stillDirty = pickDirtyCharacterFields(
      cleanForSave(next) as Record<string, unknown>,
      nextBaseline
    );
    expect(stillDirty.notes).toBe('typing');
    expect(stillDirty).not.toHaveProperty('feats');
  });

  it('returns the same character object when nothing non-resource changed', () => {
    const saved = sheetCharacter();
    const baseline = cleanForSave(saved) as Record<string, unknown>;
    const { character, nextBaseline } = mergeSheetRealtimePayload(
      saved,
      { notes: saved.notes, level: saved.level },
      baseline,
      { suppressResources: true }
    );
    expect(character).toBe(saved);
    expect(nextBaseline).toBeNull();
  });
});
