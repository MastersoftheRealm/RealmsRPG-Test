import { describe, expect, it } from 'vitest';
import {
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  generateInviteCode,
} from '@/lib/campaign-invite-code';

describe('generateInviteCode', () => {
  it('uses length 8 and only the invite alphabet', () => {
    let n = 0;
    const code = generateInviteCode((max) => {
      n = (n + 1) % max;
      return n;
    });
    expect(code).toHaveLength(INVITE_CODE_LENGTH);
    expect([...code].every((ch) => INVITE_CODE_ALPHABET.includes(ch))).toBe(true);
  });

  it('produces distinct codes across many draws', () => {
    const seen = new Set(Array.from({ length: 24 }, () => generateInviteCode()));
    expect(seen.size).toBe(24);
  });
});
