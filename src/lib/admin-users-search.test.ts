import { describe, expect, it } from 'vitest';
import {
  buildAdminUsersIlikePattern,
  buildAdminUsersOrFilter,
  profileMatchesAdminUserSearch,
  rolesMatchingAdminUserSearchQuery,
} from './admin-users-search';

describe('admin-users-search', () => {
  it('quotes commas and parens in ilike patterns', () => {
    expect(buildAdminUsersIlikePattern('Doe, Jane')).toBe('"%Doe, Jane%"');
    expect(buildAdminUsersIlikePattern('a"b')).toBe('"%a\\"b%"');
    expect(buildAdminUsersIlikePattern('(test)')).toBe('"%(test)%"');
  });

  it('matches role labels and user id via shared helpers', () => {
    expect(rolesMatchingAdminUserSearchQuery('play')).toEqual(['new_player', 'playtester']);
    expect(rolesMatchingAdminUserSearchQuery('new player')).toEqual(['new_player']);
    expect(
      profileMatchesAdminUserSearch(
        {
          id: 'uid-abc-123',
          username: 'x',
          username_display: 'x',
          email: null,
          display_name: null,
          role: 'developer',
        },
        'Developer',
      ),
    ).toBe(true);
    expect(
      profileMatchesAdminUserSearch(
        {
          id: 'uid-abc-123',
          username: 'x',
          username_display: 'x',
          email: null,
          display_name: null,
          role: 'new_player',
        },
        'uid-abc',
      ),
    ).toBe(true);
    expect(
      profileMatchesAdminUserSearch(
        {
          id: 'user-1',
          username: 'x',
          username_display: 'x',
          email: 'matcher@example.com',
          display_name: null,
          role: 'new_player',
        },
        'matcher@',
      ),
    ).toBe(true);
  });

  it('buildAdminUsersOrFilter quotes literals and includes role.in when labels match', () => {
    const filter = buildAdminUsersOrFilter('Doe, Jane');
    expect(filter).toContain('display_name.ilike."%Doe, Jane%"');
    expect(filter).not.toMatch(/display_name\.ilike\.%Doe, Jane%/);
    expect(filter).toContain('email.ilike."%Doe, Jane%"');

    const roleFilter = buildAdminUsersOrFilter('admin');
    expect(roleFilter).toContain('role.in.(admin)');
    expect(roleFilter).toContain('id.ilike.');
  });
});
