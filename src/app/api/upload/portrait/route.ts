/**
 * Portrait Upload API
 * ===================
 * Upload character portrait to Supabase Storage.
 * Path: portraits/{userId}/{characterId}.{ext}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';

const BUCKET = 'portraits';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const characterId = formData.get('characterId') as string | null;

  if (!file || !characterId?.trim()) {
    return NextResponse.json({ error: 'File and characterId required' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Must be an image file' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
  }

  // Always use .jpg for consistency (cropped images are JPEG); removes old portrait if different extension
  const path = `${user.uid}/${characterId.trim()}.jpg`;

  try {
    const supabase = await createClient();

    // Delete any existing portrait for this character (different extensions)
    const { data: existing } = await supabase.storage.from(BUCKET).list(user.uid);
    if (existing?.length) {
      const toRemove = existing
        .filter((f) => f.name?.startsWith(`${characterId.trim()}.`))
        .map((f) => `${user.uid}/${f.name}`);
      if (toRemove.length) {
        await supabase.storage.from(BUCKET).remove(toRemove);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error('Portrait upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Portrait upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
