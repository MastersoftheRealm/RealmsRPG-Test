/** Shared Next.js flags (imported from next.config.ts — tested without reading config source). */
export const NEXT_APP_DISABLE_POWERED_BY_HEADER = true;

/** Signed-in `/account` visits rewrite to the my-account page (after the session gate). */
export const ACCOUNT_PATH_ALIAS_REWRITE = {
  source: '/account',
  destination: '/my-account',
} as const;
