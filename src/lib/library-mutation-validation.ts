import { NextResponse } from 'next/server';
import type { ColumnarLibraryType } from '@/lib/library-write-keys';
import {
  isColumnarLibraryTypeName,
  unknownLibraryBodyKeys,
  unknownSpeciesBodyKeys,
} from '@/lib/library-write-keys';
import { applyUserLibraryImageWritePolicy } from '@/lib/library-image-write';

export function validateUserLibraryWriteBody(
  type: string,
  body: Record<string, unknown>,
  options?: { allowImageUrl?: boolean | undefined },
): NextResponse | null {
  const reject = (message: string) => NextResponse.json({ error: message }, { status: 400 });

  if (isColumnarLibraryTypeName(type)) {
    const unknown = unknownLibraryBodyKeys(type as ColumnarLibraryType, body);
    if (unknown.length > 0) {
      return reject('Payload contains unsupported fields');
    }
  } else if (type === 'species') {
    const unknown = unknownSpeciesBodyKeys(body);
    if (unknown.length > 0) {
      return reject('Payload contains unsupported fields');
    }
  }

  if (!options?.allowImageUrl) {
    const imageError = applyUserLibraryImageWritePolicy(body);
    if (imageError) return reject(imageError);
  }
  return null;
}
