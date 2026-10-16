/**
 * Profile Picture Upload API
 * ==========================
 * Upload user profile picture to Supabase Storage.
 * Path: profile-pictures/{userId}.{ext}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { getRolePolicyForUser } from '@/lib/role-policy';
import { detectImageMime, extensionForImageMime } from '@/lib/validate-image';
import { buildRateLimitKey, resolveClientIp, uploadLimiter } from '@/lib/rate-limit';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import { verifyMutationRequest } from '@/lib/api-validation';

const BUCKET = 'profile-pictures';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Object name in `profile-pictures` when `photoUrl` is an uploaded file for `userId`. */
export function profilePictureStorageObjectName(
  photoUrl: string | null | undefined,
  userId: string,
): string | null {
  if (!photoUrl?.trim() || !userId) return null;
  try {
    const url = new URL(photoUrl.split('?')[0] ?? photoUrl);
    const marker = `/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    const name = decodeURIComponent(url.pathname.slice(idx + marker.length));
    if (!name.startsWith(`${userId}.`)) return null;
    return name;
  } catch {
    return null;
  }
}

async function removeUploadedProfilePictureObjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  photoUrl: string | null | undefined,
) {
  const explicitName = profilePictureStorageObjectName(photoUrl, userId);
  const toRemove: string[] = explicitName ? [explicitName] : [];

  const { data: existing, error: listError } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 100 });
  if (listError) {
    logApiError('profile-picture storage list', listError);
  } else if (existing?.length) {
    for (const file of existing) {
      if (file.name?.startsWith(`${userId}.`) && !toRemove.includes(file.name)) {
        toRemove.push(file.name);
      }
    }
  }

  if (!toRemove.length) return;

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(toRemove);
  if (removeError) {
    logApiError('profile-picture storage remove', removeError);
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = verifyMutationRequest(request);
  if (denied) return denied;

  const key = buildRateLimitKey('delete-profile-picture', {
    userId: user.uid,
    ip: resolveClientIp(request.headers),
  });
  const { success } = await uploadLimiter.check(key);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const admin = createServiceRoleClient();

  try {
    const { data: profileRow, error: readError } = await admin
      .from('user_profiles')
      .select('photo_url')
      .eq('id', user.uid)
      .maybeSingle();
    if (readError) {
      return apiErrorResponse(
        'Failed to remove profile picture',
        500,
        'DELETE /api/upload/profile-picture (profile read)',
        readError,
      );
    }

    const currentPhoto = typeof profileRow?.photo_url === 'string' ? profileRow.photo_url : null;

    await removeUploadedProfilePictureObjects(admin, user.uid, currentPhoto);

    const { error: profileError } = await admin
      .from('user_profiles')
      .update({ photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.uid);
    if (profileError) {
      return apiErrorResponse(
        'Failed to remove profile picture',
        500,
        'DELETE /api/upload/profile-picture (profile update)',
        profileError,
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logApiError('DELETE /api/upload/profile-picture', err);
    return apiErrorResponse('Failed to remove profile picture', 500);
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const denied = verifyMutationRequest(request);
  if (denied) return denied;

  const key = buildRateLimitKey('upload-profile-picture', {
    userId: user.uid,
    ip: resolveClientIp(request.headers),
  });
  const { success } = await uploadLimiter.check(key);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const supabase = await createClient();
  const rolePolicy = await getRolePolicyForUser(user.uid, supabase);
  if (!rolePolicy.canUploadProfilePicture) {
    return NextResponse.json(
      { error: 'Your role cannot upload profile pictures.' },
      { status: 403 },
    );
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
    // Cleanup only: a failure leaves an orphaned object but must not fail the upload.
    const { data: existing, error: listError } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 100 });
    if (listError) {
      logApiError('POST /api/upload/profile-picture (stale picture list)', listError);
    }
    if (existing?.length) {
      const toRemove = existing
        .filter((f) => f.name?.startsWith(`${user.uid}.`))
        .map((f) => f.name);
      if (toRemove.length) {
        const { error: removeError } = await supabase.storage.from(BUCKET).remove(toRemove);
        if (removeError) {
          logApiError('POST /api/upload/profile-picture (stale picture remove)', removeError);
        }
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: detectedMime });

    if (uploadError) {
      return apiErrorResponse(
        'Upload failed',
        500,
        'POST /api/upload/profile-picture',
        uploadError,
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // photo_url is not writable by the session client (86e3jt562). The role
    // check above already ran, and storage RLS enforces the same flag.
    // Do NOT set created_at here: upsert would clobber the original signup
    // timestamp on every upload (TASK-331).
    const { error: profileError } = await createServiceRoleClient()
      .from('user_profiles')
      .upsert(
        { id: user.uid, photo_url: publicUrl, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      );
    if (profileError) {
      return apiErrorResponse(
        'Upload failed',
        500,
        'POST /api/upload/profile-picture (profile update)',
        profileError,
      );
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    logApiError('POST /api/upload/profile-picture', err);
    return apiErrorResponse('Upload failed', 500);
  }
}
