import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import { buildContentSecurityPolicy } from './src/lib/security/content-security-policy';

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
  // - /characters/new/advanced was the retired 9-step Legacy character creator (TASK-912).
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
      {
        source: '/characters/new/advanced',
        destination: '/characters/new',
        permanent: true,
      },
    ];
  },
  // Security headers for all responses; long cache for static images to cut edge requests (e.g. placeholder-portrait.png)
  async headers() {
    const csp = buildContentSecurityPolicy(process.env.NODE_ENV ?? 'production');

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
