import { describe, expect, it } from 'vitest';
import { applyCappedIdSelection } from './feat-selection';

describe('applyCappedIdSelection', () => {
  it('adds under capacity', () => {
    expect(applyCappedIdSelection(['a'], 'b', 3)).toEqual(['a', 'b']);
  });

  it('toggles off when already selected', () => {
    expect(applyCappedIdSelection(['a', 'b'], 'a', 3)).toEqual(['b']);
  });

  it('swaps last pick at capacity', () => {
    expect(applyCappedIdSelection(['a', 'b', 'c'], 'd', 3)).toEqual(['a', 'b', 'd']);
  });

  it('replaces when max is 1', () => {
    expect(applyCappedIdSelection(['a'], 'b', 1)).toEqual(['b']);
  });
});
