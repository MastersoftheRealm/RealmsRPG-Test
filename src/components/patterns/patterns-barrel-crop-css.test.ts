import { beforeEach, describe, expect, it, vi } from 'vitest';

const cropCssImport = vi.hoisted(() => vi.fn());

vi.mock('react-easy-crop/react-easy-crop.css', () => {
  cropCssImport();
  return {};
});

describe('patterns barrel crop CSS (COMP3-033)', () => {
  beforeEach(() => {
    cropCssImport.mockClear();
    vi.resetModules();
  });

  it('does not load react-easy-crop CSS when importing the patterns barrel', async () => {
    await import('@/components/patterns');
    expect(cropCssImport).not.toHaveBeenCalled();
  });
});
