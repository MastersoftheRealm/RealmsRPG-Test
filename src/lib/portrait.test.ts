import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dataUrlToBlob,
  getEffectivePortrait,
  isPortraitFallbackSrc,
  PORTRAIT_SAVE_NO_URL,
  uploadCharacterPortraitFromDataUrl,
  withPortraitCacheBust,
} from './portrait';
import { getFallbackPortraitDataUrl } from './placeholder-art';

describe('dataUrlToBlob', () => {
  it('decodes a simple JPEG data URL', () => {
    const blob = dataUrlToBlob('data:image/jpeg;base64,QQ==');
    expect(blob.type).toBe('image/jpeg');
    expect(blob.size).toBe(1);
  });

  it('rejects invalid data URLs', () => {
    expect(() => dataUrlToBlob('not-a-data-url')).toThrow('Invalid data URL');
  });
});

describe('portrait display helpers', () => {
  it('resolves theme-aware fallbacks for empty portraits', () => {
    expect(getEffectivePortrait(null, 'dark')).toBe(getFallbackPortraitDataUrl('dark'));
    expect(getEffectivePortrait('', 'light')).toBe(getFallbackPortraitDataUrl('light'));
  });

  it('detects inline fallback data URLs for either theme', () => {
    expect(isPortraitFallbackSrc(getFallbackPortraitDataUrl('light'))).toBe(true);
    expect(isPortraitFallbackSrc(getFallbackPortraitDataUrl('dark'))).toBe(true);
    expect(isPortraitFallbackSrc('https://cdn.example/p.jpg')).toBe(false);
  });

  it('does not cache-bust data-URL fallbacks', () => {
    const fallback = getFallbackPortraitDataUrl('dark');
    expect(withPortraitCacheBust(fallback, 99)).toBe(fallback);
    expect(withPortraitCacheBust('https://cdn.example/p.jpg', 99)).toBe(
      'https://cdn.example/p.jpg?t=99'
    );
  });
});

describe('uploadCharacterPortraitFromDataUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts multipart via apiUpload and returns the url', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://cdn.example/portrait.jpg' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await uploadCharacterPortraitFromDataUrl(
      'char-1',
      'data:image/jpeg;base64,QQ=='
    );

    expect(result).toEqual({ url: 'https://cdn.example/portrait.jpg' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/upload/portrait');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get('characterId')).toBe('char-1');
    expect(form.get('file')).toBeInstanceOf(File);
  });

  it('throws PORTRAIT_SAVE_NO_URL when response has no url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );

    await expect(
      uploadCharacterPortraitFromDataUrl('char-1', 'data:image/jpeg;base64,QQ==')
    ).rejects.toThrow(PORTRAIT_SAVE_NO_URL);
  });

  it('surfaces API error messages via getErrorMessage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'File too large' }),
      })
    );

    await expect(
      uploadCharacterPortraitFromDataUrl('char-1', 'data:image/jpeg;base64,QQ==')
    ).rejects.toThrow('File too large');
  });

  it('surfaces apiUpload default when API body has no error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: '',
        json: async () => ({}),
      })
    );

    await expect(
      uploadCharacterPortraitFromDataUrl('char-1', 'data:image/jpeg;base64,QQ==')
    ).rejects.toThrow('Upload failed');
  });
});
