'use client';

import { CreatorPortraitUpload } from '@/components/patterns';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const copy = GUIDED_CREATOR_COPY.steps.reveal.portrait;

export interface GuidedPortraitUploadProps {
  className?: string;
}

/** Guided reveal portrait — wires guided store to shared CreatorPortraitUpload. */
export function GuidedPortraitUpload({ className }: GuidedPortraitUploadProps) {
  const { draft, updateDraft } = useGuidedCreatorStore();

  return (
    <CreatorPortraitUpload
      variant="reveal"
      className={className}
      portraitUrl={draft.portraitUrl}
      onPortraitChange={(url) => updateDraft({ portraitUrl: url })}
      onPortraitRemove={() => updateDraft({ portraitUrl: null })}
      labels={{
        emptyHint: copy.emptyHint,
        modalTitle: copy.modalTitle,
        removeLabel: copy.removeLabel,
        changeAria: copy.changeAria,
        tooLarge: copy.tooLarge,
        processError: copy.processError,
      }}
    />
  );
}
