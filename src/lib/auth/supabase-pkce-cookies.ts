const BASE64_PREFIX = 'base64-';
const CODE_VERIFIER_KEY_RE = /^(sb-.+-auth-token-code-verifier)(?:\.(?:0|[1-9][0-9]*))?$/;

function supabaseProjectRefFromUrl(supabaseUrl: string | undefined): string | null {
  if (!supabaseUrl?.trim()) return null;
  try {
    return new URL(supabaseUrl.trim()).hostname.split('.')[0] || null;
  } catch {
    return null;
  }
}

export function supabasePkceCodeVerifierCookieKey(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string | null {
  const ref = supabaseProjectRefFromUrl(supabaseUrl);
  if (!ref) return null;
  return `sb-${ref}-auth-token-code-verifier`;
}

function decodeSupabaseSsrCookieValue(stored: string): string {
  if (stored.startsWith(BASE64_PREFIX)) {
    return Buffer.from(stored.slice(BASE64_PREFIX.length), 'base64url').toString('utf8');
  }
  return stored;
}

function combineChunkedCookieValue(
  cookies: ReadonlyArray<{ name: string; value: string }>,
  key: string,
): string | null {
  const direct = cookies.find((c) => c.name === key)?.value;
  if (direct !== undefined && direct !== '') {
    return direct;
  }
  const chunks: string[] = [];
  for (let i = 0; ; i += 1) {
    const chunkName = `${key}.${i}`;
    const chunk = cookies.find((c) => c.name === chunkName)?.value;
    if (chunk === undefined) {
      break;
    }
    chunks.push(chunk);
  }
  if (chunks.length > 0) {
    return chunks.join('');
  }
  return direct ?? null;
}

function codeVerifierBaseKeysWithData(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): string[] {
  const bases = new Set<string>();
  for (const cookie of cookies) {
    const match = cookie.name.match(CODE_VERIFIER_KEY_RE);
    if (match?.[1] && cookie.value !== '') {
      bases.add(match[1]);
    }
  }
  return [...bases];
}

/**
 * Reads the PKCE code verifier for the configured Supabase project only.
 * Returns null when missing, ambiguous (multiple projects), or wrong project.
 */
export function readSupabasePkceCodeVerifier(
  cookies: ReadonlyArray<{ name: string; value: string }>,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string | null {
  const expectedKey = supabasePkceCodeVerifierCookieKey(supabaseUrl);
  if (!expectedKey) return null;

  const populatedKeys = codeVerifierBaseKeysWithData(cookies);
  if (populatedKeys.length === 0) return null;
  if (populatedKeys.length > 1) return null;
  if (populatedKeys[0] !== expectedKey) return null;

  const stored = combineChunkedCookieValue(cookies, expectedKey);
  if (!stored) return null;
  return decodeSupabaseSsrCookieValue(stored);
}
