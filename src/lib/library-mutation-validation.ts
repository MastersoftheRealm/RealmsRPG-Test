import { NextResponse } from 'next/server';
import type { ColumnarLibraryType } from '@/lib/library-persisted-contract';
import {
  isColumnarLibraryTypeName,
  persistedLibraryBodyShapeError,
  persistedSpeciesBodyShapeError,
  unknownPersistedLibraryKeys,
  unknownPersistedSpeciesKeys,
} from '@/lib/library-persisted-contract';
import { applyUserLibraryImageWritePolicy } from '@/lib/library-image-write';

export type LibraryWriteValidationMode = 'create' | 'patch';

export function validateUserLibraryWriteBody(
  type: string,
  body: Record<string, unknown>,
  options?: {
    allowImageUrl?: boolean | undefined;
    mode?: LibraryWriteValidationMode | undefined;
  },
): NextResponse | null {
  const reject = (message: string) => NextResponse.json({ error: message }, { status: 400 });

  if (isColumnarLibraryTypeName(type)) {
    const unknown = unknownPersistedLibraryKeys(type as ColumnarLibraryType, body);
    if (unknown.length > 0) {
      return reject('Payload contains unsupported fields');
    }
    const shapeError = persistedLibraryBodyShapeError(type as ColumnarLibraryType, body);
    if (shapeError) return reject(shapeError);
  } else if (type === 'species') {
    const unknown = unknownPersistedSpeciesKeys(body);
    if (unknown.length > 0) {
      return reject('Payload contains unsupported fields');
    }
    const shapeError = persistedSpeciesBodyShapeError(body);
    if (shapeError) return reject(shapeError);
  }

  if (!options?.allowImageUrl) {
    const imageError = applyUserLibraryImageWritePolicy(body);
    if (imageError) return reject(imageError);
  }
  return null;
}
