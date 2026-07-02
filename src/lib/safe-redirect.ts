const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password', '/forgot-username'];

/**
 * Sanitize a post-auth redirect path. Allows same-origin relative paths only.
 * Rejects protocol-relative URLs, external URLs, and embedded schemes.
 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = '/',
): string {
  if (path == null || typeof path !== 'string') return fallback;

  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  if (/^\/[^/]*:/i.test(trimmed)) return fallback;
  if (trimmed.includes('://')) return fallback;

  const pathOnly = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
  if (AUTH_ONLY_PATHS.includes(pathOnly)) return fallback;

  return trimmed;
}
