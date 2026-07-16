/**
 * Codex card art — storage paths and entity types (TASK-405).
 * Admin-only uploads via /api/upload/codex-art (service role); public read URLs in DB.
 *
 * DESIGN_INTENT: Interim entity-tied upload path. Long-term art is the Realms Image Library
 * (ADR-0003 / TASK-492+): master `realms_images` row + entity `image_id`. Keep this module until
 * TASK-496/498 migrate callers; do not fork a third upload pipeline.
 */

import { apiUpload } from '@/lib/api-client';

export const CODEX_ART_BUCKET = 'codex-art';

/** Entity kinds that may have paired card art. Skills, feats, and traits are excluded. */
export const CODEX_ART_ENTITY_TYPES = [
  'species',
  'creature',
  'weapon',
  'armor',
  'shield',
  'power',
  'technique',
] as const;

export type CodexArtEntityType = (typeof CODEX_ART_ENTITY_TYPES)[number];

/** Expected art coverage by entity type (product policy — REALMS §5.0.3). */
export const CODEX_ART_COVERAGE: Record<CodexArtEntityType, 'high' | 'some' | 'low'> = {
  species: 'high',
  creature: 'high',
  weapon: 'some',
  armor: 'low',
  shield: 'low',
  power: 'low',
  technique: 'low',
};

export function isCodexArtEntityType(value: string): value is CodexArtEntityType {
  return (CODEX_ART_ENTITY_TYPES as readonly string[]).includes(value);
}

export function sanitizeCodexArtEntityId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 150);
}

export function codexArtStoragePath(entityType: CodexArtEntityType, entityId: string): string {
  return `${entityType}/${sanitizeCodexArtEntityId(entityId)}.jpg`;
}

/** Map armament library type to codex-art entity folder (weapon | armor | shield). */
export function armamentTypeToArtEntity(type: string): Extract<CodexArtEntityType, 'weapon' | 'armor' | 'shield'> | null {
  const t = type.toLowerCase();
  if (t === 'weapon' || t === 'armor' || t === 'shield') return t;
  return null;
}

export interface UploadCodexArtResult {
  url: string;
}

/** Upload cropped card art (admin session required). */
export async function uploadCodexArt(
  blob: Blob,
  entityType: CodexArtEntityType,
  entityId: string
): Promise<UploadCodexArtResult> {
  const formData = new FormData();
  formData.append('file', blob, 'card-art.jpg');
  formData.append('entityType', entityType);
  formData.append('entityId', entityId);

  // DESIGN_INTENT: use apiUpload — same error surface as portrait/profile uploads.
  const json = await apiUpload<{ url: string }>('/api/upload/codex-art', formData);
  const base = json.url.split('?')[0];
  return { url: `${base}?v=${Date.now()}` };
}
