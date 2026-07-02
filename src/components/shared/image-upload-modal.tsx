/**
 * Image Upload Modal
 * ==================
 * Modal for uploading and cropping character portraits and profile pictures.
 * Features:
 * - Upload from device, drag and drop
 * - Crop frame (square for character sheet portrait, circle for profile)
 * - Drag/pinch to position and scale within frame
 * - Live output preview matching the confirmed crop
 * - Accepted formats and size info
 */

'use client';

import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import type { Area, Point } from 'react-easy-crop';

const Cropper = lazy(() => import('react-easy-crop'));
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui';
import { Button, Alert } from '@/components/ui';
import { Upload, ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedImageBlob, normalizeImageFileToDataUrl } from '@/lib/crop-image';

// =============================================================================
// Types
// =============================================================================

export type CropShape = 'rect' | 'round';

export interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the cropped image blob when user confirms. Can return a Promise; modal stays open until resolved. */
  onConfirm: (blob: Blob) => void | Promise<void>;
  /** Shape of the crop frame */
  cropShape?: CropShape;
  /** Aspect ratio of the crop (width/height). Default: 1 (square) for rect; pass e.g. 3/4 for tall portrait. */
  aspect?: number;
  /** Title shown in the modal header */
  title?: string;
  /** Max file size in bytes. Default 5MB */
  maxFileSize?: number;
}

// =============================================================================
// Helpers
// =============================================================================

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg, .jpeg, .png, .gif, .webp';
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================================
// Component
// =============================================================================

export function ImageUploadModal({
  isOpen,
  onClose,
  onConfirm,
  cropShape = 'rect',
  aspect,
  title = 'Upload Image',
  maxFileSize = DEFAULT_MAX_SIZE,
}: ImageUploadModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const croppedAreaPixelsRef = useRef<Area | null>(null);
  const [outputPreviewUrl, setOutputPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveAspect = aspect ?? 1;

  const clearOutputPreview = useCallback(() => {
    setOutputPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const resetState = useCallback(() => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    croppedAreaPixelsRef.current = null;
    clearOutputPreview();
    setError(null);
    setIsProcessing(false);
    setIsDragging(false);
    setIsLoadingImage(false);
  }, [clearOutputPreview]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const validateAndLoadFile = useCallback(async (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${ACCEPTED_EXTENSIONS}`);
      return;
    }
    if (file.size > maxFileSize) {
      setError(`File too large (${formatFileSize(file.size)}). Maximum: ${formatFileSize(maxFileSize)}`);
      return;
    }

    setIsLoadingImage(true);
    try {
      const dataUrl = await normalizeImageFileToDataUrl(file);
      setImageSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      croppedAreaPixelsRef.current = null;
      clearOutputPreview();
    } catch {
      setError('Failed to read image');
    } finally {
      setIsLoadingImage(false);
    }
  }, [maxFileSize, clearOutputPreview]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void validateAndLoadFile(file);
    if (e.target) e.target.value = '';
  }, [validateAndLoadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) void validateAndLoadFile(file);
  }, [validateAndLoadFile]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    croppedAreaPixelsRef.current = croppedAreaPx;
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  useEffect(() => {
    if (!imageSrc || !croppedAreaPixels) {
      clearOutputPreview();
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void getCroppedImageBlob(imageSrc, croppedAreaPixels)
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          setOutputPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        })
        .catch(() => {
          if (!cancelled) clearOutputPreview();
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [imageSrc, croppedAreaPixels, clearOutputPreview]);

  const handleConfirm = useCallback(async () => {
    const pixels = croppedAreaPixelsRef.current;
    if (!imageSrc || !pixels) return;

    setIsProcessing(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, pixels);
      await onConfirm(blob);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, onConfirm, handleClose]);

  const sizeHint =
    cropShape === 'round'
      ? 'Recommended: square image, at least 200x200px'
      : Math.abs(effectiveAspect - 1) < 0.001
        ? 'Recommended: square crop to match the character sheet portrait frame, at least 300×300px'
        : 'Recommended: match your chosen aspect ratio; use a high-resolution source image';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={sizeHint}
      size="lg"
      className="max-h-[90vh]"
      fullScreenOnMobile
    >
      <div className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        {isLoadingImage ? (
          <div className="flex h-[200px] items-center justify-center rounded-xl bg-surface-alt font-nunito text-sm text-text-secondary">
            Preparing image…
          </div>
        ) : !imageSrc ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer',
              isDragging
                ? 'border-primary-outline-border bg-primary-subtle-bg'
                : 'border-border-light bg-surface-alt hover:border-primary-outline-border hover:bg-primary-subtle-bg-hover/50'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                isDragging ? 'bg-primary-subtle-bg text-primary-link-fg' : 'bg-surface text-text-muted'
              )}
            >
              {isDragging ? <Upload className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">
                {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {ACCEPTED_EXTENSIONS} &middot; Max {formatFileSize(maxFileSize)}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Choose image file"
            />
          </div>
        ) : (
          <>
            <div className="relative w-full h-[400px] bg-black/90 rounded-xl overflow-hidden">
              <Suspense fallback={<div className="flex items-center justify-center h-full text-text-muted">Loading editor...</div>}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={effectiveAspect}
                  cropShape={cropShape}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={false}
                  objectFit="contain"
                  style={{
                    containerStyle: { borderRadius: '0.75rem' },
                  }}
                />
              </Suspense>
            </div>

            {outputPreviewUrl && (
              <div className="rounded-xl border border-border-light bg-surface-alt/60 px-4 py-3">
                <p className="mb-2 font-nunito text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Output preview
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'relative shrink-0 overflow-hidden border border-border-light bg-surface shadow-sm',
                      cropShape === 'round' ? 'h-20 w-20 rounded-full' : 'h-20 w-20 rounded-card'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={outputPreviewUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="font-nunito text-xs text-text-secondary">
                    This is the exact image that will be saved when you confirm.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 px-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors min-h-11 min-w-11 flex items-center justify-center"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary-600 h-2 rounded-full"
                aria-label="Zoom"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors min-h-11 min-w-11 flex items-center justify-center"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <span className="text-xs text-text-muted w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setImageSrc(null);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setCroppedAreaPixels(null);
                  croppedAreaPixelsRef.current = null;
                  clearOutputPreview();
                }}
              >
                Choose Different Image
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isProcessing || !croppedAreaPixels}
                  isLoading={isProcessing}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
