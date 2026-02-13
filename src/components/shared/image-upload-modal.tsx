/**
 * Image Upload Modal
 * ==================
 * Modal for uploading and cropping character portraits and profile pictures.
 * Features:
 * - Upload from device, drag and drop
 * - Crop frame (rectangle for portrait, circle for profile)
 * - Drag/pinch to position and scale within frame
 * - Preview before confirming
 * - Accepted formats and size info
 */

'use client';

import { useState, useCallback, useRef, lazy, Suspense } from 'react';
import type { Area, Point } from 'react-easy-crop';

const Cropper = lazy(() => import('react-easy-crop'));
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui';
import { Button, Alert } from '@/components/ui';
import { Upload, ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';

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
  /** Aspect ratio of the crop (width/height). Default: 3/4 for portrait, 1 for round */
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

/**
 * Create a cropped image from the source image and crop area.
 * Returns a Blob of the cropped image in JPEG format.
 */
function getCroppedImage(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.9
      );
    };
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
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
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveAspect = aspect ?? (cropShape === 'round' ? 1 : 3 / 4);

  const resetState = useCallback(() => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
    setIsProcessing(false);
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const validateAndLoadFile = useCallback((file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${ACCEPTED_EXTENSIONS}`);
      return;
    }
    if (file.size > maxFileSize) {
      setError(`File too large (${formatFileSize(file.size)}). Maximum: ${formatFileSize(maxFileSize)}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  }, [maxFileSize]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndLoadFile(file);
    // Reset input so the same file can be selected again
    if (e.target) e.target.value = '';
  }, [validateAndLoadFile]);

  // Drag and drop handlers
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
    if (file) validateAndLoadFile(file);
  }, [validateAndLoadFile]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    setError(null);
    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
      await onConfirm(blob);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, onConfirm, handleClose]);

  // Recommended size text
  const sizeHint = cropShape === 'round'
    ? 'Recommended: square image, at least 200x200px'
    : 'Recommended: portrait orientation (3:4), at least 300x400px';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={sizeHint}
      size="lg"
      className="max-h-[90vh]"
    >
      <div className="space-y-4">
        {/* Error message */}
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}

        {!imageSrc ? (
          /* ============ UPLOAD ZONE ============ */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer',
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-border-light bg-surface-alt hover:border-primary-300 hover:bg-primary-50/50'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
              isDragging ? 'bg-primary-100 text-primary-600' : 'bg-surface text-text-muted'
            )}>
              {isDragging ? (
                <Upload className="w-8 h-8" />
              ) : (
                <ImageIcon className="w-8 h-8" />
              )}
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
          /* ============ CROP EDITOR ============ */
          <>
            {/* Crop area (lazy-loaded) */}
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
                  style={{
                    containerStyle: { borderRadius: '0.75rem' },
                  }}
                />
              </Suspense>
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 px-2">
              <button
                onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors"
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
                onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <span className="text-xs text-text-muted w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setImageSrc(null);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
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
                  disabled={isProcessing}
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
