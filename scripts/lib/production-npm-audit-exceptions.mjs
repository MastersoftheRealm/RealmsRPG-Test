/**
 * Temporary GHSA allowlist for `npm run audit:production` only.
 * npm has no first-party `auditConfig.ignoreGhsas`; this file is the gate's allowlist.
 *
 * Remove each entry when the registry ships a fix (then `npm audit --omit=dev` is clean
 * without the allowlist).
 */
export const PRODUCTION_AUDIT_GHSA_EXCEPTIONS = [
  {
    ghsa: 'GHSA-FC5Q-39XC-VJPF',
    expires: '2027-06-01',
    advisoryUrl: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
    /**
     * Production path (build-time only): @sentry/nextjs → @rollup/plugin-commonjs → picomatch.
     * Sentry's Next.js SDK uses Rollup inside webpack bundling (@sentry/nextjs wrappingLoader),
     * not for matching attacker-controlled globs at runtime. npm registry still stops at
     * picomatch 4.0.7; delete this exception once picomatch >= 4.0.8 resolves in the lockfile.
     */
  },
];
