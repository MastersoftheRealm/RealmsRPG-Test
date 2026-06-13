/**
 * Profile Picture Upload API
 * ==========================
 * Upload user profile picture to Supabase Storage.
 * Path: profile-pictures/{userId}.{ext}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { getRolePolicyForUser } from '@/lib/role-policy';
import { detectImageMime, extensionForImageMime } from '@/lib/validate-image';
import { buildRateLimitKey, resolveClientIp, uploadLimiter } from '@/lib/rate-limit';

const BUCKET = 'profile-pictures';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = buildRateLimitKey('upload-profile-picture', {
    userId: user.uid,
    ip: resolveClientIp(request.headers),
  });
  const { success } = uploadLimiter.check(key);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const supabase = await createClient();
  const rolePolicy = await getRolePolicyForUser(user.uid, supabase);
  if (!rolePolicy.canUploadProfilePicture) {
    return NextResponse.json({ error: 'Your role cannot upload profile pictures.' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'File required' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Must be an image file' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
  }

  // Derive the extension from the detected content type, not the client
  // filename/MIME (TASK-331). detectImageMime also doubles as the magic-byte check.
  const detectedMime = await detectImageMime(file);
  if (!detectedMime) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
  }
  const ext = extensionForImageMime(detectedMime);
  const path = `${user.uid}.${ext}`;

  try {
    const { data: existing } = await supabase.storage.from(BUCKET).list('', { limit: 100 });
    if (existing?.length) {
      const toRemove = existing
        .filter((f) => f.name?.startsWith(`${user.uid}.`))
        .map((f) => f.name);
      if (toRemove.length) {
        await supabase.storage.from(BUCKET).remove(toRemove);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: detectedMime });

    if (uploadError) {
      console.error('Profile picture upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // Do NOT set created_at here: upsert would clobber the original signup
    // timestamp on every upload (TASK-331). created_at is set on first insert
    // (DB default / ensureUserProfile); we only touch photo_url + updated_at.
    await supabase.from('user_profiles').upsert(
      { id: user.uid, photo_url: publicUrl, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[API Error] POST /api/upload/profile-picture:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
