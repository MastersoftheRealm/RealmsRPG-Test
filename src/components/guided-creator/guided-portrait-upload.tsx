'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui';
import { ImageUploadModal } from '@/components/shared';
import { blobToCompressedBase64 } from '@/lib/portrait';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const copy = GUIDED_CREATOR_COPY.steps.reveal.portrait;

export function GuidedPortraitUpload() {
  const { draft, updateDraft } = useGuidedCreatorStore();
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <label className="block font-display text-sm font-semibold text-text-primary mb-2">
        {copy.label}
      </label>

      <div className="flex items-start gap-4">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-border-light bg-surface-alt">
          {draft.portraitUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.portraitUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={handleRemove}
                aria-label={copy.removeLabel}
                className="absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-danger-button text-sm text-white hover:bg-danger-700"
              >
                ×
              </button>
            </>
          ) : (
            <div className="p-2 text-center">
              <span className="text-3xl text-text-muted dark:text-text-secondary" aria-hidden="true">
                📷
              </span>
              <p className="mt-1 font-nunito text-xs text-text-muted dark:text-text-secondary">
                {copy.emptyHint}
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={isProcessing}
            className={cn(
              'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors',
              isProcessing
                ? 'cursor-not-allowed bg-surface-alt text-text-muted dark:text-text-secondary'
                : 'border-primary-outline-border text-primary-link-fg hover:bg-primary-subtle-bg'
            )}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" />
                {copy.processing}
              </>
            ) : (
              copy.uploadButton(draft.portraitUrl != null)
            )}
          </button>
          <p className="mt-2 font-nunito text-xs text-text-muted dark:text-text-secondary">
            {copy.hint}
          </p>
          {error && (
            <p className="mt-1 font-nunito text-xs font-medium text-danger-700 dark:text-danger-400">
              {error}
            </p>
          )}
        </div>
      </div>

      <ImageUploadModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError(null);
        }}
        onConfirm={handleCropped}
        cropShape="rect"
        aspect={1}
        title={copy.modalTitle}
      />
    </div>
  );
}
