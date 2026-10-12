import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('useBrowserOffline', () => {
  it('subscribes to online and offline window events', () => {
    const src = readFileSync(path.join(process.cwd(), 'src/hooks/use-browser-offline.ts'), 'utf8');
    expect(src).toContain("addEventListener('online'");
    expect(src).toContain("addEventListener('offline'");
    expect(src).toContain('navigator.onLine');
  });
});
