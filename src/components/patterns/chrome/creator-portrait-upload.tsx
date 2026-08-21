'use client';

/**
 * Shared creator portrait presenter (Advanced finalize + Guided reveal).
 * Controlled: store wiring stays in thin wrappers. Crop → compress via lib/portrait;
 * bank pick via RealmsImagePicker; crop chrome via ImageUploadModal (no forks).
 */

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Upload, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui';
import { ImageUploadModal } from './image-upload-modal';
import { RealmsImagePicker } from './realms-image-picker';
import { getErrorMessage } from '@/lib/api-client';
import {
  compressPortraitBlobForDraft,
  PORTRAIT_DRAFT_PROCESS_FALLBACK,
  PORTRAIT_DRAFT_TOO_LARGE,
} from '@/lib/portrait';

export type CreatorPortraitVariant = 'finalize' | 'reveal';

export interface CreatorPortraitUploadLabels {
  fieldLabel?: string | undefined;
  emptyHint?: string | undefined;
  modalTitle?: string | undefined;
  removeLabel?: string | undefined;
  changeAria?: ((hasPortrait: boolean) => string) | undefined;
  uploadButton?: ((hasPortrait: boolean) => string) | undefined;
  helpText?: string | undefined;
  tooLarge?: string | undefined;
  processError?: string | undefined;
  libraryTitle?: string | undefined;
  libraryDescription?: string | undefined;
}

export interface CreatorPortraitUploadProps {
  variant: CreatorPortraitVariant;
  portraitUrl: string | null | undefined;
  onPortraitChange: (url: string) => void;
  onPortraitRemove: () => void;
  className?: string | undefined;
  labels?: CreatorPortraitUploadLabels | undefined;
}

const DEFAULT_LABELS = {
  fieldLabel: 'Character Portrait (Optional)',
  emptyHint: 'No image',
  modalTitle: 'Character Portrait',
  removeLabel: 'Remove portrait',
  changeAria: (hasPortrait: boolean) =>
    hasPortrait ? 'Change character portrait' : 'Add character portrait',
  uploadButton: (hasPortrait: boolean) => (hasPortrait ? 'Change Image' : 'Upload Image'),
  helpText: 'Click to upload and crop. JPG, PNG, or GIF. Max 5MB.',
  tooLarge: PORTRAIT_DRAFT_TOO_LARGE,
  processError: PORTRAIT_DRAFT_PROCESS_FALLBACK,
  libraryTitle: 'Choose Character Portrait',
  libraryDescription: 'Pick species or creature art from the Realms Image Library.',
} as const;

type PortraitCopy = {
  fieldLabel: string;
  emptyHint: string;
  modalTitle: string;
  removeLabel: string;
  changeAria: (hasPortrait: boolean) => string;
  uploadButton: (hasPortrait: boolean) => string;
  helpText: string;
  tooLarge: string;
  processError: string;
  libraryTitle: string;
  libraryDescription: string;
};

function mergePortraitCopy(overrides?: CreatorPortraitUploadLabels): PortraitCopy {
  return {
    fieldLabel: overrides?.fieldLabel ?? DEFAULT_LABELS.fieldLabel,
    emptyHint: overrides?.emptyHint ?? DEFAULT_LABELS.emptyHint,
    modalTitle: overrides?.modalTitle ?? DEFAULT_LABELS.modalTitle,
    removeLabel: overrides?.removeLabel ?? DEFAULT_LABELS.removeLabel,
    changeAria: overrides?.changeAria ?? DEFAULT_LABELS.changeAria,
    uploadButton: overrides?.uploadButton ?? DEFAULT_LABELS.uploadButton,
    helpText: overrides?.helpText ?? DEFAULT_LABELS.helpText,
    tooLarge: overrides?.tooLarge ?? DEFAULT_LABELS.tooLarge,
    processError: overrides?.processError ?? DEFAULT_LABELS.processError,
    libraryTitle: overrides?.libraryTitle ?? DEFAULT_LABELS.libraryTitle,
    libraryDescription: overrides?.libraryDescription ?? DEFAULT_LABELS.libraryDescription,
  };
}

export function CreatorPortraitUpload({
  variant,
  portraitUrl,
  onPortraitChange,
  onPortraitRemove,
  className,
  labels,
}: CreatorPortraitUploadProps) {
  const copy = mergePortraitCopy(labels);
  const [showModal, setShowModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPortrait = Boolean(portraitUrl);
  const isDataUrl = portraitUrl?.startsWith('data:') ?? false;

  const handleCropped = async (blob: Blob) => {
    setError(null);
    setIsProcessing(true);
    try {
      const base64 = await compressPortraitBlobForDraft(blob);
      onPortraitChange(base64);
      setShowModal(false);
    } catch (err) {
      const fallback =
        err instanceof Error && err.message === PORTRAIT_DRAFT_TOO_LARGE
          ? copy.tooLarge
          : copy.processError;
      setError(getErrorMessage(err, fallback));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    onPortraitRemove();
    setError(null);
  };

  const openPicker = () => {
    if (!isProcessing) setShowModal(true);
  };

  const modals = (
    <>
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
          onPortraitChange(image.publicUrl);
          setError(null);
        }}
        categories="portrait"
        allowAdminUpload={false}
        title={copy.libraryTitle}
        description={copy.libraryDescription}
      />
    </>
  );

  if (variant === 'reveal') {
    return (
      <div className={cn('relative shrink-0', className)}>
        <button
          type="button"
          onClick={openPicker}
          disabled={isProcessing}
          aria-label={copy.changeAria(hasPortrait)}
          className={cn(
            'group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-card border-2 bg-image-matte shadow-sm transition-colors',
            'min-h-[96px] min-w-[96px] focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:outline-none',
            hasPortrait
              ? 'border-border-light hover:border-primary-outline-border'
              : 'border-dashed border-border-light hover:border-primary-outline-border hover:bg-primary-subtle-bg/40',
            isProcessing && 'cursor-wait opacity-80',
          )}
        >
          {hasPortrait && portraitUrl ? (
            isDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portraitUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <Image src={portraitUrl} alt="" fill sizes="96px" className="object-contain" />
            )
          ) : (
            <div className="flex flex-col items-center gap-1 p-2 text-center">
              <User className="h-8 w-8 text-text-muted" aria-hidden="true" />
              <span className="font-nunito text-[10px] leading-tight text-text-muted">
                {copy.emptyHint}
              </span>
            </div>
          )}

          <span
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center bg-text-primary/45 opacity-0 transition-opacity',
              'group-hover:opacity-100 group-focus-visible:opacity-100',
              isProcessing && 'opacity-100',
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
            className="absolute -top-2 -right-2 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-danger-button text-sm text-text-on-dark hover:bg-danger-700"
          >
            ×
          </button>
        )}

        {error && (
          <p className="mt-2 max-w-[10rem] font-nunito text-xs font-medium text-danger-fg">
            {error}
          </p>
        )}

        {modals}
      </div>
    );
  }

  // variant === 'finalize' — labeled preview + upload button (Advanced)
  return (
    <div className={cn('mb-6', className)}>
      <p className="mb-2 text-sm font-medium text-text-secondary">{copy.fieldLabel}</p>

      <div className="flex items-start gap-4">
        <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border-light bg-image-matte">
          {portraitUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portraitUrl}
                alt="Character portrait"
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={handleRemove}
                aria-label={copy.removeLabel}
                className="absolute top-1 right-1 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-danger-button text-sm text-text-on-dark hover:bg-danger-700"
              >
                ×
              </button>
            </>
          ) : (
            <div className="p-2 text-center">
              <User className="mx-auto h-8 w-8 text-text-muted" aria-hidden="true" />
              <p className="mt-1 text-xs text-text-muted">{copy.emptyHint}</p>
            </div>
          )}
        </div>

        <div className="flex-1">
          <button
            type="button"
            onClick={openPicker}
            disabled={isProcessing}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors',
              isProcessing
                ? 'cursor-not-allowed bg-surface-alt text-text-muted'
                : 'border-primary-outline-border text-primary-link-fg hover:bg-primary-subtle-bg',
            )}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden="true" />
                {copy.uploadButton(hasPortrait)}
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-text-muted">{copy.helpText}</p>
          {error && <p className="mt-1 text-xs font-medium text-danger-fg">{error}</p>}
        </div>
      </div>

      {modals}
    </div>
  );
}
