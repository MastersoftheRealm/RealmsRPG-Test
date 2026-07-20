'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { blobToCompressedBase64 } from '@/lib/portrait';
import { ImageUploadModal, RealmsImagePicker } from '@/components/shared';

// =============================================================================
// Portrait Upload Component - uses ImageUploadModal for cropping
// =============================================================================

export function PortraitUpload() {
  const { draft, updateDraft } = useCharacterCreatorStore();
  const [showModal, setShowModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropped = async (blob: Blob) => {
    setError(null);
    setIsProcessing(true);
    try {
      const base64 = await blobToCompressedBase64(blob);
      if (base64.length > 700 * 1024) {
        setError('Image is still too large. Please use a smaller image.');
        return;
      }
      updateDraft({ portrait: base64 });
      setShowModal(false);
    } catch {
      setError('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    updateDraft({ portrait: undefined });
    setError(null);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-text-secondary mb-2">
        Character Portrait (Optional)
      </label>

      <div className="flex items-start gap-4">
        <div className="relative w-28 h-28 rounded-lg overflow-hidden bg-surface-alt border-2 border-dashed border-border-light flex items-center justify-center">
          {draft.portrait ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.portrait}
                alt="Character portrait"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Remove portrait"
                className="absolute top-1 right-1 min-h-11 min-w-11 rounded-full bg-danger-button text-text-on-dark flex items-center justify-center text-sm hover:bg-danger-700"
              >
                ×
              </button>
            </>
          ) : (
            <div className="text-center p-2">
              <span className="text-3xl text-text-muted dark:text-text-secondary">📷</span>
              <p className="text-xs text-text-muted dark:text-text-secondary mt-1">No image</p>
            </div>
          )}
        </div>

        <div className="flex-1">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={isProcessing}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors',
              isProcessing
                ? 'bg-surface-alt text-text-muted dark:text-text-secondary cursor-not-allowed'
                : 'border-primary-outline-border text-primary-link-fg hover:bg-primary-subtle-bg'
            )}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" />
                Processing...
              </>
            ) : (
              <>📤 {draft.portrait ? 'Change Image' : 'Upload Image'}</>
            )}
          </button>
          <p className="text-xs text-text-muted dark:text-text-secondary mt-2">
            Click to upload and crop. JPG, PNG, or GIF. Max 5MB.
          </p>
          {error && (
            <p className="text-xs text-danger-700 dark:text-danger-400 mt-1 font-medium">{error}</p>
          )}
        </div>
      </div>

      <ImageUploadModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError(null); }}
        onConfirm={handleCropped}
        onChooseFromLibrary={() => setShowBankPicker(true)}
        cropShape="rect"
        aspect={1}
        title="Character Portrait"
      />
      <RealmsImagePicker
        isOpen={showBankPicker}
        onClose={() => setShowBankPicker(false)}
        onSelect={({ image }) => {
          updateDraft({ portrait: image.publicUrl });
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
