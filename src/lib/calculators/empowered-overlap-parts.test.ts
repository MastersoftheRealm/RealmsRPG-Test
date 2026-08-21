import { describe, expect, it } from 'vitest';
import { pickCheaperEnPart, toEmpoweredAutoMechanicPart } from './empowered-overlap-parts';

describe('pickCheaperEnPart', () => {
  it('returns null when no candidates', () => {
    expect(pickCheaperEnPart([])).toBeNull();
    expect(pickCheaperEnPart([null, undefined])).toBeNull();
  });

  it('picks the lower base_en between power and technique Add Weapon', () => {
    const picked = pickCheaperEnPart([
      { side: 'power', part: { id: 369, name: 'Add Weapon to Power', base_en: 4.5 } },
      { side: 'technique', part: { id: 7, name: 'Add Weapon to Technique', base_en: 2.5 } },
    ]);
    expect(picked?.side).toBe('technique');
    expect(picked?.part.id).toBe(7);
  });

  it('picks power when power is cheaper', () => {
    const picked = pickCheaperEnPart([
      { side: 'power', part: { id: 369, name: 'Add Weapon to Power', base_en: 0 } },
      { side: 'technique', part: { id: 7, name: 'Add Weapon to Technique', base_en: 0.25 } },
    ]);
    expect(picked?.side).toBe('power');
  });

  it('on equal EN prefers technique side', () => {
    const picked = pickCheaperEnPart([
      { side: 'power', part: { id: 82, name: 'Power Reaction', base_en: 1.25 } },
      { side: 'technique', part: { id: 2, name: 'Reaction', base_en: 1.25 } },
    ]);
    expect(picked?.side).toBe('technique');
    expect(picked?.part.id).toBe(2);
  });

  it('works with a single available candidate', () => {
    const picked = pickCheaperEnPart([
      null,
      { side: 'technique', part: { id: 415, name: 'No Attack', base_en: 0.875 } },
    ]);
    expect(picked?.part.id).toBe(415);
  });
});

describe('toEmpoweredAutoMechanicPart', () => {
  it('builds a flat option-level-0 auto mechanic row', () => {
    expect(toEmpoweredAutoMechanicPart({ id: 7, name: 'Add Weapon to Technique' })).toEqual({
      id: 7,
      name: 'Add Weapon to Technique',
      op_1_lvl: 0,
      op_2_lvl: 0,
      op_3_lvl: 0,
      applyDuration: false,
    });
  });
});
