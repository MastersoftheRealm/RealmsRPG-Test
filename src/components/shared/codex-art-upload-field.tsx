'use client';

/**
 * CodexArtUploadField — admin-only card art upload with crop (TASK-405).
 * Reuses ImageUploadModal; uploads to codex-art bucket when entityId is known.
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, Spinner } from '@/components/ui';
import { ImageUploadModal } from '@/components/shared';
import {
  uploadCodexArt,
  type CodexArtEntityType,
} from '@/lib/codex-art';

export interface CodexArtUploadFieldProps {
  entityType: CodexArtEntityType;
  /** Required for immediate upload; omit on new records until first save. */
  entityId?: string | null;
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
  /** Staged blob when entityId is not yet available (new species). */
  onPendingBlobChange?: (blob: Blob | null) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export function CodexArtUploadField({
  entityType,
  entityId,
  imageUrl,
  onImageUrlChange,
  onPendingBlobChange,
  label = 'Card art',
  hint = 'Square crop recommended (~1:1). Shown on guided creator choice cards.',
  className,
}: CodexArtUploadFieldProps) {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewSrc = imageUrl ?? localPreview;

  const handleCropped = useCallback(
    async (blob: Blob) => {
      setError(null);
      setIsUploading(true);
      try {
        if (entityId) {
          const { url } = await uploadCodexArt(blob, entityType, entityId);
          onImageUrlChange(url);
          onPendingBlobChange?.(null);
          if (localPreview) {
            URL.revokeObjectURL(localPreview);
            setLocalPreview(null);
          }
          setShowModal(false);
          return;
        }

        if (localPreview) URL.revokeObjectURL(localPreview);
        const objectUrl = URL.createObjectURL(blob);
        setLocalPreview(objectUrl);
        onPendingBlobChange?.(blob);
        setShowModal(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [entityId, entityType, localPreview, onImageUrlChange, onPendingBlobChange]
  );

  const handleRemove = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    onPendingBlobChange?.(null);
    onImageUrlChange(null);
    setError(null);
  };

  const canUpload = Boolean(entityId) || Boolean(onPendingBlobChange);

  return (
    <div className={cn('space-y-2', className)}>
      <div>
        <p className="font-nunito text-sm font-medium text-text-secondary">{label}</p>
        {hint && <p className="mt-0.5 font-nunito text-xs text-text-muted dark:text-text-secondary">{hint}</p>}
        {!entityId && onPendingBlobChange && (
          <p className="mt-1 font-nunito text-xs text-text-secondary">
            You can crop now; the image uploads when you save this record.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-card border border-border-light bg-surface-alt shadow-sm">
          {previewSrc ? (
            /* Native img + object-contain: exact crop pixels, no Next/Image re-crop */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="px-2 text-center font-nunito text-xs text-text-muted dark:text-text-secondary">
              No art
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={!canUpload || isUploading}
            onClick={() => setShowModal(true)}
          >
            {isUploading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Uploading…
              </>
            ) : previewSrc ? (
              'Change image'
            ) : (
              'Upload image'
            )}
          </Button>
          {previewSrc && (
            <Button type="button" variant="ghost" className="min-h-11 text-danger-700 dark:text-danger-400" onClick={handleRemove}>
              Remove image
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="font-nunito text-sm text-danger-700 dark:text-danger-400" role="alert">
          {error}
        </p>
      )}

      <ImageUploadModal
        isOpen={showModal}
        onClose={() => !isUploading && setShowModal(false)}
        onConfirm={handleCropped}
        cropShape="rect"
        aspect={1}
        title={`Upload ${label.toLowerCase()}`}
      />
    </div>
  );
}
