import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_SUPABASE_PROJECT_REF,
  getE2eProvisionSupabaseUrlRejection,
  isProductionSupabaseUrl,
  parseSupabaseProjectRef,
} from './lib/supabase-production-url.mjs';

const productionUrl = `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`;

describe('e2e provision Supabase URL guard (CONFIG-015)', () => {
  it('parses hosted project refs', () => {
    expect(parseSupabaseProjectRef('https://e2etestonly.supabase.co')).toBe('e2etestonly');
    expect(parseSupabaseProjectRef('not-a-url')).toBeNull();
  });

  it('refuses the production project URL', () => {
    expect(isProductionSupabaseUrl(productionUrl)).toBe(true);
    const rejection = getE2eProvisionSupabaseUrlRejection(productionUrl);
    expect(rejection).not.toBeNull();
    expect(rejection?.exitCode).toBe(1);
    expect(rejection?.message).toMatch(/Refusing e2e:provision/i);
  });

  it('fails if the production URL would be accepted (regression guard)', () => {
    if (!isProductionSupabaseUrl(productionUrl)) {
      throw new Error(
        'Production Supabase URL would be accepted by e2e:provision — CONFIG-015 guard missing or wrong ref',
      );
    }
  });

  it('allows non-production hosted and local Supabase URLs', () => {
    expect(getE2eProvisionSupabaseUrlRejection('https://e2etestonly.supabase.co')).toBeNull();
    expect(getE2eProvisionSupabaseUrlRejection('http://127.0.0.1:54321')).toBeNull();
    expect(isProductionSupabaseUrl('https://e2etestonly.supabase.co')).toBe(false);
  });
});
