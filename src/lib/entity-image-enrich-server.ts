/**
 * Server-only: resolve bank public_url for entity rows with image_id but no cache.
 * Mutates rows in place (sets image_url when cache absent). Safe no-op when column missing.
 */

import { readRecordImageId, readRecordImageUrl } from '@/lib/entity-image-url';
import type { TypedSupabaseClient } from '@/lib/supabase/database';

export async function enrichRowsWithBankImageUrls(
  supabase: TypedSupabaseClient,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (rows.length === 0) return;

  const imageIds = new Set<string>();
  for (const row of rows) {
    if (readRecordImageUrl(row)) continue;
    const imageId = readRecordImageId(row);
    if (imageId) imageIds.add(imageId);
  }
  if (imageIds.size === 0) return;

  const { data, error } = await supabase
    .from('realms_images')
    .select('id, public_url')
    .in('id', [...imageIds]);

  if (error) {
    if (/does not exist|Could not find|PGRST204/i.test(error.message ?? '')) return;
    console.warn('[entity-image-enrich] realms_images lookup failed:', error.message);
    return;
  }

  const urlById = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.id && typeof row.public_url === 'string' && row.public_url.trim()) {
      urlById.set(String(row.id), row.public_url.trim());
    }
  }

  for (const row of rows) {
    if (readRecordImageUrl(row)) continue;
    const imageId = readRecordImageId(row);
    if (!imageId) continue;
    const bankUrl = urlById.get(imageId);
    if (bankUrl) row.image_url = bankUrl;
  }
}
