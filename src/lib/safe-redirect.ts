const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password'];

/**
 * Sanitize a post-auth redirect path. Allows same-origin relative paths only.
 * Rejects protocol-relative URLs, external URLs, and embedded schemes.
 */
const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/;

export function sanitizeRedirectPath(path: string | null | undefined, fallback = '/'): string {
  if (path == null || typeof path !== 'string') return fallback;

  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }
  if (decoded.includes('\\') || /%5[cC]/.test(trimmed)) return fallback;
  if (CONTROL_CHAR_RE.test(trimmed)) return fallback;
  if (/^\/[^/]*:/i.test(trimmed)) return fallback;
  if (trimmed.includes('://')) return fallback;

  const pathOnly = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
  if (AUTH_ONLY_PATHS.includes(pathOnly)) return fallback;

  const siteOrigin = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000').origin;
    } catch {
      return 'http://localhost:3000';
    }
  })();
  try {
    const resolved = new URL(trimmed, siteOrigin);
    if (resolved.origin !== siteOrigin) return fallback;
  } catch {
    return fallback;
  }

  return trimmed;
}
