/**
 * Profile Picture Upload API
 * ==========================
 * Upload user profile picture to Supabase Storage.
 * Path: profile-pictures/{userId}.{ext}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { validateImageMagicBytes } from '@/lib/validate-image';

const BUCKET = 'profile-pictures';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const isValidImage = await validateImageMagicBytes(file);
  if (!isValidImage) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.uid}.${ext}`;

  try {
    const supabase = await createClient();

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
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error('Profile picture upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

    await supabase.from('user_profiles').upsert(
      { id: user.uid, photo_url: publicUrl },
      { onConflict: 'id' }
    );

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[API Error] POST /api/upload/profile-picture:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
