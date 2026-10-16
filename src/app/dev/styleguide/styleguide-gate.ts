import { isProductionIndexingEnabled } from '@/lib/site-url';

/** Local and preview only; Vercel production returns 404 from the layout. */
export function isStyleguideServed(): boolean {
  return !isProductionIndexingEnabled();
}
