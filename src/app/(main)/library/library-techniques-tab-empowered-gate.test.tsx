// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useOfficialPowerTechniqueBrowseFilters } from '@/hooks/use-official-power-technique-browse-filters';
import { LibraryTechniquesTab } from './LibraryTechniquesTab';

vi.mock('@/hooks/use-official-power-technique-browse-filters', () => ({
  useOfficialPowerTechniqueBrowseFilters: vi.fn(() => ({
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
  })),
}));

vi.mock('@/hooks', () => ({
  useUserTechniques: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
  useUserEmpoweredTechniques: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
  useTechniqueParts: () => ({ data: [] }),
  usePowerParts: () => ({ data: [] }),
  useDuplicateTechnique: () => ({ isPending: false, mutate: vi.fn() }),
  useDuplicateEmpoweredTechnique: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock('@/hooks/use-sort', () => ({
  useSort: () => ({
    sortState: { col: 'name', dir: 1 },
    handleSort: vi.fn(),
    sortItems: <T,>(x: T[]) => x,
  }),
}));

vi.mock('@/hooks/use-add-to-character-from-library', () => ({
  useAddToCharacterFromLibrary: () => ({ active: false, confirmModal: null }),
}));

vi.mock('./hooks/use-library-entity-sync', () => ({
  useLibraryEntitySync: () => ({
    driftedCount: 0,
    syncingAll: false,
    showSyncAllConfirm: false,
    setShowSyncAllConfirm: vi.fn(),
    handleSyncAll: vi.fn(),
    syncingIds: new Set(),
    handleSyncOne: vi.fn(),
  }),
}));

vi.mock('./hooks/use-library-duplicate-confirm', () => ({
  useLibraryDuplicateConfirm: () => ({
    duplicateConfirm: null,
    closeDuplicateConfirm: vi.fn(),
    onConfirmDuplicate: vi.fn(),
    isPending: false,
    openDuplicateConfirm: vi.fn(),
  }),
}));

vi.mock('./components/UserLibraryEntityTabShell', () => ({
  UserLibraryEntityTabShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LibrarySyncRowAction: () => null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.mocked(useOfficialPowerTechniqueBrowseFilters).mockClear();
});

describe('LibraryTechniquesTab empowered gate', () => {
  it('passes rowFiltersEnabled false for empowered mode', () => {
    render(<LibraryTechniquesTab onDelete={vi.fn()} mode="empowered" />);
    expect(useOfficialPowerTechniqueBrowseFilters).toHaveBeenCalledWith(
      expect.objectContaining({ rowFiltersEnabled: false }),
    );
  });

  it('passes rowFiltersEnabled true for standard mode', () => {
    render(<LibraryTechniquesTab onDelete={vi.fn()} mode="standard" />);
    expect(useOfficialPowerTechniqueBrowseFilters).toHaveBeenCalledWith(
      expect.objectContaining({ rowFiltersEnabled: true }),
    );
  });
});
