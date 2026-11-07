/** Matches @supabase/ssr PKCE verifier cookie (`sb-<ref>-auth-token-code-verifier`). */
const SUPABASE_PKCE_CODE_VERIFIER_COOKIE = /^sb-.+-auth-token-code-verifier$/;

export function readSupabasePkceCodeVerifier(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): string | null {
  const match = cookies.find((c) => SUPABASE_PKCE_CODE_VERIFIER_COOKIE.test(c.name));
  return match?.value ?? null;
}
