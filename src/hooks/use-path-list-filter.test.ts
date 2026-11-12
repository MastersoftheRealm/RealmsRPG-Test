/** @vitest-environment happy-dom */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePathListFilter } from './use-path-recommendation-index';

vi.mock('@/hooks/use-codex', () => ({
  useCodexArchetypes: () => ({ data: [] }),
}));

describe('usePathListFilter enabled gate', () => {
  const entities = [{ id: 'e1', name: 'Entity', pathIds: ['p1'] as string[] }];

  it('treats path as inactive when enabled is false', () => {
    const { result } = renderHook(() =>
      usePathListFilter({ entities, kind: 'techniques', enabled: false }),
    );
    act(() => {
      result.current.setSelectedPathIds(['martial']);
    });
    expect(result.current.pathFilterActive).toBe(false);
    expect(result.current.pathRecommendedIds).toBeNull();
    expect(result.current.selectedPathIds).toEqual([]);
  });

  it('activates path filter when enabled is true', () => {
    const { result } = renderHook(() =>
      usePathListFilter({ entities, kind: 'techniques', enabled: true }),
    );
    act(() => {
      result.current.setSelectedPathIds(['martial']);
    });
    expect(result.current.pathFilterActive).toBe(true);
  });
});
