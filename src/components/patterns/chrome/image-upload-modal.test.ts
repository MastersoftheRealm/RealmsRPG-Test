import { describe, expect, it } from 'vitest';
import { IMAGE_CROPPER_KEYBOARD_HINT, imageCropperA11yProps } from './image-upload-modal';

describe('ImageUploadModal crop a11y (86e3k0jw8)', () => {
  it('names the crop area and links keyboard instructions', () => {
    const props = imageCropperA11yProps('crop-hint');
    expect(props['aria-label']).toBe('Crop area');
    expect(props['aria-describedby']).toBe('crop-hint');
    expect(IMAGE_CROPPER_KEYBOARD_HINT).toMatch(/arrow keys/i);
  });
});
