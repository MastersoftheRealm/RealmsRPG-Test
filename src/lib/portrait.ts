/**
 * Portrait display + creator upload helpers
 * Treat legacy placeholder path as "no portrait" so we never request it (avoids 404).
 */

import { apiUpload } from '@/lib/api-client';
import { getImageMatteFillColor } from '@/lib/crop-image';

/** Legacy path that may be stored in DB; we treat it as no portrait and use inline fallback. */
export const PLACEHOLDER_PORTRAIT_PATH = '/images/placeholder-portrait.png';

/** Inline SVG data URL for missing portrait — no network request, no 404. */
export const FALLBACK_PORTRAIT_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="%23053357"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="44" fill="white" font-family="Arial">?</text></svg>';

/** Max data-URL length for draft portraits before save-time Storage upload. */
const MAX_PORTRAIT_DATA_URL_LENGTH = 700 * 1024;

export const PORTRAIT_DRAFT_TOO_LARGE =
  'Image is still too large. Please use a smaller image.';

export const PORTRAIT_DRAFT_PROCESS_FALLBACK = 'Failed to process image';

export const PORTRAIT_SAVE_NO_URL =
  'Portrait upload returned no URL. Add a portrait from your character sheet.';

/** Fallback when save-time portrait upload fails after character create. */
export const PORTRAIT_SAVE_UPLOAD_FALLBACK =
  'Could not process or upload your portrait. Your character was created. Add a portrait from the sheet.';

/**
 * Returns the URL to use for portrait display.
 * If portrait is empty or the legacy placeholder path, returns the inline fallback so we never 404.
 */
export function getEffectivePortrait(portrait: string | null | undefined): string {
  if (!portrait || portrait.trim() === '') return FALLBACK_PORTRAIT_DATA_URL;
  if (portrait === PLACEHOLDER_PORTRAIT_PATH || portrait.endsWith('placeholder-portrait.png')) {
    return FALLBACK_PORTRAIT_DATA_URL;
  }
  return portrait;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma === -1 || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL');
  }
  const header = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mimeMatch = /^data:([^;,]+)/.exec(header);
  const mime = mimeMatch?.[1]?.trim() || 'image/jpeg';
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error('Invalid base64 in data URL');
  }
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Compress a cropped portrait blob to a JPEG data URL (max ~700KB). */
export function blobToCompressedBase64(blob: Blob, maxSize = 700 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let { width, height } = img;
      const maxDim = 400;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      canvas.width = width;
      canvas.height = height;
      if (ctx) {
        ctx.fillStyle = getImageMatteFillColor();
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }
      let quality = 0.7;
      const tryEncode = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > maxSize && quality > 0.3) {
          quality -= 0.1;
          tryEncode();
        } else {
          resolve(dataUrl);
        }
      };
      tryEncode();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Compress a cropped blob for creator draft storage (data URL).
 * Throws when still over {@link MAX_PORTRAIT_DATA_URL_LENGTH}.
 */
export async function compressPortraitBlobForDraft(blob: Blob): Promise<string> {
  const base64 = await blobToCompressedBase64(blob);
  if (base64.length > MAX_PORTRAIT_DATA_URL_LENGTH) {
    throw new Error(PORTRAIT_DRAFT_TOO_LARGE);
  }
  return base64;
}

/**
 * Upload a draft data-URL portrait to Storage after character create.
 * Uses apiUpload; callers toast failures with getErrorMessage + {@link PORTRAIT_SAVE_UPLOAD_FALLBACK}.
 */
export async function uploadCharacterPortraitFromDataUrl(
  characterId: string,
  dataUrl: string,
): Promise<{ url: string }> {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], 'portrait.jpg', {
    type: blob.type?.startsWith('image/') ? blob.type : 'image/jpeg',
  });
  const formData = new FormData();
  formData.append('file', file);
  formData.append('characterId', characterId);
  const uploadRes = await apiUpload<{ url: string }>('/api/upload/portrait', formData);
  if (!uploadRes.url) {
    throw new Error(PORTRAIT_SAVE_NO_URL);
  }
  return { url: uploadRes.url };
}
