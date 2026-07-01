/**
 * Routes that use minimal app chrome (no global header/footer) for immersive flows.
 */

const MINIMAL_CHROME_PREFIXES = ['/characters/new/guided'] as const;

/** True when the pathname is an immersive funnel route (guided creator, etc.). */
export function isMinimalChromeRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return MINIMAL_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
