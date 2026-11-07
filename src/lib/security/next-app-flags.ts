/** Shared with `next.config.ts` `poweredByHeader` (tested without reading config source). */
export const NEXT_APP_POWERED_BY_HEADER = false;

/** Signed-in `/account` visits rewrite to the my-account page (after the session gate). */
export const ACCOUNT_PATH_ALIAS_REWRITE = {
  source: '/account',
  destination: '/my-account',
} as const;
