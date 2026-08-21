/**
 * Image crop utilities — shared by ImageUploadModal and other uploaders.
 * Normalizes EXIF orientation before react-easy-crop so the crop box matches the output.
 *
 * Encoded crops preserve alpha (PNG). Theme matte is **display-only** via `bg-image-matte`
 * — never baked into stored files so light/dark switches stay correct.
 */

import type { Area } from 'react-easy-crop';
import { extensionForImageMime } from '@/lib/validate-image';

/** MIME type for all cropped upload outputs (alpha preserved). */
export const CROPPED_IMAGE_MIME = 'image/png';

/** Default filename extension for cropped blobs. */
export const CROPPED_IMAGE_EXTENSION = extensionForImageMime(CROPPED_IMAGE_MIME);

/** Build a File from a cropped blob using detected type/extension. */
export function fileFromCroppedBlob(blob: Blob, baseName: string): File {
  const ext = extensionForImageMime(blob.type || CROPPED_IMAGE_MIME);
  const type = blob.type?.startsWith('image/') ? blob.type : CROPPED_IMAGE_MIME;
  return new File([blob], `${baseName}.${ext}`, { type });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function drawBitmapToPngDataUrl(
  source: CanvasImageSource,
  width: number,
  height: number,
  closeSource?: () => void,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    closeSource?.();
    throw new Error('Canvas unavailable');
  }
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  closeSource?.();
  return canvas.toDataURL(CROPPED_IMAGE_MIME);
}

/**
 * Bake EXIF orientation into a PNG data URL so cropper pixels match canvas output.
 * Alpha is preserved for adaptive `bg-image-matte` at display time.
 */
export async function normalizeImageFileToDataUrl(file: File, maxEdge = 4096): Promise<string> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      let { width, height } = bitmap;
      const longest = Math.max(width, height);
      if (longest > maxEdge) {
        const scale = maxEdge / longest;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      return drawBitmapToPngDataUrl(bitmap, width, height, () => bitmap.close());
    } catch {
      // Fall through to FileReader (older browsers or decode errors).
    }
  }
  return readFileAsDataUrl(file);
}

function roundArea(area: Area): Area {
  return {
    x: Math.round(area.x),
    y: Math.round(area.y),
    width: Math.round(area.width),
    height: Math.round(area.height),
  };
}

function loadImageElement(imageSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
}

/**
 * Extract the cropped region as a PNG blob (alpha preserved).
 * Coordinates must come from react-easy-crop croppedAreaPixels.
 */
export async function getCroppedImageBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const crop = roundArea(pixelCrop);
  if (crop.width <= 0 || crop.height <= 0) {
    throw new Error('Invalid crop area');
  }

  const image = await loadImageElement(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.clearRect(0, 0, crop.width, crop.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, CROPPED_IMAGE_MIME);
  });
}
