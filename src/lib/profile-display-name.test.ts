import { describe, expect, it } from 'vitest';
import {
  PROFILE_DISPLAY_NAME_MAX_LENGTH,
  profileDisplayNameWriteValue,
  validateProfileDisplayName,
} from '@/lib/profile-display-name';

describe('profileDisplayNameWriteValue', () => {
  it('returns undefined when the caller did not supply a display name', () => {
    expect(profileDisplayNameWriteValue(undefined)).toBeUndefined();
  });

  it('trims and clears blank values', () => {
    expect(profileDisplayNameWriteValue('  Hero  ')).toBe('Hero');
    expect(profileDisplayNameWriteValue('   ')).toBeNull();
  });
});

describe('validateProfileDisplayName', () => {
  it('accepts a normal display name', () => {
    expect(validateProfileDisplayName('  Hero  ')).toEqual({ ok: true });
  });

  it('rejects names that exceed the max length', () => {
    const long = 'a'.repeat(PROFILE_DISPLAY_NAME_MAX_LENGTH + 1);
    expect(validateProfileDisplayName(long).ok).toBe(false);
  });

  it('rejects control characters', () => {
    expect(validateProfileDisplayName('He\x00ro').ok).toBe(false);
  });
});
