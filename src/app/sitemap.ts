import type { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from '@/lib/site-url';

/** Public, crawlable marketing / reference routes (not auth, app, or /dev). */
export const SITEMAP_PATHS = [
  '/',
  '/about',
  '/codex',
  '/rules',
  '/resources',
  '/privacy',
  '/terms',
  '/library',
  '/characters/new',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getCanonicalSiteUrl();
  return SITEMAP_PATHS.map((path) => ({
    url: path === '/' ? `${origin}/` : `${origin}${path}`,
    changeFrequency: path === '/' || path === '/rules' || path === '/codex' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/rules' || path === '/codex' ? 0.8 : 0.5,
  }));
}
