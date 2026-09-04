/**
 * Persist a finished creator payload to the account API or guest localStorage (ADR-0026).
 */

import { createCharacter, saveCharacter } from '@/services/character-service';
import { createGuestCharacter } from '@/lib/guest-character-storage';
import { PORTRAIT_SAVE_UPLOAD_FALLBACK, uploadCharacterPortraitFromDataUrl } from '@/lib/portrait';
import { getErrorMessage } from '@/lib/api-client';
import type { Character } from '@/types';

export type PersistFinishedCharacterResult = {
  id: string;
  mode: 'local' | 'account';
  portraitWarning?: string | undefined;
};

export async function persistFinishedCharacter(input: {
  lean: Partial<Character>;
  portraitDataUrl?: string | null | undefined;
  clientRequestId?: string | undefined;
  userId?: string | null | undefined;
}): Promise<PersistFinishedCharacterResult> {
  const portraitDataUrl =
    input.portraitDataUrl && input.portraitDataUrl.startsWith('data:')
      ? input.portraitDataUrl
      : null;

  if (!input.userId) {
    const id = createGuestCharacter({
      ...input.lean,
      ...(portraitDataUrl ? { portrait: portraitDataUrl } : {}),
      visibility: 'private',
    });
    return { id, mode: 'local' };
  }

  const leanForApi = { ...input.lean };
  if (portraitDataUrl) {
    delete leanForApi.portrait;
  }

  const id = await createCharacter(
    { ...leanForApi, userId: input.userId },
    { ...(input.clientRequestId ? { clientRequestId: input.clientRequestId } : {}) },
  );
  if (!id?.trim()) {
    throw new Error('Character was created but no id was returned');
  }

  let portraitWarning: string | undefined;
  if (portraitDataUrl) {
    try {
      const { url } = await uploadCharacterPortraitFromDataUrl(id, portraitDataUrl);
      await saveCharacter(id, { portrait: url });
    } catch (err) {
      portraitWarning = getErrorMessage(err, PORTRAIT_SAVE_UPLOAD_FALLBACK);
    }
  }

  return { id, mode: 'account', ...(portraitWarning ? { portraitWarning } : {}) };
}
