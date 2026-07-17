'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui';
import { ImageUploadModal, RealmsImagePicker } from '@/components/shared';
import { blobToCompressedBase64 } from '@/lib/portrait';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const copy = GUIDED_CREATOR_COPY.steps.reveal.portrait;

export interface GuidedPortraitUploadProps {
  className?: string;
}

/** Clickable hero-band portrait for guided reveal. Uses shared ImageUploadModal + portrait helpers. */
export function GuidedPortraitUpload({ className }: GuidedPortraitUploadProps) {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const [showModal, setShowModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPortrait = Boolean(draft.portraitUrl);
  const isDataUrl = draft.portraitUrl?.startsWith('data:') ?? false;

  const handleCropped = async (blob: Blob) => {
    setError(null);
    setIsProcessing(true);
    try {
      const base64 = await blobToCompressedBase64(blob);
      if (base64.length > 700 * 1024) {
        setError(copy.tooLarge);
        return;
      }
      updateDraft({ portraitUrl: base64 });
      setShowModal(false);
    } catch {
      setError(copy.processError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    updateDraft({ portraitUrl: null });
    setError(null);
  };

  const openPicker = () => {
    if (!isProcessing) setShowModal(true);
  };

  return (
    <div className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={openPicker}
        disabled={isProcessing}
        aria-label={copy.changeAria(hasPortrait)}
        className={cn(
          'group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-card border-2 bg-surface-alt shadow-sm transition-colors',
          'min-h-[96px] min-w-[96px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border',
          hasPortrait
            ? 'border-border-light hover:border-primary-outline-border'
            : 'border-dashed border-border-light hover:border-primary-outline-border hover:bg-primary-subtle-bg/40',
          isProcessing && 'cursor-wait opacity-80'
        )}
      >
        {hasPortrait && draft.portraitUrl ? (
          isDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.portraitUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image src={draft.portraitUrl} alt="" fill sizes="96px" className="object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center gap-1 p-2 text-center">
            <User className="h-8 w-8 text-text-muted dark:text-text-secondary" aria-hidden="true" />
            <span className="font-nunito text-[10px] leading-tight text-text-muted dark:text-text-secondary">
              {copy.emptyHint}
            </span>
          </div>
        )}

        <span
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center bg-text-primary/45 opacity-0 transition-opacity',
            'group-hover:opacity-100 group-focus-visible:opacity-100',
            isProcessing && 'opacity-100'
          )}
          aria-hidden="true"
        >
          {isProcessing ? (
            <Spinner size="sm" variant="white" />
          ) : (
            <Camera className="h-6 w-6 text-text-on-dark" />
          )}
        </span>
      </button>

      {hasPortrait && (
        <button
          type="button"
          onClick={handleRemove}
          aria-label={copy.removeLabel}
          className="absolute -right-2 -top-2 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-danger-button text-sm text-text-on-dark hover:bg-danger-700"
        >
          ×
        </button>
      )}

      {error && (
        <p className="mt-2 max-w-[10rem] font-nunito text-xs font-medium text-danger-700 dark:text-danger-400">
          {error}
        </p>
      )}

      <ImageUploadModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError(null);
        }}
        onConfirm={handleCropped}
        onChooseFromLibrary={() => setShowBankPicker(true)}
        cropShape="rect"
        aspect={1}
        title={copy.modalTitle}
      />
      <RealmsImagePicker
        isOpen={showBankPicker}
        onClose={() => setShowBankPicker(false)}
        onSelect={({ image }) => {
          updateDraft({ portraitUrl: image.publicUrl });
          setError(null);
        }}
        categories="portrait"
        allowAdminUpload={false}
        title="Choose Character Portrait"
        description="Pick species or creature art from the Realms Image Library."
      />
    </div>
  );
}
