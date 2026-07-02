/**
 * Codex card art — storage paths and entity types (TASK-405).
 * Admin-only uploads via /api/upload/codex-art (service role); public read URLs in DB.
 */

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

  const res = await fetch('/api/upload/codex-art', {
    method: 'POST',
    body: formData,
  });

  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.error ?? 'Upload failed');
  }
  const base = json.url.split('?')[0];
  return { url: `${base}?v=${Date.now()}` };
}
