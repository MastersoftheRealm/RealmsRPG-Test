import { describe, expect, it } from 'vitest';

import adminUsersRouteSource from './route.ts?raw';
import adminUpdateRoleRouteSource from './update-role/route.ts?raw';

describe('API-015 admin users service-role client factory', () => {
  it('GET /api/admin/users does not define a private service-role factory', () => {
    expect(adminUsersRouteSource).not.toMatch(/function getSupabaseAdmin/);
    expect(adminUsersRouteSource).not.toMatch(/@supabase\/supabase-js/);
    expect(adminUsersRouteSource).toMatch(/createServiceRoleClient/);
  });

  it('PATCH /api/admin/users/update-role does not define a private service-role factory', () => {
    expect(adminUpdateRoleRouteSource).not.toMatch(/function getSupabaseAdmin/);
    expect(adminUpdateRoleRouteSource).not.toMatch(/@supabase\/supabase-js/);
    expect(adminUpdateRoleRouteSource).toMatch(/createServiceRoleClient/);
  });
});
