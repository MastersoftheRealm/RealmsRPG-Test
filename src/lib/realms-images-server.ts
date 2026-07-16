/**
 * Realms Image Library — server-only row mapping + category writes.
 */

import type { createServiceRoleClient } from '@/lib/supabase/server';
import {
  isRealmsImageCategory,
  type RealmsImage,
  type RealmsImageCategory,
} from '@/lib/realms-images';

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

export type RealmsImageRow = {
  id: string;
  name: string;
  storage_path: string;
  public_url: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  realms_image_categories?: Array<{ category: string }> | null;
};

export function mapRealmsImageRow(row: RealmsImageRow): RealmsImage {
  const categories = (row.realms_image_categories ?? [])
    .map((c) => c.category)
    .filter(isRealmsImageCategory)
    .sort();

  return {
    id: row.id,
    name: row.name,
    categories,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

export const REALMS_IMAGE_SELECT =
  'id, name, storage_path, public_url, created_at, updated_at, created_by, realms_image_categories(category)';

export async function replaceImageCategories(
  supabase: ServiceClient,
  imageId: string,
  categories: RealmsImageCategory[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: delError } = await supabase
    .from('realms_image_categories')
    .delete()
    .eq('image_id', imageId);

  if (delError) {
    return { ok: false, message: delError.message };
  }

  if (categories.length === 0) return { ok: true };

  const { error: insError } = await supabase.from('realms_image_categories').insert(
    categories.map((category) => ({ image_id: imageId, category }))
  );

  if (insError) {
    return { ok: false, message: insError.message };
  }
  return { ok: true };
}

export async function fetchRealmsImageById(
  supabase: ServiceClient,
  id: string
): Promise<RealmsImage | null> {
  const { data, error } = await supabase
    .from('realms_images')
    .select(REALMS_IMAGE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[realms-images] fetch by id failed:', error);
    return null;
  }
  if (!data) return null;
  return mapRealmsImageRow(data as RealmsImageRow);
}
