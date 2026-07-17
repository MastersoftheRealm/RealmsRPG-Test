/**
 * Realms Image Library — catalog helpers (TASK-492 / ADR-0003).
 * Master assets live in `realms_images` + `realms_image_categories`; Storage under
 * `codex-art/library/{id}.{ext}`. Client uploads go through apiUpload only.
 *
 * DESIGN_INTENT: One shared bank. Entity-tied /api/upload/codex-art remains until
 * TASK-496/498 migrate callers — do not fork a third upload pipeline.
 */

import { apiFetch, apiUpload } from '@/lib/api-client';

/** Same bucket as interim entity-tied art; bank paths use `library/` prefix. */
export const REALMS_IMAGES_BUCKET = 'codex-art';

export const REALMS_IMAGE_CATEGORIES = [
  'species',
  'creature',
  'weapon',
  'armor',
  'shield',
  'equipment',
  'power',
  'technique',
] as const;

export type RealmsImageCategory = (typeof REALMS_IMAGE_CATEGORIES)[number];

/** Select/filter options for category tags (admin UI, picker). */
export const REALMS_IMAGE_CATEGORY_OPTIONS: { value: RealmsImageCategory; label: string }[] =
  REALMS_IMAGE_CATEGORIES.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }));

export function formatRealmsImageCategoryLabels(categories: RealmsImageCategory[]): string {
  if (categories.length === 0) return '—';
  return categories
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join(', ');
}

export interface RealmsImage {
  id: string;
  name: string;
  categories: RealmsImageCategory[];
  storagePath: string;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface RealmsImageUsageRef {
  table: string;
  id: string;
  name: string | null;
  entityKind: string;
}

export interface RealmsImageUsageReport {
  imageId: string;
  usages: RealmsImageUsageRef[];
}

export function isRealmsImageCategory(value: string): value is RealmsImageCategory {
  return (REALMS_IMAGE_CATEGORIES as readonly string[]).includes(value);
}

/** Picker filter contexts beyond a single locked category tag. */
export type RealmsImagePickerFilter =
  | RealmsImageCategory
  | RealmsImageCategory[]
  | 'empowered-technique'
  | 'portrait';

/** Normalize picker `categories` prop to API OR-filter array (ADR-0003). */
export function resolveRealmsImagePickerCategories(
  filter: RealmsImagePickerFilter
): RealmsImageCategory[] {
  if (filter === 'empowered-technique') return ['power', 'technique'];
  if (filter === 'portrait') return ['species', 'creature'];
  if (Array.isArray(filter)) return filter;
  return [filter];
}

/** Parse categories from FormData JSON array or comma-separated string. Null = invalid token. */
export function parseRealmsImageCategories(raw: unknown): RealmsImageCategory[] | null {
  if (raw == null) return [];
  let parts: string[];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (!Array.isArray(parsed)) return null;
        parts = parsed.map((v) => String(v).trim()).filter(Boolean);
      } catch {
        return null;
      }
    } else {
      parts = trimmed.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(raw)) {
    parts = raw.map((v) => String(v).trim()).filter(Boolean);
  } else {
    return null;
  }

  const out: RealmsImageCategory[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!isRealmsImageCategory(key)) return null;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function realmsImageStoragePath(imageId: string, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  return `library/${imageId}.${safeExt}`;
}

/** Cache-bust public URL for replace-everywhere consumers. */
export function withCacheBust(publicUrl: string, version = Date.now()): string {
  const base = publicUrl.split('?')[0];
  return `${base}?v=${version}`;
}

export async function listRealmsImages(opts?: {
  category?: RealmsImageCategory | RealmsImageCategory[];
  q?: string;
}): Promise<RealmsImage[]> {
  const params = new URLSearchParams();
  if (opts?.category) {
    const cats = Array.isArray(opts.category) ? opts.category : [opts.category];
    params.set('category', cats.join(','));
  }
  if (opts?.q?.trim()) params.set('q', opts.q.trim());
  const qs = params.toString();
  const data = await apiFetch<{ images: RealmsImage[] }>(`/api/images${qs ? `?${qs}` : ''}`);
  return data.images;
}

export async function getRealmsImage(id: string): Promise<RealmsImage> {
  return apiFetch<RealmsImage>(`/api/images/${encodeURIComponent(id)}`);
}

export async function getRealmsImageUsage(id: string): Promise<RealmsImageUsageReport> {
  return apiFetch<RealmsImageUsageReport>(`/api/images/${encodeURIComponent(id)}/usage`);
}

export interface CreateRealmsImageInput {
  file: Blob;
  name: string;
  categories: RealmsImageCategory[];
  fileName?: string;
}

/** Admin-only create (multipart via apiUpload). */
export async function createRealmsImage(input: CreateRealmsImageInput): Promise<RealmsImage> {
  const formData = new FormData();
  formData.append('file', input.file, input.fileName ?? 'card-art.jpg');
  formData.append('name', input.name);
  formData.append('categories', JSON.stringify(input.categories));
  return apiUpload<RealmsImage>('/api/images', formData);
}

export async function updateRealmsImage(
  id: string,
  patch: { name?: string; categories?: RealmsImageCategory[] }
): Promise<RealmsImage> {
  return apiFetch<RealmsImage>(`/api/images/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Admin-only replace master file (multipart via apiUpload). */
export async function replaceRealmsImageFile(
  id: string,
  file: Blob,
  fileName = 'card-art.jpg'
): Promise<RealmsImage> {
  const formData = new FormData();
  formData.append('file', file, fileName);
  return apiUpload<RealmsImage>(`/api/images/${encodeURIComponent(id)}/replace`, formData);
}

export async function deleteRealmsImage(id: string): Promise<void> {
  await apiFetch<void>(`/api/images/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
