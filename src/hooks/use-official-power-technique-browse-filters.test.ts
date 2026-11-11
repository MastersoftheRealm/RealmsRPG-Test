/** @vitest-environment happy-dom */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOfficialPowerTechniqueBrowseFilters } from './use-official-power-technique-browse-filters';

vi.mock('@/hooks/use-codex', () => ({
  useCodexArchetypes: () => ({ data: [] }),
}));

describe('useOfficialPowerTechniqueBrowseFilters', () => {
  it('omits rowFilters when rowFiltersEnabled is false (empowered tab parity)', () => {
    const { result } = renderHook(() =>
      useOfficialPowerTechniqueBrowseFilters({
        kind: 'technique',
        entities: [{ id: '1', name: 'T', pathIds: [] }],
        rowFiltersEnabled: false,
      }),
    );
    act(() => {
      result.current.setRulesSources(['Core']);
    });
    expect(result.current.rowFilters).toBeNull();
    expect(result.current.pathFilterActive).toBe(false);
    expect(result.current.filterActiveCount).toBeUndefined();
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

  it('counts path and character filter terms via real usePathListFilter', () => {
    const { result } = renderHook(() =>
      useOfficialPowerTechniqueBrowseFilters({
        kind: 'technique',
        entities: [{ id: '1', name: 'T', pathIds: ['p1'] }],
      }),
    );
    act(() => {
      result.current.setSelectedPathIds(['martial']);
    });
    expect(result.current.pathFilterActive).toBe(true);
    expect(result.current.filterActiveCount).toBe(1);

    act(() => {
      result.current.setCharacterFilterId('char-42');
    });
    expect(result.current.filterActiveCount).toBe(2);
  });

  it('omits pathEmptyListTitle when rowFiltersEnabled is false even if paths are selected', () => {
    const { result } = renderHook(() =>
      useOfficialPowerTechniqueBrowseFilters({
        kind: 'technique',
        entities: [{ id: '1', name: 'T', pathIds: [] }],
        rowFiltersEnabled: false,
      }),
    );
    act(() => {
      result.current.setSelectedPathIds(['martial']);
    });
    expect(result.current.pathEmptyListTitle).toBeUndefined();
  });

  it('exposes pathRecommendedIds only inside rowFilters when enabled', () => {
    const { result } = renderHook(() =>
      useOfficialPowerTechniqueBrowseFilters({
        kind: 'power',
        entities: [{ id: 'x', name: 'X', pathIds: [] }],
      }),
    );
    act(() => {
      result.current.setSelectedPathIds(['innate']);
    });
    expect(result.current.rowFilters).not.toBeNull();
    expect(result.current.rowFilters?.rulesSources).toEqual([]);
  });
});
