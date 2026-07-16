import { describe, expect, it } from 'vitest';
import {
  getPowersTechniquesL1Ids,
  isPathRecommendedPowersTechniquesId,
} from '@/lib/guided-creator/powers-techniques-l1-candidates';

describe('getPowersTechniquesL1Ids (TASK-458)', () => {
  const catalog = new Map([
    ['path-a', 'path-a'],
    ['path-b', 'path-b'],
    ['catalog-extra', 'catalog-extra'],
  ]);

  const resolve = (id: string) => catalog.get(String(id).trim().toLowerCase());

  it('keeps path ids and appends resolvable selected non-path picks', () => {
    const { displayIds, promotedIds } = getPowersTechniquesL1Ids(
      ['path-a', 'path-b'],
      ['path-a', 'catalog-extra'],
      resolve
    );
    expect(displayIds).toEqual(['path-a', 'path-b', 'catalog-extra']);
    expect(promotedIds).toEqual(['catalog-extra']);
  });

  it('dedupes by canonical id and skips unresolved selected refs', () => {
    const { displayIds, promotedIds } = getPowersTechniquesL1Ids(
      ['path-a'],
      ['PATH-A', 'missing-stale', 'catalog-extra'],
      resolve
    );
    expect(displayIds).toEqual(['path-a', 'catalog-extra']);
    expect(promotedIds).toEqual(['catalog-extra']);
  });

  it('keeps unresolved path ids visible during async load', () => {
    const emptyResolve = () => undefined;
    const { displayIds, promotedIds } = getPowersTechniquesL1Ids(
      ['pending-path'],
      ['pending-path', 'also-missing'],
      emptyResolve
    );
    expect(displayIds).toEqual(['pending-path']);
    expect(promotedIds).toEqual([]);
  });
});

describe('isPathRecommendedPowersTechniquesId', () => {
  const resolve = (id: string) =>
    id.toLowerCase() === 'firebolt' ? 'firebolt' : undefined;

  it('matches path ids case-insensitively via canonical resolve', () => {
    expect(
      isPathRecommendedPowersTechniquesId('Firebolt', ['firebolt'], resolve)
    ).toBe(true);
    expect(
      isPathRecommendedPowersTechniquesId('other', ['firebolt'], resolve)
    ).toBe(false);
  });
});
