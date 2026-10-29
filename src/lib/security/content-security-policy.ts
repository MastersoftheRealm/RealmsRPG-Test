/**
 * Content-Security-Policy for every response.
 *
 * Production script-src omits unsafe-eval. Development keeps it.
 * Hosted Supabase realtime (createBrowserClient) uses wss://*.supabase.co.
 * The Vercel toolbar websocket is wss://ws-us3.pusher.com.
 * next dev, and a local http Supabase URL, use ws://localhost or ws://127.0.0.1.
 * Cloudflare Turnstile (auth CAPTCHA when enabled): allowlisted site-wide on every
 * response (`next.config.ts` `/:path*`), not only auth routes.
 * https://developers.cloudflare.com/turnstile/reference/content-security-policy/
 */

/** Single Turnstile origin (no broader Cloudflare wildcards). */
export const TURNSTILE_CSP_ORIGIN = 'https://challenges.cloudflare.com' as const;

const CONNECT_SRC = [
  "'self'",
  'https://*.supabase.co',
  'wss://*.supabase.co',
  'https://vercel.live',
  'wss://*.vercel.live',
  'wss://ws-us3.pusher.com',
  'https://va.vercel-scripts.com',
  'https://*.sentry.io',
  'https://*.ingest.sentry.io',
  'https://*.ingest.us.sentry.io',
  TURNSTILE_CSP_ORIGIN,
] as const;

const DEV_WEBSOCKET_SRC = ['ws://localhost:*', 'ws://127.0.0.1:*'] as const;

export function buildContentSecurityPolicy(nodeEnv: string): string {
  const connectSrc: string[] = [...CONNECT_SRC];
  if (nodeEnv === 'development') {
    connectSrc.push(...DEV_WEBSOCKET_SRC);
  }

  // Production does not eval. Dev keeps unsafe-eval for React's error stacks.
  // unsafe-inline stays: a nonce would force every page to dynamic rendering.
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(nodeEnv === 'development' ? ["'unsafe-eval'"] : []),
    'https://vercel.live',
    'https://va.vercel-scripts.com',
    TURNSTILE_CSP_ORIGIN,
  ];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    // Vercel Toolbar / Live feedback (preview & production) loads from vercel.live.
    // Web Analytics: production script is same-origin (/_vercel/insights/*); local/dev
    // debug script loads from va.vercel-scripts.com (see DEPLOYMENT_AND_SECRETS_SUPABASE).
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    // Sentry browser SDK posts envelopes to regional ingest hosts
    // (e.g. o<id>.ingest.us.sentry.io). CSP `*` matches one label only.
    // Toolbar comments use wss://ws-us3.pusher.com (not wss://*.vercel.live).
    `connect-src ${connectSrc.join(' ')}`,
    // Vercel Live feedback iframe (preview toolbar); Turnstile challenge iframe
    `frame-src 'self' https://vercel.live ${TURNSTILE_CSP_ORIGIN}`,
  ].join('; ');
}
