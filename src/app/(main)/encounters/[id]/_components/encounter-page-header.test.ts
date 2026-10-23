import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Repro (86e3jrra6): signed-out guest encounters persist in localStorage but the
 * encounter header still showed "Saved to cloud".
 */
const headerSource = readFileSync(
  path.join(import.meta.dirname, 'EncounterPageHeader.tsx'),
  'utf8',
);

describe('EncounterPageHeader guest save status (86e3jrra6)', () => {
  it('shows Saved locally when persistence is guest localStorage', () => {
    expect(headerSource).toContain('useAuth');
    expect(headerSource).toContain('initialized');
    expect(headerSource).toContain('usesLocalPersistence');
    expect(headerSource).toContain('Saved locally');
    expect(headerSource).toContain('Saved to cloud');
    expect(headerSource).toMatch(/!initialized \? null : usesLocalPersistence\s*\?/);
  });
});
