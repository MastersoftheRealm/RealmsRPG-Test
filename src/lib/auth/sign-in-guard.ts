import { buildLoginRedirectUrl, sanitizeRedirectPath } from '@/lib/safe-redirect';

/** Client and edge sign-in redirect with the same post-auth allowlist. */
export function buildProtectedRouteLoginUrl(pathname: string, search: string): string {
  const query = search ? (search.startsWith('?') ? search : `?${search}`) : '';
  const destination = sanitizeRedirectPath(`${pathname || '/'}${query}`);
  return buildLoginRedirectUrl(destination);
}
