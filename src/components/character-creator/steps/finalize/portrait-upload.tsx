'use client';

import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { CreatorPortraitUpload } from '@/components/character-creator/creator-portrait-upload';

/** Advanced finalize portrait — wires creator store to shared CreatorPortraitUpload. */
export function PortraitUpload() {
  const { draft, updateDraft } = useCharacterCreatorStore();

  return (
    <CreatorPortraitUpload
      variant="finalize"
      portraitUrl={draft.portrait}
      onPortraitChange={(url) => updateDraft({ portrait: url })}
      onPortraitRemove={() => updateDraft({ portrait: undefined })}
    />
  );
}
