import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveSpeciesEditForm } from './species-creator-bootstrap';

const dir = dirname(fileURLToPath(import.meta.url));

describe('resolveSpeciesEditForm', () => {
  const saved = {
    id: 'user-species-1',
    docId: 'user-species-1',
    name: 'Saved species',
    type: 'Humanoid',
    skills: ['1', '2'],
    species_traits: ['t1'],
    ave_height: 170,
    ave_weight: 70,
    adulthood_lifespan: [18, 80],
    _source: 'user',
  };

  it('loads the matching library row into the creator form', () => {
    const resolved = resolveSpeciesEditForm('user-species-1', [saved], [], []);
    expect(resolved?.form.name).toBe('Saved species');
    expect(resolved?.form.type).toBe('Humanoid');
    expect(resolved?.form.skillIds).toEqual(['1', '2']);
    expect(resolved?.form.species_traits).toEqual(['t1']);
    expect(resolved?.form.ave_height).toBe(170);
    expect(resolved?.item).toBe(saved);
  });

  it('matches docId when it differs from id', () => {
    const row = { ...saved, id: 'row-uuid', docId: 'saved-doc' };
    const resolved = resolveSpeciesEditForm('saved-doc', [row], [], []);
    expect(resolved?.form.name).toBe('Saved species');
  });

  it('returns null when the id is not in the loaded library', () => {
    expect(resolveSpeciesEditForm('missing', [saved], [], [])).toBeNull();
  });
});

describe('species creator ?edit= wiring', () => {
  it('prefetches the library and applies the edit id in the species creator', () => {
    const page = readFileSync(join(dir, 'page.tsx'), 'utf8');
    const workspace = readFileSync(join(dir, 'use-species-creator-workspace.ts'), 'utf8');
    expect(page).toContain("searchParams.get('edit')");
    expect(page).toContain('prefetch: !!editSpeciesId');
    expect(page).toContain('editSpeciesId');
    expect(workspace).toContain('resolveSpeciesEditForm');
    expect(workspace).toContain('if (editSpeciesId)');
    expect(workspace).toContain('localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY)');
  });
});
