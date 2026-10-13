import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  initialSpeciesFormState,
  planSpeciesCreatorEdit,
  readStoredSpeciesDraft,
  resolveSpeciesEditForm,
  SPECIES_CREATOR_CACHE_KEY,
} from './species-creator-bootstrap';

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

describe('planSpeciesCreatorEdit', () => {
  const saved = {
    id: 'user-species-1',
    name: 'Saved species',
    type: 'Humanoid',
  };

  it('waits while the library is still loading and does not treat the id as missing', () => {
    expect(
      planSpeciesCreatorEdit({
        editSpeciesId: '00000000-bad-id',
        libraryReady: false,
        rawItems: [],
        traits: [],
        skills: [],
      }).type,
    ).toBe('wait');
  });

  it('keeps the draft when the edit id is not in the loaded library', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
    store.set(
      SPECIES_CREATOR_CACHE_KEY,
      JSON.stringify({
        form: { ...initialSpeciesFormState, name: 'Unsaved kin' },
        timestamp: Date.now(),
      }),
    );

    const plan = planSpeciesCreatorEdit({
      editSpeciesId: '00000000-bad-id',
      libraryReady: true,
      rawItems: [saved],
      traits: [],
      skills: [],
    });
    expect(plan.type).toBe('missing');
    expect(readStoredSpeciesDraft([], [])?.name).toBe('Unsaved kin');
    expect(store.get(SPECIES_CREATOR_CACHE_KEY)).toContain('Unsaved kin');
    vi.unstubAllGlobals();
  });

  it('replaces the draft only when the edit id is loaded', () => {
    const plan = planSpeciesCreatorEdit({
      editSpeciesId: 'user-species-1',
      libraryReady: true,
      rawItems: [saved],
      traits: [],
      skills: [],
    });
    expect(plan.type).toBe('replace');
    if (plan.type === 'replace') expect(plan.form.name).toBe('Saved species');
  });
});

describe('species creator ?edit= wiring', () => {
  it('prefetches the library and clears the draft only after the id resolves', () => {
    const page = readFileSync(join(dir, 'page.tsx'), 'utf8');
    const workspace = readFileSync(join(dir, 'use-species-creator-workspace.ts'), 'utf8');
    expect(page).toContain("searchParams.get('edit')");
    expect(page).toContain('prefetch: !!editSpeciesId');
    expect(page).toContain('editSpeciesId');
    expect(workspace).toContain('planSpeciesCreatorEdit');
    expect(workspace).toContain("plan.type === 'replace'");
    expect(workspace).toContain("plan.type === 'missing'");
    expect(workspace).toContain('creatorEditMissMessage');
    const beforePlan = workspace.slice(0, workspace.indexOf('planSpeciesCreatorEdit'));
    expect(beforePlan).not.toContain('localStorage.removeItem(SPECIES_CREATOR_CACHE_KEY)');
  });
});
