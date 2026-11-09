/** @type {readonly string} */
export const PRODUCTION_SUPABASE_PROJECT_REF = 'lbqhiwudvifmkjtkccdg';

/**
 * @param {string | undefined | null} supabaseUrl
 * @returns {string | null}
 */
export function parseSupabaseProjectRef(supabaseUrl) {
  if (!supabaseUrl || typeof supabaseUrl !== 'string') return null;
  let hostname;
  try {
    hostname = new URL(supabaseUrl.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
  const hosted = hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
  if (hosted) return hosted[1];
  return null;
}

/**
 * @param {string | undefined | null} supabaseUrl
 */
export function isProductionSupabaseUrl(supabaseUrl) {
  const ref = parseSupabaseProjectRef(supabaseUrl);
  if (ref === PRODUCTION_SUPABASE_PROJECT_REF) return true;
  const trimmed = typeof supabaseUrl === 'string' ? supabaseUrl.trim().toLowerCase() : '';
  if (!trimmed) return false;
  return trimmed.includes(`${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`);
}

/**
 * @param {string | undefined | null} supabaseUrl
 * @returns {{ message: string; exitCode: number } | null}
 */
export function getE2eProvisionSupabaseUrlRejection(supabaseUrl) {
  if (!isProductionSupabaseUrl(supabaseUrl)) return null;
  return {
    message:
      'Refusing e2e:provision against the production Supabase project. Point NEXT_PUBLIC_SUPABASE_URL at a dedicated test project.',
    exitCode: 1,
  };
}
