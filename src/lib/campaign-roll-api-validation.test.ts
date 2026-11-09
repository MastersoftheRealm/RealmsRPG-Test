import { describe, expect, it } from 'vitest';
import { campaignRollCreateSchema } from './api-validation';
import { CHARACTER_NAME_MAX_LENGTH } from './character/character-name-limit';
import { CREATOR_NAME_MAX_LENGTH } from './creator/creator-text-limits';
import {
  CAMPAIGN_ROLL_DAMAGE_TITLE_SUFFIX,
  CAMPAIGN_ROLL_TITLE_MAX_LENGTH,
} from './rolls/campaign-roll-limits';
import { ROLL_LOG_BUILDER_DICE_POOL_MAX } from './rolls/die';

function maxRandomizeCampaignRollTitle(): string {
  return `${'x'.repeat(CREATOR_NAME_MAX_LENGTH)}: 1d100 → ${'y'.repeat(CREATOR_NAME_MAX_LENGTH)}`;
}

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

  it('accepts damage title with a max-length item name plus suffix', () => {
    const title = `${'x'.repeat(CREATOR_NAME_MAX_LENGTH)}${CAMPAIGN_ROLL_DAMAGE_TITLE_SUFFIX}`;
    expect(title.length).toBeGreaterThan(CHARACTER_NAME_MAX_LENGTH);
    const result = campaignRollCreateSchema.safeParse({
      characterId: 'char-1',
      characterName: 'Hero',
      roll: { type: 'damage', title, dice: [{ type: 'd6', value: 3 }] },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a max-length Randomize title from buildRandomizeRollEntry', () => {
    const title = maxRandomizeCampaignRollTitle();
    expect(title.length).toBe(CAMPAIGN_ROLL_TITLE_MAX_LENGTH);
    const result = campaignRollCreateSchema.safeParse({
      characterId: 'char-1',
      characterName: 'Hero',
      roll: {
        type: 'custom',
        title,
        dice: [{ type: 'd20', value: 10 }],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects roll title one character over the Randomize maximum', () => {
    const result = campaignRollCreateSchema.safeParse({
      characterId: 'char-1',
      characterName: 'Hero',
      roll: {
        type: 'custom',
        title: `${maxRandomizeCampaignRollTitle()}z`,
        dice: [],
      },
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

  it('accepts a full roll-log dice pool (120 dice)', () => {
    const dice = Array.from({ length: ROLL_LOG_BUILDER_DICE_POOL_MAX }, () => ({
      type: 'd6' as const,
      value: 1,
    }));
    expect(dice.length).toBe(120);
    const result = campaignRollCreateSchema.safeParse({
      characterId: 'char-1',
      characterName: 'Hero',
      roll: { type: 'custom', title: 'Custom Roll', dice },
    });
    expect(result.success).toBe(true);
  });

  it('rejects one die over the roll-log pool maximum', () => {
    const dice = Array.from({ length: ROLL_LOG_BUILDER_DICE_POOL_MAX + 1 }, () => ({
      type: 'd6' as const,
      value: 1,
    }));
    const result = campaignRollCreateSchema.safeParse({
      characterId: 'char-1',
      characterName: 'Hero',
      roll: { type: 'custom', title: 'Custom Roll', dice },
    });
    expect(result.success).toBe(false);
  });
});
