import { describe, expect, it } from 'vitest';
import { CREATOR_NAME_MAX_LENGTH } from '@/lib/creator/creator-text-limits';
import { CAMPAIGN_ROLL_TITLE_MAX_LENGTH, formatRandomizeRollTitle } from './campaign-roll-limits';

describe('formatRandomizeRollTitle', () => {
  it('matches the API limit when power and variant names are max-length', () => {
    const title = formatRandomizeRollTitle(
      'x'.repeat(CREATOR_NAME_MAX_LENGTH),
      100,
      'y'.repeat(CREATOR_NAME_MAX_LENGTH),
    );
    expect(title.length).toBe(CAMPAIGN_ROLL_TITLE_MAX_LENGTH);
    expect(title).toBe(
      `${'x'.repeat(CREATOR_NAME_MAX_LENGTH)}: 1d100 → ${'y'.repeat(CREATOR_NAME_MAX_LENGTH)}`,
    );
  });

  it('caps titles when the variant label exceeds creator name max (oversize sheet data)', () => {
    const title = formatRandomizeRollTitle(
      'p'.repeat(CREATOR_NAME_MAX_LENGTH),
      100,
      'l'.repeat(CREATOR_NAME_MAX_LENGTH + 50),
    );
    expect(title.length).toBeLessThanOrEqual(CAMPAIGN_ROLL_TITLE_MAX_LENGTH);
    expect(title.startsWith('p'.repeat(CREATOR_NAME_MAX_LENGTH))).toBe(true);
    expect(title).toContain(': 1d100 → ');
    expect(title.length).toBe(CAMPAIGN_ROLL_TITLE_MAX_LENGTH);
  });

  it('never exceeds the API limit for smaller die sizes', () => {
    const title = formatRandomizeRollTitle('Power', 6, 'Outcome label');
    expect(title).toBe('Power: 1d6 → Outcome label');
    expect(title.length).toBeLessThanOrEqual(CAMPAIGN_ROLL_TITLE_MAX_LENGTH);
  });
});
