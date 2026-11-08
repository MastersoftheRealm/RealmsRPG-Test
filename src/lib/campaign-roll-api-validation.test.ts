import { describe, expect, it } from 'vitest';
import { campaignRollCreateSchema } from './api-validation';
import { CHARACTER_NAME_MAX_LENGTH } from './character/character-name-limit';

describe('campaignRollCreateSchema (API-012 / LIB1-007)', () => {
  it('strips client total and crit fields', () => {
    const parsed = campaignRollCreateSchema.parse({
      characterId: 'char-1',
      characterName: 'Hero',
      roll: {
        type: 'skill',
        title: 'Athletics',
        dice: [{ type: 'd20', value: 10 }],
        modifier: 2,
        total: 9000,
        isCrit: true,
        isCritFail: true,
      },
    });
    expect(parsed.roll).not.toHaveProperty('total');
    expect(parsed.roll).not.toHaveProperty('isCrit');
    expect(parsed.roll).not.toHaveProperty('isCritFail');
  });

  it('rejects roll title over the shared name limit', () => {
    const long = 'x'.repeat(CHARACTER_NAME_MAX_LENGTH + 1);
    const result = campaignRollCreateSchema.safeParse({
      characterId: 'char-1',
      characterName: 'Hero',
      roll: { type: 'skill', title: long, dice: [] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects die values outside die size', () => {
    const result = campaignRollCreateSchema.safeParse({
      characterId: 'char-1',
      characterName: 'Hero',
      roll: {
        type: 'skill',
        title: 'Athletics',
        dice: [{ type: 'd20', value: 21 }],
      },
    });
    expect(result.success).toBe(false);
  });
});
