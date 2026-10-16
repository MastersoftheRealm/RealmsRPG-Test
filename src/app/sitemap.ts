import type { MetadataRoute } from 'next';
import { RULEBOOK_SITEMAP_PATHS } from '@/lib/rules/rulebook';
import { getCanonicalSiteUrl } from '@/lib/site-url';

/** Public, crawlable marketing / reference routes (not auth, app, or /dev). */
const STATIC_SITEMAP_PATHS = [
  '/',
  '/about',
  '/codex',
  '/resources',
  '/privacy',
  '/terms',
  '/library',
  '/characters/new',
] as const;

/** Static routes plus published `/rules` chapter URLs from `chapters.json`. */
export const SITEMAP_PATHS = [
  ...STATIC_SITEMAP_PATHS.slice(0, 3),
  ...RULEBOOK_SITEMAP_PATHS,
  ...STATIC_SITEMAP_PATHS.slice(3),
] as readonly string[];

function isHighPriorityReferencePath(path: string): boolean {
  return path === '/rules' || path.startsWith('/rules/') || path === '/codex';
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getCanonicalSiteUrl();
  return SITEMAP_PATHS.map((path) => ({
    url: path === '/' ? `${origin}/` : `${origin}${path}`,
    changeFrequency: path === '/' || isHighPriorityReferencePath(path) ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : isHighPriorityReferencePath(path) ? 0.8 : 0.5,
  }));
}
