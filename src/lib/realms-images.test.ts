import { describe, expect, it } from 'vitest';
import {
  isRealmsImageCategory,
  parseRealmsImageCategories,
  realmsImageStoragePath,
  resolveRealmsImagePickerCategories,
  withCacheBust,
} from './realms-images';

describe('realms-images helpers', () => {
  it('validates locked category vocabulary', () => {
    expect(isRealmsImageCategory('weapon')).toBe(true);
    expect(isRealmsImageCategory('empowered')).toBe(false);
    expect(isRealmsImageCategory('feat')).toBe(false);
  });

  it('parses JSON and comma-separated categories', () => {
    expect(parseRealmsImageCategories('["weapon","equipment"]')).toEqual(['weapon', 'equipment']);
    expect(parseRealmsImageCategories('power,technique')).toEqual(['power', 'technique']);
    expect(parseRealmsImageCategories('')).toEqual([]);
    expect(parseRealmsImageCategories('weapon,empowered')).toBeNull();
  });

  it('resolves picker category filters', () => {
    expect(resolveRealmsImagePickerCategories('weapon')).toEqual(['weapon']);
    expect(resolveRealmsImagePickerCategories(['power', 'technique'])).toEqual(['power', 'technique']);
    expect(resolveRealmsImagePickerCategories('empowered-technique')).toEqual(['power', 'technique']);
    expect(resolveRealmsImagePickerCategories('portrait')).toEqual(['species', 'creature']);
  });

  it('builds library storage paths', () => {
    expect(realmsImageStoragePath('abc-123', 'jpg')).toBe('library/abc-123.jpg');
    expect(realmsImageStoragePath('abc-123', 'png')).toBe('library/abc-123.png');
  });

  it('cache-busts public URLs', () => {
    expect(withCacheBust('https://example.com/x.jpg', 99)).toBe('https://example.com/x.jpg?v=99');
    expect(withCacheBust('https://example.com/x.jpg?v=1', 2)).toBe('https://example.com/x.jpg?v=2');
  });
});
