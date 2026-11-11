/** @vitest-environment happy-dom */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOfficialPowerTechniqueBrowseFilters } from './use-official-power-technique-browse-filters';

vi.mock('./use-path-recommendation-index', () => ({
  usePathListFilter: vi.fn(() => ({
    selectedPathIds: [],
    setSelectedPathIds: vi.fn(),
    pathIndex: null,
    pathRecommendedIds: null,
    pathFilterActive: false,
  })),
  POWER_LIST_PATH_KINDS: ['powers', 'innatePowers'],
}));

describe('useOfficialPowerTechniqueBrowseFilters', () => {
  it('omits row filter inputs when pathFilterEnabled is false', () => {
    const { result } = renderHook(() =>
      useOfficialPowerTechniqueBrowseFilters({
        kind: 'technique',
        entities: [{ id: '1', name: 'T', pathIds: [] }],
        pathFilterEnabled: false,
      }),
    );
    act(() => {
      result.current.setRulesSources(['Core']);
    });
    expect(result.current.pathRecommendedIds).toBeNull();
    expect(result.current.advancedFiltersForRows).toBeUndefined();
    expect(result.current.characterContextForRows).toBeNull();
    expect(result.current.rulesSourcesForRows).toBeUndefined();
    expect(result.current.filterActiveCount).toBe(0);
  });

  it('counts rules-source and advanced filters when browse filters are enabled', () => {
    const { result } = renderHook(() =>
      useOfficialPowerTechniqueBrowseFilters({
        kind: 'power',
        entities: [{ id: '1', name: 'P', pathIds: [] }],
      }),
    );
    expect(result.current.filterActiveCount).toBe(0);
    act(() => {
      result.current.setRulesSources(['Core']);
    });
    expect(result.current.filterActiveCount).toBe(1);
    act(() => {
      result.current.setAdvancedFilters((prev) => ({ ...prev, categories: ['Damage'] }));
    });
    expect(result.current.filterActiveCount).toBe(2);
  });
});
