// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useOfficialPowerTechniqueBrowseFilters } from '@/hooks/use-official-power-technique-browse-filters';
import { usePathListFilter } from '@/hooks';
import { OfficialTechniqueList } from './official-technique-list';
import { OfficialItemList } from './official-item-list';

const browseReturn = {
  advancedFilters: {},
  setAdvancedFilters: vi.fn(),
  setCharacterContext: vi.fn(),
  characterFilterId: '',
  setCharacterFilterId: vi.fn(),
  rulesSources: [],
  setRulesSources: vi.fn(),
  selectedPathIds: [],
  setSelectedPathIds: vi.fn(),
  pathIndex: { options: [] },
  rowFilters: null,
  pathFilterActive: false,
  filterActiveCount: undefined,
  pathEmptyListTitle: undefined,
};

vi.mock('@/hooks/use-official-power-technique-browse-filters', () => ({
  useOfficialPowerTechniqueBrowseFilters: vi.fn(() => browseReturn),
}));

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    usePathListFilter: vi.fn(() => ({
      selectedPathIds: [],
      setSelectedPathIds: vi.fn(),
      pathIndex: { options: [] },
      pathRecommendedIds: null,
      pathFilterActive: false,
    })),
  };
});

vi.mock('@/hooks/use-add-to-character-from-library', () => ({
  useAddToCharacterFromLibrary: () => ({ active: false, confirmModal: null }),
}));

vi.mock('@/components/patterns/list/official-entity-list', () => ({
  OfficialEntityList: () => <div data-testid="entity-list" />,
}));

afterEach(() => {
  vi.mocked(useOfficialPowerTechniqueBrowseFilters).mockClear();
  vi.mocked(usePathListFilter).mockClear();
});

const techniqueListProps = {
  items: [],
  partsDb: [],
  isLoading: false,
  error: null,
  onRetry: () => {},
  emptyTitle: 'Empty',
  emptyMessage: 'None',
  variant: 'library' as const,
};

const itemListProps = {
  armamentKind: 'weapon' as const,
  items: [],
  propertiesDb: [],
  isLoading: false,
  error: null,
  onRetry: () => {},
  variant: 'library' as const,
};

describe('official list browse gates', () => {
  it('OfficialTechniqueList disables row filters in empowered mode', () => {
    render(<OfficialTechniqueList {...techniqueListProps} mode="empowered" />);
    expect(useOfficialPowerTechniqueBrowseFilters).toHaveBeenCalledWith(
      expect.objectContaining({ rowFiltersEnabled: false }),
    );
  });

  it('OfficialTechniqueList enables row filters in standard mode', () => {
    render(<OfficialTechniqueList {...techniqueListProps} mode="standard" />);
    expect(useOfficialPowerTechniqueBrowseFilters).toHaveBeenCalledWith(
      expect.objectContaining({ rowFiltersEnabled: true }),
    );
  });

  it('OfficialItemList enables path filter only for library variant', () => {
    render(<OfficialItemList {...itemListProps} variant="library" />);
    expect(usePathListFilter).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    vi.mocked(usePathListFilter).mockClear();
    render(<OfficialItemList {...itemListProps} variant="admin" />);
    expect(usePathListFilter).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
