/**
 * Codex Art Upload API
 * ====================
 * Admin-only upload for codex card art (species, creatures, equipment, etc.).
 * Path: codex-art/{entityType}/{entityId}.jpg
 * Writes use service role after isAdmin() — no direct client storage access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validateImageMagicBytes } from '@/lib/validate-image';
import { buildRateLimitKey, resolveClientIp, uploadLimiter } from '@/lib/rate-limit';
import {
  CODEX_ART_BUCKET,
  codexArtStoragePath,
  isCodexArtEntityType,
  sanitizeCodexArtEntityId,
  type CodexArtEntityType,
} from '@/lib/codex-art';

const MAX_SIZE = 5 * 1024 * 1024;

const ENTITY_TABLE: Record<CodexArtEntityType, string> = {
  species: 'codex_species',
  creature: 'official_creatures',
  weapon: 'codex_equipment',
  armor: 'codex_equipment',
  shield: 'codex_equipment',
  power: 'official_powers',
  technique: 'official_techniques',
};

async function entityExists(
  supabase: ReturnType<typeof createServiceRoleClient>,
  entityType: CodexArtEntityType,
  entityId: string
): Promise<boolean> {
  const table = ENTITY_TABLE[entityType];
  const { data, error } = await supabase.from(table).select('id').eq('id', entityId).maybeSingle();
  if (error) {
    console.error(`[codex-art] entity lookup failed (${entityType}/${entityId}):`, error);
    return false;
  }
  return Boolean(data);
}

export async function POST(request: NextRequest) {
  const { user, error: sessionError } = await getSession();
  if (sessionError || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await isAdmin(user.uid))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const key = buildRateLimitKey('upload-codex-art', {
    userId: user.uid,
    ip: resolveClientIp(request.headers),
  });
  const { success } = uploadLimiter.check(key);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const entityTypeRaw = formData.get('entityType') as string | null;
  const entityIdRaw = formData.get('entityId') as string | null;

  if (!file || !entityTypeRaw || !entityIdRaw?.trim()) {
    return NextResponse.json({ error: 'file, entityType, and entityId required' }, { status: 400 });
  }

  if (!isCodexArtEntityType(entityTypeRaw)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
  }

  const entityType = entityTypeRaw;
  const entityId = sanitizeCodexArtEntityId(entityIdRaw.trim());
  if (!entityId) {
    return NextResponse.json({ error: 'Invalid entityId' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Must be an image file' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
  }

  const isValidImage = await validateImageMagicBytes(file);
  if (!isValidImage) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();

    const exists = await entityExists(supabase, entityType, entityId);
    if (!exists) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const path = codexArtStoragePath(entityType, entityId);

    const { error: uploadError } = await supabase.storage
      .from(CODEX_ART_BUCKET)
      .upload(path, file, { upsert: true, contentType: 'image/jpeg' });

    if (uploadError) {
      console.error('Codex art upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(CODEX_ART_BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[API Error] POST /api/upload/codex-art:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
