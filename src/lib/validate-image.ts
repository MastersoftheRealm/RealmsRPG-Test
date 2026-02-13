/**
 * Image Validation Utilities
 * ==========================
 * Validates file uploads via magic byte (file signature) inspection.
 * Prevents malicious files from bypassing MIME-type-only checks.
 */

/** Supported image signatures (magic bytes) */
const IMAGE_SIGNATURES: { mime: string; bytes: number[] }[] = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // GIF87a: 47 49 46 38 37 61
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
  // GIF89a: 47 49 46 38 39 61
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  // BMP: 42 4D
  { mime: 'image/bmp', bytes: [0x42, 0x4d] },
];

/** Maximum bytes needed to identify any supported image format */
const MAX_HEADER_SIZE = 12;

/**
 * Validate that a file's content matches a known image format by inspecting
 * its magic bytes. This prevents spoofed MIME types from bypassing validation.
 *
 * @param file - The uploaded File object
 * @returns `true` if the file signature matches a known image format
 */
export async function validateImageMagicBytes(file: File): Promise<boolean> {
  const headerSlice = file.slice(0, MAX_HEADER_SIZE);
  const buffer = await headerSlice.arrayBuffer();
  const header = new Uint8Array(buffer);

  for (const sig of IMAGE_SIGNATURES) {
    if (header.length < sig.bytes.length) continue;

    // WebP needs special handling: RIFF at 0..3 and WEBP at 8..11
    if (sig.mime === 'image/webp') {
      const riffMatch = sig.bytes.every((b, i) => header[i] === b);
      const webpMatch =
        header.length >= 12 &&
        header[8] === 0x57 && // W
        header[9] === 0x45 && // E
        header[10] === 0x42 && // B
        header[11] === 0x50; // P
      if (riffMatch && webpMatch) return true;
      continue;
    }

    const match = sig.bytes.every((b, i) => header[i] === b);
    if (match) return true;
  }

  return false;
}
