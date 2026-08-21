import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],
  // Allow character portraits (and profile pictures) from Supabase Storage public URLs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Legacy route consolidation (handled at config level so no page module is needed):
  // - /browse was a redundant duplicate of the Library page's public (Realms) mode.
  // - /encounter-tracker was the old name for the Encounters hub.
  // - /crafting/new now opens directly from the crafting hub into /crafting/[id].
  async redirects() {
    return [
      {
        source: '/browse',
        destination: '/library',
        permanent: false,
      },
      {
        source: '/encounter-tracker',
        destination: '/encounters',
        permanent: true,
      },
      {
        source: '/crafting/new',
        destination: '/crafting',
        permanent: true,
      },
    ];
  },
  // Security headers for all responses; long cache for static images to cut edge requests (e.g. placeholder-portrait.png)
  async headers() {
    const csp = [
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
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live wss://*.vercel.live https://va.vercel-scripts.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
      // Vercel Live feedback iframe (preview toolbar)
      "frame-src 'self' https://vercel.live",
    ].join('; ');

    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx$/,
  options: {
    remarkPlugins: ['remark-gfm'],
  },
});

export default withMDX(nextConfig);
