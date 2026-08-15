import type { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from '@/lib/site-url';

/** Paths search engines should not index. Used by `robots.ts`. */
export const ROBOTS_DISALLOW = [
  '/dev/',
  '/my-account',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/forgot-username',
  '/api/',
  '/admin',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW],
    },
    sitemap: `${getCanonicalSiteUrl()}/sitemap.xml`,
  };
}
