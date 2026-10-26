import type { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from '@/lib/site-url';

/** Paths search engines should not index. Used by `robots.ts`. */
export const ROBOTS_DISALLOW = [
  '/dev/',
  '/my-account',
  '/login',
  '/register',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/',
  '/admin',
  // Legacy aliases in `next.config.ts` `redirects()` — crawl the destination URLs instead.
  '/browse',
  '/encounter-tracker',
  '/crafting/new',
  '/characters/new/advanced',
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
