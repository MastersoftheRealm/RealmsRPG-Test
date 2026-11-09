import { describe, expect, it } from 'vitest';
import { shouldApplyAdminUsersSearchChange } from './admin-users-search-applied';

describe('shouldApplyAdminUsersSearchChange', () => {
  it('skips no-op transitions (mount and unchanged debounced input)', () => {
    expect(shouldApplyAdminUsersSearchChange('', '')).toBe(false);
    expect(shouldApplyAdminUsersSearchChange('alice', 'alice')).toBe(false);
  });

  it('commits when the query actually changes', () => {
    expect(shouldApplyAdminUsersSearchChange('', 'alice')).toBe(true);
    expect(shouldApplyAdminUsersSearchChange('alice', 'bob')).toBe(true);
  });
});
