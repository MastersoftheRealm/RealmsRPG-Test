import { describe, expect, it } from 'vitest';
import { CROPPED_IMAGE_EXTENSION, CROPPED_IMAGE_MIME, fileFromCroppedBlob } from './crop-image';

describe('crop-image', () => {
  it('exports PNG as the cropped upload format (alpha preserved)', () => {
    expect(CROPPED_IMAGE_MIME).toBe('image/png');
    expect(CROPPED_IMAGE_EXTENSION).toBe('png');
  });

  it('builds upload filenames from blob type', () => {
    const png = new Blob(['x'], { type: 'image/png' });
    expect(fileFromCroppedBlob(png, 'portrait').name).toBe('portrait.png');
    expect(fileFromCroppedBlob(png, 'card-art').name).toBe('card-art.png');

    const webp = new Blob(['x'], { type: 'image/webp' });
    expect(fileFromCroppedBlob(webp, 'portrait').name).toBe('portrait.webp');
  });
});
