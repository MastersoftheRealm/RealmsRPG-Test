import { describe, expect, it } from 'vitest';
import { profileDisplayNameWriteValue } from '@/lib/profile-display-name';

describe('profileDisplayNameWriteValue', () => {
  it('returns undefined when the caller did not supply a display name', () => {
    expect(profileDisplayNameWriteValue(undefined)).toBeUndefined();
  });

  it('trims and clears blank values', () => {
    expect(profileDisplayNameWriteValue('  Hero  ')).toBe('Hero');
    expect(profileDisplayNameWriteValue('   ')).toBeNull();
  });
});
