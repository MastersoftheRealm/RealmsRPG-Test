import { describe, expectTypeOf, it } from 'vitest';
import type { ServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

describe('createServiceRoleClient typing', () => {
  it('returns the generated Database-bound service role client', () => {
    expectTypeOf(createServiceRoleClient).returns.toEqualTypeOf<ServiceRoleSupabaseClient>();
  });
});
