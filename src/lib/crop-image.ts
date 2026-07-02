/**
 * Image crop utilities — shared by ImageUploadModal and other uploaders.
 * Normalizes EXIF orientation before react-easy-crop so the crop box matches the output.
 */

import type { Area } from 'react-easy-crop';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Bake EXIF orientation into a JPEG data URL so cropper pixels match canvas output.
 * Falls back to a plain data URL when createImageBitmap is unavailable.
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
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        throw new Error('Canvas unavailable');
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', 0.92);
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
 * Extract the cropped region as a JPEG blob. Coordinates must come from react-easy-crop
 * croppedAreaPixels (after normalizeImageFileToDataUrl was used for the source).
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

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.92
    );
  });
}
