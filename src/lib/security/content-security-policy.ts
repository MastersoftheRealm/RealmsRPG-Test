/**
 * Content-Security-Policy for every response.
 *
 * Hosted Supabase realtime (createBrowserClient) uses wss://*.supabase.co.
 * The Vercel toolbar websocket is wss://ws-us3.pusher.com.
 * next dev, and a local http Supabase URL, use ws://localhost or ws://127.0.0.1.
 */

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
] as const;

const DEV_WEBSOCKET_SRC = ['ws://localhost:*', 'ws://127.0.0.1:*'] as const;

export function buildContentSecurityPolicy(nodeEnv: string): string {
  const connectSrc: string[] = [...CONNECT_SRC];
  if (nodeEnv === 'development') {
    connectSrc.push(...DEV_WEBSOCKET_SRC);
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    // Vercel Toolbar / Live feedback (preview & production) loads from vercel.live.
    // Web Analytics: production script is same-origin (/_vercel/insights/*); local/dev
    // debug script loads from va.vercel-scripts.com (see DEPLOYMENT_AND_SECRETS_SUPABASE).
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    // Sentry browser SDK posts envelopes to regional ingest hosts
    // (e.g. o<id>.ingest.us.sentry.io). CSP `*` matches one label only.
    // Toolbar comments use wss://ws-us3.pusher.com (not wss://*.vercel.live).
    `connect-src ${connectSrc.join(' ')}`,
    // Vercel Live feedback iframe (preview toolbar)
    "frame-src 'self' https://vercel.live",
  ].join('; ');
}
